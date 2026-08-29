type LandingFacet = {
  value: string
  landingSlug?: string | null
}

type WorksFilter = {
  group?: string
  industry?: string
  client?: string
  designer?: string
  year?: string
  query?: string
}

const DEFAULT_LANDING_BY_CATEGORY: Readonly<Record<string, string>> = {
  "brand-planning": "brand-graphic",
  "logo-trademark": "brand-graphic",
  packaging: "brand-graphic",
  "business-card": "brand-graphic",
  menu: "brand-graphic",
  poster: "brand-graphic",
  storefront: "brand-graphic",
  "web-visual": "brand-graphic",
  graphic: "brand-graphic",
  exhibition: "brand-graphic",
  merchandise: "brand-graphic",
  "public-art": "public-art",
  "product-design": "product-design",
  "crafts-design": "crafts-design",
}

/** 找出作品主要執行項目所屬的服務頁，保留作品清單的原始脈絡。 */
export function findWorksLandingSlug(
  categoryValues: readonly string[],
  categoryGroups: readonly LandingFacet[]
): string | undefined {
  const landingByCategory = new Map(
    categoryGroups
      .filter((group) => group.landingSlug)
      .map((group) => [group.value, group.landingSlug as string])
  )

  for (const value of categoryValues) {
    const landingSlug = landingByCategory.get(value)
    if (landingSlug) return landingSlug
  }

  for (const value of categoryValues) {
    const landingSlug = DEFAULT_LANDING_BY_CATEGORY[value]
    if (landingSlug) return landingSlug
  }

  return undefined
}

/** 建立服務頁作品區連結；沒有可對應的服務頁時回作品探索主畫面。 */
export function buildWorksLandingHref(
  landingSlug: string | undefined,
  filter: WorksFilter = {}
): string {
  if (!landingSlug) return "/explore"

  const search = new URLSearchParams()
  if (filter.group) search.set("group", filter.group)
  if (filter.industry) search.set("industry", filter.industry)
  if (filter.client) search.set("client", filter.client)
  if (filter.designer) search.set("designer", filter.designer)
  if (filter.year) search.set("year", filter.year)
  if (filter.query) search.set("q", filter.query)

  const query = search.toString()
  return `/services/${encodeURIComponent(landingSlug)}${query ? `?${query}` : ""}#works`
}
