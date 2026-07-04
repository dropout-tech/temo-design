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

export type Testimonial = {
  id: string
  text: string
  author: string
  company: string | null
  rating: number
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

export async function getTestimonials(): Promise<Testimonial[]> {
  const supa = createPublicClient()
  const { data } = await supa
    .from("testimonials")
    .select("id, text, author, company, rating, sort")
    .order("sort")
  return (data as Testimonial[]) ?? []
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
