#!/usr/bin/env node
// Creates the SQLite database from the Prisma schema on first run and seeds
// the demo account. Runs from `postinstall` — AFTER `prisma generate` — so a
// fresh clone (or a serverless build on Vercel) gets a working database
// without shipping a binary file inside the repository.
//
// The repository is text-only: reference data (58 wilayas) seeds itself on
// the first /api/wilayas call, and every dashboard counter starts at zero.
const { spawnSync } = require('node:child_process')
const fs = require('node:fs')
const path = require('node:path')
const crypto = require('node:crypto')

const ROOT = path.join(__dirname, '..')
const DB = path.join(ROOT, 'db', 'custom.db')

function hashPassword(password) {
  // must stay in sync with src/lib/auth.ts (scrypt, salt:hash hex)
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.scryptSync(password, salt, 64).toString('hex')
  return `${salt}:${hash}`
}

async function main() {
  if (fs.existsSync(DB) && fs.statSync(DB).size > 0) return // never clobber local data

  fs.mkdirSync(path.dirname(DB), { recursive: true })

  // 1. create tables from the schema (idempotent)
  // Always target THIS repository's db file — never trust an inherited
  // DATABASE_URL (it may point at a different checkout and would leave the
  // local file without tables).
  const env = { ...process.env, DATABASE_URL: `file:${DB}` }
  const bin = path.join(ROOT, 'node_modules', '.bin', process.platform === 'win32' ? 'prisma.cmd' : 'prisma')
  if (!fs.existsSync(bin)) {
    console.warn('[bootstrap-db] prisma CLI not found — skipping (tables will be missing)')
    return
  }
  const res = spawnSync(bin, ['db', 'push', '--skip-generate', '--accept-data-loss'], {
    env, stdio: 'inherit', cwd: ROOT,
  })
  if (res.status !== 0) throw new Error('[bootstrap-db] prisma db push failed')

  // 2. demo account (the store itself starts at a true zero state)
  const { PrismaClient } = require('@prisma/client')
  const db = new PrismaClient({ datasourceUrl: `file:${DB}` })
  try {
    const email = 'demo@wasla.io'
    await db.user.deleteMany({ where: { email } })
    await db.user.create({
      data: {
        email,
        passwordHash: hashPassword('demo1234'),
        name: 'Amine Belkacem',
        storeName: 'Nour Store DZ',
        storeSlug: 'nour-store',
        phone: '+213555012345',
        whatsapp: '+213555012345',
        plan: 'trial',
        trialEndsAt: new Date(Date.now() + 9 * 24 * 3600 * 1000),
        locale: 'en',
      },
    })
    console.log('[bootstrap-db] ready — demo login: demo@wasla.io / demo1234')
  } finally {
    await db.$disconnect()
  }
}

main().catch((e) => {
  console.warn('[bootstrap-db] skipped:', e && e.message)
})
