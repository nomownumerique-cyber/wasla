import { createServer } from 'http'
import { Server } from 'socket.io'

const PORT = 3003
const NEXT_API = 'http://localhost:3000/api/inbox/simulate'
const SERVICE_SECRET = process.env.SERVICE_SECRET || 'wasla-inbox-service-secret'

const httpServer = createServer()
const io = new Server(httpServer, {
  // path must stay '/' — the gateway (Caddy) forwards /?XTransformPort=3003 to this service
  path: '/',
  cors: { origin: '*', methods: ['GET', 'POST'] },
  pingTimeout: 60000,
  pingInterval: 25000,
})

// users currently connected (roomId -> number of sockets)
const roomSockets = new Map<string, number>()

async function createIncoming(userId: string, conversationId: string | null) {
  const res = await fetch(NEXT_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-wasla-service-secret': SERVICE_SECRET,
    },
    body: JSON.stringify({ userId, conversationId: conversationId || undefined, spawnNew: !conversationId }),
  })
  if (!res.ok) throw new Error(`simulate failed: ${res.status}`)
  return res.json() as Promise<{ message: { id: string; conversationId: string; sender: string; body: string; createdAt: string }; conversation: { id: string; channel: string; customerName: string; unread: number; lastMessageAt: string } }>
}

function broadcast(userId: string, event: string, payload: unknown) {
  io.to(`user:${userId}`).emit(event, payload)
}

io.on('connection', (socket) => {
  let joinedUser: string | null = null

  socket.on('join', (data: { userId: string }) => {
    if (!data?.userId) return
    joinedUser = data.userId
    const room = `user:${data.userId}`
    socket.join(room)
    roomSockets.set(room, (roomSockets.get(room) || 0) + 1)
    console.log(`[inbox] user ${data.userId} joined (${roomSockets.get(room)} sockets)`)
  })

  // dashboard button: simulate an incoming customer message
  socket.on('trigger', async (data: { userId: string; conversationId: string | null }) => {
    if (!data?.userId) return
    const convId = data.conversationId || null
    if (convId) broadcast(data.userId, 'typing', { conversationId: convId })
    try {
      const payload = await createIncoming(data.userId, convId)
      broadcast(data.userId, 'message', payload)
    } catch (e) {
      console.error('[inbox] trigger failed', (e as Error).message)
    }
  })

  // merchant sent a message in the dashboard → simulate the customer replying a bit later
  socket.on('merchant-message', async (data: { userId: string; conversationId: string }) => {
    if (!data?.userId || !data.conversationId) return
    const { userId, conversationId } = data
    const typingDelay = 1500 + Math.random() * 2000
    const replyDelay = typingDelay + 2500 + Math.random() * 4000
    setTimeout(() => {
      broadcast(userId, 'typing', { conversationId })
    }, typingDelay)
    setTimeout(async () => {
      try {
        const payload = await createIncoming(userId, conversationId)
        broadcast(userId, 'message', payload)
      } catch {
        /* customer did not reply — fine */
      }
    }, replyDelay)
  })

  socket.on('disconnect', () => {
    if (joinedUser) {
      const room = `user:${joinedUser}`
      const count = (roomSockets.get(room) || 1) - 1
      if (count <= 0) roomSockets.delete(room)
      else roomSockets.set(room, count)
      console.log(`[inbox] user ${joinedUser} left (${Math.max(0, count)} sockets)`)
    }
  })
})

// ambient life: a customer occasionally writes to a connected merchant (demo realism)
setInterval(async () => {
  const rooms = Array.from(roomSockets.keys())
  if (rooms.length === 0) return
  if (Math.random() > 0.5) return // ~every other cycle
  const room = rooms[Math.floor(Math.random() * rooms.length)]
  const userId = room.replace('user:', '')
  try {
    const payload = await createIncoming(userId, null) // spawnNew → may create a new conversation
    broadcast(userId, 'message', payload)
    console.log(`[inbox] ambient message for ${userId}`)
  } catch (e) {
    console.error('[inbox] ambient failed', (e as Error).message)
  }
}, 180000)

httpServer.listen(PORT, () => {
  console.log(`[inbox] WASLA realtime inbox service running on port ${PORT}`)
})

process.on('SIGTERM', () => {
  httpServer.close(() => process.exit(0))
})
process.on('SIGINT', () => {
  httpServer.close(() => process.exit(0))
})
