import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'
import { WILAYAS } from '@/lib/wilayas'

export async function GET(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const status = req.nextUrl.searchParams.get('status') || ''
  const orders = await db.order.findMany({
    where: { userId: user.id, ...(status ? { status } : {}) },
    include: { items: true },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json({ orders })
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const body = await req.json()
  if (!body.customerName || !body.customerPhone || !Array.isArray(body.items) || body.items.length === 0) {
    return NextResponse.json({ error: 'missing_fields' }, { status: 400 })
  }

  const wilayaCode = Number(body.wilayaCode) || 16
  const wilaya = WILAYAS.find((w) => w.code === wilayaCode) || WILAYAS[0]
  const deliveryType = body.deliveryType === 'desk' ? 'desk' : 'home'
  const deliveryFee = deliveryType === 'home' ? wilaya.homeFee : wilaya.deskFee

  // resolve items with product snapshots
  const items: { productId: string | null; name: string; price: number; quantity: number }[] = []
  let subtotal = 0
  for (const it of body.items) {
    const product = it.productId
      ? await db.product.findFirst({ where: { id: it.productId, userId: user.id } })
      : null
    const name = product?.name || it.name || 'Item'
    const price = product?.price ?? Number(it.price) ?? 0
    const quantity = Math.max(1, Number(it.quantity) || 1)
    items.push({ productId: product?.id || null, name, price, quantity })
    subtotal += price * quantity
  }

  const count = await db.order.count({ where: { userId: user.id } })
  const orderNumber = `ORD-${2001 + count}`

  const conversation = body.conversationId
    ? await db.conversation.findFirst({ where: { id: body.conversationId, userId: user.id } })
    : null

  const order = await db.order.create({
    data: {
      userId: user.id,
      orderNumber,
      conversationId: conversation?.id || null,
      customerName: body.customerName,
      customerPhone: body.customerPhone,
      wilayaCode: wilaya.code,
      wilayaName: wilaya.name,
      commune: body.commune || '',
      address: body.address || '',
      deliveryType,
      deliveryFee,
      subtotal,
      total: subtotal + deliveryFee,
      status: 'pending',
      paymentMethod: 'cod',
      items: { create: items },
    },
    include: { items: true },
  })
  return NextResponse.json({ order })
}
