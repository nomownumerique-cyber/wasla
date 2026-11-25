'use client'

// Client-side API helper with typed responses.
// Every request has a hard timeout so a slow/hung connection can never
// freeze the UI forever (mobile preview over embedded browsers).
const DEFAULT_TIMEOUT_MS = 20000
// AI endpoints (z-ai LLM) legitimately take longer than plain CRUD — the
// server route allows 60s — so they get their own generous budget. A short
// timeout here aborts the fetch and looks like a "network error" in the UI.
const AI_TIMEOUT_MS = 90000
const UPLOAD_TIMEOUT_MS = 90000

async function fetchWithTimeout(path: string, init: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(path, { ...init, signal: controller.signal })
  } catch (e) {
    if (e instanceof Error && e.name === 'AbortError') {
      throw new Error('timeout')
    }
    throw e
  } finally {
    clearTimeout(timer)
  }
}

export async function api<T = unknown>(path: string, options?: RequestInit, timeoutMs = DEFAULT_TIMEOUT_MS): Promise<T> {
  const res = await fetchWithTimeout(
    path,
    {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options?.headers || {}),
      },
      credentials: 'same-origin',
    },
    timeoutMs,
  )
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = new Error((data as { error?: string }).error || `Request failed (${res.status})`)
    ;(err as Error & { status?: number }).status = res.status
    throw err
  }
  return data as T
}

export const get = <T = unknown>(path: string) => api<T>(path)
export const post = <T = unknown>(path: string, body?: unknown) =>
  api<T>(path, { method: 'POST', body: JSON.stringify(body ?? {}) })
// Long-budget POST for AI completions (caption / translate / adapt / chat):
// LLM latency spikes well above the default 20s budget.
export const postAI = <T = unknown>(path: string, body?: unknown) =>
  api<T>(path, { method: 'POST', body: JSON.stringify(body ?? {}) }, AI_TIMEOUT_MS)
export const patch = <T = unknown>(path: string, body?: unknown) =>
  api<T>(path, { method: 'PATCH', body: JSON.stringify(body ?? {}) })
export const del = <T = unknown>(path: string) => api<T>(path, { method: 'DELETE' })

// True when a request failed because it exceeded its time budget (browsers
// surface aborted fetches as generic "network errors", which is misleading).
export function isTimeoutError(e: unknown): boolean {
  return e instanceof Error && e.message === 'timeout'
}

// ---------- file uploads (images & PDF, max 8 MB) ----------

const ALLOWED_UPLOAD_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'application/pdf']
const MAX_UPLOAD_SIZE = 8 * 1024 * 1024

export interface UploadedFile {
  url: string
  name: string
  type: string
  size: number
}

export type UploadErrorKind = 'bad_type' | 'too_large' | 'failed'

export const UPLOAD_ERROR_KEYS: Record<UploadErrorKind, string> = {
  bad_type: 'upl.badType',
  too_large: 'upl.tooLarge',
  failed: 'upl.err',
}

export function uploadErrorKind(e: unknown): UploadErrorKind {
  const m = e instanceof Error ? e.message : ''
  if (m === 'bad_type' || m === 'too_large') return m
  return 'failed'
}

export async function uploadMedia(file: File): Promise<UploadedFile> {
  if (!ALLOWED_UPLOAD_TYPES.includes(file.type)) throw new Error('bad_type')
  if (file.size > MAX_UPLOAD_SIZE) throw new Error('too_large')
  const fd = new FormData()
  fd.append('file', file)
  const res = await fetchWithTimeout(
    '/api/upload',
    {
      method: 'POST',
      body: fd,
      credentials: 'same-origin',
    },
    UPLOAD_TIMEOUT_MS,
  )
  const data = (await res.json().catch(() => ({}))) as Partial<UploadedFile> & { error?: string }
  if (!res.ok || !data.url) {
    const err = data.error
    if (err === 'bad_type' || err === 'too_large') throw new Error(err)
    throw new Error('failed')
  }
  return data as UploadedFile
}

export function isImageAttachment(url: string): boolean {
  return /\.(png|jpe?g|webp|gif)$/i.test(url)
}
