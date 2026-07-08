// FAQ / 見證 / 網站設定的讀取層（前台與後台顯示共用，走公開 anon，RLS 允許公開讀）。
import "server-only"
import { createPublicClient } from "@/lib/supabase/public"

export type Faq = {
  id: string
  question: string
  answer: string
  category: string | null
  sort: number
}

export type ClientLogo = {
  id: string
  name: string
  image_url: string
  sort: number
}

export type AwardLogo = {
  id: string
  name: string
  image_url: string
  sort: number
}

export type PressLink = {
  id: string
  title: string
  source: string
  url: string
  image_url: string
  sort: number
}

export type SiteSettings = {
  name: string | null
  description: string | null
  email: string | null
  phone: string | null
  address: string | null
  instagram: string | null
  facebook: string | null
  behance: string | null
}

export async function getFaqs(): Promise<Faq[]> {
  const supa = createPublicClient()
  const { data } = await supa
    .from("faqs")
    .select("id, question, answer, category, sort")
    .order("sort")
  return (data as Faq[]) ?? []
}

/** FAQ 依 category 分組（保留 sort 順序），給前台用 */
export async function getFaqsGrouped(): Promise<{ category: string; questions: { q: string; a: string }[] }[]> {
  const faqs = await getFaqs()
  const order: string[] = []
  const map = new Map<string, { q: string; a: string }[]>()
  for (const f of faqs) {
    const cat = f.category ?? "其他"
    if (!map.has(cat)) {
      map.set(cat, [])
      order.push(cat)
    }
    map.get(cat)!.push({ q: f.question, a: f.answer })
  }
  return order.map((category) => ({ category, questions: map.get(category)! }))
}

export async function getClientLogos(): Promise<ClientLogo[]> {
  const supa = createPublicClient()
  const { data } = await supa
    .from("client_logos")
    .select("id, name, image_url, sort")
    .order("sort")
  return (data as ClientLogo[]) ?? []
}

export async function getAwardLogos(): Promise<AwardLogo[]> {
  const supa = createPublicClient()
  const { data } = await supa
    .from("award_logos")
    .select("id, name, image_url, sort")
    .order("sort")
  return (data as AwardLogo[]) ?? []
}

export async function getPressLinks(): Promise<PressLink[]> {
  const supa = createPublicClient()
  const { data } = await supa
    .from("press_links")
    .select("id, title, source, url, image_url, sort")
    .order("sort")
  return (data as PressLink[]) ?? []
}

export async function getSiteSettings(): Promise<SiteSettings | null> {
  const supa = createPublicClient()
  const { data } = await supa
    .from("site_settings")
    .select("name, description, email, phone, address, instagram, facebook, behance")
    .eq("id", 1)
    .maybeSingle()
  return (data as SiteSettings) ?? null
}

// ── 即時報價試算（/quote 前台 + /studio/quote 後台共用）──────────────────────
export type QuoteAddon = { id: string; label: string; price: number; sort: number }

export type QuotePackage = {
  id: string
  name: string
  nameEn: string
  basePrice: number
  originalPrice?: number
  priceNote?: string
  features: string[]
  recommended?: boolean
  showAddons: boolean
  sort: number
  addons?: QuoteAddon[]
}

export type QuoteCategory = {
  id: string
  title: string
  titleEn: string
  description: string
  icon: string
  sort: number
  packages: QuotePackage[]
}

export type QuotePricing = { categories: QuoteCategory[]; addons: QuoteAddon[] }

/**
 * 前台計算機 + 後台管理共用的報價資料。
 * 回傳巢狀結構（類別 → 方案），show_addons 的方案自動掛上共用加購池。
 */
export async function getQuotePricing(): Promise<QuotePricing> {
  const supa = createPublicClient()
  const [catsRes, pkgsRes, addonsRes] = await Promise.all([
    supa.from("quote_categories").select("id, title, title_en, description, icon, sort").order("sort"),
    supa
      .from("quote_packages")
      .select("id, category_id, name, name_en, base_price, original_price, price_note, features, recommended, show_addons, sort")
      .order("sort"),
    supa.from("quote_addons").select("id, label, price, sort").order("sort"),
  ])

  const addons: QuoteAddon[] = (addonsRes.data ?? []).map((a) => ({
    id: a.id as string,
    label: a.label as string,
    price: a.price as number,
    sort: a.sort as number,
  }))

  const pkgRows = (pkgsRes.data ?? []) as {
    id: string
    category_id: string
    name: string
    name_en: string
    base_price: number
    original_price: number | null
    price_note: string | null
    features: unknown
    recommended: boolean
    show_addons: boolean
    sort: number
  }[]

  const categories: QuoteCategory[] = ((catsRes.data ?? []) as {
    id: string
    title: string
    title_en: string
    description: string
    icon: string
    sort: number
  }[]).map((c) => ({
    id: c.id,
    title: c.title,
    titleEn: c.title_en,
    description: c.description,
    icon: c.icon,
    sort: c.sort,
    packages: pkgRows
      .filter((p) => p.category_id === c.id)
      .map((p) => ({
        id: p.id,
        name: p.name,
        nameEn: p.name_en,
        basePrice: p.base_price,
        originalPrice: p.original_price ?? undefined,
        priceNote: p.price_note ?? undefined,
        features: Array.isArray(p.features) ? (p.features as string[]) : [],
        recommended: p.recommended || undefined,
        showAddons: p.show_addons,
        sort: p.sort,
        addons: p.show_addons ? addons : undefined,
      })),
  }))

  return { categories, addons }
}

// ── 團隊 / 設計師（關於頁團隊區 + /studio/designers 共用）──────────────────────
/** 後台編輯用的完整欄位 */
export type TeamMemberRow = {
  id: string
  slug: string | null
  name: string
  name_zh: string | null
  role: string | null
  category: string
  photo_url: string | null
  instagram: string | null
  bio: string[]
  achievements: string[]
  tags: string[]
  has_page: boolean
  sort: number
}

/** 前台關於頁卡片用的形狀 */
export type TeamMember = {
  name: string
  nameZh?: string
  role: string
  image: string
  instagram?: string
  bio?: string[]
  achievements?: string[]
  tags?: string[]
}

export type TeamGroup = { category: string; members: TeamMember[] }

/** 後台：所有團隊成員（含全部欄位，依 sort） */
export async function getTeamForStudio(): Promise<TeamMemberRow[]> {
  const supa = createPublicClient()
  const { data } = await supa
    .from("designers")
    .select(
      "id, slug, name, name_zh, role, category, photo_url, instagram, bio, achievements, tags, has_page, sort"
    )
    .order("sort")
  return (data as TeamMemberRow[]) ?? []
}

/** 前台：依 category 分組（分類順序＝各分類第一次出現的 sort 順序） */
export async function getTeamGrouped(): Promise<TeamGroup[]> {
  const rows = await getTeamForStudio()
  const order: string[] = []
  const map = new Map<string, TeamMember[]>()
  for (const r of rows) {
    const cat = r.category || "DESIGNER"
    if (!map.has(cat)) {
      map.set(cat, [])
      order.push(cat)
    }
    map.get(cat)!.push({
      name: r.name,
      nameZh: r.name_zh ?? undefined,
      role: r.role ?? "",
      image: r.photo_url ?? "",
      instagram: r.instagram ?? undefined,
      bio: r.bio ?? [],
      achievements: r.achievements ?? [],
      tags: r.tags ?? [],
    })
  }
  return order.map((category) => ({ category, members: map.get(category)! }))
}
