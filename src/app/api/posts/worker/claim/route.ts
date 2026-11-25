import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST /api/posts/worker/claim — internal endpoint used by the publisher
// worker service (mini-services/publisher-worker, port 3004).
// Atomically claims due scheduled posts (status scheduled -> publishing)
// so the same post can never be executed twice (worker claim pattern).
// Auth: x-worker-token header (WORKER_TOKEN env, dev default below).

const WORKER_TOKEN = process.env.WORKER_TOKEN || 'wasla-dev-worker'

export async function POST(req: NextRequest) {
  if (req.headers.get('x-worker-token') !== WORKER_TOKEN) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  const body = await req.json().catch(() => ({}))
  const limit = Math.min(Math.max(Number(body.limit) || 5, 1), 20)

  const due = await db.post.findMany({
    where: { status: 'scheduled', scheduledAt: { lte: new Date() } },
    orderBy: { scheduledAt: 'asc' },
    take: limit,
    select: { id: true },
  })
  if (due.length === 0) return NextResponse.json({ posts: [] })

  // atomic claim: only posts still in 'scheduled' flip to 'publishing'
  const claimed = await db.post.updateMany({
    where: { id: { in: due.map((p) => p.id) }, status: 'scheduled' },
    data: { status: 'publishing' },
  })

  const posts = claimed.count
    ? await db.post.findMany({
        where: { id: { in: due.map((p) => p.id) }, status: 'publishing' },
        select: {
          id: true, title: true, content: true, image: true,
          platforms: true, variants: true,
        },
      })
    : []

  return NextResponse.json({ posts })
}
