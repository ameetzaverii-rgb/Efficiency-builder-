import { NextRequest, NextResponse } from 'next/server'
import { createLearner, getLearnerByUserId } from '@/lib/skillbond/supabase-db'

export async function POST(req: NextRequest) {
  try {
    const { userId, email, name, country, skill_tags } = await req.json()
    if (!userId || !email || !name) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

    const existing = await getLearnerByUserId(userId)
    if (existing) return NextResponse.json(existing)

    const learner = await createLearner({
      user_id: userId,
      email,
      name,
      country: country || null,
      skill_tags: skill_tags ?? [],
      stripe_connect_id: null,
      wallet_balance_cents: 0,
    })
    return NextResponse.json(learner)
  } catch (err) {
    return new NextResponse(String(err), { status: 500 })
  }
}
