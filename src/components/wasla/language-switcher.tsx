'use client'

import { useRouter } from 'next/navigation'
import { useI18n, LOCALES, Locale } from '@/lib/i18n'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Languages } from 'lucide-react'
import { cn } from '@/lib/utils'

export function LanguageSwitcher({ variant = 'ghost' }: { variant?: 'ghost' | 'outline' }) {
  const { locale, setLocale, t } = useI18n()
  const router = useRouter()
  const current = LOCALES.find((l) => l.id === locale)!

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant === 'ghost' ? 'ghost' : 'outline'}
          size="sm"
          className={cn('gap-2 font-medium', variant === 'ghost' && 'text-muted-foreground')}
          aria-label={t('set.language')}
        >
          <Languages className="h-4 w-4" />
          <span className="hidden sm:inline">{current.label}</span>
          <span className="sm:hidden">{current.flag}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-36">
        {LOCALES.map((l) => (
          <DropdownMenuItem
            key={l.id}
            onClick={() => {
              setLocale(l.id as Locale)
              router.refresh()
            }}
            className={cn('gap-2', l.id === locale && 'bg-accent text-accent-foreground')}
          >
            <span className="flex h-6 w-6 items-center justify-center rounded bg-muted text-xs font-bold">{l.flag}</span>
            {l.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
