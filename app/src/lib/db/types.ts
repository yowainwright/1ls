export interface Preference {
  id: string
  value: unknown
  updatedAt: number
}

export interface DocPage {
  id: string
  slug: string
  title: string
  category: 'guide' | 'api'
  content: string
  lastViewed?: number
}
