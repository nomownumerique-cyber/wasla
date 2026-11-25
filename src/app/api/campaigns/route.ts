import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'
import { adPlatformForCampaign } from '@/lib/ad-platforms'

export async function GET() {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const campaigns = await db.campaign.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json({ campaigns })
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const { name, platform, objective, budget, days } = await req.json()
  if (!name || !platform || !budget) {
    return NextResponse.json({ error: 'missing_fields' }, { status: 400 })
  }

  // campaigns now run on a real (simulated) connected ad account — like the
  // Zernio-style console: no account, no campaign.
  const adsMeta = adPlatformForCampaign(platform)
  let adAccount: { id: string; adAccountId: string; handle: string } | null = null
  if (adsMeta) {
    const connected = await db.connectedAccount.findFirst({
      where: { userId: user.id, platform: adsMeta.id, status: 'connected' },
    })
    if (!connected) {
      return NextResponse.json(
        { error: 'account_not_connected', platform: adsMeta.id },
        { status: 400 }
      )
    }
    adAccount = { id: connected.id, adAccountId: connected.adAccountId, handle: connected.handle }
  }

  const dayCount = Math.max(1, Number(days) || 7)
  const daily = Number(budget)
  // simulated initial metrics
  const reach = Math.floor(daily * 90 + Math.random() * 5000)
  const clicks = Math.floor(reach * 0.04 + Math.random() * 200)
  const conversions = Math.floor(clicks * 0.02 + Math.random() * 10)
  const campaign = await db.campaign.create({
    data: {
      userId: user.id,
      name,
      platform,
      objective: objective || 'sales',
      budget: daily,
      days: dayCount,
      status: 'active',
      reach,
      clicks,
      conversions,
      spend: Math.round(daily * 0.6),
      adAccountId: adAccount?.adAccountId || '',
      startDate: new Date(),
    },
  })
  return NextResponse.json({ campaign })
}
