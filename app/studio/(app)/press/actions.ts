"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"

export type PressLinkInput = {
  title: string
  source: string
  url: string
  image_url: string
  sort: number
}

export async function savePressLink(
  input: PressLinkInput,
  id?: string
): Promise<{ id?: string; error?: string }> {
  const supabase = await createClient()
  if (!input.title.trim()) return { error: "標題為必填" }
  if (!input.url.trim()) return { error: "請填寫文章連結" }
  const row = {
    title: input.title.trim(),
    source: input.source.trim(),
    url: input.url.trim(),
    image_url: input.image_url.trim(),
    sort: input.sort,
  }
  if (id) {
    const { error } = await supabase.from("press_links").update(row).eq("id", id)
    if (error) return { error: error.message }
    revalidatePath("/about")
    return { id }
  }
  const { data, error } = await supabase
    .from("press_links")
    .insert(row)
    .select("id")
    .single()
  if (error) return { error: error.message }
  revalidatePath("/about")
  return { id: data.id }
}

export async function deletePressLink(id: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase.from("press_links").delete().eq("id", id)
  if (error) return { error: error.message }
  revalidatePath("/about")
  return {}
}
