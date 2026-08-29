import { createClient } from "@/lib/supabase/server"
import type { WorkFormInitial } from "@/components/studio/work-form"
import { normalizeCoverCrop } from "@/lib/cover-crop"
import { normalizeCollaboratorNames } from "@/lib/collaborator-names"
import { normalizeCategoryGroupValues } from "@/lib/work-category-groups"

// work_blocks 的原始 DB 欄位形狀（後台表單之後直接讀寫這個形狀即可，不做欄位改名）。
export type WorkBlockRow = {
  id: string
  type: "image" | "video" | "text" | "divider" | "button"
  src?: string | null
  alt?: string | null
  width?: number | null
  height?: number | null
  desktop_height_percent?: number | null
  src2?: string | null
  alt2?: string | null
  width2?: number | null
  height2?: number | null
  desktop_height_percent2?: number | null
  text_content?: string | null
  video_url?: string | null
  caption?: string | null
  caption_mobile?: string | null
  divider_color?: string | null
  divider_width?: number | null
  divider_thickness?: number | null
  button_text?: string | null
  button_url?: string | null
  button_open_new_tab?: boolean | null
  button_width?: number | null
  button_height?: number | null
  button_text_color?: string | null
  button_background_color?: string | null
  button_font_size?: number | null
  button_font_weight?: number | null
  sort?: number | null
}

// getWorkForEdit 在 WorkFormInitial 之上疊加 hero_url / blocks（選填，向下相容既有呼叫端）。
export type WorkForEditWithBlocks = WorkFormInitial & {
  hero_url?: string
  blocks?: WorkBlockRow[]
}

type WorkIndustryRelationRow = { industry_value: string }
type WorkCategoryGroupRelationRow = { category_group_value: string; sort: number | null }
type WorkDesignerRelationRow = { designer_id: string }
type WorkGalleryRow = {
  src: string
  alt: string | null
  caption: string | null
  sort: number | null
}

type WorkEditRow = {
  slug: string | null
  title: string | null
  subtitle: string | null
  category_group: string | null
  year: string | null
  client_id: string | null
  cover_url: string | null
  cover_zoom: number | null
  cover_position_x: number | null
  cover_position_y: number | null
  hero_url: string | null
  client_logo_url: string | null
  video_url: string | null
  size: WorkFormInitial["size"] | null
  description: string | null
  services: string[] | null
  deliverables: string[] | null
  challenge: string | null
  approach: string | null
  result: string | null
  quote_text: string | null
  quote_author: string | null
  awards: string[] | null
  press_mentions: string[] | null
  published: boolean | null
  custom_industry_names: string[] | null
  guest_designer_names: string[] | null
  work_industries: WorkIndustryRelationRow[] | null
  work_designers: WorkDesignerRelationRow[] | null
  work_gallery: WorkGalleryRow[] | null
}

/** 作品表單需要的下拉/多選選項 */
export async function getWorkOptions() {
  const supabase = await createClient()
  const [categories, clients, members, industries, collaboratorWorks] = await Promise.all([
    supabase.from("category_groups").select("value,label").order("sort"),
    supabase.from("clients").select("id,name").order("name"),
    supabase.from("designers").select("id,name,name_zh,category").order("sort"),
    supabase.from("industries").select("value,label").order("sort"),
    supabase.from("works").select("guest_designer_names").order("updated_at", { ascending: false }),
  ])
  // designers.category 自 0006/0016 起是後台自由字串（如「DESIGNER 設計團隊」），
  // 不能再精準比對舊代號；取分類含 DESIGNER 者，全對不到時退回全員以免選單空白。
  const allMembers = members.data ?? []
  const designerMembers = allMembers.filter((m) => /designer/i.test(m.category ?? ""))
  const collaboratorNames = normalizeCollaboratorNames(
    (collaboratorWorks.data ?? []).flatMap((work) =>
      Array.isArray(work.guest_designer_names) ? work.guest_designer_names : []
    )
  )
  return {
    categories: categories.data ?? [],
    clients: clients.data ?? [],
    designers: designerMembers.length > 0 ? designerMembers : allMembers,
    industries: industries.data ?? [],
    collaboratorNames,
  }
}

