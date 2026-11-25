// Formatting helpers shared by client & server
export function formatMoney(amount: number, locale: string = 'en'): string {
  const rounded = Math.round(amount)
  const sep = locale === 'en' ? ',' : ' '
  const str = rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, sep)
  if (locale === 'ar') return `${str} دج`
  if (locale === 'fr') return `${str} DA`
  return `${str} DZD`
}

export function formatNumber(n: number, locale: string = 'en'): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}k`
  return n.toLocaleString('en-US')
}

export function formatDateTime(d: Date | string, locale: string = 'en'): string {
  const date = typeof d === 'string' ? new Date(d) : d
  try {
    return new Intl.DateTimeFormat(locale === 'ar' ? 'ar' : locale === 'fr' ? 'fr-FR' : 'en', {
      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
    }).format(date)
  } catch {
    return date.toDateString()
  }
}

export function formatDate(d: Date | string, locale: string = 'en'): string {
  const date = typeof d === 'string' ? new Date(d) : d
  try {
    return new Intl.DateTimeFormat(locale === 'ar' ? 'ar' : locale === 'fr' ? 'fr-FR' : 'en', {
      day: 'numeric', month: 'short', year: 'numeric',
    }).format(date)
  } catch {
    return date.toDateString()
  }
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase() || '?'
}

export function relativeTime(d: Date | string, locale: string = 'en'): string {
  const date = typeof d === 'string' ? new Date(d) : d
  const diff = Date.now() - date.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return locale === 'ar' ? 'الآن' : locale === 'fr' ? 'maintenant' : 'now'
  if (mins < 60) return locale === 'ar' ? `قبل ${mins} د` : locale === 'fr' ? `il y a ${mins} min` : `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return locale === 'ar' ? `قبل ${hours} س` : locale === 'fr' ? `il y a ${hours} h` : `${hours}h ago`
  const days = Math.floor(hours / 24)
  return locale === 'ar' ? `قبل ${days} ي` : locale === 'fr' ? `il y a ${days} j` : `${days}d ago`
}
