import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser, sanitizeUser } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const { name, storeName, phone, whatsapp, locale } = await req.json()
  const updated = await db.user.update({
    where: { id: user.id },
    data: {
      ...(name ? { name } : {}),
      ...(storeName ? { storeName } : {}),
      ...(phone !== undefined ? { phone } : {}),
      ...(whatsapp !== undefined ? { whatsapp } : {}),
      ...(locale ? { locale } : {}),
    },
  })
  return NextResponse.json({ user: sanitizeUser(updated) })
}
