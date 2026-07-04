"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"

export type SettingsInput = {
  name: string
  description: string
  email: string
  phone: string
  address: string
  instagram: string
  facebook: string
  behance: string
}

export async function saveSettings(input: SettingsInput): Promise<{ ok?: true; error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase.from("site_settings").upsert({
    id: 1,
    name: input.name.trim() || null,
    description: input.description.trim() || null,
    email: input.email.trim() || null,
    phone: input.phone.trim() || null,
    address: input.address.trim() || null,
    instagram: input.instagram.trim() || null,
    facebook: input.facebook.trim() || null,
    behance: input.behance.trim() || null,
  })
  if (error) return { error: error.message }
  // footer 遍布全站 → 整站刷新
  revalidatePath("/", "layout")
  return { ok: true }
}
