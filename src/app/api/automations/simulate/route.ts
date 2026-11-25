import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'
import { runCommentAutomation } from '@/lib/automations'

export const dynamic = 'force-dynamic'

// Simulates an incoming COMMENT on the merchant's latest published post for
// the chosen platform (facebook | instagram). If an active comment-scope
// automation matches, it fires for real: the rule's counter increments, the
// post's comment count grows and the public auto-reply is returned.
export async function POST(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const body = await req.json().catch(() => ({}))
  const platform = body.platform === 'instagram' ? 'instagram' : 'facebook'
  const text = String(body.text || '').trim().slice(0, 500)
  if (!text) return NextResponse.json({ error: 'missing_text' }, { status: 400 })

  const fresh = await db.user.findUnique({ where: { id: user.id } })
  if (!fresh) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  // latest published post that went to this platform
  const posts = await db.post.findMany({
    where: { userId: user.id, status: 'published' },
    orderBy: { publishedAt: 'desc' },
    take: 30,
  })
  const post = posts.find((p) => {
    try {
      const plats = JSON.parse(p.platforms) as string[]
      return Array.isArray(plats) && plats.includes(platform)
    } catch {
      return false
    }
  })
  if (!post) return NextResponse.json({ error: 'no_post' }, { status: 404 })

  const fired = await runCommentAutomation(fresh, { text, platform, post })
  if (!fired) {
    return NextResponse.json({
      matched: false,
      postTitle: post.title,
    })
  }
  // the public auto-reply lands on the post — engagement counter follows
  await db.post.update({ where: { id: post.id }, data: { comments: { increment: 1 } } })
  return NextResponse.json({
    matched: true,
    postTitle: post.title,
    ruleName: fired.ruleName,
    reply: fired.reply,
  })
}
