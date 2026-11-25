import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const { conversationId, body, attachment } = await req.json()
  const text = typeof body === 'string' ? body : ''
  const att = typeof attachment === 'string' && attachment ? attachment : null
  if (!conversationId || (!text.trim() && !att)) return NextResponse.json({ error: 'missing_fields' }, { status: 400 })
  const conversation = await db.conversation.findFirst({ where: { id: conversationId, userId: user.id } })
  if (!conversation) return NextResponse.json({ error: 'not_found' }, { status: 404 })

  const message = await db.message.create({
    data: { conversationId, sender: 'merchant', body: text, attachment: att },
  })
  await db.conversation.update({
    where: { id: conversationId },
    data: { lastMessageAt: new Date(), unread: 0 },
  })
  return NextResponse.json({ message })
}
