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
  facebook: string
  line_url: string
  threads_url: string
  website: string
  show_instagram: boolean
  show_facebook: boolean
  show_line: boolean
  show_threads: boolean
  show_website: boolean
  phone: string
  address: string
  email: string
  show_contact: boolean
  bio: string[]
  achievements: string[]
  tags: string[]
  has_page: boolean
  sort: number
}

function cleanPublicUrl(
  value: string,
  label: string,
  options: { httpsOnly?: boolean } = {}
): { value: string | null; error?: string } {
  const clean = value.trim()
  if (!clean) return { value: null }
  if (clean.length > 500) return { value: null, error: `${label}不可超過 500 個字元` }

  try {
    const url = new URL(clean)
    const allowed = options.httpsOnly
      ? url.protocol === "https:"
      : url.protocol === "http:" || url.protocol === "https:"
    if (!allowed) throw new Error("unsupported protocol")
  } catch {
    const prefix = options.httpsOnly ? "https://" : "http:// 或 https://"
    return { value: null, error: `${label}格式錯誤，請貼上以 ${prefix} 開頭的完整網址` }
  }

  return { value: clean }
}

export async function saveDesigner(
  input: DesignerInput,
  id?: string
): Promise<{ id?: string; error?: string }> {
  const supabase = await createClient()
  if (!input.name.trim()) return { error: "英文名（name）為必填" }
  if (!input.category.trim()) return { error: "分類為必填" }

  const instagram = cleanPublicUrl(input.instagram, "Instagram 連結")
  const facebook = cleanPublicUrl(input.facebook, "Facebook 連結")
  const lineUrl = cleanPublicUrl(input.line_url, "LINE 連結", { httpsOnly: true })
  const threadsUrl = cleanPublicUrl(input.threads_url, "Threads 連結")
  const website = cleanPublicUrl(input.website, "個人網站連結")
  const invalidUrl = [instagram, facebook, lineUrl, threadsUrl, website].find(
    (result) => result.error
  )
  if (invalidUrl?.error) return { error: invalidUrl.error }

  const row = {
    slug: input.slug.trim() || null,
    name: input.name.trim(),
    name_zh: input.name_zh.trim() || null,
    role: input.role.trim() || null,
    category: input.category.trim(),
    photo_url: input.photo_url.trim() || null,
    instagram: instagram.value,
    facebook: facebook.value,
    line_url: lineUrl.value,
    threads_url: threadsUrl.value,
    website: website.value,
    show_instagram: input.show_instagram,
    show_facebook: input.show_facebook,
    show_line: input.show_line,
    show_threads: input.show_threads,
    show_website: input.show_website,
    phone: input.phone.trim() || null,
    address: input.address.trim() || null,
    email: input.email.trim() || null,
    show_contact: input.show_contact,
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
    revalidatePath("/team/[slug]", "page")
    return { id }
  }
  const { data, error } = await supabase
    .from("designers")
    .insert(row)
    .select("id")
    .single()
  if (error) return { error: error.message }
  revalidatePath("/about")
  revalidatePath("/team/[slug]", "page")
  return { id: data.id }
}

export async function deleteDesigner(id: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase.from("designers").delete().eq("id", id)
  if (error) return { error: error.message }
  revalidatePath("/about")
  revalidatePath("/team/[slug]", "page")
  return {}
}

/** 拖拉排序後把成員新順序寫回（依陣列索引重寫 sort） */
export async function reorderDesigners(ids: string[]): Promise<{ error?: string }> {
  const supabase = await createClient()
  const results = await Promise.all(
    ids.map((id, i) => supabase.from("designers").update({ sort: i }).eq("id", id))
  )
  const failed = results.find((r) => r.error)
  if (failed?.error) return { error: failed.error.message }
  revalidatePath("/about")
  return {}
}

// ── 分類大項目（team_categories）─────────────────────────────────────────────

/** 新增一個分類大項目（sort 接在最後） */
export async function addTeamCategory(
  name: string
): Promise<{ id?: string; error?: string }> {
  const clean = name.trim()
  if (!clean) return { error: "分類名稱不可空白" }
  const supabase = await createClient()
  const { data: maxRow } = await supabase
    .from("team_categories")
    .select("sort")
    .order("sort", { ascending: false })
    .limit(1)
    .maybeSingle()
  const nextSort = (maxRow?.sort ?? -1) + 1
  const { data, error } = await supabase
    .from("team_categories")
    .insert({ name: clean, sort: nextSort })
    .select("id")
    .single()
  if (error) {
    if (error.code === "23505") return { error: "已經有同名分類了" }
    return { error: error.message }
  }
  revalidatePath("/about")
  return { id: data.id }
}

/** 改分類名稱：同步改 team_categories 與所有屬於舊名的成員 */
export async function renameTeamCategory(
  id: string,
  oldName: string,
  newName: string
): Promise<{ error?: string }> {
  const clean = newName.trim()
  if (!clean) return { error: "分類名稱不可空白" }
  if (clean === oldName) return {}
  const supabase = await createClient()
  const { error: catErr } = await supabase
    .from("team_categories")
    .update({ name: clean })
    .eq("id", id)
  if (catErr) {
    if (catErr.code === "23505") return { error: "已經有同名分類了" }
    return { error: catErr.message }
  }
  // 把舊名的成員一起改到新名（category 是字串鍵）
  const { error: memErr } = await supabase
    .from("designers")
    .update({ category: clean })
    .eq("category", oldName)
  if (memErr) return { error: memErr.message }
  revalidatePath("/about")
  return {}
}

/** 刪除分類：底下還有成員時拒絕，避免成員變孤兒 */
export async function deleteTeamCategory(
  id: string,
  name: string
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { count } = await supabase
    .from("designers")
    .select("id", { count: "exact", head: true })
    .eq("category", name)
  if ((count ?? 0) > 0) {
    return { error: `「${name}」底下還有 ${count} 位成員，請先把他們移到其他分類再刪。` }
  }
  const { error } = await supabase.from("team_categories").delete().eq("id", id)
  if (error) return { error: error.message }
  revalidatePath("/about")
  return {}
}

/** 拖拉排序分類大項目後寫回新順序 */
export async function reorderTeamCategories(ids: string[]): Promise<{ error?: string }> {
  const supabase = await createClient()
  const results = await Promise.all(
    ids.map((id, i) => supabase.from("team_categories").update({ sort: i }).eq("id", id))
  )
  const failed = results.find((r) => r.error)
  if (failed?.error) return { error: failed.error.message }
  revalidatePath("/about")
  return {}
}
