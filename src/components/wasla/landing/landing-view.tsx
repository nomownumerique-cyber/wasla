'use client'

import React, { useState } from 'react'
import { useI18n } from '@/lib/i18n'
import { useAppStore } from '@/store/app-store'
import { Button } from '@/components/ui/button'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { WaslaLogo, PlatformIcon } from '@/components/wasla/shared'
import { PLATFORMS } from '@/lib/platforms'
import {
  Rocket, Inbox, Package, Truck, Megaphone, Sparkles, BarChart3, Check,
  ChevronRight, ArrowRight, Menu, X, Zap, Globe2, HeartHandshake, Scale, Minus,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ---------------- language pills (FR · ع · EN — always visible) ----------------
function NavbarLangs() {
  const { locale, setLocale } = useI18n()
  const langs = [
    { id: 'fr', label: 'FR', name: 'Français' },
    { id: 'ar', label: 'ع', name: 'العربية' },
    { id: 'en', label: 'EN', name: 'English' },
  ] as const
  return (
    <div className="flex items-center rounded-full border bg-card p-0.5" role="group" aria-label="Language · Langue · اللغة">
      {langs.map((l) => (
        <button
          key={l.id}
          type="button"
          onClick={() => setLocale(l.id)}
          aria-pressed={locale === l.id}
          aria-label={l.name}
          className={cn(
            'min-h-8 min-w-9 rounded-full px-2 py-1 text-xs font-bold transition',
            locale === l.id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {l.label}
        </button>
      ))}
    </div>
  )
}

// ---------------- navbar ----------------
function Navbar() {
  const { t } = useI18n()
  const goAuth = useAppStore((s) => s.goAuth)
  const [open, setOpen] = useState(false)
  const links = [
    { href: '#features', label: t('nav.product') },
    { href: '#platforms', label: t('nav.platforms') },
    { href: '#compare', label: t('nav.compare') },
    { href: '#pricing', label: t('nav.pricing') },
    { href: '#faq', label: t('nav.faq') },
  ]
  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <a href="#top" className="shrink-0" aria-label={`${t('common.brand')} home`}>
          <WaslaLogo size={30} />
        </a>
        <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-accent hover:text-accent-foreground">
              {l.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <NavbarLangs />
          <Button variant="ghost" size="sm" className="hidden sm:inline-flex" onClick={() => goAuth('login')}>
            {t('nav.login')}
          </Button>
          <Button size="sm" onClick={() => goAuth('register')} className="hidden gap-1 sm:inline-flex">
            {t('nav.start')}
            <ArrowRight className="h-4 w-4 rtl:rotate-180" />
          </Button>
          <button
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border md:hidden"
            onClick={() => setOpen(!open)}
            aria-label="Menu"
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>
      {open && (
        <div className="border-t bg-background px-4 py-3 md:hidden">
          {links.map((l) => (
            <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="block rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent">
              {l.label}
            </a>
          ))}
          <Button size="sm" className="mt-2 w-full gap-1" onClick={() => goAuth('register')}>
            {t('nav.start')}
            <ArrowRight className="h-4 w-4 rtl:rotate-180" />
          </Button>
          <Button variant="outline" size="sm" className="mt-2 w-full" onClick={() => goAuth('login')}>
            {t('nav.login')}
          </Button>
        </div>
      )}
    </header>
  )
}

// ---------------- interactive publish demo ----------------
type DemoState = 'idle' | 'publishing' | 'done'

// The 4 platforms Algerian COD merchants actually sell on — the rest are
// secondary (see the "also supports" line under the demo).
const CORE_PLATFORMS = ['facebook', 'instagram', 'tiktok', 'whatsapp']

function PublishDemo() {
  const { t, locale } = useI18n()
  const [selected, setSelected] = useState<string[]>(['instagram', 'tiktok', 'facebook', 'whatsapp'])
  const [state, setState] = useState<DemoState>('idle')
  // No fabricated metrics: the demo only flips tiles to "published" — real
  // reach numbers come from the connected accounts in the dashboard, not here.
  const [done, setDone] = useState<string[]>([])

  const toggle = (id: string) => {
    if (state !== 'idle') return
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))
  }

  const publish = () => {
    if (selected.length === 0 || state === 'publishing') return
    setState('publishing')
    setDone([])
    selected.forEach((p, i) => {
      setTimeout(() => {
        setDone((d) => (d.includes(p) ? d : [...d, p]))
        if (i === selected.length - 1) setState('done')
      }, 450 * (i + 1))
    })
  }

  return (
    <div className="rounded-2xl border bg-card p-5 shadow-xl shadow-primary/5 sm:p-6">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Zap className="h-4 w-4" />
          </span>
          <p className="font-semibold">{t('demo.title')}</p>
        </div>
        <span className="hidden rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800 sm:block dark:bg-emerald-950 dark:text-emerald-300">
          LIVE DEMO
        </span>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">{t('demo.sub')}</p>

      <p className="mt-4 text-xs font-medium text-muted-foreground uppercase tracking-wide">{t('demo.pick')}</p>
      <div className="mt-2 grid grid-cols-4 gap-2">
        {PLATFORMS.filter((p) => CORE_PLATFORMS.includes(p.id)).map((p) => {
          const active = selected.includes(p.id)
          const isDone = done.includes(p.id)
          return (
            <button
              key={p.id}
              onClick={() => toggle(p.id)}
              aria-pressed={active}
              className={cn(
                'flex flex-col items-center gap-1.5 rounded-xl border p-2 transition',
                active ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border hover:border-muted-foreground/30',
                state === 'publishing' && !isDone && 'opacity-100'
              )}
            >
              <span className="relative">
                <PlatformIcon id={p.id} size={30} />
                {(active || isDone) && (
                  <span className="absolute -end-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-white">
                    <Check className="h-2.5 w-2.5" />
                  </span>
                )}
              </span>
              <span className="w-full truncate text-center text-[10px] font-medium text-muted-foreground">{p.name.split(' ')[0]}</span>
              {state === 'publishing' && !isDone && <span className="shimmer h-1 w-full rounded-full" />}
            </button>
          )
        })}
      </div>
      <p className="mt-3 text-center text-[11px] font-medium text-muted-foreground">{t('hero.also')}</p>

      <Button
        className="mt-4 w-full gap-2 text-base font-bold"
        size="lg"
        disabled={selected.length === 0 || state === 'publishing'}
        onClick={publish}
      >
        {state === 'publishing' ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            {t('demo.publishing')}
          </>
        ) : state === 'done' ? (
          <>
            <Check className="h-5 w-5" />
            {t('demo.done', { n: selected.length })}
          </>
        ) : (
          <>
            <Rocket className="h-5 w-5" />
            {t('demo.publish', { n: selected.length })}
          </>
        )}
      </Button>
      {selected.length === 0 && state === 'idle' && (
        <p className="mt-2 text-center text-xs text-amber-600 dark:text-amber-400">{t('demo.selectOne')}</p>
      )}
      {state === 'done' && (
        <button
          className="mt-2 w-full text-center text-xs font-medium text-primary underline-offset-2 hover:underline"
          onClick={() => {
            setState('idle')
            setDone([])
          }}
        >
          {locale === 'ar' ? 'إعادة المحاولة' : locale === 'fr' ? 'Recommencer' : 'Run it again'}
        </button>
      )}
    </div>
  )
}