/** 讀單一作品並攤平成表單初始值（含 行業 / 設計師 關聯 / hero_url / blocks） */
export async function getWorkForEdit(id: string): Promise<WorkForEditWithBlocks | null> {
  const supabase = await createClient()
  // 注意：hero_url 靠 "*" 自然帶出——migration 未套用時該欄位就是不存在，"*" 不會因此報錯
  // （不像明寫欄位名／關聯 join，缺表缺欄會讓整筆查詢失敗）。work_blocks 因此獨立查詢，見下方。
  const { data } = await supabase
    .from("works")
    .select(
      "*, work_industries(industry_value), work_designers(designer_id), work_gallery(src, alt, caption, sort)"
    )
    .eq("id", id)
    .single()
  if (!data) return null
  const w = data as unknown as WorkEditRow
  const coverCrop = normalizeCoverCrop({
    zoom: w.cover_zoom ?? undefined,
    positionX: w.cover_position_x ?? undefined,
    positionY: w.cover_position_y ?? undefined,
  })

  // 新關聯未套用時仍可用舊 category_group 開啟表單；套用後依使用者選取順序回填。
  let categoryGroupValues: string[] = []
  try {
    const { data: categoryRows, error: categoryError } = await supabase
      .from("work_category_groups")
      .select("category_group_value, sort")
      .eq("work_id", id)
      .order("sort")
    if (!categoryError && Array.isArray(categoryRows)) {
      categoryGroupValues = normalizeCategoryGroupValues(
        (categoryRows as WorkCategoryGroupRelationRow[]).map((row) => row.category_group_value)
      )
    }
  } catch {
    categoryGroupValues = []
  }
  if (categoryGroupValues.length === 0) {
    categoryGroupValues = normalizeCategoryGroupValues([w.category_group])
  }

  // ── blocks：獨立查詢 work_blocks（migration 未套用/表不存在/查詢失敗 → 回空陣列，表單走既有 gallery 欄位）──
  let blocks: WorkBlockRow[] = []
  try {
    const { data: blockRows, error: blockErr } = await supabase
      .from("work_blocks")
      .select("*")
      .eq("work_id", id)
      .order("sort")
    if (!blockErr && Array.isArray(blockRows)) {
      blocks = blockRows as WorkBlockRow[]
    }
  } catch {
    blocks = []
  }

  return {
    hero_url: w.hero_url ?? "",
    // 多張 LOGO 換行分隔存於同一欄位，還原成陣列給表單
    client_logo_urls: String(w.client_logo_url ?? "")
      .split("\n")
      .map((s: string) => s.trim())
      .filter(Boolean),
    blocks,
    slug: w.slug ?? "",
    title: w.title ?? "",
    subtitle: w.subtitle ?? "",
    categoryGroupValues,
    year: w.year ?? "",
    client_id: w.client_id ?? "",
    cover_url: w.cover_url ?? "",
    cover_zoom: coverCrop.zoom,
    cover_position_x: coverCrop.positionX,
    cover_position_y: coverCrop.positionY,
    video_url: w.video_url ?? "",
    size: w.size ?? "medium",
    description: w.description ?? "",
    services: (w.services ?? []).join("\n"),
    deliverables: (w.deliverables ?? []).join("\n"),
    challenge: w.challenge ?? "",
    approach: w.approach ?? "",
    result: w.result ?? "",
    quote_text: w.quote_text ?? "",
    quote_author: w.quote_author ?? "",
    awards: (w.awards ?? []).join("\n"),
    press: (w.press_mentions ?? []).join("\n"),
    published: w.published ?? true,
    industryValues: (w.work_industries ?? []).map((r) => r.industry_value),
    customIndustryNames: Array.isArray(w.custom_industry_names)
      ? w.custom_industry_names
          .map((name: unknown) => String(name).trim())
          .filter(Boolean)
      : [],
    designerIds: (w.work_designers ?? []).map((r) => r.designer_id),
    guestDesignerNames: Array.isArray(w.guest_designer_names)
      ? w.guest_designer_names
          .map((name: unknown) => String(name).trim())
          .filter(Boolean)
      : [],
    gallery: (w.work_gallery ?? [])
      .sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0))
      .map((g) => ({ src: g.src, alt: g.alt ?? undefined, caption: g.caption ?? undefined })),
  }
}
