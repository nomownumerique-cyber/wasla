import fs from 'node:fs'
import path from 'node:path'
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// SQLite datasource resolution:
// - Local dev: DATABASE_URL from .env (absolute path into the project).
// - Serverless (Vercel): the deployment filesystem is read-only, so the
//   bundled seed database is copied once to the writable /tmp and every
//   Prisma call is pointed there. Writes live for the lifetime of the warm
//   instance; a cold start re-copies the pristine seed file.
function resolveDatasourceUrl(): string {
  const envUrl = process.env.DATABASE_URL
  if (process.env.VERCEL === '1') {
    const tmpDb = path.join('/tmp', 'wasla.db')
    try {
      if (!fs.existsSync(tmpDb)) {
        const seed = path.join(process.cwd(), 'db', 'custom.db')
        if (fs.existsSync(seed)) {
          fs.copyFileSync(seed, tmpDb)
        } else {
          // empty file → Prisma treats it as a blank database (tables are
          // created lazily by the API routes that seed reference data)
          fs.writeFileSync(tmpDb, '')
        }
      }
    } catch {
      // best effort: if /tmp is unavailable we fall through to env URL
    }
    return `file:${tmpDb}`
  }
  return envUrl || 'file:./db/custom.db'
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'production' ? ['error'] : ['query'],
    datasourceUrl: resolveDatasourceUrl(),
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
