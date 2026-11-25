import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'
import { WILAYAS } from '@/lib/wilayas'

export async function GET() {
  const count = await db.wilaya.count()
  if (count < 58) {
    await db.wilaya.deleteMany()
    await db.wilaya.createMany({ data: WILAYAS })
  }
  const wilayas = await db.wilaya.findMany({ orderBy: { code: 'asc' } })
  return NextResponse.json({ wilayas })
}
