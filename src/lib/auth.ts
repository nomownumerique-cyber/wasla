import crypto from 'crypto'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'

const SECRET = process.env.AUTH_SECRET || 'wasla-dev-secret-change-me'
export const SESSION_COOKIE = 'wasla_session'
const SESSION_DAYS = 30

// ---------- password hashing (scrypt, built-in) ----------
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.scryptSync(password, salt, 64).toString('hex')
  return `${salt}:${hash}`
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(':')
  if (!salt || !hash) return false
  const candidate = crypto.scryptSync(password, salt, 64).toString('hex')
  const a = Buffer.from(candidate, 'hex')
  const b = Buffer.from(hash, 'hex')
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}

// ---------- HMAC session token ----------
export function signToken(userId: string): string {
  const exp = Date.now() + SESSION_DAYS * 24 * 3600 * 1000
  const payload = `${userId}|${exp}`
  const sig = crypto.createHmac('sha256', SECRET).update(payload).digest('hex')
  return `${Buffer.from(payload).toString('base64url')}.${sig}`
}

export function verifyToken(token: string): string | null {
  const [encoded, sig] = token.split('.')
  if (!encoded || !sig) return null
  try {
    const payload = Buffer.from(encoded, 'base64url').toString('utf8')
    const expected = crypto.createHmac('sha256', SECRET).update(payload).digest('hex')
    const a = Buffer.from(sig, 'hex')
    const b = Buffer.from(expected, 'hex')
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null
    const [userId, expStr] = payload.split('|')
    if (!userId || !expStr) return null
    if (Date.now() > Number(expStr)) return null
    return userId
  } catch {
    return null
  }
}

// ---------- session helpers for route handlers ----------
export async function setSessionCookie(userId: string) {
  const store = await cookies()
  store.set(SESSION_COOKIE, signToken(userId), {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_DAYS * 24 * 3600 * 1000,
  })
}

export async function clearSessionCookie() {
  const store = await cookies()
  store.set(SESSION_COOKIE, '', { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 0 })
}

export async function getSessionUserId(): Promise<string | null> {
  const store = await cookies()
  const token = store.get(SESSION_COOKIE)?.value
  if (!token) return null
  return verifyToken(token)
}

export async function getSessionUser() {
  const uid = await getSessionUserId()
  if (!uid) return null
  const user = await db.user.findUnique({ where: { id: uid } })
  return user
}

export function sanitizeUser(user: {
  id: string
  email: string
  name: string
  storeName: string
  storeSlug: string
  phone: string
  whatsapp: string
  plan: string
  trialEndsAt: Date | null
  locale: string
  currency: string
  createdAt: Date
}) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    storeName: user.storeName,
    storeSlug: user.storeSlug,
    phone: user.phone,
    whatsapp: user.whatsapp,
    plan: user.plan,
    trialEndsAt: user.trialEndsAt,
    locale: user.locale,
    currency: user.currency,
    createdAt: user.createdAt,
  }
}

export type SessionUser = ReturnType<typeof sanitizeUser>
