'use client'

import React, { useState } from 'react'
import { cn } from '@/lib/utils'
import { PLATFORMS, PlatformId, platformById } from '@/lib/platforms'
import { formatMoney, formatNumber } from '@/lib/format'
import { useI18n } from '@/lib/i18n'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Loader2, ShieldCheck, Check } from 'lucide-react'

// ---------- Brand logo (WASLA / وصلا) ----------
export function WaslaLogo({ className, size = 28 }: { className?: string; size?: number }) {
  const { t, isRTL } = useI18n()
  const brand = t('common.brand')
  return (
    <span className={cn('inline-flex items-center gap-2', className)} aria-label={brand}>
      <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
        <rect x="2" y="2" width="44" height="44" rx="12" fill="url(#wasla-g)" />
        <path
          d="M13 17.5 L19 32 L24 21.5 L29 32 L35 17.5"
          stroke="white"
          strokeWidth="3.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <circle cx="24" cy="11.5" r="2.4" fill="#FDE68A" />
        <defs>
          <linearGradient id="wasla-g" x1="2" y1="2" x2="46" y2="46">
            <stop stopColor="#0D9D6C" />
            <stop offset="1" stopColor="#0A7A54" />
          </linearGradient>
        </defs>
      </svg>
      <span className={cn('font-bold text-foreground text-lg', !isRTL && 'tracking-tight')}>{brand}</span>
    </span>
  )
}

// ---------- Platform brand glyphs (brand colors, NOT the UI theme) ----------
function glyph(id: PlatformId) {
  switch (id) {
    case 'facebook':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-[55%] w-[55%]">
          <path d="M13.5 21v-7.2h2.4l.4-3h-2.8V9c0-.9.3-1.5 1.6-1.5H17V4.7c-.3 0-1.2-.1-2.3-.1-2.3 0-3.9 1.4-3.9 4v2.2H8.5v3h2.3V21h2.7z" />
        </svg>
      )
    case 'instagram':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" className="h-[58%] w-[58%]">
          <rect x="3.2" y="3.2" width="17.6" height="17.6" rx="5" />
          <circle cx="12" cy="12" r="4.1" />
          <circle cx="17.2" cy="6.8" r="1.15" fill="currentColor" stroke="none" />
        </svg>
      )
    case 'tiktok':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-[58%] w-[58%]">
          <path d="M16.2 3c.4 2.3 1.9 3.9 4.3 4.2v3.1c-1.6.1-3.1-.3-4.4-1.1v6.4c0 3.7-3.1 6.5-6.7 6-3-.4-5.3-3-5.3-6-.4-3.7 2.5-6.9 6.2-6.9.3 0 .6 0 .9.1v3.3c-.3-.1-.6-.1-1-.1-1.8.1-3.2 1.7-3 3.5.2 1.6 1.5 2.9 3.1 3 1.9.2 3.5-1.3 3.5-3.2V3h1.4z" />
        </svg>
      )
    case 'whatsapp':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-[58%] w-[58%]">
          <path d="M12 3.4a8.5 8.5 0 0 0-7.3 12.8L3.5 20.5l4.4-1.1A8.5 8.5 0 1 0 12 3.4zm0 2a6.5 6.5 0 1 1-3.3 12.1l-.3-.2-2.6.7.7-2.5-.2-.3A6.5 6.5 0 0 1 12 5.4zm-2.6 3c-.2 0-.5.1-.7.4-.2.3-.9 1-.9 2s.9 2.3 1 2.5c.2.2 1.8 2.9 4.4 3.9 2.2.9 2.7.7 3.2.7.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.2-.2-.5-.3-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1-.2.3-.7.9-.9 1.1-.2.2-.3.2-.6.1-.3-.2-1.2-.5-2.3-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6l.4-.5c.2-.2.2-.3.3-.5.1-.2.1-.4 0-.5 0-.2-.6-1.5-.8-2-.2-.5-.4-.5-.6-.5h-.5z" />
        </svg>
      )
    case 'x':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-[52%] w-[52%]">
          <path d="M17.7 3H21l-7.3 8.3L22 21h-6.7l-5.2-6.4L4.6 21H1.3l7.8-8.9L2 3h6.9l4.7 5.9L17.7 3zm-1.2 16h1.9L7.1 4.9H5L16.5 19z" />
        </svg>
      )
    case 'youtube':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-[58%] w-[58%]">
          <path d="M21.6 7.2a2.5 2.5 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4A2.5 2.5 0 0 0 2.4 7.2 26 26 0 0 0 2 12a26 26 0 0 0 .4 4.8 2.5 2.5 0 0 0 1.8 1.8c1.6.4 7.8.4 7.8.4s6.2 0 7.8-.4a2.5 2.5 0 0 0 1.8-1.8A26 26 0 0 0 22 12a26 26 0 0 0-.4-4.8zM10 15.2V8.8l5.2 3.2-5.2 3.2z" />
        </svg>
      )
    case 'snapchat':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-[58%] w-[58%]">
          <path d="M12 3.2c2.6 0 4 2 4.1 4.3 0 .6 0 1.1-.1 1.6.4.1.9 0 1.3-.2.5-.2 1-.2 1.2.1.3.4 0 .8-.6 1.1-.5.3-1.3.5-1.4.8-.1.3.5 1.3 1.1 2 .6.7 1.5 1.3 2.3 1.4.3.1.4.4.3.6-.4.7-2 1.1-3 1.3-.3.1-.4.4-.5.9-.1.4-.2.9-.5.9-.5 0-1.5-.4-2.7-.4-.7 0-1.3.2-1.9.4-.6.2-1.2.4-1.9.4s-1.3-.2-1.9-.4c-.6-.2-1.2-.4-1.9-.4-1.2 0-2.2.4-2.7.4-.3 0-.4-.5-.5-.9-.1-.5-.2-.8-.5-.9-1-.2-2.6-.6-3-1.3-.1-.2 0-.5.3-.6.8-.1 1.7-.7 2.3-1.4.6-.7 1.2-1.7 1.1-2-.1-.3-.9-.5-1.4-.8-.6-.3-.9-.7-.6-1.1.2-.3.7-.3 1.2-.1.4.2.9.3 1.3.2-.1-.5-.1-1-.1-1.6C8 5.2 9.4 3.2 12 3.2z" />
        </svg>
      )
    case 'pinterest':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-[58%] w-[58%]">
          <path d="M12 3a9 9 0 0 0-3.3 17.4c-.1-.8 0-2 .2-2.9.2-.8 1.4-5.9 1.4-5.9s-.3-.7-.3-1.6c0-1.5.9-2.7 2-2.7.9 0 1.4.7 1.4 1.6 0 1-.6 2.4-1 3.7-.3 1.1.5 2 1.6 2 1.9 0 3.3-2.5 3.3-5.4 0-2.2-1.5-3.9-4.3-3.9a4.9 4.9 0 0 0-5.1 4.9c0 1 .3 1.7.7 2.3.2.2.2.4.2.5l-.2.8c-.1.3-.3.4-.6.3-1.3-.5-1.9-2-1.9-3.6 0-2.9 2.4-6 7.2-6 3.8 0 6.3 2.8 6.3 5.7 0 4-2.2 6.9-5.4 6.9-1.1 0-2.1-.6-2.4-1.2l-.7 2.6c-.2.7-.7 1.7-1.1 2.3A9 9 0 1 0 12 3z" />
        </svg>
      )
  }
}

