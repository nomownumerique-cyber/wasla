import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'
import { simulatePublish, engagementSeeds } from '@/lib/publish'

export async function GET(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const status = req.nextUrl.searchParams.get('status') || ''
  // workspace scoping (agency mode):
  //   clientId=<id>   → posts of that client workspace
  //   clientId=mine   → the merchant's own posts (clientId null)
  //   absent          → all posts of the user (legacy behaviour)
  const clientIdParam = req.nextUrl.searchParams.get('clientId') || ''
  const posts = await db.post.findMany({
    where: {
      userId: user.id,
      ...(status ? { status } : {}),
      ...(clientIdParam === 'mine' ? { clientId: null } : clientIdParam ? { clientId: clientIdParam } : {}),
    },
    include: {
      product: true,
      client: { select: { id: true, name: true } },
    },
    orderBy: [{ scheduledAt: 'asc' }, { createdAt: 'desc' }],
  })
  return NextResponse.json({ posts })
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const body = await req.json()
  const platforms: string[] = Array.isArray(body.platforms) ? body.platforms : []
  if (platforms.length === 0) {
    return NextResponse.json({ error: 'no_platforms' }, { status: 400 })
  }
  if (!body.content && !body.productId) {
    return NextResponse.json({ error: 'no_content' }, { status: 400 })
  }

  const product = body.productId
    ? await db.product.findFirst({ where: { id: body.productId, userId: user.id } })
    : null

  // agency mode: post created inside a client workspace stays attached to it
  // (ownership validated; invalid ids are ignored → the merchant's own posts)
  let clientId: string | null = null
  if (typeof body.clientId === 'string' && body.clientId) {
  const cl = await db.client.findFirst({
      where: { id: body.clientId, userId: user.id },
      select: { id: true },
    })
    if (cl) clientId = cl.id
  }

  const publishNow = !!body.publishNow
  const variants: Record<string, string> =
    body.variants && typeof body.variants === 'object' && !Array.isArray(body.variants)
      ? Object.fromEntries(Object.entries(body.variants as Record<string, unknown>).filter(([, v]) => typeof v === 'string'))
      : {}

  const data: Record<string, unknown> = {
    userId: user.id,
    clientId,
    productId: product?.id || null,
    title: body.title || '',
    content: body.content || '',
    contentAr: body.contentAr || '',
    contentFr: body.contentFr || '',
    image: product?.image || body.image || '',
    platforms: JSON.stringify(platforms),
    variants: JSON.stringify(variants),
    status: publishNow ? 'published' : 'scheduled',
  }

  if (publishNow) {
    data.publishedAt = new Date()
    data.results = JSON.stringify(simulatePublish(platforms))
    const followers = await db.connectedAccount.aggregate({
      where: { userId: user.id, platform: { in: platforms } },
      _sum: { followers: true },
    })
    const seeds = engagementSeeds(followers._sum.followers || 12000)
    data.views = seeds.views
    data.likes = seeds.likes
    data.comments = seeds.comments
    data.clicks = seeds.clicks
  } else {
    data.scheduledAt = body.scheduledAt ? new Date(body.scheduledAt) : new Date(Date.now() + 3600 * 1000)
  }

  const post = await db.post.create({
    data: data as never,
    include: { product: true, client: { select: { id: true, name: true } } },
  })
  return NextResponse.json({ post })
}
