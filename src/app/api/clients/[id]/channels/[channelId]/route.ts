import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'

// DELETE /api/clients/[id]/channels/[channelId] — disconnect one of the
// client's social accounts (revokes WASLA's delegated access).
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; channelId: string }> },
) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const { id, channelId } = await params

  const channel = await db.clientChannel.findFirst({
    where: { id: channelId, clientId: id },
    include: { client: true },
  })
  if (!channel || channel.client.userId !== user.id) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }

  await db.clientChannel.delete({ where: { id: channelId } })
  return NextResponse.json({ ok: true })
}
