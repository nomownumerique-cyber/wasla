import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'
import { CLIENT_INDUSTRIES, CLIENT_PLANS, serializeClient } from '@/lib/clients'

// GET /api/clients — agency console: every client workspace of the logged-in
// merchant with its connected accounts, post count, billing summary.
export async function GET() {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const clients = await db.client.findMany({
    where: { userId: user.id },
    include: { channels: true, _count: { select: { posts: true } } },
    orderBy: { createdAt: 'desc' },
  })

  const lastPosts = await db.post.groupBy({
    by: ['clientId'],
    where: { userId: user.id, clientId: { not: null } },
    _max: { updatedAt: true },
  })
  const lastMap = new Map<string, Date | null>(
    lastPosts.map((r) => [r.clientId as string, r._max.updatedAt]),
  )

  const rows = clients.map((c) => serializeClient(c, lastMap.get(c.id) || c.updatedAt))

  const summary = {
    total: rows.length,
    active: rows.filter((r) => r.status === 'active').length,
    invited: rows.filter((r) => r.status === 'invited').length,
    paused: rows.filter((r) => r.status === 'paused').length,
    channels: rows.reduce((n, r) => n + r.channels.length, 0),
    mrr: rows.filter((r) => r.status === 'active').reduce((n, r) => n + r.monthlyFee, 0),
  }
  return NextResponse.json({ clients: rows, summary })
}

// POST /api/clients — add a client brand (starts as 'invited': the client
// receives an invitation and connects their own accounts via OAuth).
export async function POST(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const name = String(body?.name || '').trim()
  if (!name) return NextResponse.json({ error: 'missing_fields' }, { status: 400 })

  const client = await db.client.create({
    data: {
      userId: user.id,
      name,
      contactEmail: String(body?.contactEmail || '').trim(),
      contactPhone: String(body?.contactPhone || '').trim(),
      industry:
        typeof body?.industry === 'string' &&
        (CLIENT_INDUSTRIES as readonly string[]).includes(body.industry)
          ? body.industry
          : 'general',
      plan:
        typeof body?.plan === 'string' && (CLIENT_PLANS as readonly string[]).includes(body.plan)
          ? body.plan
          : 'starter',
      monthlyFee: Math.max(0, Number(body?.monthlyFee) || 0),
      notes: String(body?.notes || ''),
      status: 'invited',
    },
    include: { channels: true, _count: { select: { posts: true } } },
  })
  return NextResponse.json({ client: serializeClient(client, client.updatedAt) })
}
