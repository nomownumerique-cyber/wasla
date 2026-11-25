import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const { id } = await params
  const existing = await db.connectedAccount.findFirst({ where: { id, userId: user.id } })
  if (!existing) return NextResponse.json({ error: 'not_found' }, { status: 404 })
  await db.connectedAccount.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
