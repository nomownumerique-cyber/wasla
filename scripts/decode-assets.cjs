#!/usr/bin/env node
// Decodes the base64 seed assets (committed as text so the repository stays
// text-only) into their binary locations. Runs on `postinstall`, BEFORE the
// Next.js build — so serverless hosts (Vercel) get:
//   public/products/*.png → demo product images used by the products picker
//                   and the inbox simulator.
// The SQLite database itself is NOT shipped: scripts/bootstrap-db.cjs creates
// it from the Prisma schema and seeds the demo account on first run.
// Existing files are NEVER overwritten: local dev databases keep evolving.
const fs = require('node:fs')
const path = require('node:path')

const ROOT = path.join(__dirname, '..')
const ASSETS = path.join(ROOT, 'assets-b64')

// base64 file -> binary target (relative to project root)
const MAP = {
  'products-abaya.png.b64': path.join('public', 'products', 'abaya.png'),
  'products-caftan.png.b64': path.join('public', 'products', 'caftan.png'),
  'products-cosmetics.png.b64': path.join('public', 'products', 'cosmetics.png'),
  'products-dates.png.b64': path.join('public', 'products', 'dates.png'),
  'products-earbuds.png.b64': path.join('public', 'products', 'earbuds.png'),
  'products-jewelry.png.b64': path.join('public', 'products', 'jewelry.png'),
  'products-oliveoil.png.b64': path.join('public', 'products', 'oliveoil.png'),
  'products-smartwatch.png.b64': path.join('public', 'products', 'smartwatch.png'),
  'products-sneakers.png.b64': path.join('public', 'products', 'sneakers.png'),
  'products-tagine.png.b64': path.join('public', 'products', 'tagine.png'),
}

function decode() {
  if (!fs.existsSync(ASSETS)) return
  for (const [name, relTarget] of Object.entries(MAP)) {
    const source = path.join(ASSETS, name)
    if (!fs.existsSync(source)) continue
    const target = path.join(ROOT, relTarget)
    fs.mkdirSync(path.dirname(target), { recursive: true })
    if (fs.existsSync(target)) continue // never clobber local dev data
    const buf = Buffer.from(fs.readFileSync(source, 'utf8').replace(/\s+/g, ''), 'base64')
    fs.writeFileSync(target, buf)
    console.log(`[decode-assets] ${name} -> ${relTarget} (${buf.length} bytes)`)
  }
}

try {
  decode()
} catch (e) {
  // non-fatal: the app still boots; API routes that need the database will
  // surface clear errors instead of crashing the install/build.
  console.warn('[decode-assets] skipped:', e && e.message)
}
