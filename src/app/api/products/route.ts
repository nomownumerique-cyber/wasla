import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const q = req.nextUrl.searchParams.get('q')?.toLowerCase() || ''
  const products = await db.product.findMany({
    where: {
      userId: user.id,
      ...(q
        ? {
            OR: [
              { name: { contains: q } },
              { nameAr: { contains: q } },
              { nameFr: { contains: q } },
              { category: { contains: q } },
              { sku: { contains: q } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json({ products })
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const body = await req.json()
  if (!body.name || body.price == null) {
    return NextResponse.json({ error: 'missing_fields' }, { status: 400 })
  }
  const product = await db.product.create({
    data: {
      userId: user.id,
      name: body.name,
      nameAr: body.nameAr || '',
      nameFr: body.nameFr || '',
      description: body.description || '',
      category: body.category || 'general',
      price: Number(body.price) || 0,
      comparePrice: body.comparePrice ? Number(body.comparePrice) : null,
      stock: Number(body.stock) || 0,
      sku: body.sku || `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
      image: body.image || '',
      status: body.status || 'active',
    },
  })
  return NextResponse.json({ product })
}
