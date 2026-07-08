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
