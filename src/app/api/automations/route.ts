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

export async function GET() {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const rows = await db.automation.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'asc' } })
  const automations = rows.map(parseAutomation)
  return NextResponse.json({
    automations,
    summary: {
      total: automations.length,
      active: automations.filter((a) => a.status === 'active').length,
      replies: automations.reduce((s, a) => s + a.triggered, 0),
    },
  })
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const body = await req.json().catch(() => ({}))

  const name = String(body.name || '').trim().slice(0, 80)
  const keywords = sanitizeKeywords(body.keywords)
  const reply = String(body.reply || '').trim().slice(0, 1000)
  const scope = SCOPE_WHITELIST.includes(body.scope) ? body.scope : 'both'
  const platforms = sanitizePlatforms(body.platforms)

  if (!name) return NextResponse.json({ error: 'missing_name' }, { status: 400 })
  if (keywords.length === 0) return NextResponse.json({ error: 'missing_keywords' }, { status: 400 })
  if (!reply) return NextResponse.json({ error: 'missing_reply' }, { status: 400 })

  const automation = await db.automation.create({
    data: {
      userId: user.id,
      name,
      keywords: JSON.stringify(keywords),
      scope,
      platforms: JSON.stringify(platforms),
      reply,
      status: 'active',
    },
  })
  return NextResponse.json({ automation: parseAutomation(automation) })
}
