import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'
import { serializeChannel } from '@/lib/clients'
import { platformById } from '@/lib/platforms'

// POST /api/clients/[id]/channels — connect one of the CLIENT's social
// accounts. Simulated result of the platform OAuth screen the client
// approved: WASLA receives tokens + scopes, never the client's password.
// Only possible once the client accepted the invitation (status 'active').
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const { id } = await params

  const client = await db.client.findFirst({ where: { id, userId: user.id } })
  if (!client) return NextResponse.json({ error: 'not_found' }, { status: 404 })
  if (client.status !== 'active') {
    return NextResponse.json({ error: 'client_not_active' }, { status: 400 })
  }

  const body = await req.json().catch(() => ({}))
  const platform = String(body?.platform || '')
  if (!platformById(platform)) {
    return NextResponse.json({ error: 'unknown_platform' }, { status: 400 })
  }

  const existing = await db.clientChannel.findFirst({ where: { clientId: id, platform } })
  if (existing) {
    return NextResponse.json({ error: 'already_connected' }, { status: 409 })
  }

  const handle =
    String(body?.handle || '').trim() ||
    `@${client.name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 14) || 'client'}`

  const channel = await db.clientChannel.create({
    data: {
      clientId: id,
      platform,
      handle,
      followers: Math.floor(500 + Math.random() * 9500),
      status: 'connected',
      scopes: JSON.stringify(['profile', 'publish_content', 'read_insights']),
    },
  })
  return NextResponse.json({ channel: serializeChannel(channel) })
}
