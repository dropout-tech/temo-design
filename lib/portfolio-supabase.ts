// 前台從 Supabase 讀作品資料，並映射成前台元件既有的型別（Work / DetailProject）。
import "server-only"
import { createPublicClient } from "@/lib/supabase/public"
import type { DetailProject } from "@/components/pages/portfolio-detail-client"
import type { Work, Designer } from "@/lib/portfolio-data"
import { normalizeCoverCrop } from "@/lib/cover-crop"
import { normalizeCategoryGroupValues } from "@/lib/work-category-groups"

// ─── 作品內容區塊（Adobe Portfolio 式：圖片/文字/YouTube 影片，可同列雙圖） ─────
// 這是後台表單與前台渲染共用的合約型別，欄位形狀不得隨意更動。
export type WorkBlock = {
  id: string
  type: "image" | "video" | "text" | "divider" | "button"
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
  dividerColor?: string | null
  dividerWidth?: number | null
  dividerThickness?: number | null
  buttonText?: string | null
  buttonUrl?: string | null
  buttonOpenNewTab?: boolean | null
  buttonWidth?: number | null
  buttonHeight?: number | null
  buttonTextColor?: string | null
  buttonBackgroundColor?: string | null
  buttonFontSize?: number | null
  buttonFontWeight?: number | null
}

// getWorkDetail 在 DetailProject 之上疊加 hero / blocks（都是選填，向下相容既有呼叫端）。
export type WorkDetailWithBlocks = DetailProject & {
  hero?: string
  blocks?: WorkBlock[]
}

type SlugRow = { slug: string }

type DesignerDbRow = {
  slug: string | null
  name: string
  name_zh: string | null
  role: string | null
  photo_url: string | null
  instagram?: string | null
  bio?: string[] | null
}

type ClientDbRow = {
  slug: string
  name: string
  brief?: string | null
}

type IndustryDbRow = { value: string; label: string }
type WorkIndustryDbRow = {
  industry_value?: Work["industries"][number]
  industries?: IndustryDbRow | null
}
type WorkDesignerDbRow = { sort: number | null; designers: DesignerDbRow | null }
type WorkCategoryGroupDbRow = {
  work_id?: string
  category_group_value: string
  sort: number | null
  category_groups?: { value: string; label: string } | null
}
type WorkGalleryDbRow = {
  src: string
  alt: string | null
  caption: string | null
  sort: number | null
}

type WorkListDbRow = {
  id: string
  slug: string
  title: string
  subtitle: string | null
  year: string | null
  cover_url: string | null
  cover_zoom: number | null
  cover_position_x: number | null
  cover_position_y: number | null
  video_url: string | null
  size: Work["size"] | null
  description: string | null
  category_group: Work["categoryGroup"]
  clients: Pick<ClientDbRow, "slug" | "name"> | null
  work_industries: WorkIndustryDbRow[] | null
  work_designers: WorkDesignerDbRow[] | null
}

type WorkDetailDbRow = {
  id: string
  slug: string
  title: string
  subtitle: string | null
  year: string | null
  cover_url: string | null
  video_url: string | null
  description: string | null
  services: string[] | null
  deliverables: string[] | null
  challenge: string | null
  approach: string | null
  result: string | null
  quote_text: string | null
  quote_author: string | null
  awards: string[] | null
  category_group: string | null
  category_groups: { value: string; label: string } | null
  clients: ClientDbRow | null
  work_industries: WorkIndustryDbRow[] | null
  work_designers: WorkDesignerDbRow[] | null
  work_gallery: WorkGalleryDbRow[] | null
}

type RelatedWorkDbRow = {
  id: string
  slug: string
  title: string
  subtitle: string | null
  cover_url: string | null
  year: string | null
  category_group: string | null
  category_groups: { label: string } | null
}

