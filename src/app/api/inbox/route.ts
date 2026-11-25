import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const channel = req.nextUrl.searchParams.get('channel') || ''
  const conversations = await db.conversation.findMany({
    where: { userId: user.id, ...(channel ? { channel } : {}) },
    orderBy: { lastMessageAt: 'desc' },
    include: { messages: { orderBy: { createdAt: 'desc' }, take: 1 } },
  })
  return NextResponse.json({ conversations })
}
