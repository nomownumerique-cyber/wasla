// Zernio-style ad platform catalog — the in-app "Platforms" hub for ad networks.
// Metadata mirrors a real integration console: slug, auth type, capabilities,
// tool counts, webhook events and the OAuth connect endpoint.

export type AdPlatformId = 'metaads' | 'tiktokads' | 'googleads' | 'linkedinads'

export interface AdScope {
  id: string
  label: string
}

export interface AdPlatformMeta {
  id: AdPlatformId
  campaignPlatform: string // matching Campaign.platform value: meta | tiktok | google | linkedin
  name: string
  nameAr: string
  nameFr: string
  slug: string
  category: string
  categoryKey: string // i18n key for the category
  auth: 'OAuth2'
  authVia: string // e.g. "via Facebook"
  authViaKey: string // i18n key
  capabilities: string[] // short capability tags
  tools: number // number of API tools surfaced
  webhookEvents: number
  webhookEventNames: string[]
  toolsSample: string[] // representative API tools shown in the drawer
  connectEndpoint: string // GET /v1/connect/...
  description: string
  descriptionAr: string
  descriptionFr: string
  color: string // brand hex
  logo: 'meta' | 'tiktok' | 'google' | 'linkedin'
  loginBrand: {
    // styling for the simulated platform login step (in-app OAuth)
    headerBg: string
    buttonBg: string
    buttonText: string
    dark?: boolean
  }
  adAccountPrefix: string // act_ for meta, numeric for tiktok
  scopes: AdScope[]
}

