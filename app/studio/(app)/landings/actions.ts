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