// ---------------- hero ----------------
function Hero() {
  const { t, locale } = useI18n()
  const goAuth = useAppStore((s) => s.goAuth)
  return (
    <section id="top" className="relative overflow-hidden">
      <div className="hero-grid absolute inset-0" aria-hidden="true" />
      <div className="relative mx-auto grid max-w-6xl gap-8 px-4 pb-12 pt-10 sm:gap-10 sm:px-6 sm:pb-16 sm:pt-14 lg:grid-cols-2 lg:items-center lg:gap-8 lg:pb-24 lg:pt-20">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground">
            <Globe2 className="h-3.5 w-3.5 text-primary" />
            {t('hero.badge')}
          </span>
          <h1 className="mt-4 text-[2rem] font-extrabold leading-[1.12] tracking-tight sm:mt-5 sm:text-5xl sm:leading-[1.08] lg:text-[3.4rem]">
            {t('hero.title1')}{' '}
            <span className="text-primary">{t('hero.title2')}</span>
            <br />
            {t('hero.title3')}
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">{t('hero.sub')}</p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Button size="lg" className="h-12 gap-2 px-6 text-base font-bold" onClick={() => goAuth('register')}>
              <Rocket className="h-5 w-5" />
              {t('hero.cta')}
            </Button>
            <Button size="lg" variant="outline" className="h-12 gap-2 px-6" onClick={() => goAuth('login')}>
              {t('hero.cta2')}
              <ChevronRight className="h-4 w-4 rtl:rotate-180" />
            </Button>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">{t('auth.trialNote')}</p>
          <div className="mt-7 sm:mt-9">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{t('hero.trust')}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {['DZ', 'MA', 'TN', 'EG', 'SA', 'AE'].map((c) => (
                <span key={c} className="flex h-8 w-8 items-center justify-center rounded-full border bg-muted text-[10px] font-bold text-muted-foreground">
                  {c}
                </span>
              ))}
              <span className="ms-1 text-xs font-medium text-muted-foreground">{t('common.brand')} {new Date().getFullYear()}</span>
            </div>
          </div>
        </div>
        <PublishDemo />
      </div>
    </section>
  )
}

// ---------------- platforms band ----------------
function PlatformsBand() {
  const { t } = useI18n()
  const row = [...PLATFORMS, ...PLATFORMS]
  return (
    <section id="platforms" className="border-y bg-muted/40 py-8">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <p className="text-center text-sm font-medium text-muted-foreground">{t('feat.publish.desc')}</p>
        <div className="relative mt-5 overflow-hidden" dir="ltr">
          <div className="flex w-max animate-marquee gap-3">
            {row.map((p, i) => (
              <span key={`${p.id}-${i}`} className="flex items-center gap-2 rounded-full border bg-card px-4 py-2 text-sm font-medium">
                <PlatformIcon id={p.id} size={22} />
                {p.name}
              </span>
            ))}
          </div>
          <div className="pointer-events-none absolute inset-y-0 start-0 w-16 bg-gradient-to-r from-muted/40 to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 end-0 w-16 bg-gradient-to-l from-muted/40 to-transparent" />
        </div>
      </div>
    </section>
  )
}