export function PlatformIcon({ id, size = 40, className }: { id: string; size?: number; className?: string }) {
  const meta = PLATFORMS.find((p) => p.id === id)
  if (!meta) return null
  const isLight = ['snapchat'].includes(meta.id)
  return (
    <span
      className={cn('relative inline-flex items-center justify-center rounded-xl shrink-0', className)}
      style={{
        width: size,
        height: size,
        background: meta.id === 'tiktok' || meta.id === 'x' ? meta.color : `${meta.color}1A`,
        border: `1px solid ${meta.color}55`,
      }}
    >
      <span
        className="flex h-full w-full items-center justify-center"
        style={{ color: isLight ? '#000000' : meta.color }}
      >
        {glyph(meta.id)}
      </span>
    </span>
  )
}

export function PlatformDot({ id, size = 12 }: { id: string; size?: number }) {
  const meta = PLATFORMS.find((p) => p.id === id)
  if (!meta) return null
  return (
    <span
      className="inline-block rounded-full border border-white/60 shrink-0"
      style={{ width: size, height: size, background: meta.color }}
    />
  )
}

// ---------- status badges ----------
const ORDER_STATUSES = ['pending', 'confirmed', 'packed', 'shipped', 'delivered', 'returned', 'cancelled'] as const

export const orderStatusStyles: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-900',
  confirmed: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-900',
  packed: 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-950/60 dark:text-orange-300 dark:border-orange-900',
  shipped: 'bg-teal-100 text-teal-800 border-teal-200 dark:bg-teal-950/60 dark:text-teal-300 dark:border-teal-900',
  delivered: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-950/60 dark:text-green-300 dark:border-green-900',
  returned: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-950/60 dark:text-red-300 dark:border-red-900',
  cancelled: 'bg-neutral-100 text-neutral-600 border-neutral-200 dark:bg-neutral-900 dark:text-neutral-400 dark:border-neutral-800',
}

export const postStatusStyles: Record<string, string> = {
  draft: 'bg-neutral-100 text-neutral-600 border-neutral-200 dark:bg-neutral-900 dark:text-neutral-400 dark:border-neutral-800',
  scheduled: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-900',
  publishing: 'bg-primary/10 text-primary border-primary/30 animate-pulse dark:bg-primary/15 dark:text-primary dark:border-primary/40',
  published: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-900',
  failed: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-950/60 dark:text-red-300 dark:border-red-900',
}

export const campaignStatusStyles: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-900',
  paused: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-900',
  completed: 'bg-neutral-100 text-neutral-600 border-neutral-200 dark:bg-neutral-900 dark:text-neutral-400 dark:border-neutral-800',
}

