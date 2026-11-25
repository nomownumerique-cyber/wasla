'use client'

import { io, Socket } from 'socket.io-client'

// Realtime inbox connection (mini-service on port 3003 via the gateway)
let socket: Socket | null = null
let connectPromise: Promise<Socket | null> | null = null

export type InboxMessage = {
  id: string
  conversationId: string
  sender: string
  body: string
  attachment?: string | null
  createdAt: string
}

export type InboxConversation = {
  id: string
  channel: string
  customerName: string
  customerPhone: string
  unread: number
  lastMessageAt: string
}

export function getSocket(userId: string): Promise<Socket | null> {
  if (socket && socket.connected) return Promise.resolve(socket)
  if (connectPromise) return connectPromise
  connectPromise = new Promise((resolve) => {
    try {
      const s = io('/?XTransformPort=3003', {
        path: '/',
        transports: ['websocket', 'polling'],
        reconnectionAttempts: 5,
        timeout: 8000,
      })
      s.on('connect', () => {
        socket = s
        s.emit('join', { userId })
        resolve(s)
      })
      s.on('connect_error', () => {
        // fall back to REST polling; resolve null so callers know socket is unavailable
        if (!socket) resolve(null)
      })
    } catch {
      resolve(null)
    }
  })
  return connectPromise
}

export function closeSocket() {
  if (socket) {
    socket.disconnect()
    socket = null
    connectPromise = null
  }
}
