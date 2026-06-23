import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? 'sk_test_placeholder', { apiVersion: '2026-05-27.dahlia' as never })

function getAdmin() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
}

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET ?? '')
  } catch {
    return new NextResponse('Webhook signature failed', { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    if (session.metadata?.type === 'escrow_deposit' && session.metadata.platform_id) {
      const amount = session.amount_total ?? 0
      const db = getAdmin()
      const { data: platform } = await db.from('sb_platforms').select('escrow_balance_cents').eq('id', session.metadata.platform_id).single()
      if (platform) {
        await db.from('sb_platforms').update({ escrow_balance_cents: platform.escrow_balance_cents + amount }).eq('id', session.metadata.platform_id)
        await db.from('sb_transactions').insert({
          type: 'escrow_deposit',
          platform_id: session.metadata.platform_id,
          amount_cents: amount,
          stripe_transfer_id: session.id,
        })
      }
    }
  }

  return NextResponse.json({ received: true })
}
