// Trilingual dictionaries (EN / FR / AR). One file per language keeps each
// under ~40KB so they stay reviewable; this barrel preserves the public API
// (Locale, LOCALES, DICT, translate) used across the app.
import type { Locale } from './en'
import { en, LOCALES } from './en'
import { fr } from './fr'
import { ar } from './ar'

export type { Locale }
export { LOCALES, en, fr, ar }

export const DICT: Record<Locale, Record<string, string>> = { en, fr, ar }

export function translate(locale: Locale, key: string, params?: Record<string, string | number>): string {
  let value = DICT[locale]?.[key] ?? DICT.en[key] ?? key
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      value = value.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v))
    }
  }
  return value
}
