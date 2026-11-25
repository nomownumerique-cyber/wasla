'use client'

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { Locale, LOCALES, translate } from './dictionaries'

const STORAGE_KEY = 'wasla-locale'

interface I18nContextValue {
  locale: Locale
  setLocale: (l: Locale) => void
  t: (key: string, params?: Record<string, string | number>) => string
  dir: 'ltr' | 'rtl'
  isRTL: boolean
}

const I18nContext = createContext<I18nContextValue | null>(null)

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en')

  useEffect(() => {
    const stored = (typeof window !== 'undefined' && window.localStorage.getItem(STORAGE_KEY)) as Locale | null
    if (stored && ['en', 'fr', 'ar'].includes(stored)) {
      // deferred: avoid a synchronous cascading render inside the effect body
      queueMicrotask(() => setLocaleState(stored))
      return
    }
    // No saved preference: default to the visitor's browser language when we
    // support it (fr → French, ar → Arabic) — most DZ visitors browse in FR/AR.
    const nav =
      typeof navigator !== 'undefined' ? (navigator.language || (navigator.languages && navigator.languages[0]) || '') : ''
    const lower = nav.toLowerCase()
    if (lower.startsWith('ar')) queueMicrotask(() => setLocaleState('ar'))
    else if (lower.startsWith('fr')) queueMicrotask(() => setLocaleState('fr'))
  }, [])

  useEffect(() => {
    const dir = locale === 'ar' ? 'rtl' : 'ltr'
    document.documentElement.dir = dir
    document.documentElement.lang = locale
    try {
      window.localStorage.setItem(STORAGE_KEY, locale)
    } catch {
      /* ignore */
    }
  }, [locale])

  const setLocale = useCallback((l: Locale) => setLocaleState(l), [])

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      setLocale,
      t: (key, params) => translate(locale, key, params),
      dir: locale === 'ar' ? 'rtl' : 'ltr',
      isRTL: locale === 'ar',
    }),
    [locale, setLocale]
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used within I18nProvider')
  return ctx
}

export { LOCALES }
export type { Locale }
