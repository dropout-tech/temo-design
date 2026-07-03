import { createClient } from "@/lib/supabase/server"
import type { WorkFormInitial } from "@/components/studio/work-form"

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

/** 讀單一作品並攤平成表單初始值（含 行業 / 設計師 關聯） */
export async function getWorkForEdit(id: string): Promise<WorkFormInitial | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("works")
    .select(
      "*, work_industries(industry_value), work_designers(designer_id), work_gallery(src, alt, caption, sort)"
    )
    .eq("id", id)
    .single()
  if (!data) return null
  const w = data as Record<string, any>
  return {
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
