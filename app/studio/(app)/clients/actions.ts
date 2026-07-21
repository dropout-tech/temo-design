"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"

export type ClientLogoInput = {
  name: string
  image_url: string
  sort: number
}

export async function saveClientLogo(
  input: ClientLogoInput,
  id?: string
): Promise<{ id?: string; error?: string }> {
  const supabase = await createClient()
  if (!input.name.trim()) return { error: "客戶名稱為必填" }
  if (!input.image_url.trim()) return { error: "請先上傳 Logo 圖片" }
  const row = {
    name: input.name.trim(),
    image_url: input.image_url.trim(),
    sort: input.sort,
  }
  if (id) {
    const { error } = await supabase.from("client_logos").update(row).eq("id", id)
    if (error) return { error: error.message }
    revalidatePath("/about")
    return { id }
  }
  const { data, error } = await supabase
    .from("client_logos")
    .insert(row)
    .select("id")
    .single()
  if (error) return { error: error.message }
  revalidatePath("/about")
  return { id: data.id }
}

export async function deleteClientLogo(id: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase.from("client_logos").delete().eq("id", id)
  if (error) return { error: error.message }
  revalidatePath("/about")
  return {}
}

/** 拖拉排序後把新順序寫回（依陣列索引重寫 sort） */
export async function reorderClientLogos(ids: string[]): Promise<{ error?: string }> {
  const supabase = await createClient()
  const results = await Promise.all(
    ids.map((id, i) => supabase.from("client_logos").update({ sort: i }).eq("id", id))
  )
  const failed = results.find((r) => r.error)
  if (failed?.error) return { error: failed.error.message }
  revalidatePath("/about")
  return {}
}
