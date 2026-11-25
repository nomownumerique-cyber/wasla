import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser, sanitizeUser } from '@/lib/auth'

export const PLANS = {
  free: { id: 'free', price: 0, posts: 10, platforms: 3, seats: 1 },
  pro: { id: 'pro', price: 2900, posts: 100, platforms: 8, seats: 3 },
  business: { id: 'business', price: 8900, posts: 1000, platforms: 8, seats: 10 },
}

export async function GET() {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  return NextResponse.json({ user: sanitizeUser(user), plans: PLANS })
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const { plan } = await req.json()
  if (!['free', 'pro', 'business', 'trial'].includes(plan)) {
    return NextResponse.json({ error: 'invalid_plan' }, { status: 400 })
  }
  const updated = await db.user.update({
    where: { id: user.id },
    data: {
      plan,
      ...(plan === 'trial' ? { trialEndsAt: new Date(Date.now() + 14 * 24 * 3600 * 1000) } : {}),
      ...(plan === 'free' ? { trialEndsAt: null } : {}),
    },
  })
  return NextResponse.json({ user: sanitizeUser(updated), plans: PLANS })
}
