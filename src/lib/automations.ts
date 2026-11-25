import { db } from '@/lib/db'
import type { Automation, Message, Post, User } from '@prisma/client'

// WASLA automations engine — keyword-triggered rules that auto-answer
// comments (public) and messages/DMs (private) on Instagram & Facebook.

export type AutomationScope = 'comments' | 'messages' | 'both'

export interface ParsedAutomation {
  id: string
  name: string
  keywords: string[]
  scope: AutomationScope
  platforms: string[]
  reply: string
  status: 'active' | 'paused'
  triggered: number
  lastTriggeredAt: Date | null
  createdAt: Date
}

export function parseAutomation(a: Automation): ParsedAutomation {
  let keywords: string[] = []
  let platforms: string[] = ['facebook', 'instagram']
  try {
    const k = JSON.parse(a.keywords)
    if (Array.isArray(k)) keywords = k.map(String).filter((s) => s.trim())
    const p = JSON.parse(a.platforms)
    if (Array.isArray(p) && p.length > 0) platforms = p.map(String)
  } catch {
    /* corrupted JSON → fall back to defaults */
  }
  return {
    id: a.id,
    name: a.name,
    keywords,
    scope: (['comments', 'messages', 'both'].includes(a.scope) ? a.scope : 'both') as AutomationScope,
    platforms,
    reply: a.reply,
    status: a.status === 'paused' ? 'paused' : 'active',
    triggered: a.triggered,
    lastTriggeredAt: a.lastTriggeredAt,
    createdAt: a.createdAt,
  }
}

// Normalize text for matching: lowercases, strips Arabic diacritics
// (tashkeel), unifies alef forms and ta-marbuta, flattens French accents and
// punctuation — so "السِّعر" matches "السعر" and "Prix?" matches "prix".
export function normalizeText(s: string): string {
  return s
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670\u0640]/g, '') // harakat + tatweel
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/[éèêë]/g, 'e')
    .replace(/[àâä]/g, 'a')
    .replace(/[ùûü]/g, 'u')
    .replace(/[îï]/g, 'i')
    .replace(/[ôö]/g, 'o')
    .replace(/[ç]/g, 'c')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function matchesKeywords(text: string, keywords: string[]): number {
  // returns the number of distinct keywords hit (0 = no match) — used to
  // pick the most specific rule when several match
  const norm = ` ${normalizeText(text)} `
  let hits = 0
  for (const k of keywords) {
    const nk = normalizeText(k)
    if (nk && norm.includes(nk)) hits++
  }
  return hits
}

// ---- reply template rendering: {store} {product} {price} {whatsapp} ----

async function templateContext(user: User): Promise<{ store: string; product: string; price: string; whatsapp: string }> {
  const best = await db.product.findFirst({
    where: { userId: user.id, status: 'active' },
    orderBy: { createdAt: 'desc' },
    select: { name: true, price: true },
  })
  return {
    store: user.storeName,
    product: best?.name || user.storeName,
    price: best?.price ? `${Math.round(best.price)}` : '—',
    whatsapp: user.whatsapp,
  }
}

export async function renderReply(template: string, user: User): Promise<string> {
  const ctx = await templateContext(user)
  return template
    .replaceAll('{store}', ctx.store)
    .replaceAll('{product}', ctx.product)
    .replaceAll('{price}', ctx.price)
    .replaceAll('{whatsapp}', ctx.whatsapp)
    .trim()
}

// ---- engine core ----

// Load the active rules eligible for a channel/scope/platform, ranked by
// keyword specificity (most matched keywords first), and return the winner.
async function findBestRule(
  userId: string,
  opts: { text: string; scope: 'comments' | 'messages'; platform: string },
): Promise<{ rule: ParsedAutomation; hits: number } | null> {
  const wantedScope = opts.scope
  const rules = await db.automation.findMany({
    where: { userId, status: 'active' },
    orderBy: { createdAt: 'asc' },
  })
  let best: { rule: ParsedAutomation; hits: number } | null = null
  for (const raw of rules) {
    const rule = parseAutomation(raw)
    if (rule.scope !== wantedScope && rule.scope !== 'both') continue
    if (!rule.platforms.includes(opts.platform)) continue
    if (rule.keywords.length === 0 || !rule.reply.trim()) continue
    const hits = matchesKeywords(opts.text, rule.keywords)
    if (hits > 0 && (!best || hits > best.hits)) best = { rule, hits }
  }
  return best
}

async function fireRule(ruleId: string): Promise<void> {
  await db.automation.update({
    where: { id: ruleId },
    data: { triggered: { increment: 1 }, lastTriggeredAt: new Date() },
  })
}

// ---- DM integration (called by /api/inbox/simulate for EVERY incoming
// customer message — covers the UI demo button, the websocket ambient
// traffic and post-merchant auto-replies) ----
export async function runMessageAutomation(
  user: User,
  opts: { text: string; platform: string; conversationId: string },
): Promise<{ message: Message; ruleName: string } | null> {
  const match = await findBestRule(user.id, { text: opts.text, scope: 'messages', platform: opts.platform })
  if (!match) return null
  const body = await renderReply(match.rule.reply, user)
  if (!body) return null
  const message = await db.message.create({
    data: {
      conversationId: opts.conversationId,
      sender: 'merchant',
      body,
      automationId: match.rule.id,
    },
  })
  await fireRule(match.rule.id)
  return { message, ruleName: match.rule.name }
}

// ---- comment integration (public replies on published FB/IG posts) ----
export async function runCommentAutomation(
  user: User,
  opts: { text: string; platform: string; post: Post },
): Promise<{ reply: string; ruleName: string } | null> {
  const match = await findBestRule(user.id, { text: opts.text, scope: 'comments', platform: opts.platform })
  if (!match) return null
  const reply = await renderReply(match.rule.reply, user)
  if (!reply) return null
  await fireRule(match.rule.id)
  return { reply, ruleName: match.rule.name }
}

// ---- dry-run matcher (test panel — nothing is persisted) ----
export async function testAutomation(
  user: User,
  opts: { text: string; platform: string; scope: 'comments' | 'messages' },
): Promise<{ matched: boolean; ruleName: string; reply: string }> {
  const match = await findBestRule(user.id, opts)
  if (!match) return { matched: false, ruleName: '', reply: '' }
  const reply = await renderReply(match.rule.reply, user)
  return { matched: true, ruleName: match.rule.name, reply }
}
