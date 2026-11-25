import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'
import { simulatePublish, engagementSeeds } from '@/lib/publish'

// THE one-click multi-platform publish endpoint
// With ?retry=1 (or body.retry), retries only the previously FAILED platforms of a published post
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const { id } = await params
  const post = await db.post.findFirst({ where: { id, userId: user.id } })
  if (!post) return NextResponse.json({ error: 'not_found' }, { status: 404 })
  const retry = req.nextUrl.searchParams.get('retry') === '1'
  if (post.status === 'published' && !retry) {
    return NextResponse.json({ error: 'already_published' }, { status: 400 })
  }
  const platforms: string[] = JSON.parse(post.platforms || '[]')
  if (platforms.length === 0) {
    return NextResponse.json({ error: 'no_platforms' }, { status: 400 })
  }

  if (retry && post.status === 'published') {
    // merge: keep successful results, re-run failed platforms (succeeds this time)
    const prev = JSON.parse(post.results || '[]') as { platform: string; status: string }[]
    const failedPlatforms = prev.filter((r) => r.status === 'failed').map((r) => r.platform)
    if (failedPlatforms.length === 0) {
      return NextResponse.json({ error: 'nothing_to_retry' }, { status: 400 })
    }
    const retried = simulatePublish(failedPlatforms).map((r) => ({ ...r, status: 'published' as const }))
    const merged = prev.filter((r) => r.status !== 'failed').concat(retried)
    const updated = await db.post.update({
      where: { id },
      data: { results: JSON.stringify(merged) },
      include: { product: true },
    })
    return NextResponse.json({ post: updated, results: merged, retried: failedPlatforms.length })
  }

  const results = simulatePublish(platforms)
  const followers = await db.connectedAccount.aggregate({
    where: { userId: user.id, platform: { in: platforms } },
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
  return NextResponse.json({ post: updated, results })
}
