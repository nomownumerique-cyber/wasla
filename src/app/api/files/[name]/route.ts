import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

// GET /api/files/<name> — serve an uploaded file (images, PDF)

const UPLOAD_DIR = path.join(process.cwd(), 'uploads')

const MIME_BY_EXT: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  gif: 'image/gif',
  pdf: 'application/pdf',
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params
  // strict filename whitelist (no traversal, no slashes)
  if (!/^[A-Za-z0-9_-]{1,120}\.[A-Za-z0-9]{2,5}$/.test(name)) {
    return new NextResponse('bad request', { status: 400 })
  }
  const filePath = path.join(UPLOAD_DIR, name)
  const resolved = path.resolve(filePath)
  if (!resolved.startsWith(path.resolve(UPLOAD_DIR) + path.sep)) {
    return new NextResponse('forbidden', { status: 403 })
  }
  try {
    const data = await fs.readFile(filePath)
    const ext = name.split('.').pop()?.toLowerCase() || ''
    return new NextResponse(new Uint8Array(data), {
      headers: {
        'Content-Type': MIME_BY_EXT[ext] || 'application/octet-stream',
        'Content-Length': String(data.byteLength),
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch {
    return new NextResponse('not found', { status: 404 })
  }
}
