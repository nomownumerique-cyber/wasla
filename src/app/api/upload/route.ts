import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import { randomUUID } from 'crypto'
import { getSessionUser } from '@/lib/auth'

// POST /api/upload — multipart file upload (images & PDF)
// Files are stored in ./uploads and served through /api/files/<name>

const UPLOAD_DIR = path.join(process.cwd(), 'uploads')
const MAX_SIZE = 8 * 1024 * 1024 // 8 MB

const EXT_BY_TYPE: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'application/pdf': 'pdf',
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const form = await req.formData().catch(() => null)
  const file = form?.get('file')
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'missing_file' }, { status: 400 })
  }

  const ext = EXT_BY_TYPE[file.type]
  if (!ext) return NextResponse.json({ error: 'bad_type' }, { status: 415 })
  if (file.size > MAX_SIZE) return NextResponse.json({ error: 'too_large' }, { status: 413 })
  if (file.size === 0) return NextResponse.json({ error: 'empty_file' }, { status: 400 })

  try {
    await fs.mkdir(UPLOAD_DIR, { recursive: true })
    const name = `${Date.now().toString(36)}-${randomUUID().slice(0, 8)}.${ext}`
    const buffer = Buffer.from(await file.arrayBuffer())
    await fs.writeFile(path.join(UPLOAD_DIR, name), buffer)
    return NextResponse.json({
      url: `/api/files/${name}`,
      name: file.name,
      type: file.type,
      size: file.size,
    })
  } catch {
    return NextResponse.json({ error: 'upload_failed' }, { status: 500 })
  }
}
