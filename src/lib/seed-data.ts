import { db } from '@/lib/db'
import { WILAYAS } from '@/lib/wilayas'

// Reference data: the 58 wilayas with delivery pricing. This is app
// configuration (not user data) — seeded once, never fabricated counts.
export async function seedWilayas() {
  const count = await db.wilaya.count()
  if (count >= 58) return
  await db.wilaya.deleteMany()
  await db.wilaya.createMany({ data: WILAYAS })
}

// True zero state: every counter in the dashboard starts at 0 and only
// grows from the merchant's own actions. Nothing is fabricated — no
// starter catalog, no pre-connected accounts, no example automations.
export async function resetUserToZero(userId: string) {
  await db.clientChannel.deleteMany({ where: { client: { userId } } })
  await db.client.deleteMany({ where: { userId } })
  await db.orderItem.deleteMany({ where: { order: { userId } } })
  await db.order.deleteMany({ where: { userId } })
  await db.message.deleteMany({ where: { conversation: { userId } } })
  await db.conversation.deleteMany({ where: { userId } })
  await db.post.deleteMany({ where: { userId } } })
  await db.campaign.deleteMany({ where: { userId } })
  await db.connectedAccount.deleteMany({ where: { userId } })
  await db.product.deleteMany({ where: { userId } })
  await db.automation.deleteMany({ where: { userId } })
}
