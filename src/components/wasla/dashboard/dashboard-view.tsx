'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useI18n } from '@/lib/i18n'
import { useAppStore, AppUser } from '@/store/app-store'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { useQuery } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import { LanguageSwitcher } from '@/components/wasla/language-switcher'
import { WaslaLogo } from '@/components/wasla/shared'
import { cn } from '@/lib/utils'
import { initials } from '@/lib/format'
import { get } from '@/lib/api-client'
import {
  LayoutDashboard, Package, Rocket, Inbox, ClipboardList, Truck, BarChart3,
  Megaphone, Users, Sparkles, Settings, LogOut, Menu, Moon, Sun, Bell, ChevronLeft,
  ChevronDown, Store, Building2, Zap,
} from 'lucide-react'
import { useTheme } from 'next-themes'

export type DashSectionId =
  | 'overview' | 'products' | 'publisher' | 'inbox' | 'automations' | 'orders'
  | 'delivery' | 'analytics' | 'ads' | 'clients' | 'ai' | 'settings'

const NAV: { id: DashSectionId; icon: React.ElementType }[] = [
  { id: 'overview', icon: LayoutDashboard },
  { id: 'publisher', icon: Rocket },
  { id: 'inbox', icon: Inbox },
  { id: 'automations', icon: Zap },
  { id: 'orders', icon: ClipboardList },
  { id: 'products', icon: Package },
  { id: 'delivery', icon: Truck },
  { id: 'analytics', icon: BarChart3 },
  { id: 'ads', icon: Megaphone },
  { id: 'clients', icon: Users },
  { id: 'ai', icon: Sparkles },
  { id: 'settings', icon: Settings },
]

function trialDaysLeft(user: AppUser): number | null {
  if (!user.trialEndsAt) return null
  const diff = new Date(user.trialEndsAt).getTime() - Date.now()
  return Math.max(0, Math.ceil(diff / (24 * 3600 * 1000)))
}

function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  return (
    <Button variant="ghost" size="icon" className="h-9 w-9" aria-label="Toggle theme" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
      <Sun className="h-4 w-4 dark:hidden" />
      <Moon className="hidden h-4 w-4 dark:block" />
    </Button>
  )
}

