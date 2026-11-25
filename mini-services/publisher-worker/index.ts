/**
 * WASLA Publisher Worker — independent Node/Bun service (port 3004).
 *
 * The worker is the EXECUTION plane of publishing: it picks up scheduled
 * posts when their time comes and publishes them on every platform —
 * even when nobody has the dashboard open. The dashboard is only the
 * CONTROL plane (compose/schedule/monitor); this process does the work.
 *
 * Flow:
 *   poll (15s) -> POST /api/posts/worker/claim   (atomic scheduled -> publishing)
 *              -> per-platform constraint validation + "API call"
 *                 (transient errors retried with backoff, max 2 retries)
 *              -> POST /api/posts/worker/result  (published / failed + reasons)
 *
 * Real constraints of the social networks are encoded below on purpose:
 * we do NOT promise that every format works everywhere; failures carry
 * the real reason so the UI can show them to the merchant.
 */

const APP_URL = process.env.APP_URL || 'http://localhost:3000'
const TOKEN = process.env.WORKER_TOKEN || 'wasla-dev-worker'
const POLL_MS = 15_000
const PORT = 3004

// ------------------------------------------------------------------ stats
const stats = { lastPollAt: null as string | null, claimed: 0, published: 0, failedPlatforms: 0, note: 'starting' }

// -------------------------------------------------- per-platform constraints
// media: whether the network requires an image/video (IG photo/reel, TT video…)
interface Rule {
  media: boolean // needs a media file (photo/video)
  mediaKind: 'any' | 'video' // some networks accept photos, others video only
  captionLimit?: number // hard caption length limit
  constraint: string // human reason shown to the merchant on failure
}

const RULES: Record<string, Rule> = {
  facebook: { media: false, mediaKind: 'any', constraint: 'ok' },
  instagram: { media: true, mediaKind: 'any', constraint: 'Instagram requires a photo or Reel (Business/Creator account via the official Content Publishing API)' },
  tiktok: { media: true, mediaKind: 'video', constraint: 'TikTok Direct Post accepts video only and requires the video.publish authorization' },
  whatsapp: { media: false, mediaKind: 'any', constraint: 'ok' },
  x: { media: false, mediaKind: 'any', captionLimit: 280, constraint: 'X caption exceeds 280 characters' },
  youtube: { media: true, mediaKind: 'video', constraint: 'YouTube upload requires a video and consumes daily API quota units' },
  snapchat: { media: true, mediaKind: 'any', constraint: 'Snapchat accepts Story media only' },
  pinterest: { media: true, mediaKind: 'any', constraint: 'Pinterest pins require an image' },
}

// ------------------------------------------------------------------ helpers
const domains: Record<string, string> = {
  facebook: 'facebook.com', instagram: 'instagram.com', tiktok: 'tiktok.com',
  whatsapp: 'wa.me', x: 'x.com', youtube: 'youtube.com',
  snapchat: 'snapchat.com', pinterest: 'pinterest.com',
}

function pickText(post: ClaimedPost, platform: string): string {
  const variants: Record<string, string> = JSON.parse(post.variants || '{}')
  return variants[platform] || post.content || post.title || ''
}

async function api(path: string, body: unknown): Promise<any> {
  const res = await fetch(`${APP_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-worker-token': TOKEN },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`${path} -> ${res.status}`)
  return res.json()
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

// ------------------------------------------------- "publish" on one platform
// In production this calls the platform's official API
// (Graph API, TikTok Content Posting API, YouTube Data API…).
// Here: constraint validation + simulated transient API errors with retry.
async function publishOne(post: ClaimedPost, platform: string) {
  const rule = RULES[platform]
  const text = pickText(post, platform)

  // hard constraints — NOT retried: the format itself is incompatible
  if (rule) {
    if (rule.media && !post.image) {
      return { ok: false, fatal: true, error: rule.constraint }
    }
    if (rule.captionLimit && text.length > rule.captionLimit) {
      return { ok: false, fatal: true, error: `${rule.constraint} (${text.length}/${rule.captionLimit})` }
    }
  }

  // transient API errors — retried up to 2 times with backoff
  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt > 0) await sleep(1200 * attempt)
    const transient = Math.random() < (attempt === 0 ? 0.07 : 0.03) // rare, decreases on retries
    if (!transient) {
      const id = `${platform}_${Math.random().toString(36).slice(2, 10)}`
      return { ok: true, id, url: `https://${domains[platform] || 'example.com'}/${id}`, reach: Math.floor(800 + Math.random() * 42000) }
    }
    console.log(`[worker]   ↻ transient API error on ${platform} for post ${post.id} (attempt ${attempt + 1}/3)`)
  }
  return { ok: false, fatal: false, error: `${platform} API unavailable after 3 attempts` }
}

// -------------------------------------------------------------- claim types
interface ClaimedPost {
  id: string
  title: string
  content: string
  image: string
  platforms: string
  variants: string
}

// ---------------------------------------------------------------- main loop
async function tick() {
  stats.lastPollAt = new Date().toISOString()

  let claimed: ClaimedPost[] = []
  try {
    const res = await api('/api/posts/worker/claim', { limit: 5 })
    claimed = res.posts || []
  } catch (e) {
    stats.note = `claim failed: ${(e as Error).message}`
    return
  }
  if (claimed.length === 0) {
    stats.note = 'idle — no due posts'
    return
  }

  stats.claimed += claimed.length
  stats.note = `processing ${claimed.length} post(s)`

  for (const post of claimed) {
    const platforms: string[] = JSON.parse(post.platforms || '[]')
    console.log(`[worker] ⏰ post ${post.id.slice(-6)} due now → [${platforms.join(', ')}]`)
    const results = []
    for (const platform of platforms) {
      const r = await publishOne(post, platform)
      if (r.ok) {
        stats.published++
        results.push({ platform, status: 'published', externalId: r.id, url: r.url, reach: r.reach })
        console.log(`[worker]   ✔ ${platform} published ${r.url}`)
      } else {
        stats.failedPlatforms++
        results.push({ platform, status: 'failed', externalId: '', url: '', reach: 0, error: r.error })
        console.log(`[worker]   ✘ ${platform} FAILED — ${r.error}`)
      }
    }
    try {
      await api('/api/posts/worker/result', { id: post.id, results })
    } catch (e) {
      console.log(`[worker]   ⚠ could not report result for ${post.id}: ${(e as Error).message}`)
    }
  }
  stats.note = `last run: ${claimed.length} post(s) processed`
}

setInterval(() => {
  tick().catch((e) => {
    stats.note = `tick error: ${(e as Error).message}`
    console.log(`[worker] tick error: ${e}`)
  })
}, POLL_MS)
tick().catch(() => {}) // first run immediately

// --------------------------------------------------------- tiny health server
Bun.serve({
  port: PORT,
  fetch() {
    return Response.json({ ok: true, service: 'wasla-publisher-worker', port: PORT, pollSeconds: POLL_MS / 1000, stats })
  },
})

console.log(`[worker] WASLA publisher worker running on port ${PORT} — polling ${APP_URL} every ${POLL_MS / 1000}s`)
