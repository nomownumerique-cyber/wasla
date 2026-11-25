'use client'

import React, { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { I18nProvider, useI18n } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/store/app-store'
import { get } from '@/lib/api-client'
import { LandingView } from '@/components/wasla/landing/landing-view'
import { AuthView } from '@/components/wasla/auth-view'
import { Button } from '@/components/ui/button'

/**
 * Boot spinner with a slow-connection recovery: if loading takes longer than
 * `slowMs`, it offers the visitor a Retry button (full reload) instead of an
 * endless spinner (mobile / embedded preview networks).
 */
function BootSpinner({ slowMs = 12000, fullScreen = true }: { slowMs?: number; fullScreen?: boolean }) {
  const { t, isRTL } = useI18n()
  const [slow, setSlow] = useState(false)
  useEffect(() => {
    const id = setTimeout(() => setSlow(true), slowMs)
    return () => clearTimeout(id)
  }, [slowMs])

  return (
    <div
      className={
        fullScreen
          ? 'flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6'
          : 'flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6'
      }
      role="status"
      aria-label="Loading"
    >
      <div className="flex flex-col items-center gap-3">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <span className={cn('text-sm font-semibold text-muted-foreground', !isRTL && 'uppercase tracking-widest')}>{t('common.brand')}</span>
      </div>
      {slow && (
        <div className="flex max-w-xs flex-col items-center gap-2 text-center">
          <p className="text-xs text-muted-foreground">{t('common.slow')}</p>
          <Button size="sm" variant="outline" onClick={() => window.location.reload()}>
            {t('common.retry')}
          </Button>
        </div>
      )}
    </div>
  )
}

// The dashboard (all 10 sections) is code-split: visitors download only the
// lightweight landing shell, so the app paints immediately even on slow links.
const DashboardView = dynamic(
  () => import('@/components/wasla/dashboard/dashboard-view').then((m) => ({ default: m.DashboardView })),
  { ssr: false, loading: () => <BootSpinner /> }
)

function BootLayer({ children }: { children: React.ReactNode }) {
  const { setUser } = useAppStore()

  useEffect(() => {
    let mounted = true
    // The auth check runs in the background while the visitor already sees the
    // landing page (SSR content paints instantly — no spinner hostage).
    // If a session exists, we switch to the dashboard once the check lands;
    // on failure/slow networks the landing page simply stays.
    get<{ user: unknown }>('/api/auth/me')
      .then((res) => {
        if (mounted) setUser(res.user as never)
      })
      .catch(() => {
        if (mounted) setUser(null)
      })
    return () => {
      mounted = false
    }
  }, [setUser])

  // Render immediately: content is visible from the first server-rendered
  // byte, instead of gating the whole UI behind the auth round trip.
  return <>{children}</>
}

function ViewSwitch() {
  const { view, setUser } = useAppStore()
  if (view === 'landing') return <LandingView />
  if (view === 'auth') return <AuthView onSuccess={(u) => setUser(u)} />
  return <DashboardView onLogout={() => setUser(null)} />
}

export function WaslaApp() {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 15000, retry: 1, refetchOnWindowFocus: false },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <BootLayer>
          <ViewSwitch />
        </BootLayer>
      </I18nProvider>
    </QueryClientProvider>
  )
}
