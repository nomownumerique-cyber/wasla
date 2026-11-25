// Agency model: serialization + allowed enum values for client workspaces.
// Used by /api/clients routes only (server side).
import type { Client, ClientChannel } from '@prisma/client'

export const CLIENT_PLANS = ['starter', 'growth', 'pro'] as const
export const CLIENT_INDUSTRIES = ['fashion', 'beauty', 'electronics', 'food', 'general'] as const
export const CLIENT_STATUSES = ['invited', 'active', 'paused'] as const

export interface ClientChannelDTO {
  id: string
  platform: string
  handle: string
  followers: number
  status: string
  scopes: string
  connectedAt: string
}

export interface ClientDTO {
  id: string
  name: string
  contactEmail: string
  contactPhone: string
  industry: string
  plan: string
  monthlyFee: number
  status: string
  notes: string
  createdAt: string
  updatedAt: string
  channels: ClientChannelDTO[]
  postsCount: number
  lastActivityAt: string
}

type ClientRow = Client & { channels: ClientChannel[]; _count?: { posts: number } }

export function serializeChannel(ch: ClientChannel): ClientChannelDTO {
  return {
    id: ch.id,
    platform: ch.platform,
    handle: ch.handle,
    followers: ch.followers,
    status: ch.status,
    scopes: ch.scopes,
    connectedAt: ch.connectedAt.toISOString(),
  }
}

export function serializeClient(c: ClientRow, lastActivityAt: Date): ClientDTO {
  return {
    id: c.id,
    name: c.name,
    contactEmail: c.contactEmail,
    contactPhone: c.contactPhone,
    industry: c.industry,
    plan: c.plan,
    monthlyFee: c.monthlyFee,
    status: c.status,
    notes: c.notes,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
    channels: [...c.channels]
      .sort((a, b) => a.connectedAt.getTime() - b.connectedAt.getTime())
      .map(serializeChannel),
    postsCount: c._count?.posts ?? 0,
    lastActivityAt: lastActivityAt.toISOString(),
  }
}
