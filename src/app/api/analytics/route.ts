import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'

const now = new Date()
const d30 = new Date(now.getTime() - 30 * 24 * 3600 * 1000)
const d60 = new Date(now.getTime() - 60 * 24 * 3600 * 1000)

export async function GET() {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const [orders, posts, accounts, products] = await Promise.all([
    db.order.findMany({ where: { userId: user.id, createdAt: { gte: d60 } }, include: { items: true } }),
    db.post.findMany({ where: { userId: user.id } }),
    db.connectedAccount.findMany({ where: { userId: user.id } }),
    db.product.findMany({ where: { userId: user.id } }),
  ])

  const in30 = orders.filter((o) => o.createdAt >= d30)
  const prev30 = orders.filter((o) => o.createdAt >= d60 && o.createdAt < d30)

  const validStatuses = new Set(['pending', 'confirmed', 'packed', 'shipped', 'delivered'])
  const revenue = in30.filter((o) => validStatuses.has(o.status)).reduce((s, o) => s + o.total, 0)
  const prevRevenue = prev30.filter((o) => validStatuses.has(o.status)).reduce((s, o) => s + o.total, 0)
  const delivered = in30.filter((o) => o.status === 'delivered')
  const returned = in30.filter((o) => o.status === 'returned')
  const deliveredRate = in30.length ? Math.round((delivered.length / in30.length) * 100) : 0
  const returnRate = in30.length ? Math.round((returned.length / in30.length) * 100) : 0
  const avgOrder = in30.length ? Math.round(revenue / in30.length) : 0

  // revenue trend per day (30 days)
  const trend: { date: string; revenue: number; orders: number }[] = []
  for (let i = 29; i >= 0; i--) {
    const day = new Date(now.getTime() - i * 24 * 3600 * 1000)
    const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate())
    const dayEnd = new Date(dayStart.getTime() + 24 * 3600 * 1000)
    const dayOrders = in30.filter((o) => o.createdAt >= dayStart && o.createdAt < dayEnd && validStatuses.has(o.status))
    trend.push({
      date: dayStart.toISOString().slice(0, 10),
      revenue: dayOrders.reduce((s, o) => s + o.total, 0),
      orders: dayOrders.length,
    })
  }

  // sales by wilaya (top 10)
  const byWilayaMap = new Map<string, { code: number; name: string; revenue: number; orders: number }>()
  for (const o of in30.filter((o) => validStatuses.has(o.status))) {
    const entry = byWilayaMap.get(o.wilayaName) || { code: o.wilayaCode, name: o.wilayaName, revenue: 0, orders: 0 }
    entry.revenue += o.total
    entry.orders += 1
    byWilayaMap.set(o.wilayaName, entry)
  }
  const byWilaya = Array.from(byWilayaMap.values()).sort((a, b) => b.revenue - a.revenue).slice(0, 10)

  // platform performance from published posts
  const platformStats = new Map<string, { platform: string; posts: number; reach: number; clicks: number }>()
  for (const p of posts.filter((x) => x.status === 'published')) {
    const plats: string[] = JSON.parse(p.platforms || '[]')
    for (const pl of plats) {
      const entry = platformStats.get(pl) || { platform: pl, posts: 0, reach: 0, clicks: 0 }
      entry.posts += 1
      entry.clicks += p.clicks
      const results = JSON.parse(p.results || '[]') as { platform: string; reach: number }[]
      const r = results.find((x) => x.platform === pl)
      entry.reach += r?.reach || Math.round(p.views / plats.length)
      platformStats.set(pl, entry)
    }
  }
  const byPlatform = Array.from(platformStats.values()).sort((a, b) => b.reach - a.reach)

  // best sellers (all time)
  const sellerMap = new Map<string, { name: string; image: string; units: number; revenue: number }>()
  for (const o of orders) {
    for (const it of o.items) {
      const entry = sellerMap.get(it.name) || { name: it.name, image: '', units: 0, revenue: 0 }
      entry.units += it.quantity
      entry.revenue += it.price * it.quantity
      const product = products.find((p) => p.name === it.name)
      if (product?.image) entry.image = product.image
      sellerMap.set(it.name, entry)
    }
  }
  const topProducts = Array.from(sellerMap.values()).sort((a, b) => b.units - a.units).slice(0, 5)

  const totalFollowers = accounts.reduce((s, a) => s + (a.status === 'connected' ? a.followers : 0), 0)
  const scheduled = posts.filter((p) => p.status === 'scheduled').length
  const published = posts.filter((p) => p.status === 'published')

  // publishing errors: failed per-platform results on published posts (retryable)
  const publishErrors = published
    .flatMap((p) => {
      const results = JSON.parse(p.results || '[]') as { platform: string; status: string }[]
      return results
        .filter((r) => r.status === 'failed')
        .map((r) => ({ postId: p.id, title: p.title || p.content.slice(0, 40), platform: r.platform, publishedAt: p.publishedAt }))
    })
    .slice(0, 6)

  return NextResponse.json({
    kpis: {
      revenue,
      prevRevenue,
      revenueChange: prevRevenue ? Math.round(((revenue - prevRevenue) / prevRevenue) * 100) : null,
      orders: in30.length,
      prevOrders: prev30.length,
      deliveredRate,
      returnRate,
      avgOrder,
      followers: totalFollowers,
      scheduled,
      publishedCount: published.length,
      errorsCount: publishErrors.length,
    },
    accounts: accounts.map((a) => ({
      platform: a.platform,
      handle: a.handle,
      followers: a.followers,
      status: a.status,
    })),
    publishErrors,
    trend,
    byWilaya,
    byPlatform,
    topProducts,
    engagement: {
      views: published.reduce((s, p) => s + p.views, 0),
      likes: published.reduce((s, p) => s + p.likes, 0),
      comments: published.reduce((s, p) => s + p.comments, 0),
      clicks: published.reduce((s, p) => s + p.clicks, 0),
    },
    recentOrders: orders
      .filter((o) => o.createdAt >= d30)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 6)
      .map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        customerName: o.customerName,
        wilayaName: o.wilayaName,
        total: o.total,
        status: o.status,
        createdAt: o.createdAt,
      })),
    upcomingPosts: posts
      .filter((p) => p.status === 'scheduled' && p.scheduledAt)
      .sort((a, b) => (a.scheduledAt!.getTime() || 0) - (b.scheduledAt!.getTime() || 0))
      .slice(0, 5)
      .map((p) => ({
        id: p.id,
        title: p.title || p.content.slice(0, 60),
        image: p.image,
        platforms: JSON.parse(p.platforms || '[]'),
        scheduledAt: p.scheduledAt,
      })),
  })
}
