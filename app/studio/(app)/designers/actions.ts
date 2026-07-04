"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"

export type DesignerInput = {
  slug: string
  name: string
  name_zh: string
  role: string
  category: string
  photo_url: string
  instagram: string
  bio: string[]
  achievements: string[]
  tags: string[]
  has_page: boolean
  sort: number
}

export async function saveDesigner(
  input: DesignerInput,
  id?: string
): Promise<{ id?: string; error?: string }> {
  const supabase = await createClient()
  if (!input.name.trim()) return { error: "英文名（name）為必填" }
  if (!input.category.trim()) return { error: "分類為必填" }
  const row = {
    slug: input.slug.trim() || null,
    name: input.name.trim(),
    name_zh: input.name_zh.trim() || null,
    role: input.role.trim() || null,
    category: input.category.trim(),
    photo_url: input.photo_url.trim() || null,
    instagram: input.instagram.trim() || null,
    bio: input.bio.map((s) => s.trim()).filter(Boolean),
    achievements: input.achievements.map((s) => s.trim()).filter(Boolean),
    tags: input.tags.map((s) => s.trim()).filter(Boolean),
    has_page: input.has_page,
    sort: input.sort,
  }
  if (id) {
    const { error } = await supabase.from("designers").update(row).eq("id", id)
    if (error) return { error: error.message }
    revalidatePath("/about")
    return { id }
  }
  const { data, error } = await supabase
    .from("designers")
    .insert(row)
    .select("id")
    .single()
  if (error) return { error: error.message }
  revalidatePath("/about")
  return { id: data.id }
}

export async function deleteDesigner(id: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase.from("designers").delete().eq("id", id)
  if (error) return { error: error.message }
  revalidatePath("/about")
  return {}
}
