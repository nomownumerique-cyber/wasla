import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'
import { CLIENT_INDUSTRIES, CLIENT_PLANS, CLIENT_STATUSES, serializeClient } from '@/lib/clients'

// PATCH /api/clients/[id] — update a client workspace (profile, plan, fee) or
// its status: 'active' = invitation accepted (workspace activated), 'paused',
// 'active' again to resume.
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const { id } = await params

  const existing = await db.client.findFirst({ where: { id, userId: user.id } })
  if (!existing) return NextResponse.json({ error: 'not_found' }, { status: 404 })

  const body = await req.json().catch(() => ({}))
  const data: Record<string, unknown> = {}
  if (typeof body?.name === 'string' && body.name.trim()) data.name = body.name.trim()
  if (typeof body?.contactEmail === 'string') data.contactEmail = body.contactEmail.trim()
  if (typeof body?.contactPhone === 'string') data.contactPhone = body.contactPhone.trim()
  if (typeof body?.notes === 'string') data.notes = body.notes
  if (
    typeof body?.industry === 'string' &&
    (CLIENT_INDUSTRIES as readonly string[]).includes(body.industry)
  )
    data.industry = body.industry
  if (typeof body?.plan === 'string' && (CLIENT_PLANS as readonly string[]).includes(body.plan))
    data.plan = body.plan
  if (body?.monthlyFee != null && !Number.isNaN(Number(body.monthlyFee)))
    data.monthlyFee = Math.max(0, Number(body.monthlyFee))
  if (
    typeof body?.status === 'string' &&
    (CLIENT_STATUSES as readonly string[]).includes(body.status)
  )
    data.status = body.status

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'nothing_to_update' }, { status: 400 })
  }

  const client = await db.client.update({
    where: { id },
    data: data as never,
    include: { channels: true, _count: { select: { posts: true } } },
  })
  return NextResponse.json({ client: serializeClient(client, client.updatedAt) })
}

// DELETE /api/clients/[id] — remove the client workspace. Connected accounts
// are detached (cascade); their posts stay in the history (SetNull).
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const { id } = await params

  const existing = await db.client.findFirst({ where: { id, userId: user.id } })
  if (!existing) return NextResponse.json({ error: 'not_found' }, { status: 404 })

  await db.client.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
