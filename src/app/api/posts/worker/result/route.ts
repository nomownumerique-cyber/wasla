import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { engagementSeeds } from '@/lib/publish'

// POST /api/posts/worker/result — the publisher worker reports the final
// per-platform outcome of a claimed post. Post status becomes:
//  - 'published' when at least one platform accepted it (metrics seeded)
//  - 'failed'   when every platform rejected it (reasons kept in results)
// Auth: x-worker-token header (WORKER_TOKEN env, dev default below).

const WORKER_TOKEN = process.env.WORKER_TOKEN || 'wasla-dev-worker'

interface WorkerResult {
  platform: string
  status: 'published' | 'failed'
  externalId?: string
  url?: string
  reach?: number
  error?: string
}

export async function POST(req: NextRequest) {
  if (req.headers.get('x-worker-token') !== WORKER_TOKEN) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  const body = await req.json().catch(() => null)
  const id = body?.id
  const results: WorkerResult[] = Array.isArray(body?.results)
    ? body.results.filter((r: WorkerResult) => r && typeof r.platform === 'string')
    : []
  if (!id || results.length === 0) {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 })
  }

  const post = await db.post.findFirst({ where: { id } })
  if (!post) return NextResponse.json({ error: 'not_found' }, { status: 404 })
  if (post.status !== 'publishing') {
    // already processed (manual publish raced the worker) — accept idempotently
    return NextResponse.json({ ok: true, ignored: post.status })
  }

  const okAny = results.some((r) => r.status === 'published')

  if (okAny) {
    const followers = await db.connectedAccount.aggregate({
      where: { userId: post.userId, platform: { in: results.map((r) => r.platform) } },
      _sum: { followers: true },
    })
    const seeds = engagementSeeds(followers._sum.followers || 12000)
    const updated = await db.post.update({
      where: { id },
      data: {
        status: 'published',
        publishedAt: new Date(),
        scheduledAt: null,
        results: JSON.stringify(results),
        views: post.views || seeds.views,
        likes: post.likes || seeds.likes,
        comments: post.comments || seeds.comments,
        clicks: post.clicks || seeds.clicks,
      },
      include: { product: true },
    })
    return NextResponse.json({ post: updated })
  }

  const updated = await db.post.update({
    where: { id },
    data: {
      status: 'failed',
      scheduledAt: null,
      results: JSON.stringify(results),
    },
    include: { product: true },
  })
  return NextResponse.json({ post: updated })
}
