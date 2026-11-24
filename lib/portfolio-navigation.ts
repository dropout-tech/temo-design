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

export type FilterState = {
  query: string
  group: string
  industries: string[]
  designer: string
  client: string
  year: string
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

let pendingProjectPath: string | undefined

type ProjectSource = {
  href: string
  scrollY: number
  filters?: FilterState
}

/** Called by a project link only for same-tab client navigation. */
export function rememberProjectNavigation(href: string, filters?: FilterState) {
  const path = new URL(href, window.location.href).pathname
  pendingProjectPath = path === window.location.pathname ? undefined : path
  if (!pendingProjectPath) return

  const source: ProjectSource = { href: window.location.href, scrollY: window.scrollY, filters }
  window.history.replaceState({ ...window.history.state, temoProjectSource: source }, "")
}

export function getProjectSource(): ProjectSource | undefined {
  const source: ProjectSource | undefined = window.history.state?.temoProjectSource
  return source?.href === window.location.href ? source : undefined
}

export function recordProjectArrival() {
  const path = window.location.pathname
  if (pendingProjectPath !== path) return

  pendingProjectPath = undefined
  window.history.replaceState({ ...window.history.state, temoProjectBackPath: path }, "")
}

export function canReturnFromProject(): boolean {
  return window.history.state?.temoProjectBackPath === window.location.pathname
}
