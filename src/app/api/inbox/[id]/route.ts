import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const { id } = await params
  const conversation = await db.conversation.findFirst({
    where: { id, userId: user.id },
    include: {
      messages: { orderBy: { createdAt: 'asc' } },
      orders: { orderBy: { createdAt: 'desc' }, include: { items: true } },
    },
  })
  if (!conversation) return NextResponse.json({ error: 'not_found' }, { status: 404 })
  return NextResponse.json({ conversation })

}

export async function PATCH(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const { id } = await params
  const conversation = await db.conversation.findFirst({ where: { id, userId: user.id } })
  if (!conversation) return NextResponse.json({ error: 'not_found' }, { status: 404 })
  await db.conversation.update({ where: { id }, data: { unread: 0 } })
  return NextResponse.json({ ok: true })
}