function getRelatedGroupValues(
  row: RelatedWorkDbRow,
  groupsByWork: Map<string, { value: string; label: string }[]>
): string[] {
  const linked = groupsByWork.get(row.id)?.map((group) => group.value) ?? []
  return normalizeCategoryGroupValues(linked.length > 0 ? linked : [row.category_group])
}

type ClientContactDbRow = {
  address: string | null
  phone: string | null
  website: string | null
}

type WorkBlockDbRow = {
  id: string
  type: WorkBlock["type"]
  src: string | null
  alt: string | null
  width: number | null
  height: number | null
  src2: string | null
  alt2: string | null
  width2: number | null
  height2: number | null
  text_content: string | null
  video_url: string | null
  caption: string | null
  caption_mobile: string | null
  divider_color: string | null
  divider_width: number | null
  divider_thickness: number | null
  button_text: string | null
  button_url: string | null
  button_open_new_tab: boolean | null
  button_width: number | null
  button_height: number | null
  button_text_color: string | null
  button_background_color: string | null
  button_font_size: number | null
  button_font_weight: number | null
}

// 注意：hero_url 刻意不放進這個主查詢——migration 0015 套用前 works 表沒有這個欄位，
// 若混進同一個 select 會讓 PostgREST 連整筆查詢一起失敗。hero_url 改用獨立查詢（見下方），
// 查不到就 fallback 到 cover_url，行為與 migration 套用前完全一致。
const DETAIL_SELECT = `
  id, slug, title, subtitle, year, cover_url, video_url, size, description,
  services, deliverables, challenge, approach, result, quote_text, quote_author, awards,
  category_group,
  category_groups:category_groups!works_category_group_fkey ( value, label ),
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
  return ((data ?? []) as unknown as SlugRow[]).map((row) => row.slug)
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
  return ((data ?? []) as unknown as SlugRow[]).map((row) => row.slug)
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
  const d = data as unknown as DesignerDbRow
  return {
    slug: d.slug ?? slug,
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
      `id, slug, title, subtitle, year, cover_url, cover_zoom, cover_position_x, cover_position_y, video_url, size, description, category_group,
       clients ( slug, name ),
       work_industries ( industry_value ),
       work_designers ( sort, designers ( slug, name, name_zh ) )`
    )
    .eq("published", true)
    .order("sort")

  const rows = (data ?? []) as unknown as WorkListDbRow[]
  const linkedGroups = new Map<string, string[]>()
  if (rows.length > 0) {
    try {
      const { data: groupRows, error: groupError } = await supa
        .from("work_category_groups")
        .select("work_id, category_group_value, sort")
        .in("work_id", rows.map((row) => row.id))
        .order("sort")
      if (!groupError && Array.isArray(groupRows)) {
        for (const relation of groupRows as unknown as WorkCategoryGroupDbRow[]) {
          if (!relation.work_id) continue
          linkedGroups.set(relation.work_id, [
            ...(linkedGroups.get(relation.work_id) ?? []),
            relation.category_group_value,
          ])
        }
      }
    } catch {
      // migration 尚未套用時，由下方既有 category_group 欄位接手。
    }
  }

  return rows.map((w, idx) => {
    const coverCrop = normalizeCoverCrop({
      zoom: w.cover_zoom ?? undefined,
      positionX: w.cover_position_x ?? undefined,
      positionY: w.cover_position_y ?? undefined,
    })

    const linkedCategoryGroups = linkedGroups.get(w.id) ?? []
    const categoryGroups = normalizeCategoryGroupValues(
      linkedCategoryGroups.length > 0 ? linkedCategoryGroups : [w.category_group]
    )

    return {
      id: idx + 1,
      slug: w.slug,
      title: w.title,
      subtitle: w.subtitle ?? "",
      categoryGroup: (categoryGroups[0] ?? "") as Work["categoryGroup"],
      categoryGroups,
      industries: (w.work_industries ?? [])
        .map((relation) => relation.industry_value)
        .filter((value): value is Work["industries"][number] => Boolean(value)),
      year: w.year ?? "",
      clientSlug: w.clients?.slug ?? "",
      clientName: w.clients?.name ?? undefined,
      designerSlugs: (w.work_designers ?? [])
        .sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0))
        .map((relation) => relation.designers?.slug)
        .filter((value): value is string => Boolean(value)),
      designerNames: (w.work_designers ?? [])
        .sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0))
        .filter((relation) => relation.designers?.slug)
        .map((relation) => relation.designers?.name_zh || relation.designers?.name || relation.designers?.slug || ""),
      designerEnglishNames: (w.work_designers ?? [])
        .sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0))
        .filter((relation) => relation.designers?.slug)
        .map((relation) => relation.designers?.name || relation.designers?.slug || ""),
      cover: w.cover_url ?? "/placeholder.jpg",
      coverZoom: coverCrop.zoom,
      coverPositionX: coverCrop.positionX,
      coverPositionY: coverCrop.positionY,
      videoUrl: w.video_url ?? undefined,
      size: w.size ?? "medium",
      description: w.description ?? "",
    }
  })
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
  const w = data as unknown as WorkDetailDbRow

  let categoryGroups: { value: string; label: string }[] = []
  try {
    const { data: groupRows, error: groupError } = await supa
      .from("work_category_groups")
      .select("category_group_value, sort, category_groups ( value, label )")
      .eq("work_id", w.id)
      .order("sort")
    if (!groupError && Array.isArray(groupRows)) {
      categoryGroups = (groupRows as unknown as WorkCategoryGroupDbRow[])
        .map((relation) => relation.category_groups)
        .filter((group): group is { value: string; label: string } => Boolean(group))
    }
  } catch {
    categoryGroups = []
  }
  if (categoryGroups.length === 0 && w.category_group && w.category_groups) {
    categoryGroups = [w.category_groups]
  }

  // 相關作品：與目前作品命中任一執行項目者優先，其次補其他。
  const { data: relData } = await supa
    .from("works")
    .select("id, slug, title, subtitle, cover_url, year, category_group, category_groups:category_groups!works_category_group_fkey ( label )")
    .eq("published", true)
    .neq("slug", slug)
    .order("sort")

  const relatedRows = (relData ?? []) as unknown as RelatedWorkDbRow[]
  const relatedGroups = new Map<string, { value: string; label: string }[]>()
  if (relatedRows.length > 0) {
    try {
      const { data: groupRows, error: groupError } = await supa
        .from("work_category_groups")
        .select("work_id, category_group_value, sort, category_groups ( value, label )")
        .in("work_id", relatedRows.map((row) => row.id))
        .order("sort")
      if (!groupError && Array.isArray(groupRows)) {
        for (const relation of groupRows as unknown as WorkCategoryGroupDbRow[]) {
          if (!relation.work_id || !relation.category_groups) continue
          relatedGroups.set(relation.work_id, [
            ...(relatedGroups.get(relation.work_id) ?? []),
            relation.category_groups,
          ])
        }
      }
    } catch {
      // 舊資料庫由 category_group / category_groups 關聯退回。
    }
  }

  const currentGroupValues = new Set(categoryGroups.map((group) => group.value))
  const related = relatedRows
    .sort(
      (a, b) =>
        (getRelatedGroupValues(a, relatedGroups).some((value) => currentGroupValues.has(value)) ? 0 : 1) -
        (getRelatedGroupValues(b, relatedGroups).some((value) => currentGroupValues.has(value)) ? 0 : 1)
    )
    .slice(0, 3)
    .map((r) => ({
      slug: r.slug,
      title: r.title,
      subtitle: r.subtitle ?? "",
      cover: r.cover_url ?? "/placeholder.jpg",
      categoryLabel:
        relatedGroups.get(r.id)?.map((group) => group.label).join("、") ||
        r.category_groups?.label ||
        "",
      year: r.year ?? "",
    }))

  const linkedIndustries = (w.work_industries ?? [])
    .map((relation) => relation.industries)
    .filter((industry): industry is IndustryDbRow => Boolean(industry))
    .map((industry) => ({ value: industry.value, label: industry.label }))

  // 自訂行業只存顯示名稱；獨立查詢可讓 migration 尚未套用時仍正常讀取舊作品。
  let customIndustryNames: string[] = []
  try {
    const { data: customIndustryRow, error: customIndustryErr } = await supa
      .from("works")
      .select("custom_industry_names")
      .eq("slug", slug)
      .maybeSingle()
    const customNames = (customIndustryRow as unknown as { custom_industry_names?: unknown })?.custom_industry_names
    if (!customIndustryErr && Array.isArray(customNames)) {
      customIndustryNames = customNames
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
        const contact = clientRow as unknown as ClientContactDbRow
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
    .sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0))
    .map((relation) => relation.designers)
    .filter((designer): designer is DesignerDbRow => Boolean(designer))
    .map((d) => ({
      slug: d.slug ?? "",
      name: d.name,
      nameZh: d.name_zh ?? undefined,
      role: d.role ?? "",
      photo: d.photo_url ?? "",
    }))

  // 臨時合作夥伴只存顯示名稱；獨立查詢可讓 migration 尚未套用時仍正常讀取舊作品。
  let collaboratorNames: string[] = []
  try {
    const { data: guestRow, error: guestErr } = await supa
      .from("works")
      .select("guest_designer_names")
      .eq("slug", slug)
      .maybeSingle()
    const guestNames = (guestRow as unknown as { guest_designer_names?: unknown })?.guest_designer_names
    if (!guestErr && Array.isArray(guestNames)) {
      collaboratorNames = guestNames
        .map((name: unknown) => String(name).trim())
        .filter(Boolean)
    }
  } catch {
    collaboratorNames = []
  }

  const gallery = (w.work_gallery ?? [])
    .sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0))
    .map((g) => ({ src: g.src, alt: g.alt ?? undefined, caption: g.caption ?? undefined }))

  // ── hero_url：獨立查詢，欄位不存在（migration 未套用）時安靜 fallback 到 cover ──
  let heroUrl: string | null = null
  try {
    const { data: heroRow, error: heroErr } = await supa
      .from("works")
      .select("hero_url")
      .eq("slug", slug)
      .maybeSingle()
    if (!heroErr) heroUrl = (heroRow as unknown as { hero_url?: string | null })?.hero_url ?? null
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
      const raw = (logoRow as unknown as { client_logo_url?: unknown })?.client_logo_url
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
    const mentions = (pressRow as unknown as { press_mentions?: unknown })?.press_mentions
    if (!pressErr && Array.isArray(mentions)) {
      pressMentions = mentions.map((mention) => String(mention))
    }
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
      blocks = (blockRows as unknown as WorkBlockDbRow[]).map((b) => ({
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
        dividerColor: b.divider_color ?? null,
        dividerWidth: b.divider_width ?? null,
        dividerThickness: b.divider_thickness ?? null,
        buttonText: b.button_text ?? null,
        buttonUrl: b.button_url ?? null,
        buttonOpenNewTab: b.button_open_new_tab ?? null,
        buttonWidth: b.button_width ?? null,
        buttonHeight: b.button_height ?? null,
        buttonTextColor: b.button_text_color ?? null,
        buttonBackgroundColor: b.button_background_color ?? null,
        buttonFontSize: b.button_font_size ?? null,
        buttonFontWeight: b.button_font_weight ?? null,
      }))
    }
  } catch {
    blocks = []
  }
  if (blocks.length === 0 && gallery.length > 0) {
    blocks = gallery.map((g, idx) => ({
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
    categoryLabel: categoryGroups.map((group) => group.label).join("、"),
    categoryGroup: categoryGroups[0]?.value ?? w.category_group ?? undefined,
    categoryGroups,
    industryLabels: industries.map((industry) => industry.label),
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
    designers: linkedDesigners,
    collaborators: collaboratorNames,
    related,
    blocks,
  }
}
