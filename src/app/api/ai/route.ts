import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'

export const maxDuration = 60

type Mode = 'description' | 'caption' | 'reply' | 'translate' | 'adapt' | 'chat'

const SYSTEM = `You are the WASLA commerce copilot for MENA e-merchants (Algeria first). You write in Arabic, French and English with an authentic MENA commerce tone: warm, direct, using light Darija/Arabic phrasing in Arabic outputs (e.g. "Salam", "Rah", "Wach"), emojis sparingly (max 2 per text), relevant hashtags for social captions. You understand COD (cash on delivery), delivery per wilaya, and WhatsApp-first commerce. Keep answers concise and ready to copy-paste.`

// per-network specs used by the Universal Publisher adaptation (mirrors lib/platforms)
const PLATFORM_SPECS: Record<string, { limit: number; hint: string }> = {
  facebook: { limit: 2000, hint: 'longer storytelling post, link + CTA to order' },
  instagram: { limit: 2200, hint: 'visual hook, emoji, 5-8 hashtags' },
  tiktok: { limit: 300, hint: 'punchy hook, trending hashtags' },
  whatsapp: { limit: 700, hint: 'direct order message, COD + wilaya delivery' },
  x: { limit: 280, hint: 'ultra short, 1-2 hashtags max' },
  youtube: { limit: 1000, hint: 'title + description style' },
  snapchat: { limit: 250, hint: 'fast casual tone, urgency' },
  pinterest: { limit: 500, hint: 'keyword-rich, search-friendly phrasing' },
}

// robust JSON extraction from an LLM answer (strips fences, finds first {...} block)
function parseVariants(raw: string, requested: string[]): Record<string, string> | null {
  let s = raw.trim()
  s = s.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim()
  const start = s.indexOf('{')
  const end = s.lastIndexOf('}')
  if (start === -1 || end <= start) return null
  try {
    const obj = JSON.parse(s.slice(start, end + 1)) as Record<string, unknown>
    const out: Record<string, string> = {}
    for (const p of requested) {
      const v = obj[p]
      if (typeof v === 'string' && v.trim()) out[p] = v.trim()
    }
    return Object.keys(out).length > 0 ? out : null
  } catch {
    return null
  }
}

async function complete(userPrompt: string): Promise<string> {
  // One retry on transient SDK/network failures — a single hiccup upstream
  // should never surface as an error to the merchant.
  let lastError: unknown = null
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const zai = await ZAI.create()
      const completion = await zai.chat.completions.create({
        messages: [
          { role: 'assistant', content: SYSTEM },
          { role: 'user', content: userPrompt },
        ],
        thinking: { type: 'disabled' },
      })
      const content = completion.choices[0]?.message?.content || ''
      if (content) return content
      lastError = new Error('empty completion')
    } catch (e) {
      lastError = e
    }
    if (attempt === 0) await new Promise((r) => setTimeout(r, 800))
  }
  throw lastError instanceof Error ? lastError : new Error('ai_unavailable')
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const body = await req.json()
  const mode = (body.mode as Mode) || 'chat'
  const lang = body.language || 'en'

  try {
    let prompt = ''
    switch (mode) {
      case 'description': {
        const { name, category, price, notes } = body
        prompt = `Write a compelling e-commerce product description (~60-90 words) in ${langName(lang)} for: "${name}", category ${category || 'general'}, price ${price || ''} DZD${notes ? `, details: ${notes}` : ''}. Mention COD delivery across the 58 wilayas of Algeria at the end. Output only the description text.`
        break
      }
      case 'caption': {
        const { name, price, platforms, notes } = body
        prompt = `Write a high-converting social media caption in ${langName(lang)} to sell: "${name}"${price ? ` at ${price} DZD` : ''} on ${Array.isArray(platforms) ? platforms.join(', ') : 'social media'}${notes ? `. Context: ${notes}` : ''}. Structure: hook line, 2 short selling lines, call to action with WhatsApp order invite, then 4-6 relevant hashtags. Output only the caption.`
        break
      }
      case 'reply': {
        const { customerName, channel, history, notes } = body
        prompt = `Draft a friendly merchant reply in ${langName(lang)} to customer "${customerName}" on ${channel || 'WhatsApp'}. Conversation so far:\n${String(history || '').slice(0, 1500)}\n${notes ? `Extra instructions: ${notes}` : 'Answer their last message warmly and helpfully, offering COD order help.'} Output only the reply text, max 60 words.`
        break
      }
      case 'adapt': {
        // Universal Publisher: adapt one source caption into per-network variants (AR/FR/EN)
        const { text, platforms, product, price, language } = body
        const list = Array.isArray(platforms) && platforms.length > 0 ? platforms : ['facebook', 'instagram', 'tiktok']
        const spec = list
          .map((p: string) => {
            const meta = PLATFORM_SPECS[p]
            return `- ${p}${meta ? ` (max ~${meta.limit} chars, style: ${meta.hint})` : ''}`
          })
          .join('\n')
        prompt = `You adapt ONE commerce caption into per-network variants for a MENA seller (Algeria, COD, WhatsApp-first). Base caption in ${langName(language || lang)}:\n"""\n${String(text || '').slice(0, 1500)}\n"""\nProduct: ${String(product || 'our product')}${price ? `, price ${price} DZD` : ''}.\nNetworks to adapt for:\n${spec}\nFor EACH network, rewrite the caption so it fits that network's native style (hook, length, hashtags count, CTA format — WhatsApp gets an order-ready message with COD + 58-wilaya delivery; X stays under 280 chars; TikTok punchy). Keep the SAME language as the base caption: ${langName(language || lang)}.\nReturn STRICT JSON only, no markdown fences, shape: {"<platform>": "<adapted text>"} with one key per requested network.`
        break
      }
      case 'translate': {
        const { text, target } = body
        prompt = `Translate the following commerce text to ${langName(target || lang)}. Keep emojis and hashtags. Output only the translation.\n\n${String(text || '').slice(0, 2000)}`
        break
      }
      default: {
        prompt = String(body.message || '').slice(0, 2000)
        if (!prompt) return NextResponse.json({ error: 'missing_message' }, { status: 400 })
        // give the copilot live store context
        const [productCount, orderCount, followerAgg] = await Promise.all([
          db.product.count({ where: { userId: user.id } }),
          db.order.count({ where: { userId: user.id } }),
          db.connectedAccount.aggregate({ where: { userId: user.id }, _sum: { followers: true } }),
        ])
        prompt = `Store context: "${user.storeName}", ${productCount} products, ${orderCount} orders, ~${followerAgg._sum.followers || 0} followers, Algeria, COD business.\n\nMerchant question: ${prompt}`
      }
    }

    const content = await complete(prompt)
    if (!content) return NextResponse.json({ error: 'empty_response' }, { status: 502 })
    if (mode === 'adapt') {
      const requested = Array.isArray(body.platforms) && body.platforms.length > 0
        ? (body.platforms as string[])
        : ['facebook', 'instagram', 'tiktok']
      const variants = parseVariants(content, requested)
      if (!variants) return NextResponse.json({ error: 'ai_error' }, { status: 502 })
      return NextResponse.json({ variants })
    }
    return NextResponse.json({ content })
  } catch (e) {
    console.error('ai error', e)
    return NextResponse.json({ error: 'ai_error' }, { status: 502 })
  }
}

function langName(l: string): string {
  if (l === 'ar') return 'Arabic (with light Algerian Darija flavor)'
  if (l === 'fr') return 'French'
  return 'English'
}
