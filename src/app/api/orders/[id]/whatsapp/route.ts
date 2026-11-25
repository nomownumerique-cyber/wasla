import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'
import { formatMoney } from '@/lib/format'

// COD payment confirmation through WhatsApp — the Algerian e-commerce flow
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const { id } = await params
  const order = await db.order.findFirst({
    where: { id, userId: user.id },
    include: { items: true, conversation: true },
  })
  if (!order) return NextResponse.json({ error: 'not_found' }, { status: 404 })

  // ensure a conversation exists for this customer
  let conversation = order.conversationId
    ? await db.conversation.findUnique({ where: { id: order.conversationId } })
    : null
  if (!conversation) {
    const existing = await db.conversation.findFirst({
      where: { userId: user.id, customerPhone: order.customerPhone },
    })
    conversation =
      existing ||
      (await db.conversation.create({
        data: {
          userId: user.id,
          channel: 'whatsapp',
          customerName: order.customerName,
          customerPhone: order.customerPhone,
          lastMessageAt: new Date(),
        },
      }))
  }

  const text = `Salam ${order.customerName.split(' ')[0]}, your order ${order.orderNumber} (${formatMoney(order.total, 'en')}, cash on delivery) is confirmed. Delivery to ${order.wilayaName}${order.carrier ? ` via ${order.carrier}` : ''}${order.trackingNumber ? `. Tracking: ${order.trackingNumber}` : ''}. Chukran!`

  const message = await db.message.create({
    data: { conversationId: conversation.id, sender: 'merchant', body: text },
  })
  await db.conversation.update({
    where: { id: conversation.id },
    data: { lastMessageAt: new Date() },
  })
  await db.order.update({
    where: { id: order.id },
    data: { whatsappConfirmed: true, conversationId: conversation.id, status: order.status === 'pending' ? 'confirmed' : order.status },
  })

  const phone = order.customerPhone.replace(/[^0-9]/g, '')
  const waLink = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`

  return NextResponse.json({ message, waLink, conversationId: conversation.id })
}
