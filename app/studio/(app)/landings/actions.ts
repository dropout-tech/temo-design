"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"

export type LandingInput = {
  slug: string
  num: string
  title_en: string[]
  tagline_zh: string
  tagline_en: string
  cta_label: string
  cta_href: string
  portfolio_group: string
  hide_filters: boolean
  sort: number
}

function nullIfEmpty(s: string): string | null {
  const trimmed = s.trim()
  return trimmed === "" ? null : trimmed
}

function revalidateAll(slug: string) {
  revalidatePath(`/services/${slug}`)
  revalidatePath("/explore")
  revalidatePath("/studio/landings")
  revalidatePath("/studio/categories")
}

export type LandingRecord = {
  slug: string
  num: string | null
  title_en: string[] | null
  tagline_zh: string | null
  tagline_en: string | null
  cta_label: string | null
  cta_href: string | null
  portfolio_group: string | null
  hide_filters: boolean | null
  sort: number | null
}

export type CreateLandingInput = {
  slug: string
  num: string
  title_en: string[]
  tagline_zh: string
  tagline_en: string
}

const SLUG_RE = /^[a-z0-9-]+$/

/** 新增一個服務落地頁大分類；slug 必須唯一、只能小寫英文數字與 -。
 * cta/portfolio_group/hide_filters/sort 不開放在建立表單填，統一給合理預設，
 * 事後可在既有的編輯表單（saveLanding）調整。 */
export async function createLanding(
  input: CreateLandingInput
): Promise<{ ok?: true; error?: string; row?: LandingRecord }> {
  const slug = input.slug.trim().toLowerCase()
  if (!slug) return { error: "網址代碼為必填" }
  if (!SLUG_RE.test(slug)) return { error: "網址代碼只能用小寫英文、數字與 -（例：new-service）" }

  const supabase = await createClient()

  const { data: existing, error: existingError } = await supabase
    .from("category_landings")
    .select("slug")
    .eq("slug", slug)
    .maybeSingle()
  if (existingError) return { error: existingError.message }
  if (existing) return { error: `網址代碼「${slug}」已經存在，換一個試試` }

  const { data: all, error: listError } = await supabase.from("category_landings").select("num, sort")
  if (listError) return { error: listError.message }
  const maxNum = (all ?? []).reduce((m, r) => {
    const n = parseInt(r.num ?? "", 10)
    return Number.isFinite(n) && n > m ? n : m
  }, 0)
  const maxSort = (all ?? []).reduce((m, r) => Math.max(m, r.sort ?? -1), -1)

  const row = {
    slug,
    num: nullIfEmpty(input.num) ?? String(maxNum + 1).padStart(2, "0"),
    title_en: input.title_en,
    tagline_zh: nullIfEmpty(input.tagline_zh),
    tagline_en: nullIfEmpty(input.tagline_en),
    cta_label: "價格試算表單",
    cta_href: "/contact",
    portfolio_group: "all",
    hide_filters: true,
    sort: maxSort + 1,
  }

  const { data: inserted, error } = await supabase
    .from("category_landings")
    .insert(row)
    .select(
      "slug, num, title_en, tagline_zh, tagline_en, cta_label, cta_href, portfolio_group, hide_filters, sort"
    )
    .single()

  if (error) {
    if (error.code === "23505") return { error: `網址代碼「${slug}」已經存在，換一個試試` }
    return { error: error.message }
  }

  revalidateAll(slug)
  return { ok: true, row: inserted as LandingRecord }
}

/** 刪除服務落地頁大分類；先清空掛在它底下的執行項目歸屬，避免留下指向已刪落地頁的孤兒外鍵。 */
export async function deleteLanding(slug: string): Promise<{ ok?: true; error?: string }> {
  const supabase = await createClient()

  const { error: clearError } = await supabase
    .from("category_groups")
    .update({ landing_slug: null })
    .eq("landing_slug", slug)
  if (clearError) return { error: clearError.message }

  const { error } = await supabase.from("category_landings").delete().eq("slug", slug)
  if (error) return { error: error.message }

  revalidateAll(slug)
  revalidatePath("/portfolio")
  return { ok: true }
}

export async function saveLanding(input: LandingInput): Promise<{ ok?: true; error?: string }> {
  const supabase = await createClient()

  const row = {
    num: nullIfEmpty(input.num),
    title_en: input.title_en,
    tagline_zh: nullIfEmpty(input.tagline_zh),
    tagline_en: nullIfEmpty(input.tagline_en),
    cta_label: nullIfEmpty(input.cta_label),
    cta_href: nullIfEmpty(input.cta_href),
    portfolio_group: input.portfolio_group,
    hide_filters: input.hide_filters,
    sort: input.sort,
  }

  const { error } = await supabase.from("category_landings").update(row).eq("slug", input.slug)
  if (error) return { error: error.message }

  revalidatePath(`/services/${input.slug}`)
  revalidatePath("/explore")
  revalidatePath("/studio/landings")

  return { ok: true }
}
