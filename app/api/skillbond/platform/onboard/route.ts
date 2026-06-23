import { NextRequest, NextResponse } from 'next/server'
import { createPlatform, getPlatformByUserId } from '@/lib/skillbond/supabase-db'

export async function POST(req: NextRequest) {
  try {
    const { userId, name, website } = await req.json()
    if (!userId || !name) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

    const existing = await getPlatformByUserId(userId)
    if (existing) return NextResponse.json(existing)

    const platform = await createPlatform({
      user_id: userId,
      name,
      website: website || null,
      escrow_balance_cents: 0,
      stripe_customer_id: null,
      kyc_status: 'pending',
    })
    return NextResponse.json(platform)
  } catch (err) {
    return new NextResponse(String(err), { status: 500 })
  }
}
