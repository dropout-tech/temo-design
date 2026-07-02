"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

export type WorkInput = {
  slug: string
  title: string
  subtitle: string
  category_group: string
  year: string
  client_id: string
  cover_url: string
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

  revalidatePath("/studio/works")
  redirect("/studio/works")
}

export async function deleteWork(id: string): Promise<{ error: string } | void> {
  const supabase = await createClient()
  const { error } = await supabase.from("works").delete().eq("id", id)
  if (error) return { error: error.message }
  revalidatePath("/studio/works")
  redirect("/studio/works")
}
