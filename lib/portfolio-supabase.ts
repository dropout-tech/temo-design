// 前台從 Supabase 讀作品資料，並映射成前台元件既有的型別（Work / DetailProject）。
import "server-only"
import { createPublicClient } from "@/lib/supabase/public"
import type { DetailProject } from "@/components/pages/portfolio-detail-client"
import type { Work, Designer } from "@/lib/portfolio-data"
import { normalizeCoverCrop } from "@/lib/cover-crop"

// ─── 作品內容區塊（Adobe Portfolio 式：圖片/文字/YouTube 影片，可同列雙圖） ─────
// 這是後台表單與前台渲染共用的合約型別，欄位形狀不得隨意更動。
export type WorkBlock = {
  id: string
  type: "image" | "video" | "text"
  src?: string | null
  alt?: string | null
  width?: number | null
  height?: number | null
  src2?: string | null
  alt2?: string | null
  width2?: number | null
  height2?: number | null
  text?: string | null // 對應 DB 欄 text_content
  videoUrl?: string | null // 對應 DB 欄 video_url
  caption?: string | null
  captionMobile?: string | null // 對應 DB 欄 caption_mobile；空值時前台沿用 caption
}

// getWorkDetail 在 DetailProject 之上疊加 hero / blocks（都是選填，向下相容既有呼叫端）。
export type WorkDetailWithBlocks = DetailProject & {
  hero?: string
  blocks?: WorkBlock[]
}

