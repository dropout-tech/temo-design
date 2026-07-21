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
  business_hours: string | null
  line_url: string | null
  line_qr_url: string | null
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

/** 服務分類落地頁（/services/[slug]）：組成前台元件既有的 CategoryLanding 形狀 */
import type { CategoryLanding } from "@/lib/category-landing-data"

export async function getCategoryLandings(): Promise<CategoryLanding[]> {
  const supa = createPublicClient()
  const { data } = await supa
    .from("category_landings")
    .select("slug, num, title_en, tagline_zh, tagline_en, cta_label, cta_href, portfolio_group, hide_filters, sort")
    .order("sort")
  if (!data) return []
  return (data as any[]).map((c) => ({
    slug: c.slug,
    num: c.num,
    titleEn: c.title_en ?? [],
    taglineZh: c.tagline_zh ?? "",
    taglineEn: c.tagline_en ?? "",
    cta: c.cta_label ? { label: c.cta_label, href: c.cta_href ?? "/contact" } : undefined,
    portfolioGroup: c.portfolio_group ?? "all",
    hideFilters: c.hide_filters ?? false,
  }))
}

export async function getCategoryLanding(slug: string): Promise<CategoryLanding | null> {
  const all = await getCategoryLandings()
  return all.find((c) => c.slug === slug) ?? null
}

/** 報價設計需求單（問卷）：組成前台元件既有的 BriefSection[] 形狀 */
import type { BriefSection, BriefQuestionType } from "@/lib/quote-brief-questions"

export async function getBriefSections(): Promise<BriefSection[]> {
  const supa = createPublicClient()
  const { data } = await supa
    .from("brief_sections")
    .select(
      "id, title, title_en, description, applies_to, sort, brief_questions(qid, label, hint, type, required, options, placeholder, allow_other, sort)"
    )
    .order("sort")
  if (!data) return []
  return (data as any[]).map((s) => ({
    id: s.id,
    title: s.title,
    titleEn: s.title_en ?? "",
    description: s.description ?? undefined,
    appliesTo: s.applies_to ?? undefined,
    questions: (s.brief_questions ?? [])
      .slice()
      .sort((a: any, b: any) => (a.sort ?? 0) - (b.sort ?? 0))
      .map((q: any) => ({
        id: q.qid,
        label: q.label,
        hint: q.hint ?? undefined,
        type: q.type as BriefQuestionType,
        required: q.required ?? undefined,
        options: q.options ?? undefined,
        placeholder: q.placeholder ?? undefined,
        allowOther: q.allow_other ?? undefined,
      })),
  }))
}

/** 導覽選單 / 頁尾連結（location: header | menu | footer） */
export type NavLink = {
  id: string
  location: string
  href: string
  label: string
  label_en: string | null
  sort: number
}

export async function getNavLinks(): Promise<NavLink[]> {
  const supa = createPublicClient()
  const { data } = await supa
    .from("nav_links")
    .select("id, location, href, label, label_en, sort")
    .order("location")
    .order("sort")
  return (data as NavLink[]) ?? []
}

/** 作品分類選項（執行項目 / 行業分類），前台篩選與標籤共用 */
export type Facet = { value: string; label: string }

export async function getCategoryGroups(): Promise<Facet[]> {
  const supa = createPublicClient()
  const { data } = await supa
    .from("category_groups")
    .select("value, label")
    .order("sort")
  return (data as Facet[]) ?? []
}

export async function getIndustries(): Promise<Facet[]> {
  const supa = createPublicClient()
  const { data } = await supa
    .from("industries")
    .select("value, label")
    .order("sort")
  return (data as Facet[]) ?? []
}

export async function getSiteSettings(): Promise<SiteSettings | null> {
  const supa = createPublicClient()
  const { data } = await supa
    .from("site_settings")
    .select("name, description, email, phone, address, instagram, facebook, behance, business_hours, line_url, line_qr_url")
    .eq("id", 1)
    .maybeSingle()
  return (data as SiteSettings) ?? null
}

// ── 即時報價試算（/quote 前台 + /studio/quote 後台共用）──────────────────────
export type QuoteAddon = { id: string; label: string; price: number; sort: number }

// 內容元件：多個方案若同時包含同一元件，重疊部分自動扣抵（不重複計價）
export type QuoteComponent = { id: string; name: string; deductValue: number; sort: number }

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
  componentIds: string[]
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

export type QuotePricing = { categories: QuoteCategory[]; addons: QuoteAddon[]; components: QuoteComponent[] }

/**
 * 前台計算機 + 後台管理共用的報價資料。
 * 回傳巢狀結構（類別 → 方案），show_addons 的方案自動掛上共用加購池。
 */
