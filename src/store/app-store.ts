'use client'

import { create } from 'zustand'

export interface AppUser {
  id: string
  email: string
  name: string
  storeName: string
  storeSlug: string
  phone: string
  whatsapp: string
  plan: string
  trialEndsAt: string | null
  locale: string
  currency: string
  createdAt: string
}

type View = 'landing' | 'auth' | 'app'
type AuthMode = 'login' | 'register'
type DashSection =
  | 'overview' | 'products' | 'publisher' | 'inbox' | 'automations' | 'orders'
  | 'delivery' | 'analytics' | 'ads' | 'clients' | 'ai' | 'settings'

interface AppState {
  view: View
  authMode: AuthMode
  authChecked: boolean
  user: AppUser | null
  section: DashSection
  unreadTotal: number
  // agency workspace switching: null = the merchant's own store
  activeClientId: string | null
  activeClientName: string | null
  setActiveClient: (id: string | null, name: string | null) => void
  setView: (v: View) => void
  setAuthMode: (m: AuthMode) => void
  goAuth: (mode: AuthMode) => void
  setUser: (u: AppUser | null) => void
  setSection: (s: DashSection) => void
  setUnreadTotal: (n: number) => void
  logout: () => void
}

export const useAppStore = create<AppState>((set) => ({
  view: 'landing',
  authMode: 'login',
  authChecked: false,
  user: null,
  section: 'overview',
  unreadTotal: 0,
  setView: (view) => set({ view }),
  setAuthMode: (authMode) => set({ authMode }),
  goAuth: (authMode) => set({ view: 'auth', authMode }),
  setUser: (user) => set({ user, view: user ? 'app' : 'landing', authChecked: true }),
  setSection: (section) => set({ section }),
  setUnreadTotal: (unreadTotal) => set({ unreadTotal }),
  setActiveClient: (activeClientId, activeClientName) => set({ activeClientId, activeClientName }),
  logout: async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch {
      /* ignore */
    }
    set({ user: null, view: 'landing', section: 'overview', activeClientId: null, activeClientName: null })
  },
}))