// 注意：hero_url 刻意不放進這個主查詢——migration 0015 套用前 works 表沒有這個欄位，
// 若混進同一個 select 會讓 PostgREST 連整筆查詢一起失敗。hero_url 改用獨立查詢（見下方），
// 查不到就 fallback 到 cover_url，行為與 migration 套用前完全一致。
const DETAIL_SELECT = `
  id, slug, title, subtitle, year, cover_url, video_url, size, description,
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
      `slug, title, subtitle, year, cover_url, cover_zoom, cover_position_x, cover_position_y, video_url, size, description, category_group,
       clients ( slug, name ),
       work_industries ( industry_value ),
       work_designers ( sort, designers ( slug, name, name_zh ) )`
    )
    .eq("published", true)
    .order("sort")

  return (data ?? []).map((w: any, idx: number) => {
    const coverCrop = normalizeCoverCrop({
      zoom: w.cover_zoom,
      positionX: w.cover_position_x,
      positionY: w.cover_position_y,
    })

    return {
      id: idx + 1,
      slug: w.slug,
      title: w.title,
      subtitle: w.subtitle ?? "",
      categoryGroup: w.category_group,
      industries: (w.work_industries ?? []).map((r: any) => r.industry_value),
      year: w.year ?? "",
      clientSlug: w.clients?.slug ?? "",
      clientName: w.clients?.name ?? undefined,
      designerSlugs: (w.work_designers ?? [])
        .sort((a: any, b: any) => (a.sort ?? 0) - (b.sort ?? 0))
        .map((r: any) => r.designers?.slug)
        .filter(Boolean),
      designerNames: (w.work_designers ?? [])
        .sort((a: any, b: any) => (a.sort ?? 0) - (b.sort ?? 0))
        .filter((r: any) => r.designers?.slug)
        .map((r: any) => r.designers?.name_zh || r.designers?.name || r.designers?.slug),
      cover: w.cover_url ?? "/placeholder.jpg",
      coverZoom: coverCrop.zoom,
      coverPositionX: coverCrop.positionX,
      coverPositionY: coverCrop.positionY,
      videoUrl: w.video_url ?? undefined,
      size: w.size ?? "medium",
      description: w.description ?? "",
    }
  }) as Work[]
}

/** 給詳情頁：單一作品完整資料，映射成 DetailProject（+ hero / blocks） */
export async function getWorkDetail(slug: string): Promise<WorkDetailWithBlocks | null> {
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

  const linkedIndustries = (w.work_industries ?? [])
    .map((r: any) => r.industries)
    .filter(Boolean)
    .map((i: any) => ({ value: i.value, label: i.label }))

  // 自訂行業只存顯示名稱；獨立查詢可讓 migration 尚未套用時仍正常讀取舊作品。
  let customIndustryNames: string[] = []
  try {
    const { data: customIndustryRow, error: customIndustryErr } = await supa
      .from("works")
      .select("custom_industry_names")
      .eq("slug", slug)
      .maybeSingle()
    if (!customIndustryErr && Array.isArray((customIndustryRow as any)?.custom_industry_names)) {
      customIndustryNames = (customIndustryRow as any).custom_industry_names
        .map((name: unknown) => String(name).trim())
        .filter(Boolean)
    }
  } catch {
    customIndustryNames = []
  }

  const industries = [
    ...linkedIndustries,
    ...customIndustryNames.map((label) => ({ label })),
  ]

  // 聯絡欄位用獨立查詢，讓前端在 migration 套用前仍能顯示作品，
  // 只是暫時隱藏尚不存在的客戶聯絡資料。
  let clientContact: { address?: string; phone?: string; website?: string } = {}
  if (w.clients?.slug) {
    try {
      const { data: clientRow, error: clientError } = await supa
        .from("clients")
        .select("address, phone, website")
        .eq("slug", w.clients.slug)
        .maybeSingle()
      if (!clientError && clientRow) {
        const contact = clientRow as any
        clientContact = {
          address: contact.address ?? undefined,
          phone: contact.phone ?? undefined,
          website: contact.website ?? undefined,
        }
      }
    } catch {
      clientContact = {}
    }
  }

  const linkedDesigners = (w.work_designers ?? [])
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

  // 單次合作設計師只存顯示名稱；獨立查詢可讓 migration 尚未套用時仍正常讀取舊作品。
  let guestDesignerNames: string[] = []
  try {
    const { data: guestRow, error: guestErr } = await supa
      .from("works")
      .select("guest_designer_names")
      .eq("slug", slug)
      .maybeSingle()
    if (!guestErr && Array.isArray((guestRow as any)?.guest_designer_names)) {
      guestDesignerNames = (guestRow as any).guest_designer_names
        .map((name: unknown) => String(name).trim())
        .filter(Boolean)
    }
  } catch {
    guestDesignerNames = []
  }

  const designers = [
    ...linkedDesigners,
    ...guestDesignerNames.map((name) => ({
      name,
      role: "",
      photo: "",
    })),
  ]

  const gallery = (w.work_gallery ?? [])
    .sort((a: any, b: any) => (a.sort ?? 0) - (b.sort ?? 0))
    .map((g: any) => ({ src: g.src, alt: g.alt ?? undefined, caption: g.caption ?? undefined }))

  // ── hero_url：獨立查詢，欄位不存在（migration 未套用）時安靜 fallback 到 cover ──
  let heroUrl: string | null = null
  try {
    const { data: heroRow, error: heroErr } = await supa
      .from("works")
      .select("hero_url")
      .eq("slug", slug)
      .maybeSingle()
    if (!heroErr) heroUrl = (heroRow as any)?.hero_url ?? null
  } catch {
    heroUrl = null
  }
  const cover = w.cover_url ?? "/placeholder.jpg"
  const hero = heroUrl || cover

  // ── client_logo_url：獨立查詢，欄位不存在（migration 0017 未套用）時安靜回空陣列 ──
  // 多張 LOGO 以換行分隔存於同一 text 欄位（一件作品可能有多位客戶），舊資料單一 URL 即單元素陣列
  let clientLogos: string[] = []
  try {
    const { data: logoRow, error: logoErr } = await supa
      .from("works")
      .select("client_logo_url")
      .eq("slug", slug)
      .maybeSingle()
    if (!logoErr) {
      const raw = (logoRow as any)?.client_logo_url
      if (typeof raw === "string") {
        clientLogos = raw
          .split("\n")
          .map((s: string) => s.trim())
          .filter(Boolean)
      }
    }
  } catch {
    clientLogos = []
  }

  // ── press_mentions：獨立查詢，欄位不存在（migration 0019 未套用）時安靜回空陣列 ──
  let pressMentions: string[] = []
  try {
    const { data: pressRow, error: pressErr } = await supa
      .from("works")
      .select("press_mentions")
      .eq("slug", slug)
      .maybeSingle()
    if (!pressErr) pressMentions = ((pressRow as any)?.press_mentions ?? []) as string[]
  } catch {
    pressMentions = []
  }

  // ── blocks：獨立查詢 work_blocks（migration 未套用/表不存在/查詢失敗/空陣列 → fallback 成 gallery 轉的 image blocks）──
  let blocks: WorkBlock[] = []
  try {
    const { data: blockRows, error: blockErr } = await supa
      .from("work_blocks")
      .select("*")
      .eq("work_id", w.id)
      .order("sort")
    if (!blockErr && Array.isArray(blockRows)) {
      blocks = blockRows.map((b: any) => ({
        id: b.id,
        type: b.type,
        src: b.src ?? null,
        alt: b.alt ?? null,
        width: b.width ?? null,
        height: b.height ?? null,
        src2: b.src2 ?? null,
        alt2: b.alt2 ?? null,
        width2: b.width2 ?? null,
        height2: b.height2 ?? null,
        text: b.text_content ?? null,
        videoUrl: b.video_url ?? null,
        caption: b.caption ?? null,
        captionMobile: b.caption_mobile ?? null,
      }))
    }
  } catch {
    blocks = []
  }
  if (blocks.length === 0 && gallery.length > 0) {
    blocks = gallery.map((g: any, idx: number) => ({
      id: `gallery-${idx}`,
      type: "image" as const,
      src: g.src,
      alt: g.alt ?? null,
      width: null,
      height: null,
      src2: null,
      alt2: null,
      width2: null,
      height2: null,
      text: null,
      videoUrl: null,
      caption: g.caption ?? null,
      captionMobile: null,
    }))
  }

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
    clientAddress: clientContact.address,
    clientPhone: clientContact.phone,
    clientWebsite: clientContact.website,
    clientLogos: clientLogos.length > 0 ? clientLogos : undefined,
    description: w.description ?? "",
    cover,
    hero,
    videoUrl: w.video_url ?? undefined,
    services: w.services ?? [],
    deliverables: w.deliverables ?? [],
    challenge: w.challenge ?? undefined,
    approach: w.approach ?? undefined,
    result: w.result ?? undefined,
    gallery: gallery.length > 0 ? gallery : undefined,
    quote: w.quote_text ? { text: w.quote_text, author: w.quote_author ?? undefined } : undefined,
    awards: w.awards ?? [],
    pressMentions,
    designers,
    related,
    blocks,
  }
}