export const AD_PLATFORMS: AdPlatformMeta[] = [
  {
    id: 'metaads',
    campaignPlatform: 'meta',
    name: 'Meta Ads',
    nameAr: 'إعلانات ميتا',
    nameFr: 'Meta Ads',
    slug: 'metaads',
    category: 'Ad networks',
    categoryKey: 'adCat.networks',
    auth: 'OAuth2',
    authVia: 'via Facebook',
    authViaKey: 'adAuth.viaFacebook',
    capabilities: ['Ads', 'Audiences', 'Pixels'],
    tools: 248,
    webhookEvents: 5,
    webhookEventNames: ['ad.account', 'campaign.status', 'leadgen', 'pixel.fired', 'audience.updated'],
    toolsSample: [
      'POST /v1/meta/ads/campaigns',
      'POST /v1/meta/ads/ad-sets',
      'POST /v1/meta/ads/creatives',
      'GET /v1/meta/ads/insights',
      'POST /v1/meta/ads/audiences',
      'GET /v1/meta/ads/pixels',
    ],
    connectEndpoint: 'GET /v1/connect/facebook/ads',
    description: 'Facebook and Instagram campaigns, audiences, lead forms and pixels.',
    descriptionAr: 'حملات فيسبوك وإنستغرام، الجماهير، نماذج العملاء والبكسل.',
    descriptionFr: 'Campagnes Facebook et Instagram, audiences, formulaires et pixels.',
    color: '#1877F2',
    logo: 'meta',
    loginBrand: { headerBg: '#1877F2', buttonBg: '#1877F2', buttonText: '#FFFFFF' },
    adAccountPrefix: 'act_',
    scopes: [
      { id: 'ads_management', label: 'Create and manage your ads' },
      { id: 'ads_read', label: 'Read your ad performance insights' },
      { id: 'business_management', label: 'Manage your business assets' },
      { id: 'pages_read_engagement', label: 'Read your Page engagement' },
      { id: 'catalog_management', label: 'Manage your product catalog' },
    ],
  },
  {
    id: 'tiktokads',
    campaignPlatform: 'tiktok',
    name: 'TikTok Ads',
    nameAr: 'إعلانات تيك توك',
    nameFr: 'TikTok Ads',
    slug: 'tiktokads',
    category: 'Ad networks',
    categoryKey: 'adCat.networks',
    auth: 'OAuth2',
    authVia: 'via TikTok',
    authViaKey: 'adAuth.viaTikTok',
    capabilities: ['Ads', 'Audiences', 'Catalog'],
    tools: 142,
    webhookEvents: 3,
    webhookEventNames: ['campaign.status', 'ad.approval', 'creative.rejected'],
    toolsSample: [
      'POST /v1/tiktok/ads/campaigns',
      'POST /v1/tiktok/ads/ad-groups',
      'POST /v1/tiktok/ads/creatives',
      'GET /v1/tiktok/ads/reports',
      'POST /v1/tiktok/ads/audiences',
      'GET /v1/tiktok/ads/catalog',
    ],
    connectEndpoint: 'GET /v1/connect/tiktok/ads',
    description: 'TikTok campaigns, Spark Ads, audiences and product catalogs.',
    descriptionAr: 'حملات تيك توك، إعلانات سبارك، الجماهير وكتالوجات المنتجات.',
    descriptionFr: 'Campagnes TikTok, Spark Ads, audiences et catalogues produits.',
    color: '#010101',
    logo: 'tiktok',
    loginBrand: { headerBg: '#111111', buttonBg: '#111111', buttonText: '#FFFFFF', dark: true },
    adAccountPrefix: '',
    scopes: [
      { id: 'ad.group.list', label: 'Read your ad accounts' },
      { id: 'campaign.management', label: 'Create and manage your campaigns' },
      { id: 'audience.management', label: 'Build custom audiences' },
      { id: 'catalog.management', label: 'Manage your product catalog' },
      { id: 'reporting.read', label: 'Read your reporting data' },
    ],
  },
  {
    id: 'googleads',
    campaignPlatform: 'google',
    name: 'Google Ads',
    nameAr: 'إعلانات جوجل',
    nameFr: 'Google Ads',
    slug: 'googleads',
    category: 'Ad networks',
    categoryKey: 'adCat.networks',
    auth: 'OAuth2',
    authVia: 'via Google',
    authViaKey: 'adAuth.viaGoogle',
    capabilities: ['Ads', 'Keywords'],
    tools: 120,
    webhookEvents: 2,
    webhookEventNames: ['campaign.changed', 'budget.alert'],
    toolsSample: [
      'POST /v1/google/ads/campaigns',
      'POST /v1/google/ads/ad-groups',
      'GET /v1/google/ads/keywords',
      'GET /v1/google/ads/reports',
      'POST /v1/google/ads/audiences',
      'GET /v1/google/ads/conversions',
    ],
    connectEndpoint: 'GET /v1/connect/google/ads',
    description: 'Search, Display and YouTube campaigns with keyword targeting.',
    descriptionAr: 'حملات البحث والعرض ويوتيوب مع استهداف الكلمات المفتاحية.',
    descriptionFr: 'Campagnes Search, Display et YouTube avec ciblage par mots-clés.',
    color: '#EA4335',
    logo: 'google',
    loginBrand: { headerBg: '#FFFFFF', buttonBg: '#1A73E8', buttonText: '#FFFFFF' },
    adAccountPrefix: '',
    scopes: [
      { id: 'https://www.googleapis.com/auth/adwords', label: 'Manage your Google Ads campaigns' },
      { id: 'analytics.readonly', label: 'Read your Analytics data' },
    ],
  },
  {
    id: 'linkedinads',
    campaignPlatform: 'linkedin',
    name: 'LinkedIn Ads',
    nameAr: 'إعلانات لينكدإن',
    nameFr: 'LinkedIn Ads',
    slug: 'linkedinads',
    category: 'Ad networks',
    categoryKey: 'adCat.networks',
    auth: 'OAuth2',
    authVia: 'via LinkedIn',
    authViaKey: 'adAuth.viaLinkedIn',
    capabilities: ['Ads', 'Lead Gen'],
    tools: 86,
    webhookEvents: 2,
    webhookEventNames: ['leadgen.response', 'campaign.status'],
    toolsSample: [
      'POST /v1/linkedin/ads/campaigns',
      'GET /v1/linkedin/ads/ad-accounts',
      'POST /v1/linkedin/ads/creatives',
      'GET /v1/linkedin/ads/reports',
      'POST /v1/linkedin/ads/audiences',
      'GET /v1/linkedin/ads/lead-forms',
    ],
    connectEndpoint: 'GET /v1/connect/linkedin/ads',
    description: 'B2B campaigns, lead gen forms and audience targeting by job title.',
    descriptionAr: 'حملات B2B ونماذج توليد العملاء والاستهداف حسب المسمى الوظيفي.',
    descriptionFr: 'Campagnes B2B, formulaires de leads et ciblage par poste.',
    color: '#0A66C2',
    logo: 'linkedin',
    loginBrand: { headerBg: '#0A66C2', buttonBg: '#0A66C2', buttonText: '#FFFFFF' },
    adAccountPrefix: '',
    scopes: [
      { id: 'r_ads', label: 'Read your ads data' },
      { id: 'rw_ads', label: 'Manage your campaigns' },
      { id: 'r_organization_social', label: 'Read your organization profile' },
    ],
  },
]

export const adPlatformById = (id: string): AdPlatformMeta | undefined =>
  AD_PLATFORMS.find((p) => p.id === id || p.slug === id)

export const adPlatformForCampaign = (campaignPlatform: string): AdPlatformMeta | undefined =>
  AD_PLATFORMS.find((p) => p.campaignPlatform === campaignPlatform)

// Generates a realistic-looking ad account id for the freshly connected platform
export function generateAdAccountId(meta: AdPlatformMeta): string {
  const digits = () => Math.floor(100000000 + Math.random() * 899999999)
  if (meta.id === 'metaads') return `act_${digits()}`
  if (meta.id === 'linkedinads') return `${Math.floor(500000000 + Math.random() * 499999999)}`
  return `${digits()}`
}