// ---------------- stats (verifiable capabilities, not vanity metrics) ----------------
function StatsBand() {
  const { t } = useI18n()
  const stats = [
    { value: '58', label: t('stats.wilayas'), icon: Truck },
    { value: '4', label: t('stats.couriers'), icon: Package },
    { value: '4', label: t('stats.langs'), icon: Globe2 },
    { value: '<30s', label: t('stats.confirm'), icon: Zap },
  ]
  return (
    <section className="py-8 sm:py-14">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-4 px-4 sm:px-6 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border bg-card p-4 text-center sm:p-5">
            <s.icon className="mx-auto h-5 w-5 text-primary" />
            <p className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl" dir="ltr">{s.value}</p>
            <p className="mt-1 text-xs font-medium text-muted-foreground sm:text-sm">{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

// ---------------- features ----------------
// 6 pillars (COD & Delivery engine merged) — clean 3x2 grid, no orphan card.
const FEATURES = [
  { key: 'cod', icon: Truck, highlight: true },
  { key: 'publish', icon: Rocket },
  { key: 'inbox', icon: Inbox },
  { key: 'ai', icon: Sparkles },
  { key: 'ads', icon: Megaphone },
  { key: 'analytics', icon: BarChart3 },
] as const

// Real Darija conversation shown inside the inbox feature card — the local
// proof sellers recognize instantly.
function DarijaSnippet() {
  const { locale } = useI18n()
  const q = locale === 'ar' ? 'سلام، شحال الثمن والتوصيل لوهران؟' : "Salam, chhal prix w livraison l'Oran?"
  const a =
    locale === 'ar'
      ? 'سلام! الثمن 2,900 دج والتوصيل لوهران 500 دج (منزل). الطلب مسجّل — طرد ياليدين جاهز.'
      : locale === 'fr'
        ? "Salam ! Prix 2 900 DA, livraison Oran 500 DA (domicile). Commande enregistrée — colis Yalidine prêt."
        : "Salam! Price 2,900 DZD, Oran delivery 500 DZD (home). Order saved — Yalidine parcel ready."
  const parcel = locale === 'ar' ? 'إنشاء طرد ياليدين' : locale === 'fr' ? 'Créer le colis Yalidine' : 'Create Yalidine parcel'
  return (
    <div className="mt-3 space-y-2 rounded-xl bg-muted/50 p-3" dir="auto">
      <p className="rounded-lg bg-card px-2.5 py-1.5 text-xs text-foreground/90">{q}</p>
      <p className="rounded-lg bg-primary/10 px-2.5 py-1.5 text-xs font-medium text-foreground">{a}</p>
      <span className="inline-flex items-center gap-1.5 rounded-full bg-primary px-2.5 py-1 text-[10px] font-bold text-primary-foreground">
        <Truck className="h-3 w-3" />
        {parcel}
      </span>
    </div>
  )
}

function FeatureCards() {
  const { t } = useI18n()
  const goAuth = useAppStore((s) => s.goAuth)
  return (
    <div className="mt-8 grid gap-5 sm:mt-10 md:grid-cols-2 lg:grid-cols-3">
      {FEATURES.map((f) => (
        <article
          key={f.key}
          className={cn(
            'group rounded-2xl border bg-card p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:p-6',
            f.highlight && 'ring-1 ring-primary/40'
          )}
        >
          <div className="flex items-center justify-between">
            <span className={cn('flex h-10 w-10 items-center justify-center rounded-xl', f.highlight ? 'bg-primary text-white' : 'bg-primary/10 text-primary')}>
              <f.icon className="h-5 w-5" />
            </span>
            {f.highlight && (
              <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                CORE
              </span>
            )}
          </div>
          <h3 className="mt-4 text-lg font-bold">{t(`feat.${f.key}.title`)}</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t(`feat.${f.key}.desc`)}</p>
          {f.key === 'inbox' && <DarijaSnippet />}
          <button onClick={() => goAuth('register')} className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
            {t('pub.preview')}
            <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" />
          </button>
        </article>
      ))}
    </div>
  )
}

function Features() {
  const { t } = useI18n()
  return (
    <section id="features" className="scroll-mt-16 py-10 sm:py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 className="text-center text-3xl font-extrabold tracking-tight sm:text-4xl">{t('features.title')}</h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-muted-foreground">{t('features.sub')}</p>
        <FeatureCards />
      </div>
    </section>
  )
}

// ---------------- testimonials ----------------
const TESTIMONIALS: Record<string, { name: string; store: string; handle: string; text: string }[]> = {
  en: [
    { name: 'Lina B.', store: 'Nour Store DZ — Alger', handle: '@nourstore.dz', text: 'I used to repost my products on 4 apps every evening. With WASLA I compose once, one click, done. My evenings are mine again.' },
    { name: 'Karim T.', store: 'TK Cosmetics — Oran', handle: '@tkcosmetics.oran', text: 'The WhatsApp inbox changes everything: orders, questions, confirmations — everything in one thread, in Darija.' },
    { name: 'Meriem A.', store: 'Dar Caftan — Constantine', handle: '@darcaftan.cst', text: 'Yalidine tracking right inside the dashboard, and COD confirmed on WhatsApp before shipping. Returns dropped by half.' },
  ],
  fr: [
    { name: 'Lina B.', store: 'Nour Store DZ — Alger', handle: '@nourstore.dz', text: 'Avant, je republiais mes produits sur 4 applis chaque soir. Avec WASLA : une rédaction, un clic, terminé.' },
    { name: 'Karim T.', store: 'TK Cosmetics — Oran', handle: '@tkcosmetics.oran', text: 'La boîte WhatsApp change tout : commandes, questions, confirmations — tout dans un seul fil, en darija.' },
    { name: 'Meriem A.', store: 'Dar Caftan — Constantine', handle: '@darcaftan.cst', text: 'Le suivi Yalidine intégré au tableau de bord, et le COD confirmé sur WhatsApp avant l\'expédition. Mes retours ont chuté de moitié.' },
  ],
  ar: [
    { name: 'لينا ب.', store: 'نور ستور — الجزائر', handle: '@nourstore.dz', text: 'كنت أعيد نشر منتجاتي على 4 تطبيقات كل مساء. مع وصلا: أكتب مرة، نقرة واحدة، وانتهى الأمر.' },
    { name: 'كريم ت.', store: 'تي كاي كوزمتيك — وهران', handle: '@tkcosmetics.oran', text: 'صندوق واتساب يغيّر كل شيء: الطلبات والأسئلة والتأكيدات — كلها في خيط واحد، بالدارجة.' },
    { name: 'مريم ع.', store: 'دار القفطان — قسنطينة', handle: '@darcaftan.cst', text: 'تتبع ياليدين داخل لوحة التحكم، والدفع عند الاستلام يؤكَّد عبر واتساب قبل الإرسال. المرتجعات انخفضت للنصف.' },
  ],
}

function Testimonials() {
  const { t, locale } = useI18n()
  const items = TESTIMONIALS[locale] || TESTIMONIALS.en
  return (
    <section className="py-10 sm:py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 className="text-center text-3xl font-extrabold tracking-tight sm:text-4xl">{t('testimonials.title')}</h2>
        <p className="mt-3 text-center text-muted-foreground">{t('testimonials.sub')}</p>
        <div className="mt-8 grid gap-5 sm:mt-10 md:grid-cols-3">
          {items.map((tm) => (
            <figure key={tm.name} className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
              <div className="flex text-amber-500" aria-hidden="true">{'★★★★★'}</div>
              <blockquote className="mt-3 text-sm leading-relaxed text-foreground/90">“{tm.text}”</blockquote>
              <figcaption className="mt-4 flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                  {tm.name.slice(0, 2)}
                </span>
                <div>
                  <p className="text-sm font-semibold">{tm.name}</p>
                  <p className="text-xs text-muted-foreground">{tm.store}</p>
                  <p className="text-[11px] font-semibold text-primary" dir="ltr">{tm.handle}</p>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  )
}

// ---------------- comparison / counter-positioning ----------------
type CellStatus = 'full' | 'partial' | 'none' | 'na'
type Cell = [CellStatus, string]

const CMP_ROWS: { key: string; wasla: Record<string, Cell>; intl: Record<string, Cell>; builders: Record<string, Cell>; api: Record<string, Cell> }[] = [
  {
    key: 'cmp.row.price',
    wasla: { en: ['full', '0–8,900 DZD/mo · CCP & BaridiMob'], fr: ['full', '0–8 900 DA/mois · CCP & BaridiMob'], ar: ['full', '٠–٨٩٠٠ دج/شهر · CCP وبريدي موب'] },
    intl: { en: ['none', 'From $18/mo · USD card required'], fr: ['none', 'À partir de 18 $/mois · carte USD requise'], ar: ['none', 'من 18$/شهر · بطاقة دولارية مطلوبة'] },
    builders: { en: ['partial', 'Tassyir & DZBuild in DZD · YouCan $29–187/mo'], fr: ['partial', 'Tassyir & DZBuild en DA · YouCan 29–187 $/mois'], ar: ['partial', 'تاسي وDZBuild بالدينار · YouCan من 29–187$/شهر'] },
    api: { en: ['none', '~$48/mo avg · per account'], fr: ['none', '~48 $/mois en moyenne · par compte'], ar: ['none', '~48$/شهر في المتوسط · لكل حساب'] },
  },
  {
    key: 'cmp.row.publish',
    wasla: { en: ['full', '8 platforms, one click'], fr: ['full', '8 plateformes, un clic'], ar: ['full', '٨ منصات، نقرة واحدة'] },
    intl: { en: ['partial', 'Yes, but no DZ market fit'], fr: ['partial', 'Oui, mais rien pour le marché DZ'], ar: ['partial', 'نعم لكن بلا خصائص جزائرية'] },
    builders: { en: ['none', 'Manual repost on each app'], fr: ['none', 'Repost manuel sur chaque appli'], ar: ['none', 'إعادة نشر يدوي على كل تطبيق'] },
    api: { en: ['partial', 'Code required — for developers'], fr: ['partial', 'Code requis — développeurs'], ar: ['partial', 'يتطلب برمجة — للمطورين'] },
  },
  {
    key: 'cmp.row.cod',
    wasla: { en: ['full', 'Built-in COD flow'], fr: ['full', 'Flux COD intégré'], ar: ['full', 'تدفق الدفع عند الاستلام مدمج'] },
    intl: { en: ['none', 'Not available'], fr: ['none', 'Non disponible'], ar: ['none', 'غير متوفر'] },
    builders: { en: ['partial', 'Order tracking, no WhatsApp confirm'], fr: ['partial', 'Suivi de commandes, sans confirmation WhatsApp'], ar: ['partial', 'تتبع الطلبات بلا تأكيد واتساب'] },
    api: { en: ['na', '—'], fr: ['na', '—'], ar: ['na', '—'] },
  },
  {
    key: 'cmp.row.delivery',
    wasla: { en: ['full', 'Yalidine & partners integrated'], fr: ['full', 'Yalidine & partenaires intégrés'], ar: ['full', 'ياليدين والشركاء مدمجون'] },
    intl: { en: ['none', 'Not available'], fr: ['none', 'Non disponible'], ar: ['none', 'غير متوفر'] },
    builders: { en: ['partial', 'Courier integrations'], fr: ['partial', 'Intégrations livreurs'], ar: ['partial', 'تكامل مع شركات التوصيل'] },
    api: { en: ['na', '—'], fr: ['na', '—'], ar: ['na', '—'] },
  },
  {
    key: 'cmp.row.inbox',
    wasla: { en: ['full', 'All in one, in Darija'], fr: ['full', 'Tout au même endroit, en darija'], ar: ['full', 'الكل في مكان واحد، بالدارجة'] },
    intl: { en: ['partial', 'Comments only, no WhatsApp'], fr: ['partial', 'Commentaires seulement, pas de WhatsApp'], ar: ['partial', 'تعليقات فقط، بلا واتساب'] },
    builders: { en: ['none', 'Not available'], fr: ['none', 'Non disponible'], ar: ['none', 'غير متوفر'] },
    api: { en: ['partial', 'API only'], fr: ['partial', 'API uniquement'], ar: ['partial', 'عبر API فقط'] },
  },
  {
    key: 'cmp.row.lang',
    wasla: { en: ['full', 'Native AR/FR/EN + RTL'], fr: ['full', 'AR/FR/EN natif + RTL'], ar: ['full', 'عربي/فرنسي/إنجليزي أصلي + RTL'] },
    intl: { en: ['none', 'No Arabic RTL'], fr: ['none', 'Pas d\'arabe RTL'], ar: ['none', 'بلا عربي RTL'] },
    builders: { en: ['partial', 'Arabic support varies'], fr: ['partial', 'Support arabe variable'], ar: ['partial', 'دعم عربي متفاوت'] },
    api: { en: ['none', 'No merchant interface'], fr: ['none', 'Pas d\'interface marchand'], ar: ['none', 'بلا واجهة للتاجر'] },
  },
  {
    key: 'cmp.row.fees',
    wasla: { en: ['full', '0% — you keep everything'], fr: ['full', '0 % — vous gardez tout'], ar: ['full', '٠٪ — تحتفظ بكل شيء'] },
    intl: { en: ['na', '—'], fr: ['na', '—'], ar: ['na', '—'] },
    builders: { en: ['none', 'YouCan charges fees on COD sales'], fr: ['none', 'YouCan facture des frais sur le COD'], ar: ['none', 'YouCan يفرض رسوماً على مبيعات الدفع عند الاستلام'] },
    api: { en: ['na', '—'], fr: ['na', '—'], ar: ['na', '—'] },
  },
  {
    key: 'cmp.row.agency',
    wasla: { en: ['full', 'Included in Business plan'], fr: ['full', 'Inclus dans le plan Business'], ar: ['full', 'مشمول في خطة الأعمال'] },
    intl: { en: ['partial', 'Expensive team tiers'], fr: ['partial', 'Paliers équipes coûteux'], ar: ['partial', 'خطط فرق باهظة'] },
    builders: { en: ['none', 'Not available'], fr: ['none', 'Non disponible'], ar: ['none', 'غير متوفر'] },
    api: { en: ['na', '—'], fr: ['na', '—'], ar: ['na', '—'] },
  },
]

function CmpCell({ cell, wasla }: { cell: Cell; wasla?: boolean }) {
  const [status, text] = cell
  if (status === 'na') {
    return <span className="flex items-center gap-1.5 text-muted-foreground/60">—</span>
  }
  const icon =
    status === 'full' ? <Check className="h-3.5 w-3.5" /> :
    status === 'partial' ? <Minus className="h-3.5 w-3.5" /> :
    <X className="h-3.5 w-3.5" />
  const cls =
    status === 'full'
      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
      : status === 'partial'
        ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400'
        : 'bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400'
  return (
    <span className="flex items-start gap-1.5">
      <span className={cn('mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full', cls)} aria-hidden="true">
        {icon}
      </span>
      <span className={cn('text-xs leading-snug', wasla ? 'font-semibold text-foreground' : 'text-muted-foreground')}>{text}</span>
    </span>
  )
}

function Compare() {
  const { t, locale } = useI18n()
  const cols: { id: 'wasla' | 'intl' | 'builders' | 'api'; label: string; sub?: string }[] = [
    { id: 'wasla', label: t('cmp.col.wasla') },
    { id: 'intl', label: t('cmp.col.intl'), sub: t('cmp.col.intlSub') },
    { id: 'builders', label: t('cmp.col.builders'), sub: t('cmp.col.buildersSub') },
    { id: 'api', label: t('cmp.col.api'), sub: t('cmp.col.apiSub') },
  ]
  return (
    <section id="compare" className="scroll-mt-16 py-10 sm:py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 className="text-center text-3xl font-extrabold tracking-tight sm:text-4xl">{t('cmp.title')}</h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-muted-foreground">{t('cmp.sub')}</p>
        <div className="mt-8 sm:mt-10">
          <p className="mb-2 text-center text-[11px] font-medium text-muted-foreground sm:hidden" dir="auto">{t('cmp.swipe')}</p>
          <div className="overflow-x-auto rounded-2xl border bg-card shadow-sm">
            <table className="w-full min-w-[860px] border-collapse text-start">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="w-[22%] px-4 py-3.5 text-start text-xs font-semibold text-muted-foreground">
                    <span className="flex items-center gap-1.5"><Scale className="h-4 w-4 text-primary" />{t('common.brand')} vs …</span>
                  </th>
                  {cols.map((c) => (
                    <th key={c.id} className={cn('px-4 py-3.5 text-start', c.id === 'wasla' && 'bg-primary/5')}>
                      <span className={cn('block text-sm', c.id === 'wasla' ? 'font-extrabold text-primary' : 'font-bold')}>{c.label}</span>
                      {c.sub ? <span className="mt-0.5 block text-[11px] font-normal text-muted-foreground">{c.sub}</span> : (
                        c.id === 'wasla' && <span className="mt-0.5 inline-block rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">{t('cmp.waslaBadge')}</span>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {CMP_ROWS.map((row, i) => (
                  <tr key={row.key} className={cn('border-b last:border-0', i % 2 === 1 && 'bg-muted/20')}>
                    <th scope="row" className="px-4 py-3 text-start text-xs font-bold">{t(row.key as any)}</th>
                    {cols.map((c) => (
                      <td key={c.id} className={cn('px-4 py-3 align-top', c.id === 'wasla' && 'bg-primary/5')}>
                        <CmpCell cell={row[c.id][locale] || row[c.id].en} wasla={c.id === 'wasla'} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        {/* legend */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5"><span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"><Check className="h-3 w-3" /></span>{t('cmp.legendFull')}</span>
          <span className="flex items-center gap-1.5"><span className="flex h-4 w-4 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400"><Minus className="h-3 w-3" /></span>{t('cmp.legendPartial')}</span>
          <span className="flex items-center gap-1.5"><span className="flex h-4 w-4 items-center justify-center rounded-full bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400"><X className="h-3 w-3" /></span>{t('cmp.legendNone')}</span>
        </div>
        <p className="mt-4 text-center text-[11px] leading-relaxed text-muted-foreground/70">{t('cmp.foot')}</p>
      </div>
    </section>
  )
}

// ---------------- pricing ----------------
// Tiers anchored on COD order volume (the metric that runs an Algerian store).
const PLANS_INFO = [
  { id: 'free', price: 0, annual: 0, features: { en: ['1 store', '50 COD orders / month', '10 posts / month', '3 platforms', 'Unified inbox', 'WhatsApp confirmations'], fr: ['1 boutique', '50 commandes COD / mois', '10 posts / mois', '3 plateformes', 'Boîte unifiée', 'Confirmations WhatsApp'], ar: ['متجر واحد', '50 طلب دفع عند الاستلام / شهر', '10 منشورات / شهر', '3 منصات', 'صندوق موحد', 'تأكيدات واتساب'] } },
  { id: 'pro', price: 2900, annual: 2320, popular: true, features: { en: ['500 COD orders / month', '100 posts / month', '8 platforms', 'Courier sync (Yalidine, ZR, Maystro, NOEST)', 'AI copilot (Darija/AR/FR/EN)', 'Analytics & calendar'], fr: ['500 commandes COD / mois', '100 posts / mois', '8 plateformes', 'Synchro livreurs (Yalidine, ZR, Maystro, NOEST)', 'Copilote IA (darija/AR/FR/EN)', 'Analyses & calendrier'], ar: ['500 طلب دفع عند الاستلام / شهر', '100 منشور / شهر', '8 منصات', 'مزامنة التوصيل (ياليدين، ZR، مايسترو، NOEST)', 'مساعد ذكي (دارجة/ع/ف/إ)', 'تحليلات وتقويم'] } },
  { id: 'business', price: 8900, annual: 7120, features: { en: ['Unlimited COD orders', 'Unlimited posts', 'All platforms + API', 'Ads manager', 'Multi-client agency mode', '10 team seats'], fr: ['Commandes COD illimitées', 'Posts illimités', 'Toutes plateformes + API', 'Gestion des publicités', 'Mode agence multi-clients', '10 sièges'], ar: ['طلبات غير محدودة', 'منشورات غير محدودة', 'كل المنصات + API', 'إدارة الإعلانات', 'وضع وكالة متعدد العملاء', '10 مقاعد'] } },
]

const PAYMENT_METHODS = ['Edahabia', 'CIB', 'BaridiMob', 'CCP', 'Visa', 'Mastercard']

function Pricing() {
  const { t, locale } = useI18n()
  const goAuth = useAppStore((s) => s.goAuth)
  const [annual, setAnnual] = useState(false)
  return (
    <section id="pricing" className="scroll-mt-16 border-t bg-muted/40 py-10 sm:py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 className="text-center text-3xl font-extrabold tracking-tight sm:text-4xl">{t('pricing.title')}</h2>
        <p className="mt-3 text-center text-muted-foreground">{t('pricing.sub')}</p>
        <p className="mt-2 text-center text-sm font-medium text-primary">{t('pricing.trial')}</p>

        {/* monthly / annual toggle */}
        <div className="mt-5 flex justify-center sm:mt-6">
          <div className="inline-flex items-center rounded-full border bg-card p-1 shadow-sm" role="group" aria-label="Billing period">
            <button
              onClick={() => setAnnual(false)}
              aria-pressed={!annual}
              className={cn('rounded-full px-4 py-1.5 text-sm font-semibold transition', !annual ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground')}
            >
              {t('pricing.monthly')}
            </button>
            <button
              onClick={() => setAnnual(true)}
              aria-pressed={annual}
              className={cn('flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-semibold transition', annual ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground')}
            >
              {t('pricing.annual')}
              <span className={cn('rounded-full px-1.5 py-0.5 text-[10px] font-bold', annual ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400')}>
                {t('pricing.save20')}
              </span>
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-6 sm:mt-8 lg:grid-cols-3">
          {PLANS_INFO.map((p) => {
            const current = annual ? p.annual : p.price
            return (
              <div
                key={p.id}
                className={cn(
                  'relative flex flex-col rounded-2xl border bg-card p-5 shadow-sm sm:p-6',
                  p.popular && 'border-primary shadow-lg ring-1 ring-primary/50'
                )}
              >
                {p.popular && (
                  <span className="absolute -top-3 start-6 rounded-full bg-primary px-3 py-1 text-[11px] font-bold text-primary-foreground">
                    {t('pricing.popular')}
                  </span>
                )}
                <h3 className="text-lg font-bold">{t(`pricing.${p.id}.name`)}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{t(`pricing.${p.id}.desc`)}</p>
                <p className="mt-4 text-3xl font-extrabold tracking-tight" dir="ltr">
                  {current === 0 ? '0' : current.toLocaleString('en')}
                  <span className="text-base font-semibold text-muted-foreground"> {locale === 'fr' ? 'DA' : locale === 'ar' ? 'دج' : 'DZD'}{t('pricing.month')}</span>
                </p>
                {annual && p.id !== 'free' && (
                  <p className="mt-0.5 text-[11px] font-medium text-muted-foreground">{t('pricing.annualNote')}</p>
                )}
                <ul className="mt-5 flex-1 space-y-2.5 text-sm">
                  {(p.features as Record<string, string[]>)[locale].map((f) => (
                    <li key={f} className="flex items-start gap-2 text-muted-foreground">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      {f}
                    </li>
                  ))}
                </ul>
                {p.popular && (
                  <p className="mt-3 rounded-lg bg-primary/5 px-3 py-2 text-[11px] font-semibold leading-snug text-primary">{t('pricing.roi')}</p>
                )}
                <Button className="mt-6 w-full font-semibold" variant={p.popular ? 'default' : 'outline'} onClick={() => goAuth('register')}>
                  {t('pricing.cta')}
                </Button>
              </div>
            )
          })}
        </div>

        {/* local payment methods */}
        <div className="mt-6 text-center sm:mt-8">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{t('pricing.payWith')}</p>
          <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
            {PAYMENT_METHODS.map((m) => (
              <span key={m} className="rounded-lg border bg-card px-3 py-1.5 text-xs font-bold text-muted-foreground" dir="ltr">
                {m}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// ---------------- FAQ ----------------
function Faq() {
  const { t } = useI18n()
  return (
    <section id="faq" className="scroll-mt-16 py-10 sm:py-16">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <h2 className="text-center text-3xl font-extrabold tracking-tight sm:text-4xl">{t('faq.title')}</h2>
        <Accordion type="single" collapsible className="mt-6 sm:mt-8">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <AccordionItem key={i} value={`q${i}`}>
              <AccordionTrigger className="text-start text-base font-semibold">{t(`faq.q${i}`)}</AccordionTrigger>
              <AccordionContent className="text-sm leading-relaxed text-muted-foreground">{t(`faq.a${i}`)}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  )
}

// ---------------- CTA ----------------
function Cta() {
  const { t } = useI18n()
  const goAuth = useAppStore((s) => s.goAuth)
  return (
    <section className="px-4 pb-12 sm:px-6 sm:pb-16">
      <div className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl bg-primary px-5 py-10 text-center text-primary-foreground sm:px-10 sm:py-16">
        <div className="hero-grid absolute inset-0 opacity-20 invert" aria-hidden="true" />
        <h2 className="relative text-2xl font-extrabold tracking-tight sm:text-4xl">{t('cta.title')}</h2>
        <p className="relative mx-auto mt-3 max-w-xl text-primary-foreground/85">{t('cta.sub')}</p>
        <Button size="lg" variant="secondary" className="relative mt-7 h-12 px-8 text-base font-bold" onClick={() => goAuth('register')}>
          <Rocket className="h-5 w-5" />
          {t('cta.button')}
        </Button>
      </div>
    </section>
  )
}

// ---------------- footer ----------------
function Footer() {
  const { t } = useI18n()
  const cols: { title: string; links: { label: string; href: string }[] }[] = [
    {
      title: t('footer.product'),
      links: [
        { label: t('app.publisher'), href: '#features' },
        { label: t('feat.cod.title'), href: '#compare' },
        { label: t('app.inbox'), href: '#features' },
        { label: t('app.analytics'), href: '#features' },
      ],
    },
    {
      title: t('footer.company'),
      links: [
        { label: t('footer.about'), href: '#top' },
        { label: t('footer.contact'), href: 'mailto:contact@wasla.io' },
      ],
    },
    {
      title: t('footer.legal'),
      links: [
        { label: t('footer.terms'), href: '#faq' },
        { label: t('footer.privacy'), href: '#faq' },
      ],
    },
  ]
  return (
    <footer className="mt-auto border-t bg-muted/40">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="grid gap-6 sm:grid-cols-2 sm:gap-8 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <WaslaLogo size={30} />
            <p className="mt-3 max-w-xs text-sm text-muted-foreground">{t('footer.desc')}</p>
          </div>
          {cols.map((c) => (
            <nav key={c.title} aria-label={c.title}>
              <p className="text-sm font-semibold">{c.title}</p>
              <ul className="mt-3 space-y-2">
                {c.links.map((l) => (
                  <li key={l.label}>
                    <a href={l.href} className="text-sm text-muted-foreground transition hover:text-foreground">{l.label}</a>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t pt-6 text-xs text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} {t('common.brand')}. {t('footer.rights')}</p>
          <p className="flex items-center gap-1.5">
            <HeartHandshake className="h-3.5 w-3.5 text-primary" />
            {t('footer.made')}
          </p>
        </div>
      </div>
    </footer>
  )
}

// ---------------- announcement ----------------
function Announcement() {
  const { t } = useI18n()
  const goAuth = useAppStore((s) => s.goAuth)
  return (
    <div className="border-b bg-primary text-primary-foreground">
      <button onClick={() => goAuth('register')} className="mx-auto flex w-full items-center justify-center gap-2 px-4 py-2 text-center text-xs font-medium leading-snug sm:text-[13px]">
        <Sparkles className="h-3.5 w-3.5 shrink-0" />
        <span>{t('announce')}</span>
        <ArrowRight className="h-3.5 w-3.5 shrink-0 rtl:rotate-180" />
      </button>
    </div>
  )
}

// ---------------- sticky mobile CTA ----------------
// Most Algerian merchants arrive from mobile Facebook/Instagram/TikTok ads:
// keep a persistent "Start free" within thumb reach on small viewports.
function StickyMobileCta() {
  const { t } = useI18n()
  const goAuth = useAppStore((s) => s.goAuth)
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur-md md:hidden">
      <Button className="w-full gap-2 font-bold" size="lg" onClick={() => goAuth('register')}>
        <Rocket className="h-5 w-5" />
        {t('hero.cta')}
      </Button>
    </div>
  )
}

// ---------------- landing view ----------------
export function LandingView() {
  return (
    <div className="flex min-h-screen flex-col bg-background pb-16 md:pb-0">
      <Announcement />
      <Navbar />
      <main className="flex-1">
        <Hero />
        <PlatformsBand />
        <StatsBand />
        <Features />
        <Testimonials />
        <Compare />
        <Pricing />
        <Faq />
        <Cta />
      </main>
      <Footer />
      <StickyMobileCta />
    </div>
  )
}
