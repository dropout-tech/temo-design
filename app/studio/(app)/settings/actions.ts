"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import {
  isPortfolioFilterLanguage,
  type PortfolioFilterLanguage,
} from "@/lib/portfolio-filter-language"

export type SettingsInput = {
  name: string
  description: string
  email: string
  phone: string
  address: string
  business_hours: string
  line_url: string
  line_qr_url: string
  portfolio_filter_language: PortfolioFilterLanguage
}

export async function saveSettings(input: SettingsInput): Promise<{ ok?: true; error?: string }> {
  if (!isPortfolioFilterLanguage(input.portfolio_filter_language)) {
    return { error: "作品篩選顯示語言無效，請重新選擇。" }
  }

  const supabase = await createClient()
  const { error } = await supabase.from("site_settings").upsert({
    id: 1,
    name: input.name.trim() || null,
    description: input.description.trim() || null,
    email: input.email.trim() || null,
    phone: input.phone.trim() || null,
    address: input.address.trim() || null,
    business_hours: input.business_hours.trim() || null,
    line_url: input.line_url.trim() || null,
    line_qr_url: input.line_qr_url.trim() || null,
    portfolio_filter_language: input.portfolio_filter_language,
  })
  if (error) return { error: error.message }
  // footer 遍布全站 → 整站刷新
  revalidatePath("/", "layout")
  return { ok: true }
}
