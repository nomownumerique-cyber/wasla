import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword, setSessionCookie, sanitizeUser } from '@/lib/auth'
import { resetUserToZero, seedWilayas } from '@/lib/seed-data'

export async function POST(req: NextRequest) {
  try {
    const { name, storeName, email, password } = await req.json()
    if (!name || !storeName || !email || !password) {
      return NextResponse.json({ error: 'missing_fields' }, { status: 400 })
    }
    if (typeof password !== 'string' || password.length < 6) {
      return NextResponse.json({ error: 'weak_password' }, { status: 400 })
    }
    const existing = await db.user.findUnique({ where: { email: email.toLowerCase() } })
    if (existing) {
      return NextResponse.json({ error: 'email_exists' }, { status: 409 })
    }
    const slug =
      storeName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || `store-${Date.now()}`

    const user = await db.user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash: hashPassword(password),
        name,
        storeName,
        storeSlug: slug,
        plan: 'trial',
        trialEndsAt: new Date(Date.now() + 14 * 24 * 3600 * 1000),
      },
    })

    await seedWilayas().catch(() => {})
    // fresh account = true zero state (non-fatal if it ever fails)
    try {
      await resetUserToZero(user.id)
    } catch (e) {
      console.error('zero reset failed', e)
    }

    await setSessionCookie(user.id)
    return NextResponse.json({ user: sanitizeUser(user) })
  } catch (e) {
    console.error('register error', e)
    return NextResponse.json({ error: 'server_error' }, { status: 500 })
  }
}
