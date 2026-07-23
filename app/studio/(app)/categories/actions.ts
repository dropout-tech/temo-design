"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"

function revalidate() {
  revalidatePath("/portfolio")
  revalidatePath("/studio/categories")
  revalidatePath("/services/[slug]", "page")
}

export type FacetInput = { value: string; label: string; sort: number; landing_slug?: string | null }

// ── 執行項目（category_groups，單選）─────────────────────
export async function saveCategoryGroup(input: FacetInput): Promise<{ ok?: true; error?: string }> {
  const supabase = await createClient()
  if (!input.label.trim()) return { error: "顯示名稱為必填" }
  // landing_slug 沒傳就不寫（upsert 只更新有給的欄位），避免舊呼叫點把歸屬洗掉
  const row: Record<string, unknown> = { value: input.value, label: input.label.trim(), sort: input.sort }
  if (input.landing_slug !== undefined) row.landing_slug = input.landing_slug
  const { error } = await supabase.from("category_groups").upsert(row, { onConflict: "value" })
  if (error) return { error: error.message }
  revalidate()
  return { ok: true }
}

export async function deleteCategoryGroup(value: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase.from("category_groups").delete().eq("value", value)
  if (error) return { error: error.message }
  revalidate()
  return {}
}

/** 拖拉排序後把執行項目新順序寫回（依陣列索引重寫 sort） */
export async function reorderCategoryGroups(values: string[]): Promise<{ error?: string }> {
  const supabase = await createClient()
  const results = await Promise.all(
    values.map((value, i) => supabase.from("category_groups").update({ sort: i }).eq("value", value))
  )
  const failed = results.find((r) => r.error)
  if (failed?.error) return { error: failed.error.message }
  revalidate()
  return {}
}

// ── 行業分類（industries，複選）───────────────────────────
export async function saveIndustry(input: FacetInput): Promise<{ ok?: true; error?: string }> {
  const supabase = await createClient()
  if (!input.label.trim()) return { error: "顯示名稱為必填" }
  const row = { value: input.value, label: input.label.trim(), sort: input.sort }
  const { error } = await supabase.from("industries").upsert(row, { onConflict: "value" })
  if (error) return { error: error.message }
  revalidate()
  return { ok: true }
}

export async function deleteIndustry(value: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase.from("industries").delete().eq("value", value)
  if (error) return { error: error.message }
  revalidate()
  return {}
}

/** 拖拉排序後把行業分類新順序寫回（依陣列索引重寫 sort） */
export async function reorderIndustries(values: string[]): Promise<{ error?: string }> {
  const supabase = await createClient()
  const results = await Promise.all(
    values.map((value, i) => supabase.from("industries").update({ sort: i }).eq("value", value))
  )
  const failed = results.find((r) => r.error)
  if (failed?.error) return { error: failed.error.message }
  revalidate()
  return {}
}
