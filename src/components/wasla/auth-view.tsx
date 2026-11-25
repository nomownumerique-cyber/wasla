'use client'

import React, { useState } from 'react'
import { useI18n } from '@/lib/i18n'
import { useAppStore, AppUser } from '@/store/app-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { WaslaLogo } from '@/components/wasla/shared'
import { LanguageSwitcher } from '@/components/wasla/language-switcher'
import { post } from '@/lib/api-client'
import { LogIn, UserPlus, Loader2, ArrowLeft, Sparkles, Store, Mail, Lock, User } from 'lucide-react'
import { cn } from '@/lib/utils'

export function AuthView({ onSuccess }: { onSuccess: (user: AppUser) => void }) {
  const { t, locale } = useI18n()
  const { authMode, setAuthMode, setView } = useAppStore()
  const [name, setName] = useState('')
  const [storeName, setStoreName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!email || !password || (authMode === 'register' && (!name || !storeName))) {
      setError(t('auth.error.required'))
      return
    }
    if (password.length < 6) {
      setError(t('auth.error.weak'))
      return
    }
    setLoading(true)
    try {
      const path = authMode === 'login' ? '/api/auth/login' : '/api/auth/register'
      const body = authMode === 'login' ? { email, password } : { name, storeName, email, password }
      const res = await post<{ user: AppUser }>(path, body)
      onSuccess(res.user)
    } catch (err) {
      const msg = (err as Error).message
      if (msg.includes('invalid_credentials')) setError(t('auth.error.invalid'))
      else if (msg.includes('email_exists')) setError(t('auth.error.exists'))
      else if (msg.includes('weak_password')) setError(t('auth.error.weak'))
      else setError(t('common.error'))
    } finally {
      setLoading(false)
    }
  }

  const demoLogin = async () => {
    setError(null)
    setLoading(true)
    try {
      const res = await post<{ user: AppUser }>('/api/auth/login', {
        email: 'demo@wasla.io',
        password: 'demo1234',
      })
      onSuccess(res.user)
    } catch {
      setError(t('common.error'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <header className="flex items-center justify-between px-4 py-4 sm:px-8">
        <button onClick={() => setView('landing')} className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground" aria-label={t('app.backHome')}>
          <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
          {t('app.backHome')}
        </button>
        <LanguageSwitcher />
      </header>

      <main className="flex flex-1 items-center justify-center px-4 pb-16">
        <div className="w-full max-w-md">
          <div className="rounded-2xl border bg-card p-6 shadow-xl shadow-primary/5 sm:p-8">
            <div className="flex flex-col items-center text-center">
              <WaslaLogo size={40} />
              <h1 className="mt-4 text-2xl font-bold tracking-tight">
                {authMode === 'login' ? t('auth.login.title') : t('auth.register.title')}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {authMode === 'login' ? t('auth.login.sub') : t('auth.register.sub')}
              </p>
            </div>

            <form onSubmit={submit} className="mt-6 space-y-4">
              {authMode === 'register' && (
                <>
                  <div className="space-y-1.5">
                    <Label htmlFor="name">{t('auth.name')}</Label>
                    <div className="relative">
                      <User className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="ps-9" autoComplete="name" dir="auto" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="store">{t('auth.storeName')}</Label>
                    <div className="relative">
                      <Store className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input id="store" value={storeName} onChange={(e) => setStoreName(e.target.value)} className="ps-9" dir="auto" />
                    </div>
                  </div>
                </>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="email">{t('auth.email')}</Label>
                <div className="relative">
                  <Mail className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="ps-9" autoComplete="email" dir="ltr" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">{t('auth.password')}</Label>
                <div className="relative">
                  <Lock className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="ps-9" autoComplete={authMode === 'login' ? 'current-password' : 'new-password'} dir="ltr" />
                </div>
              </div>

              {error && (
                <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
                  {error}
                </p>
              )}

              <Button type="submit" className="w-full gap-2 font-semibold" size="lg" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : authMode === 'login' ? <LogIn className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                {authMode === 'login' ? t('auth.submitLogin') : t('auth.submitRegister')}
              </Button>
            </form>

            <div className="mt-5 flex items-center gap-3">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs text-muted-foreground">{t('auth.demo')}</span>
              <div className="h-px flex-1 bg-border" />
            </div>

            <Button variant="outline" className="mt-4 w-full gap-2" onClick={demoLogin} disabled={loading}>
              <Sparkles className="h-4 w-4 text-primary" />
              {t('auth.demo')}
              <span className="text-xs text-muted-foreground" dir="ltr">({t('auth.demoHint')})</span>
            </Button>

            <p className={cn('mt-5 text-center text-sm text-muted-foreground')}>
              {authMode === 'login' ? t('auth.noAccount') : t('auth.hasAccount')}{' '}
              <button
                type="button"
                className="font-semibold text-primary hover:underline"
                onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
              >
                {authMode === 'login' ? t('auth.signup') : t('nav.login')}
              </button>
            </p>
            <p className="mt-2 text-center text-xs text-muted-foreground">
              {locale === 'ar' ? 'تجربة مجانية 14 يوماً على خطة الأعمال' : locale === 'fr' ? 'Essai Business gratuit de 14 jours' : 'Free 14-day Business trial'} — {locale === 'ar' ? 'بدون بطاقة بنكية' : locale === 'fr' ? 'sans carte bancaire' : 'no card required'}
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
