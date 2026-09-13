import type { MetadataRoute } from 'next'
import { SITE_ORIGIN } from '@/lib/legacy-work-paths'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = SITE_ORIGIN

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/studio/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