// Agency workspace switcher: the merchant works either as their own store
// or inside a client's brand workspace (posts, publisher and data are then
// scoped to that client). Hidden until at least one client exists.
function WorkspaceSwitcher() {
  const { t } = useI18n()
  const { toast } = useToast()
  const activeClientId = useAppStore((s) => s.activeClientId)
  const activeClientName = useAppStore((s) => s.activeClientName)
  const setActiveClient = useAppStore((s) => s.setActiveClient)
  const setSection = useAppStore((s) => s.setSection)
  const { data } = useQuery<{
    clients: { id: string; name: string; status: string }[]
    summary: { total: number }
  }>({ queryKey: ['clients'], queryFn: () => get('/api/clients') })
  if (!data || data.summary.total === 0) return null

  const clients = data.clients || []
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="max-w-44 gap-1.5" aria-label={t('app.workingAs')}>
          {activeClientId ? (
            <Building2 className="h-3.5 w-3.5 shrink-0 text-primary" />
          ) : (
            <Store className="h-3.5 w-3.5 shrink-0 text-primary" />
          )}
          <span className="truncate">{activeClientName || t('app.myStore')}</span>
          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel className="text-xs">{t('app.workingAs')}</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => setActiveClient(null, null)} className="gap-2 text-sm">
          <Store className="h-4 w-4 text-primary" />
          <span className="truncate">{t('app.myStore')}</span>
        </DropdownMenuItem>
        {clients.length > 0 && <DropdownMenuSeparator />}
        {clients.map((c) => (
          <DropdownMenuItem
            key={c.id}
            disabled={c.status !== 'active'}
            onClick={() => {
              setActiveClient(c.id, c.name)
              toast({ title: t('app.switched', { name: c.name }) })
            }}
            className="gap-2 text-sm"
          >
            <Building2 className="h-4 w-4 shrink-0 text-primary" />
            <span className="truncate">{c.name}</span>
            {c.status !== 'active' && (
              <span className="ms-auto shrink-0 text-[10px] font-medium text-muted-foreground">
                {t(`cl.status.${c.status}`)}
              </span>
            )}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => setSection('clients')} className="gap-2 text-sm">
          <Users className="h-4 w-4 text-primary" />
          {t('app.clients')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function DashboardShell({
  user, section, onSection, children, onLogout,
}: {
  user: AppUser
  section: DashSectionId
  onSection: (s: DashSectionId) => void
  children: React.ReactNode
  onLogout: () => void
}) {
  const { t } = useI18n()
  const unreadTotal = useAppStore((s) => s.unreadTotal)
  const activeClientName = useAppStore((s) => s.activeClientName)
  const [mobileOpen, setMobileOpen] = useState(false)
  const daysLeft = trialDaysLeft(user)

  const planLabel = user.plan === 'trial' ? t('app.plan.business') : t(`app.plan.${user.plan}`)
  const planBadge = user.plan === 'trial' || user.plan === 'business' ? 'default' : 'secondary'

  const navButtons = (onNavigate: (s: DashSectionId) => void) => (
    <nav className="flex flex-col gap-1" aria-label="Dashboard">
      {NAV.map((item) => {
        const active = section === item.id
        return (
          <button
            key={item.id}
            onClick={() => {
              onNavigate(item.id)
              setMobileOpen(false)
            }}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition',
              active ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
              item.id === 'inbox' && 'justify-between'
            )}
          >
            <span className="flex items-center gap-3">
              <item.icon className={cn('h-4.5 w-4.5', !active && 'text-muted-foreground group-hover:text-accent-foreground')} />
              {t(`app.${item.id === 'ai' ? 'ai' : item.id}`)}
            </span>
            {item.id === 'inbox' && unreadTotal > 0 && (
              <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-bold', active ? 'bg-primary-foreground text-primary' : 'bg-primary text-primary-foreground')}>
                {unreadTotal}
              </span>
            )}
          </button>
        )
      })}
    </nav>
  )

  const sidebarInner = (
    <div className="flex h-full flex-col">
      <div className="px-4 py-5">
        <WaslaLogo size={30} />
        <div className="mt-4 rounded-xl border bg-muted/50 p-3">
          {activeClientName ? (
            <>
              <p className="truncate text-sm font-semibold">{activeClientName}</p>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">{user.storeName}</p>
              <div className="mt-2 flex items-center gap-1.5">
                <Badge variant="outline" className="border-primary/40 text-[11px] text-primary">{t('app.clientBadge')}</Badge>
              </div>
            </>
          ) : (
            <>
              <p className="truncate text-sm font-semibold">{user.storeName}</p>
              <p className="mt-0.5 truncate text-xs text-muted-foreground" dir="ltr">{user.email}</p>
              <div className="mt-2 flex items-center gap-1.5">
                <Badge variant={planBadge} className="text-[11px]">{planLabel}</Badge>
                {user.plan === 'trial' && daysLeft != null && (
                  <span className="text-[11px] font-medium text-amber-600 dark:text-amber-400">{t('app.plan.trial', { n: daysLeft })}</span>
                )}
              </div>
            </>
          )}
        </div>
      </div>
      <div className="custom-scroll flex-1 overflow-y-auto px-3 pb-4">{navButtons(onSection)}</div>
      <div className="border-t p-3">
        <Button variant="outline" size="sm" className="w-full gap-2" onClick={onLogout}>
          <LogOut className="h-4 w-4" />
          {t('app.logout')}
        </Button>
      </div>
    </div>
  )

  return (
    <div className="flex min-h-screen bg-muted/25">
      {/* desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-e bg-sidebar text-sidebar-foreground lg:block">
        {sidebarInner}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* topbar */}
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-2 border-b bg-background/85 px-4 backdrop-blur-md sm:px-6">
          <div className="flex min-w-0 items-center gap-2">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9 lg:hidden" aria-label="Open menu">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="start" className="w-72 p-0">
                <SheetTitle className="sr-only">Menu</SheetTitle>
                {sidebarInner}
              </SheetContent>
            </Sheet>
            <ChevronLeft className="hidden h-4 w-4 text-muted-foreground lg:hidden" />
            <p className="truncate text-sm font-semibold">{t(`app.${section === 'ai' ? 'ai' : section}`)}</p>
            {section === 'inbox' && unreadTotal > 0 && (
              <Badge className="bg-primary text-[11px]">{unreadTotal} {t('app.unreadBadge')}</Badge>
            )}
            <WorkspaceSwitcher />
          </div>
          <div className="flex items-center gap-1.5">
            {user.plan === 'trial' && daysLeft != null && daysLeft <= 14 && (
              <Button variant="outline" size="sm" className="hidden gap-1.5 border-primary/40 text-primary hover:bg-primary/5 sm:inline-flex" onClick={() => onSection('settings')}>
                <Sparkles className="h-3.5 w-3.5" />
                {t('app.upgrade')}
              </Button>
            )}
            <ThemeToggle />
            <LanguageSwitcher />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative h-9 w-9" aria-label="Notifications">
                  <Bell className="h-4 w-4" />
                  {unreadTotal > 0 && <span className="absolute end-1.5 top-1.5 h-2 w-2 rounded-full bg-primary" />}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel className="text-xs">{t('inbox.title')}</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => onSection('inbox')} className="gap-2 text-sm">
                  <Inbox className="h-4 w-4 text-primary" />
                  {unreadTotal > 0 ? `${unreadTotal} ${t('app.unreadBadge')}` : t('inbox.empty')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onSection('publisher')} className="gap-2 text-sm">
                  <Rocket className="h-4 w-4 text-primary" />
                  {t('ov.newPost')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onSection('orders')} className="gap-2 text-sm">
                  <ClipboardList className="h-4 w-4 text-primary" />
                  {t('ord.title')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="rounded-full ring-2 ring-background focus:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label="Account">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary/10 text-xs font-bold text-primary">
                      {initials(user.name || user.storeName)}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <p className="text-sm font-semibold">{user.name || user.storeName}</p>
                  <p className="text-xs text-muted-foreground" dir="ltr">{user.email}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onSection('settings')} className="gap-2 text-sm">
                  <Settings className="h-4 w-4" />
                  {t('app.settings')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onLogout} className="gap-2 text-sm text-destructive focus:text-destructive">
                  <LogOut className="h-4 w-4" />
                  {t('app.logout')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  )
}

// ---------------- orchestrator ----------------
// Code-splitting: every dashboard section loads on demand so the app starts
// fast (the landing/auth shell stays tiny) even on slow connections.
import { lazy, Suspense } from 'react'

const OverviewView = lazy(() => import('./overview-view').then((m) => ({ default: m.OverviewView })))
const ProductsView = lazy(() => import('./products-view').then((m) => ({ default: m.ProductsView })))
const PublisherView = lazy(() => import('./publisher-view').then((m) => ({ default: m.PublisherView })))
const InboxView = lazy(() => import('./inbox-view').then((m) => ({ default: m.InboxView })))
const AutomationsView = lazy(() => import('./automations-view').then((m) => ({ default: m.AutomationsView })))
const OrdersView = lazy(() => import('./orders-view').then((m) => ({ default: m.OrdersView })))
const DeliveryView = lazy(() => import('./delivery-view').then((m) => ({ default: m.DeliveryView })))
const AnalyticsView = lazy(() => import('./analytics-view').then((m) => ({ default: m.AnalyticsView })))
const AdsView = lazy(() => import('./ads-view').then((m) => ({ default: m.AdsView })))
const ClientsView = lazy(() => import('./clients-view').then((m) => ({ default: m.ClientsView })))
const AiView = lazy(() => import('./ai-view').then((m) => ({ default: m.AiView })))
const SettingsView = lazy(() => import('./settings-view').then((m) => ({ default: m.SettingsView })))

function SectionLoader() {
  const { t, isRTL } = useI18n()
  const [slow, setSlow] = useState(false)
  useEffect(() => {
    const id = setTimeout(() => setSlow(true), 12000)
    return () => clearTimeout(id)
  }, [])
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4" role="status" aria-label="Loading">
      <div className="flex flex-col items-center gap-3">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <span className={cn('text-xs font-semibold text-muted-foreground', !isRTL && 'uppercase tracking-widest')}>{t('common.brand')}</span>
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

export function DashboardView({ onLogout }: { onLogout: () => void }) {
  const user = useAppStore((s) => s.user)
  const section = useAppStore((s) => s.section)
  const setSection = useAppStore((s) => s.setSection)
  const logout = useAppStore((s) => s.logout)

  if (!user) return null

  return (
    <DashboardShell
      user={user}
      section={section as DashSectionId}
      onSection={(s) => setSection(s)}
      onLogout={() => {
        logout()
        onLogout()
      }}
    >
      <Suspense fallback={<SectionLoader />}>
        {section === 'overview' && <OverviewView user={user} onSection={(s) => setSection(s)} />}
        {section === 'publisher' && <PublisherView />}
        {section === 'inbox' && <InboxView user={user} />}
        {section === 'automations' && <AutomationsView />}
        {section === 'orders' && <OrdersView />}
        {section === 'products' && <ProductsView />}
        {section === 'delivery' && <DeliveryView />}
        {section === 'analytics' && <AnalyticsView />}
        {section === 'ads' && <AdsView />}
        {section === 'clients' && <ClientsView />}
        {section === 'ai' && <AiView />}
        {section === 'settings' && <SettingsView user={user} />}
      </Suspense>
    </DashboardShell>
  )
}
