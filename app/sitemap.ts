import type { MetadataRoute } from 'next'
import { SITE_ORIGIN, getWorkPublicPath } from '@/lib/legacy-work-paths'
import { getPublishedWorkSlugs } from '@/lib/portfolio-supabase'

export const revalidate = 60

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = SITE_ORIGIN
  const slugs = await getPublishedWorkSlugs()
  
  return [
    ...slugs.map((slug) => ({ url: `${baseUrl}${getWorkPublicPath(slug)}` })),
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/explore`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/faq`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.8,
    },
  ]
}
