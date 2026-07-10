"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"

function revalidate() {
  revalidatePath("/", "layout")
  revalidatePath("/studio/settings")
}

export type SocialLinkInput = {
  platform: string
  href: string
  visible: boolean
  sort: number
}

export async function saveSocialLink(
  input: SocialLinkInput,
  id?: string
): Promise<{ id?: string; error?: string }> {
  const supabase = await createClient()
  if (!input.platform.trim()) return { error: "平台為必填" }

  const row = {
    platform: input.platform.trim(),
    href: input.href.trim() ? input.href.trim() : null,
    visible: input.visible,
    sort: input.sort,
  }

  if (id) {
    const { error } = await supabase.from("social_links").update(row).eq("id", id)
    if (error) return { error: error.message }
    revalidate()
    return { id }
  }

  const { data, error } = await supabase.from("social_links").insert(row).select("id").single()
  if (error) return { error: error.message }
  revalidate()
  return { id: data.id }
}

export async function deleteSocialLink(id: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase.from("social_links").delete().eq("id", id)
  if (error) return { error: error.message }
  revalidate()
  return {}
}
