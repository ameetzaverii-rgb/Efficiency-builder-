import { NextRequest, NextResponse } from 'next/server'
import { createChallenge, getPlatformByUserId } from '@/lib/skillbond/supabase-db'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { userId, title, skill_vertical, reward_cents, max_submissions, deadline, rubric_json } = body

    const platform = await getPlatformByUserId(userId)
    if (!platform) return new NextResponse('Platform not found', { status: 404 })

    const challenge = await createChallenge({
      platform_id: platform.id,
      title,
      skill_vertical,
      reward_cents,
      max_submissions,
      deadline,
      brief_url: null,
      rubric_json: { ...rubric_json, challenge_id: 'pending', skill_vertical },
      status: 'draft',
      escrow_reserved_cents: 0,
    })
    return NextResponse.json(challenge)
  } catch (err) {
    return new NextResponse(String(err), { status: 500 })
  }
}
