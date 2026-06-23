import { NextRequest, NextResponse } from 'next/server'
import { overrideSubmission } from '@/lib/skillbond/supabase-db'
import { createClient } from '@supabase/supabase-js'

function getAdmin() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { verdict } = await req.json()
    if (verdict !== 'passed' && verdict !== 'failed') return new NextResponse('Invalid verdict', { status: 400 })

    await overrideSubmission(params.id, verdict)

    if (verdict === 'passed') {
      const db = getAdmin()
      const { data: sub } = await db.from('sb_submissions').select('*, sb_challenges(reward_cents)').eq('id', params.id).single()
      if (sub) {
        const TAKE_RATE = 0.15
        const rewardCents = (sub as { sb_challenges?: { reward_cents: number } }).sb_challenges?.reward_cents ?? 0
        const learnerAmount = Math.round(rewardCents * (1 - TAKE_RATE))
        const { data: learner } = await db.from('sb_learners').select('wallet_balance_cents').eq('id', sub.learner_id).single()
        if (learner) {
          await db.from('sb_learners').update({ wallet_balance_cents: learner.wallet_balance_cents + learnerAmount }).eq('id', sub.learner_id)
          await db.from('sb_transactions').insert({
            type: 'reward_release',
            learner_id: sub.learner_id,
            challenge_id: sub.challenge_id,
            submission_id: params.id,
            amount_cents: learnerAmount,
          })
        }
      }
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    return new NextResponse(String(err), { status: 500 })
  }
}
