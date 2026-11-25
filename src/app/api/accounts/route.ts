import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'
import { AD_PLATFORMS, generateAdAccountId, adPlatformById } from '@/lib/ad-platforms'

export async function GET() {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const accounts = await db.connectedAccount.findMany({
    where: { userId: user.id },
    orderBy: [{ kind: 'asc' }, { createdAt: 'asc' }],
  })
  return NextResponse.json({ accounts })
}

// simulated OAuth connect (social platforms + ad networks via the in-app flow)
export async function POST(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const { platform, handle, scopes } = await req.json()
  if (!platform) return NextResponse.json({ error: 'missing_fields' }, { status: 400 })

  const adsMeta = adPlatformById(platform)
  const kind = adsMeta ? 'ads' : 'social'

  if (kind === 'ads') {
    // --- ad network connect (Zernio-style in-app OAuth flow result) ---
    const granted: string[] = Array.isArray(scopes) ? scopes.filter((s: unknown) => typeof s === 'string') : []
    const adAccountId = generateAdAccountId(adsMeta)
    const existing = await db.connectedAccount.findFirst({ where: { userId: user.id, platform } })
    if (existing) {
      const account = await db.connectedAccount.update({
        where: { id: existing.id },
        data: {
          status: 'connected',
          kind,
          adAccountId,
          scopes: JSON.stringify(granted.length ? granted : adsMeta.scopes.map((s) => s.id)),
          handle: handle || existing.handle,
        },
      })
      return NextResponse.json({ account })
    }
    const account = await db.connectedAccount.create({
      data: {
        userId: user.id,
        platform,
        kind,
        adAccountId,
        scopes: JSON.stringify(granted.length ? granted : adsMeta.scopes.map((s) => s.id)),
        handle: handle || `${user.storeSlug}-ads`,
        followers: 0,
        status: 'connected',
      },
    })
    return NextResponse.json({ account })
  }

  // --- social platform connect (unchanged legacy flow) ---
  const existing = await db.connectedAccount.findFirst({ where: { userId: user.id, platform } })
  if (existing) {
    const account = await db.connectedAccount.update({
      where: { id: existing.id },
      data: { status: 'connected', handle: handle || existing.handle },
    })
    return NextResponse.json({ account })
  }
  const account = await db.connectedAccount.create({
    data: {
      userId: user.id,
      platform,
      handle: handle || `@${user.storeSlug || 'store'}`,
      followers: Math.floor(500 + Math.random() * 5000),
      status: 'connected',
    },
  })
  return NextResponse.json({ account })
}

// ad platform catalog for the in-app Platforms hub (Zernio-style metadata)
export async function OPTIONS() {
  return NextResponse.json({ platforms: AD_PLATFORMS.map((p) => ({ id: p.id, slug: p.slug })) })
}
