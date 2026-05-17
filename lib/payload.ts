/**
 * Server-side helpers to read data from Payload.
 * 在沒有 DATABASE_URI 的環境中（例如還沒設定好 .env），
 * 這些函式會回傳 null，呼叫端會 fallback 到寫死的資料，避免整站炸掉。
 */
import 'server-only'
import { getPayload } from 'payload'
import config from '../payload.config'

export type PortfolioDoc = {
  id: string | number
  slug: string
  title: string
  subtitle?: string | null
  category: string
  year: string
  client?: string | null
  tags?: { tag: string }[] | null
  description: string
  content?: string | null
  coverUrl?: string | null
  cover?: { url?: string | null; alt?: string | null } | string | null
  size: 'large' | 'medium' | 'small'
  order?: number | null
  published?: boolean | null
}

function hasDb() {
  return Boolean(process.env.DATABASE_URI)
}

export function resolveCover(doc: PortfolioDoc): string {
  const c = doc.cover
  if (c && typeof c === 'object' && c.url) return c.url
  if (doc.coverUrl) return doc.coverUrl
  return '/placeholder.jpg'
}

export async function getAllPortfolio(): Promise<PortfolioDoc[] | null> {
  if (!hasDb()) return null
  try {
    const payload = await getPayload({ config })
    const result = await payload.find({
      collection: 'portfolio',
      where: { published: { equals: true } },
      limit: 200,
      sort: 'order',
      depth: 1,
    })
    return result.docs as unknown as PortfolioDoc[]
  } catch (e) {
    console.error('[Payload] getAllPortfolio failed:', e)
    return null
  }
}

export async function getPortfolioBySlug(slug: string): Promise<PortfolioDoc | null> {
  if (!hasDb()) return null
  try {
    const payload = await getPayload({ config })
    const result = await payload.find({
      collection: 'portfolio',
      where: { slug: { equals: slug } },
      limit: 1,
      depth: 1,
    })
    return (result.docs[0] as unknown as PortfolioDoc) ?? null
  } catch (e) {
    console.error('[Payload] getPortfolioBySlug failed:', e)
    return null
  }
}

export async function getAllPortfolioSlugs(): Promise<string[] | null> {
  if (!hasDb()) return null
  try {
    const payload = await getPayload({ config })
    const result = await payload.find({
      collection: 'portfolio',
      where: { published: { equals: true } },
      limit: 200,
      sort: 'order',
      depth: 0,
    })
    return result.docs.map((d: any) => d.slug)
  } catch (e) {
    console.error('[Payload] getAllPortfolioSlugs failed:', e)
    return null
  }
}
