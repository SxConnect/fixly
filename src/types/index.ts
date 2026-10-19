export interface User {
  id: string
  email: string
  name: string
}

export interface Profile {
  id: string
  userId: string
  name: string
  bio: string | null
  photoUrl: string | null
  signatureUrl: string | null
  brandColor: string
}

export interface Product {
  id: string
  profileId: string
  niche: string
  subNiche: string | null
  title: string
  promise: string
  audience: string | null
  status: 'draft' | 'generating' | 'ready' | 'published'
  price: number | null
  purchaseLink: string | null
  slug: string | null
  coverChoice: string | null
  createdAt: string
  updatedAt: string
}

export interface Chapter {
  id: string
  productId: string
  order: number
  type: 'chapter' | 'appendix'
  title: string
  content: string
  note: number | null
  attempts: number
  status: 'pending' | 'generating' | 'reviewing' | 'approved' | 'needs_rewrite'
}

export interface ProductIdea {
  id: string
  productId: string
  title: string
  promise: string
  audience: string | null
  selected: boolean
}

export interface GenerationJob {
  id: string
  productId: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  progress: number
  totalChapters: number
  currentChapter: number
  error: string | null
}

export interface SalesPage {
  id: string
  productId: string
  slug: string
  published: boolean
  ogTitle: string | null
  ogDescription: string | null
  ogImageUrl: string | null
}

export interface Sale {
  id: string
  productId: string
  platform: string
  externalId: string
  buyerEmail: string
  buyerName: string | null
  amount: number
  status: 'approved' | 'refunded' | 'chargeback'
  createdAt: string
}

export interface DownloadLink {
  id: string
  salesId: string
  token: string
  maxUses: number
  useCount: number
  revoked: boolean
  expiresAt: string
}

export interface DiagnosisResult {
  stage: 'reach' | 'page' | 'checkout' | 'healthy'
  title: string
  description: string
  suggestions: string[]
}

export interface UsageStatus {
  products: { used: number; limit: number; remaining: number }
  ideas: { used: number; limit: number; remaining: number }
  adjustments: { used: number; limit: number; remaining: number }
}
