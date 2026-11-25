// Simulated multi-platform publishing (one-click core)
// In production this calls the platforms' official APIs (Graph, TikTok Content Posting, WhatsApp Business...)

export interface PublishResult {
  platform: string
  status: 'published' | 'failed'
  externalId: string
  url: string
  reach: number
}

const domains: Record<string, string> = {
  facebook: 'facebook.com',
  instagram: 'instagram.com',
  tiktok: 'tiktok.com',
  whatsapp: 'wa.me',
  x: 'x.com',
  youtube: 'youtube.com',
  snapchat: 'snapchat.com',
  pinterest: 'pinterest.com',
}

export function simulatePublish(platforms: string[]): PublishResult[] {
  return platforms.map((platform, i) => {
    // simulate rare transient failure on one platform for realism (never on the first platform)
    const failed = platforms.length >= 3 && i === platforms.length - 1 && Math.random() < 0.12
    const id = `${platform}_${Math.random().toString(36).slice(2, 10)}`
    const domain = domains[platform] || 'example.com'
    return {
      platform,
      status: failed ? 'failed' : 'published',
      externalId: id,
      url: `https://${domain}/${id}`,
      // no fabricated reach: real numbers arrive when platforms report back
      reach: 0,
    }
  })
}

// Engagement metrics are NOT fabricated: a fresh publication starts at zero and
// only grows from real platform reports. (Signature kept for call sites.)
export function engagementSeeds(_followers: number) {
  return { views: 0, likes: 0, comments: 0, clicks: 0 }
}
