import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser, sanitizeUser } from '@/lib/auth'
import { resetUserToZero } from '@/lib/seed-data'

export async function POST() {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  await resetUserToZero(user.id)
  return NextResponse.json({ user: sanitizeUser(user) })
}
