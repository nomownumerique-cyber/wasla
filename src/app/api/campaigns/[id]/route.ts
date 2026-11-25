import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const { id } = await params
  const existing = await db.campaign.findFirst({ where: { id, userId: user.id } })
  if (!existing) return NextResponse.json({ error: 'not_found' }, { status: 404 })
  const body = await req.json()

  let reach = existing.reach
  let clicks = existing.clicks
  let spend = existing.spend
  let conversions = existing.conversions

  // when resuming/refreshing, let metrics progress a bit (simulation)
  if (body.status === 'active' || body.tick) {
    reach += Math.floor(Math.random() * 4000)
    clicks += Math.floor(Math.random() * 160)
    conversions += Math.floor(Math.random() * 8)
    spend = Math.min(existing.budget * existing.days, Math.round(spend + existing.budget * 0.4))
  }

  const campaign = await db.campaign.update({
    where: { id },
    data: {
      ...(body.status ? { status: body.status } : {}),
      reach, clicks, spend, conversions,
    },
  })
  return NextResponse.json({ campaign })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const { id } = await params
  const existing = await db.campaign.findFirst({ where: { id, userId: user.id } })
  if (!existing) return NextResponse.json({ error: 'not_found' }, { status: 404 })
  await db.campaign.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
