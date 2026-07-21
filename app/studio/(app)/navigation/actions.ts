"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"

function revalidate() {
  revalidatePath("/", "layout")
  revalidatePath("/studio/navigation")
}

export type NavLinkInput = {
  location: string
  href: string
  label: string
  label_en: string
  sort: number
}

export async function saveNavLink(
  input: NavLinkInput,
  id?: string
): Promise<{ id?: string; error?: string }> {
  const supabase = await createClient()
  if (!input.label.trim()) return { error: "中文名稱為必填" }
  if (!input.href.trim()) return { error: "連結路徑為必填" }

  const row = {
    location: input.location,
    href: input.href.trim(),
    label: input.label.trim(),
    label_en: input.label_en.trim() ? input.label_en.trim() : null,
    sort: input.sort,
  }

  if (id) {
    const { error } = await supabase.from("nav_links").update(row).eq("id", id)
    if (error) return { error: error.message }
    revalidate()
    return { id }
  }

  const { data, error } = await supabase.from("nav_links").insert(row).select("id").single()
  if (error) return { error: error.message }
  revalidate()
  return { id: data.id }
}

export async function deleteNavLink(id: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase.from("nav_links").delete().eq("id", id)
  if (error) return { error: error.message }
  revalidate()
  return {}
}

/** 拖拉排序後把某一組（header/menu/footer）新順序寫回（依陣列索引重寫 sort） */
export async function reorderNavLinks(ids: string[]): Promise<{ error?: string }> {
  const supabase = await createClient()
  const results = await Promise.all(
    ids.map((id, i) => supabase.from("nav_links").update({ sort: i }).eq("id", id))
  )
  const failed = results.find((r) => r.error)
  if (failed?.error) return { error: failed.error.message }
  revalidate()
  return {}
}
