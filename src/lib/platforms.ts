// Platform metadata shared across the app (brand tiles, colors, display names)
export type PlatformId =
  | 'facebook'
  | 'instagram'
  | 'tiktok'
  | 'whatsapp'
  | 'x'
  | 'youtube'
  | 'snapchat'
  | 'pinterest'

export interface PlatformMeta {
  id: PlatformId
  name: string
  nameAr: string
  nameFr: string
  color: string // brand hex (used ONLY for platform tiles, not UI theme)
  format: 'post' | 'reel' | 'video' | 'story' | 'status'
  limit: number // recommended caption length for the network
  hint: string // short adaptation hint shown in the variants editor
  compat: string // real API constraint shown in the composer (formats/authorization) — we do not promise every format works everywhere
}

export const PLATFORMS: PlatformMeta[] = [
  { id: 'facebook', name: 'Facebook', nameAr: 'فيسبوك', nameFr: 'Facebook', color: '#1877F2', format: 'post', limit: 2000, hint: 'Longer storytelling post, link + CTA to order', compat: 'Photo, video & link posts — Page access token' },
  { id: 'instagram', name: 'Instagram', nameAr: 'إنستغرام', nameFr: 'Instagram', color: '#E1306C', format: 'reel', limit: 2200, hint: 'Visual hook, emoji, 5-8 hashtags', compat: 'Photo & Reel only — Business or Creator account required by the Content Publishing API' },
  { id: 'tiktok', name: 'TikTok', nameAr: 'تيك توك', nameFr: 'TikTok', color: '#010101', format: 'video', limit: 300, hint: 'Punchy hook, trending hashtags', compat: 'Video only — video.publish authorization; unaudited apps post in private mode' },
  { id: 'whatsapp', name: 'WhatsApp', nameAr: 'واتساب', nameFr: 'WhatsApp', color: '#25D366', format: 'status', limit: 700, hint: 'Direct order message, COD + wilaya delivery', compat: 'Status & broadcast — WhatsApp Business API' },
  { id: 'x', name: 'X (Twitter)', nameAr: 'إكس (تويتر)', nameFr: 'X (Twitter)', color: '#000000', format: 'post', limit: 280, hint: 'Ultra short, 1-2 hashtags max', compat: 'Max 280 characters — OAuth 2.0' },
  { id: 'youtube', name: 'YouTube', nameAr: 'يوتيوب', nameFr: 'YouTube', color: '#FF0000', format: 'video', limit: 1000, hint: 'Title + description style', compat: 'Video only — OAuth; daily quota units apply' },
  { id: 'snapchat', name: 'Snapchat', nameAr: 'سناب شات', nameFr: 'Snapchat', color: '#F5C100', format: 'story', limit: 250, hint: 'Fast casual tone, urgency', compat: 'Story media only — approved Snap app required' },
  { id: 'pinterest', name: 'Pinterest', nameAr: 'بنترست', nameFr: 'Pinterest', color: '#E60023', limit: 500, format: 'post', hint: 'Keyword-rich, search-friendly phrasing', compat: 'Image pins — claimed website required' },
]

export const platformById = (id: string): PlatformMeta | undefined =>
  PLATFORMS.find((p) => p.id === id)

// Social inbox channels
export type ChannelId = 'whatsapp' | 'facebook' | 'instagram'

export const CHANNELS: Record<ChannelId, { id: ChannelId; name: string; nameAr: string; color: string }> = {
  whatsapp: { id: 'whatsapp', name: 'WhatsApp', nameAr: 'واتساب', color: '#25D366' },
  facebook: { id: 'facebook', name: 'Facebook', nameAr: 'فيسبوك', color: '#1877F2' },
  instagram: { id: 'instagram', name: 'Instagram', nameAr: 'إنستغرام', color: '#E1306C' },
}