export function StatusBadge({ status, styleMap, label, className }: { status: string; styleMap: Record<string, string>; label: string; className?: string }) {
  return (
    <span className={cn('inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium', styleMap[status] || orderStatusStyles.pending, className)}>
      {label}
    </span>
  )
}

// ---------- KPI card ----------
export function KpiCard({
  label, value, sub, icon, tone = 'default',
}: {
  label: string
  value: React.ReactNode
  sub?: React.ReactNode
  icon?: React.ReactNode
  tone?: 'default' | 'positive' | 'warning'
}) {
  return (
    <div className="rounded-xl border bg-card p-4 sm:p-5 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">{label}</p>
        {icon && <span className="text-muted-foreground">{icon}</span>}
      </div>
      <p className={cn('mt-2 text-2xl font-bold tracking-tight', tone === 'positive' && 'text-emerald-600 dark:text-emerald-400', tone === 'warning' && 'text-amber-600 dark:text-amber-400')}>
        {value}
      </p>
      {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
    </div>
  )
}

// ---------- money text ----------
export function Money({ amount, locale, className }: { amount: number; locale: string; className?: string }) {
  return <span className={cn('tabular-nums', className)}>{formatMoney(amount, locale)}</span>
}

export function Num({ value, locale, className }: { value: number; locale: string; className?: string }) {
  return <span className={cn('tabular-nums', className)}>{formatNumber(value, locale)}</span>
}

// ---------- empty state ----------
export function EmptyState({ title, hint, action }: { title: string; hint?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-muted/30 px-6 py-12 text-center">
      <p className="font-medium text-foreground">{title}</p>
      {hint && <p className="mt-1 text-sm text-muted-foreground max-w-md">{hint}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

// ---------- section header ----------
export function SectionHeader({ title, sub, action }: { title: string; sub?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">{title}</h1>
        {sub && <p className="mt-1 text-sm text-muted-foreground">{sub}</p>}
      </div>
      {action}
    </div>
  )
}

export { ORDER_STATUSES, formatMoney, formatNumber }

// ---------- simulated OAuth consent dialog (Social Accounts module) ----------
// Renders a realistic OAuth-style consent screen: platform branding, requested
// scopes, Allow/Cancel, then a short "connecting…" hand-shake before onConfirm fires.
export function ConnectAccountDialog({
  platform,
  open,
  onOpenChange,
  onConfirm,
  storeName,
}: {
  platform: string | null
  open: boolean
  onOpenChange: (v: boolean) => void
  onConfirm: (platform: string) => Promise<void>
  storeName: string
}) {
  const { t } = useI18n()
  const [phase, setPhase] = useState<'consent' | 'connecting' | 'done'>('consent')
  const meta = platform ? platformById(platform) : undefined
  const name = meta?.name || platform || ''

  // reset the flow whenever the dialog closes (fresh consent screen on next open)
  const close = () => {
    setPhase('consent')
    onOpenChange(false)
  }

  const allow = async () => {
    if (!platform) return
    setPhase('connecting')
    try {
      await new Promise((r) => setTimeout(r, 700)) // simulated OAuth handshake
      await onConfirm(platform)
      setPhase('done')
      setTimeout(close, 900)
    } catch {
      setPhase('consent')
    }
  }

  if (!platform) return null

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v && phase !== 'connecting') close() }}>
      <DialogContent className="sm:max-w-sm">
        <div
          className="flex items-center gap-3 rounded-xl border p-3"
          style={{ background: `${meta?.color || '#0D9D6C'}12` }}
        >
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white"
            style={{ background: meta?.color || '#0D9D6C' }}
          >
            {phase === 'done' ? <Check className="h-5 w-5" /> : <ShieldCheck className="h-5 w-5" />}
          </span>
          <div className="min-w-0" dir="ltr">
            <p className="truncate text-sm font-bold">{name}</p>
            <p className="text-[11px] text-muted-foreground">{storeName}</p>
          </div>
        </div>

        {phase === 'connecting' ? (
          <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground" dir="ltr">
            <Loader2 className="h-4 w-4 animate-spin" />
            {t('oauth.connecting', { platform: name })}
          </div>
        ) : phase === 'done' ? (
          <div className="flex flex-col items-center gap-2 py-8 text-sm font-semibold text-emerald-600 dark:text-emerald-400" dir="ltr">
            <Check className="h-6 w-6" />
            {t('oauth.done')}
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-base">{t('oauth.wants', { platform: name })}</DialogTitle>
              <DialogDescription>{t('oauth.scopes')}</DialogDescription>
            </DialogHeader>
            <ul className="space-y-2 py-1 text-sm">
              {[t('oauth.sc1'), t('oauth.sc2'), t('oauth.sc3')].map((s) => (
                <li key={s} className="flex items-start gap-2.5 rounded-lg border bg-muted/30 p-2.5">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span className="text-foreground/90">{s}</span>
                </li>
              ))}
            </ul>
            <div className="mt-2 flex gap-2">
              <Button variant="outline" className="flex-1" onClick={close}>
                {t('oauth.cancel')}
              </Button>
              <Button className="flex-1 font-bold" onClick={allow}>
                {t('oauth.allow')}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
