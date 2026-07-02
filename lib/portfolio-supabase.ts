// 前台從 Supabase 讀作品資料，並映射成前台元件既有的型別（Work / DetailProject）。
import "server-only"
import { createPublicClient } from "@/lib/supabase/public"
import type { DetailProject } from "@/components/pages/portfolio-detail-client"
import type { Work, Designer } from "@/lib/portfolio-data"

const DETAIL_SELECT = `
  slug, title, subtitle, year, cover_url, video_url, size, description,
  services, deliverables, challenge, approach, result, quote_text, quote_author, awards,
  category_group,
  category_groups ( value, label ),
  clients ( slug, name, brief ),
  work_industries ( industries ( value, label ) ),
  work_designers ( sort, designers ( slug, name, name_zh, role, photo_url ) ),
  work_gallery ( src, alt, caption, sort )
`

export async function getPublishedWorkSlugs(): Promise<string[]> {
  const supa = createPublicClient()
  const { data } = await supa
    .from("works")
    .select("slug")
    .eq("published", true)
    .order("sort")
  return (data ?? []).map((r: any) => r.slug as string)
}

// ── 團隊 / 設計師 ──────────────────────────────────────────────────────────
/** 有獨立頁的設計師 slug（給 /team/[slug] 的 generateStaticParams） */
export async function getDesignerSlugs(): Promise<string[]> {
  const supa = createPublicClient()
  const { data } = await supa
    .from("designers")
    .select("slug")
    .eq("has_page", true)
    .not("slug", "is", null)
    .order("sort")
  return (data ?? []).map((r: any) => r.slug as string)
}

/** 單一設計師，映射成前台 Designer 形狀（expertise 目前留空，前台會自動隱藏該區） */
export async function getDesignerBySlug(slug: string): Promise<Designer | null> {
  const supa = createPublicClient()
  const { data } = await supa
    .from("designers")
    .select("slug, name, name_zh, role, photo_url, instagram, bio")
    .eq("slug", slug)
    .maybeSingle()
  if (!data) return null
  const d: any = data
  return {
    slug: d.slug,
    name: d.name,
    nameZh: d.name_zh ?? undefined,
    role: d.role ?? "",
    photo: d.photo_url ?? "",
    instagram: d.instagram ?? undefined,
    bio: d.bio ?? [],
    expertise: [],
  }
}

/** 某設計師參與的作品（透過 work_designers 關聯；未指派前為空） */
export async function getWorksByDesignerSlug(slug: string): Promise<Work[]> {
  const all = await getAllWorks()
  return all.filter((w) => w.designerSlugs.includes(slug))
}

/** 給列表頁：所有已發布作品，映射成前台的 Work 形狀 */
export async function getAllWorks(): Promise<Work[]> {
  const supa = createPublicClient()
  const { data } = await supa
    .from("works")
    .select(
      `slug, title, subtitle, year, cover_url, video_url, size, description, category_group,
       clients ( slug ),
       work_industries ( industry_value ),
       work_designers ( sort, designers ( slug ) )`
    )
    .eq("published", true)
    .order("sort")

  return (data ?? []).map((w: any, idx: number) => ({
    id: idx + 1,
    slug: w.slug,
    title: w.title,
    subtitle: w.subtitle ?? "",
    categoryGroup: w.category_group,
    industries: (w.work_industries ?? []).map((r: any) => r.industry_value),
    year: w.year ?? "",
    clientSlug: w.clients?.slug ?? "",
    designerSlugs: (w.work_designers ?? [])
      .sort((a: any, b: any) => (a.sort ?? 0) - (b.sort ?? 0))
      .map((r: any) => r.designers?.slug)
      .filter(Boolean),
    cover: w.cover_url ?? "/placeholder.jpg",
    videoUrl: w.video_url ?? undefined,
    size: w.size ?? "medium",
    description: w.description ?? "",
  })) as Work[]
}

/** 給詳情頁：單一作品完整資料，映射成 DetailProject */
export async function getWorkDetail(slug: string): Promise<DetailProject | null> {
  const supa = createPublicClient()
  const { data, error } = await supa
    .from("works")
    .select(DETAIL_SELECT)
    .eq("slug", slug)
    .eq("published", true)
    .maybeSingle()
  if (error || !data) return null
  const w: any = data

  // 相關作品：同執行項目優先，其次補其他
  const { data: relData } = await supa
    .from("works")
    .select("slug, title, subtitle, cover_url, year, category_group, category_groups ( label )")
    .eq("published", true)
    .neq("slug", slug)
    .order("sort")
  const related = (relData ?? [])
    .sort(
      (a: any, b: any) =>
        (a.category_group === w.category_group ? 0 : 1) -
        (b.category_group === w.category_group ? 0 : 1)
    )
    .slice(0, 3)
    .map((r: any) => ({
      slug: r.slug,
      title: r.title,
      subtitle: r.subtitle ?? "",
      cover: r.cover_url ?? "/placeholder.jpg",
      categoryLabel: r.category_groups?.label ?? "",
      year: r.year ?? "",
    }))

  const industries = (w.work_industries ?? [])
    .map((r: any) => r.industries)
    .filter(Boolean)
    .map((i: any) => ({ value: i.value, label: i.label }))

  const designers = (w.work_designers ?? [])
    .sort((a: any, b: any) => (a.sort ?? 0) - (b.sort ?? 0))
    .map((r: any) => r.designers)
    .filter(Boolean)
    .map((d: any) => ({
      slug: d.slug ?? "",
      name: d.name,
      nameZh: d.name_zh ?? undefined,
      role: d.role ?? "",
      photo: d.photo_url ?? "",
    }))

  const gallery = (w.work_gallery ?? [])
    .sort((a: any, b: any) => (a.sort ?? 0) - (b.sort ?? 0))
    .map((g: any) => ({ src: g.src, alt: g.alt ?? undefined, caption: g.caption ?? undefined }))

  return {
    slug: w.slug,
    title: w.title,
    subtitle: w.subtitle ?? "",
    categoryLabel: w.category_groups?.label ?? "",
    categoryGroup: w.category_group ?? undefined,
    industryLabels: industries.map((i: any) => i.label),
    industries,
    year: w.year ?? "",
    clientName: w.clients?.name ?? undefined,
    clientSlug: w.clients?.slug ?? undefined,
    clientBrief: w.clients?.brief ?? undefined,
    description: w.description ?? "",
    cover: w.cover_url ?? "/placeholder.jpg",
    videoUrl: w.video_url ?? undefined,
    services: w.services ?? [],
    deliverables: w.deliverables ?? [],
    challenge: w.challenge ?? undefined,
    approach: w.approach ?? undefined,
    result: w.result ?? undefined,
    gallery: gallery.length > 0 ? gallery : undefined,
    quote: w.quote_text ? { text: w.quote_text, author: w.quote_author ?? undefined } : undefined,
    awards: w.awards ?? [],
    designers,
    related,
  }
}
