import { createClient } from "@/lib/supabase/server"
import type { WorkFormInitial } from "@/components/studio/work-form"

// work_blocks 的原始 DB 欄位形狀（後台表單之後直接讀寫這個形狀即可，不做欄位改名）。
export type WorkBlockRow = {
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
  text_content?: string | null
  video_url?: string | null
  caption?: string | null
  sort?: number | null
}

// getWorkForEdit 在 WorkFormInitial 之上疊加 hero_url / blocks（選填，向下相容既有呼叫端）。
export type WorkForEditWithBlocks = WorkFormInitial & {
  hero_url?: string
  blocks?: WorkBlockRow[]
}

/** 作品表單需要的下拉/多選選項 */
export async function getWorkOptions() {
  const supabase = await createClient()
  const [categories, clients, designers, industries] = await Promise.all([
    supabase.from("category_groups").select("value,label").order("sort"),
    supabase.from("clients").select("id,name").order("name"),
    supabase
      .from("designers")
      .select("id,name,name_zh")
      .eq("category", "DESIGNER")
      .order("sort"),
    supabase.from("industries").select("value,label").order("sort"),
  ])
  return {
    categories: categories.data ?? [],
    clients: clients.data ?? [],
    designers: designers.data ?? [],
    industries: industries.data ?? [],
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
  const w = data as Record<string, any>

  // ── blocks：獨立查詢 work_blocks（migration 未套用/表不存在/查詢失敗 → 回空陣列，表單走既有 gallery 欄位）──
  let blocks: WorkBlockRow[] = []
  try {
    const { data: blockRows, error: blockErr } = await supabase
      .from("work_blocks")
      .select(
        "id, type, src, alt, width, height, src2, alt2, width2, height2, text_content, video_url, caption, sort"
      )
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
    blocks,
    slug: w.slug ?? "",
    title: w.title ?? "",
    subtitle: w.subtitle ?? "",
    category_group: w.category_group ?? "",
    year: w.year ?? "",
    client_id: w.client_id ?? "",
    cover_url: w.cover_url ?? "",
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
    published: w.published ?? true,
    industryValues: (w.work_industries ?? []).map((r: any) => r.industry_value),
    designerIds: (w.work_designers ?? []).map((r: any) => r.designer_id),
    gallery: (w.work_gallery ?? [])
      .sort((a: any, b: any) => (a.sort ?? 0) - (b.sort ?? 0))
      .map((g: any) => ({ src: g.src, alt: g.alt ?? undefined, caption: g.caption ?? undefined })),
  }
}
