"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"

function revalidate() {
  revalidatePath("/quote")
  revalidatePath("/studio/quote")
}

// ── 類別 ──────────────────────────────────────────────
export type CategoryInput = {
  title: string
  titleEn: string
  description: string
  icon: string
  sort: number
}

export async function saveCategory(
  input: CategoryInput,
  id?: string
): Promise<{ id?: string; error?: string }> {
  const supabase = await createClient()
  if (!input.title.trim()) return { error: "類別名稱為必填" }
  const row = {
    title: input.title.trim(),
    title_en: input.titleEn.trim(),
    description: input.description.trim(),
    icon: input.icon.trim(),
    sort: input.sort,
  }
  if (id) {
    const { error } = await supabase.from("quote_categories").update(row).eq("id", id)
    if (error) return { error: error.message }
    revalidate()
    return { id }
  }
  const { data, error } = await supabase.from("quote_categories").insert(row).select("id").single()
  if (error) return { error: error.message }
  revalidate()
  return { id: data.id }
}

export async function deleteCategory(id: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  // 底下的方案靠 on delete cascade 一併移除
  const { error } = await supabase.from("quote_categories").delete().eq("id", id)
  if (error) return { error: error.message }
  revalidate()
  return {}
}

// ── 方案 ──────────────────────────────────────────────
export type PackageInput = {
  categoryId: string
  name: string
  nameEn: string
  basePrice: number
  originalPrice: number | null
  priceNote: string
  features: string[]
  recommended: boolean
  showAddons: boolean
  componentIds: string[]
  sort: number
}

export async function savePackage(
  input: PackageInput,
  id?: string
): Promise<{ id?: string; error?: string }> {
  const supabase = await createClient()
  if (!input.categoryId) return { error: "方案必須歸屬於一個類別" }
  if (!input.name.trim()) return { error: "方案名稱為必填" }
  const row = {
    category_id: input.categoryId,
    name: input.name.trim(),
    name_en: input.nameEn.trim(),
    base_price: Number.isFinite(input.basePrice) ? input.basePrice : 0,
    original_price:
      input.originalPrice != null && Number.isFinite(input.originalPrice)
        ? input.originalPrice
        : null,
    price_note: input.priceNote.trim() || null,
    features: input.features.map((f) => f.trim()).filter(Boolean),
    recommended: input.recommended,
    show_addons: input.showAddons,
    component_ids: Array.isArray(input.componentIds) ? input.componentIds : [],
    sort: input.sort,
  }
  if (id) {
    const { error } = await supabase.from("quote_packages").update(row).eq("id", id)
    if (error) return { error: error.message }
    revalidate()
    return { id }
  }
  const { data, error } = await supabase.from("quote_packages").insert(row).select("id").single()
  if (error) return { error: error.message }
  revalidate()
  return { id: data.id }
}

export async function deletePackage(id: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase.from("quote_packages").delete().eq("id", id)
  if (error) return { error: error.message }
  revalidate()
  return {}
}

// ── 加購項 ────────────────────────────────────────────
export type AddonInput = { label: string; price: number; sort: number }

export async function saveAddon(
  input: AddonInput,
  id?: string
): Promise<{ id?: string; error?: string }> {
  const supabase = await createClient()
  if (!input.label.trim()) return { error: "加購項名稱為必填" }
  const row = {
    label: input.label.trim(),
    price: Number.isFinite(input.price) ? input.price : 0,
    sort: input.sort,
  }
  if (id) {
    const { error } = await supabase.from("quote_addons").update(row).eq("id", id)
    if (error) return { error: error.message }
    revalidate()
    return { id }
  }
  const { data, error } = await supabase.from("quote_addons").insert(row).select("id").single()
  if (error) return { error: error.message }
  revalidate()
  return { id: data.id }
}

export async function deleteAddon(id: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase.from("quote_addons").delete().eq("id", id)
  if (error) return { error: error.message }
  revalidate()
  return {}
}

// ── 內容元件（重疊自動扣抵）─────────────────────────────
export type ComponentInput = { name: string; deductValue: number; sort: number }

export async function saveComponent(
  input: ComponentInput,
  id?: string
): Promise<{ id?: string; error?: string }> {
  const supabase = await createClient()
  if (!input.name.trim()) return { error: "元件名稱為必填" }
  const row = {
    name: input.name.trim(),
    deduct_value: Number.isFinite(input.deductValue) ? Math.max(0, input.deductValue) : 0,
    sort: input.sort,
  }
  if (id) {
    const { error } = await supabase.from("quote_components").update(row).eq("id", id)
    if (error) return { error: error.message }
    revalidate()
    return { id }
  }
  const { data, error } = await supabase.from("quote_components").insert(row).select("id").single()
  if (error) return { error: error.message }
  revalidate()
  return { id: data.id }
}

export async function deleteComponent(id: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase.from("quote_components").delete().eq("id", id)
  if (error) return { error: error.message }
  revalidate()
  return {}
}
