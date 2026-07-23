"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { sanitizeRichText, richTextIsEmpty } from "@/lib/sanitize-rich-text"

export type WorkInput = {
  slug: string
  title: string
  subtitle: string
  category_group: string
  year: string
  client_id: string
  cover_url: string
  /** 內頁首圖，選填，留空＝沿用封面圖 */
  hero_url: string
  video_url: string
  size: "large" | "medium" | "small"
  description: string
  services: string[]
  deliverables: string[]
  challenge: string
  approach: string
  result: string
  quote_text: string
  quote_author: string
  awards: string[]
  published: boolean
  industryValues: string[]
  designerIds: string[]
  blocks: {
    type: "image" | "video" | "text"
    src: string
    alt: string
    width: number | null
    height: number | null
    src2: string
    alt2: string
    width2: number | null
    height2: number | null
    text_content: string
    video_url: string
    caption: string
  }[]
}

function toRow(input: WorkInput) {
  return {
    slug: input.slug.trim(),
    title: input.title.trim(),
    subtitle: input.subtitle.trim() || null,
    category_group: input.category_group || null,
    year: input.year.trim() || null,
    client_id: input.client_id || null,
    cover_url: input.cover_url.trim() || null,
    hero_url: input.hero_url.trim() || null,
    video_url: input.video_url.trim() || null,
    size: input.size,
    description: input.description.trim() || null,
    services: input.services,
    deliverables: input.deliverables,
    challenge: input.challenge.trim() || null,
    approach: input.approach.trim() || null,
    result: input.result.trim() || null,
    quote_text: input.quote_text.trim() || null,
    quote_author: input.quote_author.trim() || null,
    awards: input.awards,
    published: input.published,
  }
}

/** 新增或更新作品（含 行業 / 設計師 關聯）。成功則導回列表，失敗回傳 { error }。 */
export async function saveWork(
  input: WorkInput,
  id?: string
): Promise<{ error: string } | void> {
  const supabase = await createClient()

  if (!input.title.trim() || !input.slug.trim()) {
    return { error: "標題與網址 slug 為必填" }
  }

  const row = toRow(input)
  let workId = id

  if (id) {
    const { error } = await supabase.from("works").update(row).eq("id", id)
    if (error) return { error: error.message }
  } else {
    const { data, error } = await supabase
      .from("works")
      .insert(row)
      .select("id")
      .single()
    if (error) return { error: error.message }
    workId = data.id
  }

  // 重建 行業 關聯
  await supabase.from("work_industries").delete().eq("work_id", workId!)
  if (input.industryValues.length > 0) {
    const { error } = await supabase
      .from("work_industries")
      .insert(input.industryValues.map((v) => ({ work_id: workId!, industry_value: v })))
    if (error) return { error: error.message }
  }

  // 重建 設計師 關聯
  await supabase.from("work_designers").delete().eq("work_id", workId!)
  if (input.designerIds.length > 0) {
    const { error } = await supabase
      .from("work_designers")
      .insert(input.designerIds.map((d, i) => ({ work_id: workId!, designer_id: d, sort: i })))
    if (error) return { error: error.message }
  }

  // 重建 內容區塊（work_blocks，取代 work_gallery 成為作品內容的唯一來源）
  // 注意：migration 0015 尚未套用到 DB 時，work_blocks 表不存在，這裡會回傳錯誤並讓 saveWork 失敗——
  // 這是預期行為（資料層就緒前不假裝存檔成功），不吞掉錯誤。
  await supabase.from("work_blocks").delete().eq("work_id", workId!)
  if (input.blocks.length > 0) {
    const { error } = await supabase.from("work_blocks").insert(
      input.blocks.map((b, i) => {
        const cleanText = b.type === "text" ? sanitizeRichText(b.text_content) : b.text_content.trim()
        return {
          work_id: workId!,
          type: b.type,
          src: b.src.trim() || null,
          alt: b.alt.trim() || null,
          width: b.width,
          height: b.height,
          src2: b.src2.trim() || null,
          alt2: b.alt2.trim() || null,
          width2: b.width2,
          height2: b.height2,
          text_content:
            b.type === "text" ? (richTextIsEmpty(cleanText) ? null : cleanText) : cleanText || null,
          video_url: b.video_url.trim() || null,
          caption: b.caption.trim() || null,
          sort: i,
        }
      })
    )
    if (error) return { error: error.message }
  }

  // 後台與前台一起刷新（前台立即反映，不必等 ISR 60 秒）
  revalidatePath("/studio/works")
  revalidatePath("/portfolio")
  revalidatePath("/portfolio/[slug]", "page")
  redirect("/studio/works")
}

export async function deleteWork(id: string): Promise<{ error: string } | void> {
  const supabase = await createClient()
  const { error } = await supabase.from("works").delete().eq("id", id)
  if (error) return { error: error.message }
  revalidatePath("/studio/works")
  redirect("/studio/works")
}
