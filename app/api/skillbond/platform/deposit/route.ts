import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getPlatformByUserId } from '@/lib/skillbond/supabase-db'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? 'sk_test_placeholder', { apiVersion: '2026-05-27.dahlia' as never })

export async function POST(req: NextRequest) {
  try {
    const { userId, amount_cents } = await req.json()
    const platform = await getPlatformByUserId(userId)
    if (!platform) return NextResponse.json({ error: 'Platform not found' }, { status: 404 })

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: { name: 'SkillBond Escrow Deposit' },
          unit_amount: amount_cents,
        },
        quantity: 1,
      }],
      metadata: { platform_id: platform.id, type: 'escrow_deposit' },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/skillbond/platform/dashboard?deposit=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/skillbond/platform/deposit`,
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
