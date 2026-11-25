import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const { id } = await params
  const existing = await db.product.findFirst({ where: { id, userId: user.id } })
  if (!existing) return NextResponse.json({ error: 'not_found' }, { status: 404 })
  const body = await req.json()
  const product = await db.product.update({
    where: { id },
    data: {
      ...(body.name !== undefined ? { name: body.name } : {}),
      ...(body.nameAr !== undefined ? { nameAr: body.nameAr } : {}),
      ...(body.nameFr !== undefined ? { nameFr: body.nameFr } : {}),
      ...(body.description !== undefined ? { description: body.description } : {}),
      ...(body.category !== undefined ? { category: body.category } : {}),
      ...(body.price !== undefined ? { price: Number(body.price) } : {}),
      ...(body.comparePrice !== undefined ? { comparePrice: body.comparePrice ? Number(body.comparePrice) : null } : {}),
      ...(body.stock !== undefined ? { stock: Number(body.stock) } : {}),
      ...(body.sku !== undefined ? { sku: body.sku } : {}),
      ...(body.image !== undefined ? { image: body.image } : {}),
      ...(body.status !== undefined ? { status: body.status } : {}),
    },
  })
  return NextResponse.json({ product })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const { id } = await params
  const existing = await db.product.findFirst({ where: { id, userId: user.id } })
  if (!existing) return NextResponse.json({ error: 'not_found' }, { status: 404 })
  await db.product.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