export async function getQuotePricing(): Promise<QuotePricing> {
  const supa = createPublicClient()
  // 注意：component_ids 欄位與 quote_components 表由 migration 0014 新增。為了讓「migration 尚未
  // 套用」時前台計算機仍能正常運作（不因缺欄位整包查詢失敗），把「重疊扣抵」相關資料獨立成
  // 兩個容錯查詢——查不到就當作沒有此功能（componentIds=[]、components=[]），主查詢絕不受影響。
  const [catsRes, pkgsRes, addonsRes, pkgComponentsRes, componentsRes] = await Promise.all([
    supa.from("quote_categories").select("id, title, title_en, description, icon, sort").order("sort"),
    supa
      .from("quote_packages")
      .select("id, category_id, name, name_en, base_price, original_price, price_note, features, recommended, show_addons, sort")
      .order("sort"),
    supa.from("quote_addons").select("id, label, price, sort").order("sort"),
    supa.from("quote_packages").select("id, component_ids"),
    supa.from("quote_components").select("id, name, deduct_value, sort").order("sort"),
  ])

  const addons: QuoteAddon[] = (addonsRes.data ?? []).map((a) => ({
    id: a.id as string,
    label: a.label as string,
    price: a.price as number,
    sort: a.sort as number,
  }))

  const components: QuoteComponent[] = (componentsRes.data ?? []).map((c) => ({
    id: c.id as string,
    name: c.name as string,
    deductValue: c.deduct_value as number,
    sort: c.sort as number,
  }))

  // 方案 id → 內含元件 id 陣列（migration 未套用時此查詢會失敗 → 空 map → 全部當作 []）
  const componentIdsByPkg = new Map<string, string[]>(
    (pkgComponentsRes.data ?? []).map((r) => [
      r.id as string,
      Array.isArray((r as { component_ids?: unknown }).component_ids)
        ? ((r as { component_ids: unknown[] }).component_ids as string[])
        : [],
    ])
  )

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
        componentIds: componentIdsByPkg.get(p.id) ?? [],
        sort: p.sort,
        addons: p.show_addons ? addons : undefined,
      })),
  }))

  return { categories, addons, components }
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
  facebook: string | null
  website: string | null
  phone: string | null
  address: string | null
  email: string | null
  show_contact: boolean
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
  facebook?: string
  website?: string
  /** 只有 showContact=true 時才帶值（前台據此決定是否公開顯示個人聯絡） */
  phone?: string
  address?: string
  email?: string
  bio?: string[]
  achievements?: string[]
  tags?: string[]
}

export type TeamGroup = { category: string; members: TeamMember[] }

/** 分類大項目（team_categories 登錄表；含 id 供後台編輯，依 sort） */
export type TeamCategory = { id: string; name: string; sort: number }

const TEAM_SELECT =
  "id, slug, name, name_zh, role, category, photo_url, instagram, facebook, website, phone, address, email, show_contact, bio, achievements, tags, has_page, sort"

/** 後台：所有團隊成員（含全部欄位，依 sort） */
export async function getTeamForStudio(): Promise<TeamMemberRow[]> {
  const supa = createPublicClient()
  const { data } = await supa.from("designers").select(TEAM_SELECT).order("sort")
  return (data as TeamMemberRow[]) ?? []
}

/** 分類大項目清單（依 sort）；表不存在時容錯回空陣列 */
export async function getTeamCategories(): Promise<TeamCategory[]> {
  const supa = createPublicClient()
  const { data, error } = await supa
    .from("team_categories")
    .select("id, name, sort")
    .order("sort")
  if (error) return []
  return (data as TeamCategory[]) ?? []
}

/** 前台：依 category 分組。分類順序改讀 team_categories.sort；
 *  沒被登錄到 team_categories 的舊分類，接在後面（沿用成員 sort 出現序）。 */
export async function getTeamGrouped(): Promise<TeamGroup[]> {
  const [rows, cats] = await Promise.all([getTeamForStudio(), getTeamCategories()])
  const order: string[] = []
  const map = new Map<string, TeamMember[]>()
  // 先鋪好已登錄分類的順序（即使暫時沒有成員也保留空位由下方過濾）
  for (const c of cats) if (!map.has(c.name)) map.set(c.name, [])
  for (const r of rows) {
    const cat = r.category || "DESIGNER"
    if (!map.has(cat)) {
      map.set(cat, [])
      order.push(cat) // 未登錄的舊分類，記在後面
    }
    map.get(cat)!.push({
      name: r.name,
      nameZh: r.name_zh ?? undefined,
      role: r.role ?? "",
      image: r.photo_url ?? "",
      instagram: r.instagram ?? undefined,
      facebook: r.facebook ?? undefined,
      website: r.website ?? undefined,
      phone: r.show_contact ? r.phone ?? undefined : undefined,
      address: r.show_contact ? r.address ?? undefined : undefined,
      email: r.show_contact ? r.email ?? undefined : undefined,
      bio: r.bio ?? [],
      achievements: r.achievements ?? [],
      tags: r.tags ?? [],
    })
  }
  // 最終順序：team_categories 的登錄序在前，未登錄分類在後；空分類不輸出
  const finalOrder = [...cats.map((c) => c.name), ...order]
  const seen = new Set<string>()
  return finalOrder
    .filter((c) => (seen.has(c) ? false : (seen.add(c), true)))
    .map((category) => ({ category, members: map.get(category) ?? [] }))
    .filter((g) => g.members.length > 0)
}
