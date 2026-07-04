"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"

export type AwardLogoInput = {
  name: string
  image_url: string
  sort: number
}

export async function saveAwardLogo(
  input: AwardLogoInput,
  id?: string
): Promise<{ id?: string; error?: string }> {
  const supabase = await createClient()
  if (!input.name.trim()) return { error: "獎項名稱為必填" }
  if (!input.image_url.trim()) return { error: "請先上傳 Logo 圖片" }
  const row = {
    name: input.name.trim(),
    image_url: input.image_url.trim(),
    sort: input.sort,
  }
  if (id) {
    const { error } = await supabase.from("award_logos").update(row).eq("id", id)
    if (error) return { error: error.message }
    revalidatePath("/about")
    return { id }
  }
  const { data, error } = await supabase
    .from("award_logos")
    .insert(row)
    .select("id")
    .single()
  if (error) return { error: error.message }
  revalidatePath("/about")
  return { id: data.id }
}

export async function deleteAwardLogo(id: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase.from("award_logos").delete().eq("id", id)
  if (error) return { error: error.message }
  revalidatePath("/about")
  return {}
}
