import { NextRequest, NextResponse } from 'next/server'
import { createSubmission } from '@/lib/skillbond/supabase-db'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { learnerId, submission_url, reflection_text } = await req.json()
    if (!learnerId || !submission_url) return new NextResponse('Missing fields', { status: 400 })

    const submission = await createSubmission({
      challenge_id: params.id,
      learner_id: learnerId,
      submission_url,
      reflection_text: reflection_text || null,
      status: 'grading',
    })

    // Trigger async grading job (scaffold — mock verdict for Phase 1)
    fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/skillbond/verify/grade`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ submission_id: submission.id }),
    }).catch(() => {})

    return NextResponse.json(submission)
  } catch (err) {
    return new NextResponse(String(err), { status: 500 })
  }
}
