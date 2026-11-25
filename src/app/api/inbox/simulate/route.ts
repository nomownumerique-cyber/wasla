import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'
import { runMessageAutomation } from '@/lib/automations'

// Simulate an incoming customer message (used by the demo button & the realtime socket service)
// Some messages carry a photo attachment, like real WhatsApp / Messenger traffic.
// Every incoming message also runs through the automations engine: if an
// active message-scope rule matches, the auto-reply is posted instantly in
// the conversation (as a merchant message flagged with the automation id).

interface IncomingTemplate {
  body: string
  attachment?: string
}

const INCOMING: IncomingTemplate[] = [
  { body: 'Salam, tji taille M? 🌸' },
  { body: 'Salam khaw, wach l livraison l Alger wach kayna?' },
  { body: 'Bonjour, est-ce que le produit est encore disponible ?' },
  { body: 'Hi! How much is the shipping to Oran?' },
  { body: 'Salam 3lik, nhab na3ref taman l produit hada' },
  { body: 'السلام عليكم، هل التوصيل متوفر لولاية سطيف؟' },
  { body: 'Salam, la robe djamila bezzaf, wach ndir commande?' },
  { body: 'Wach kayna promo had lsemaine? 👀' },
  { body: 'Salam, l article jit m3a la livraison wela ndi3ha nhar l delivery?' },
  { body: 'Bonjour, je voudrais commander 2 pièces, c\'est possible ?' },
  { body: 'Salam, pouvez-vous me envoyer les tailles disponibles ?' },
  { body: 'Wach tqdro t3awnouni, n7eb ndir hdi hadiya lel mama 💐' },
  { body: 'Wach hadi hiya la couleur? J\'ai mis la photo', attachment: '/products/caftan.png' },
  { body: 'Salam, wach 3ndkom l produit hada?', attachment: '/products/jewelry.png' },
  { body: '', attachment: '/products/tagine.png' },
  { body: '', attachment: '/products/cosmetics.png' },
]

const NEW_CUSTOMERS = [
  { name: 'Imene Kaci', phone: '+213553121214', channel: 'whatsapp' },
  { name: 'Walid Amrani', phone: '+213669410782', channel: 'facebook' },
  { name: 'Meriem Laroussi', phone: '+213772033645', channel: 'instagram' },
  { name: 'Hichem Djaballah', phone: '+213556777899', channel: 'whatsapp' },
  { name: 'Fairouz Benali', phone: '+213661244357', channel: 'whatsapp' },
]

async function createIncoming(userId: string, conversationId?: string, spawnNew = false) {
  let conversation = conversationId
    ? await db.conversation.findFirst({ where: { id: conversationId, userId } })
    : null

  if (!conversation || spawnNew) {
    const customer = NEW_CUSTOMERS[Math.floor(Math.random() * NEW_CUSTOMERS.length)]
    conversation = await db.conversation.create({
      data: {
        userId,
        channel: customer.channel,
        customerName: customer.name,
        customerPhone: customer.phone,
        unread: 1,
        lastMessageAt: new Date(),
      },
    })
  }

  const template = INCOMING[Math.floor(Math.random() * INCOMING.length)]
  const message = await db.message.create({
    data: { conversationId: conversation.id, sender: 'customer', body: template.body, attachment: template.attachment || null },
  })
  const updated = await db.conversation.update({
    where: { id: conversation.id },
    data: { lastMessageAt: new Date(), unread: { increment: 1 } },
  })
  return { message, conversation: updated }
}

export async function POST(req: NextRequest) {
  // auth: either a merchant session OR the internal realtime service secret
  const serviceSecret = req.headers.get('x-wasla-service-secret')
  let userId: string | null = null
  if (serviceSecret && serviceSecret === (process.env.SERVICE_SECRET || 'wasla-inbox-service-secret')) {
    const body = await req.json().catch(() => ({}))
    userId = body.userId || null
  } else {
    const user = await getSessionUser()
    userId = user?.id || null
  }
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { conversationId, spawnNew } = await req.json().catch(() => ({}))
  const { message, conversation } = await createIncoming(userId, conversationId, !!spawnNew)

  // Automations engine: if an active message-scope rule (facebook/instagram
  // DMs) matches the incoming text, the auto-reply is posted immediately.
  let automation: { message: typeof message; ruleName: string } | null = null
  if (message.body.trim() && (conversation.channel === 'facebook' || conversation.channel === 'instagram')) {
    const user = await db.user.findUnique({ where: { id: userId } })
    if (user) {
      try {
        automation = await runMessageAutomation(user, {
          text: message.body,
          platform: conversation.channel,
          conversationId: conversation.id,
        })
      } catch (e) {
        console.error('automation error', e)
      }
    }
  }

  return NextResponse.json({ message, conversation, automation })
}
