import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getPlatformByUserId } from '@/lib/skillbond/supabase-db'

function getAdmin() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { userId } = await req.json()
    const platform = await getPlatformByUserId(userId)
    if (!platform) return new NextResponse('Platform not found', { status: 404 })

    const db = getAdmin()
    const { data: challenge } = await db.from('sb_challenges').select('*').eq('id', params.id).single()
    if (!challenge || challenge.platform_id !== platform.id) return new NextResponse('Not found', { status: 404 })

    const needed = challenge.reward_cents * challenge.max_submissions
    if (platform.escrow_balance_cents < needed) {
      return new NextResponse(`Insufficient escrow. Need $${(needed / 100).toFixed(2)}, have $${(platform.escrow_balance_cents / 100).toFixed(2)}`, { status: 402 })
    }

    await db.from('sb_challenges').update({ status: 'active', escrow_reserved_cents: needed }).eq('id', params.id)
    await db.from('sb_platforms').update({ escrow_balance_cents: platform.escrow_balance_cents - needed }).eq('id', platform.id)

    return NextResponse.json({ ok: true })
  } catch (err) {
    return new NextResponse(String(err), { status: 500 })
  }
}
