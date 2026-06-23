import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getAdmin() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
}

export async function POST(req: NextRequest) {
  try {
    const { learnerId } = await req.json()
    const db = getAdmin()

    const { data: learner } = await db.from('sb_learners').select('*').eq('id', learnerId).single()
    if (!learner) return new NextResponse('Learner not found', { status: 404 })
    if (learner.wallet_balance_cents < 1000) return new NextResponse('Minimum withdrawal is $10', { status: 400 })

    const amount = learner.wallet_balance_cents

    // In production: trigger Stripe Connect payout to learner's connected account
    // For MVP: record the withdrawal intent
    await db.from('sb_learners').update({ wallet_balance_cents: 0 }).eq('id', learnerId)
    await db.from('sb_transactions').insert({
      type: 'withdrawal',
      learner_id: learnerId,
      amount_cents: amount,
    })

    return NextResponse.json({ ok: true, amount_withdrawn: amount })
  } catch (err) {
    return new NextResponse(String(err), { status: 500 })
  }
}
