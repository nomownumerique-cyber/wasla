# WASLA — وصلة

**The COD engine for Algerian sellers.** Turn WhatsApp chats into confirmed cash-on-delivery sales, delivered across all 58 wilayas — and publish your products to 8 social platforms in one click.

- **COD confirmations on WhatsApp** in Darija, Arabic, French or English
- **One-click multi-platform publishing**: Facebook, Instagram, TikTok, WhatsApp, X, YouTube, Snapchat, Pinterest
- **Delivery sync**: Yalidine, ZR Express, Maystro & NOEST — home/desk rates per wilaya
- **Unified inbox** with AI reply drafting and keyword-triggered automations
- **Trilingual UI** (EN / FR / AR with full RTL)
- **AI commerce copilot**: captions, translations, per-network adaptations

## Demo account

| Field | Value |
| --- | --- |
| Email | `demo@wasla.io` |
| Password | `demo1234` |

The demo store starts at a true zero state — every counter grows only from your own actions.

## Stack

- **Next.js 16** (App Router) + TypeScript
- **Tailwind CSS 4** + shadcn/ui (New York) + Lucide icons
- **Prisma ORM** with SQLite
- **TanStack Query** + Zustand
- **socket.io** realtime inbox (optional mini-service — REST polling fallback when absent)
- **z-ai-web-dev-sdk** for the AI copilot (captions, translation, adaptation)

## Getting started

```bash
bun install          # prisma generate + asset decode + db bootstrap run automatically
cp .env.example .env # set DATABASE_URL to your SQLite path
bun run dev          # http://localhost:3000
```

The SQLite database is NOT shipped as a binary: `postinstall` creates it from
the Prisma schema and seeds the demo account (`scripts/bootstrap-db.cjs`).
Demo product images ship base64-encoded (`assets-b64/`) and are decoded on
install (never overwriting existing files).

### Optional realtime inbox

```bash
cd mini-services/inbox-service && bun install && bun run dev   # port 3003
```

Without the service the inbox falls back to REST polling automatically.

## Deploy on Vercel

1. Import this repository on [vercel.com/new](https://vercel.com/new) (framework auto-detected: Next.js).
2. Set the `DATABASE_URL` environment variable (any writable SQLite path, e.g. `file:/tmp/wasla.db`) — optional; the runtime falls back to `/tmp` automatically.
3. Deploy. `postinstall` generates the Prisma client, decodes the seed assets and bootstraps the database; the SQLite file is bundled into every serverless function and copied to `/tmp` at runtime (read-only filesystem).

## Project layout

```
src/app/api/        REST API routes (auth, products, orders, posts, inbox, AI, …)
src/components/     Landing, auth and the 10 dashboard sections
src/lib/            i18n dictionaries, automations engine, auth, publish, db
prisma/             Database schema
mini-services/      WebSocket inbox service + scheduled-post publisher worker
```

## License

Proprietary — © WASLA.
