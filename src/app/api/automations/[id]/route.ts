import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'
import { parseAutomation } from '@/lib/automations'

export const dynamic = 'force-dynamic'

const PLATFORM_WHITELIST = ['facebook', 'instagram']
const SCOPE_WHITELIST = ['comments', 'messages', 'both']

function sanitizeKeywords(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return Array.from(new Set(raw.map((k) => String(k).trim().toLowerCase()).filter((k) => k.length > 0 && k.length <= 40))).slice(0, 30)
  }
  if (typeof raw === 'string') {
    return sanitizeKeywords(raw.split(/[,;\n]/))
  }
  return []
}

function sanitizePlatforms(raw: unknown): string[] {
  const list = Array.isArray(raw) ? raw.map(String) : []
  const clean = list.filter((p) => PLATFORM_WHITELIST.includes(p))
  return clean.length > 0 ? clean : ['facebook', 'instagram']
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const { id } = await params
  const existing = await db.automation.findFirst({ where: { id, userId: user.id } })
  if (!existing) return NextResponse.json({ error: 'not_found' }, { status: 404 })

  const body = await req.json().catch(() => ({}))
  const data: Record<string, string> = {}
  if (typeof body.name === 'string' && body.name.trim()) data.name = body.name.trim().slice(0, 80)
  if (body.keywords !== undefined) {
    const keywords = sanitizeKeywords(body.keywords)
    if (keywords.length === 0) return NextResponse.json({ error: 'missing_keywords' }, { status: 400 })
    data.keywords = JSON.stringify(keywords)
  }
  if (typeof body.reply === 'string' && body.reply.trim()) data.reply = body.reply.trim().slice(0, 1000)
  if (SCOPE_WHITELIST.includes(body.scope)) data.scope = body.scope
  if (body.platforms !== undefined) data.platforms = JSON.stringify(sanitizePlatforms(body.platforms))
  if (body.status === 'active' || body.status === 'paused') data.status = body.status

  const automation = await db.automation.update({ where: { id }, data })
  return NextResponse.json({ automation: parseAutomation(automation) })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const { id } = await params
  const existing = await db.automation.findFirst({ where: { id, userId: user.id } })
  if (!existing) return NextResponse.json({ error: 'not_found' }, { status: 404 })
  await db.automation.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
