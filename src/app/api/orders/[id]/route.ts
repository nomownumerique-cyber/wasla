import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'
import { CARRIERS } from '@/lib/wilayas'

const NEXT_STATUS: Record<string, string> = {
  pending: 'confirmed',
  confirmed: 'packed',
  packed: 'shipped',
  shipped: 'delivered',
  delivered: 'delivered',
  returned: 'returned',
  cancelled: 'cancelled',
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const { id } = await params
  const order = await db.order.findFirst({
    where: { id, userId: user.id },
    include: { items: true, conversation: true },
  })
  if (!order) return NextResponse.json({ error: 'not_found' }, { status: 404 })
  return NextResponse.json({ order })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const { id } = await params
  const existing = await db.order.findFirst({ where: { id, userId: user.id } })
  if (!existing) return NextResponse.json({ error: 'not_found' }, { status: 404 })
  const body = await req.json()

  let carrier = existing.carrier
  let trackingNumber = existing.trackingNumber

  if (body.carrier) {
    const c = CARRIERS.find((x) => x.id === body.carrier)
    if (c) {
      carrier = c.id
      if (body.regenerateTracking || !trackingNumber) {
        trackingNumber = `${c.prefix}-${Math.floor(1000 + Math.random() * 9000)}-${String(existing.wilayaCode).padStart(2, '0')}`
      }
    }
  }

  const status = body.status === 'advance' ? NEXT_STATUS[existing.status] || existing.status : body.status || existing.status

  const order = await db.order.update({
    where: { id },
    data: {
      status,
      carrier,
      trackingNumber,
      ...(body.wilayaCode ? { wilayaCode: Number(body.wilayaCode) } : {}),
      ...(body.deliveryType ? { deliveryType: body.deliveryType } : {}),
    },
    include: { items: true, conversation: true },
  })
  return NextResponse.json({ order })
}
