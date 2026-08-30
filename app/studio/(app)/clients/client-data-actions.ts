"use server"

import { randomUUID } from "node:crypto"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { normalizeWorkSlug } from "@/lib/work-slug"

export type ClientInput = {
  name: string
  brief: string
  address: string
  phone: string
  website: string
}

export type SavedClient = ClientInput & {
  id: string
  slug: string
}

function normalizedWebsite(raw: string): { value: string | null; error?: string } {
  const value = raw.trim()
  if (!value) return { value: null }

  const candidate = /^https?:\/\//i.test(value) ? value : `https://${value}`
  try {
    const url = new URL(candidate)
    if (!['http:', 'https:'].includes(url.protocol)) {
      return { value: null, error: "官方網站請使用 http 或 https 網址" }
    }
    return { value: url.toString() }
  } catch {
    return { value: null, error: "官方網站格式不正確，請輸入完整網址" }
  }
}

const clientSchema = z.object({
  name: z.string().trim().min(1, "客戶名稱為必填").max(100, "客戶名稱請控制在 100 個字內"),
  brief: z.string().max(500, "客戶簡介請控制在 500 個字內"),
  address: z.string().max(300, "地址請控制在 300 個字內"),
  phone: z.string().max(50, "電話請控制在 50 個字內"),
  website: z.string().max(500, "官方網站請控制在 500 個字內"),
})

export async function saveClientData(
  input: ClientInput,
  id?: string
): Promise<{ client?: SavedClient; error?: string }> {
  const parsed = clientSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "客戶資料格式不正確" }
  const cleanInput = parsed.data

  const website = normalizedWebsite(cleanInput.website)
  if (website.error) return { error: website.error }

  const row = {
    name: cleanInput.name,
    brief: cleanInput.brief.trim() || null,
    address: cleanInput.address.trim() || null,
    phone: cleanInput.phone.trim() || null,
    website: website.value,
  }
  const supabase = await createClient()

  const query = id
    ? supabase.from("clients").update(row).eq("id", id)
    : supabase.from("clients").insert({
        ...row,
        slug: `${normalizeWorkSlug(row.name).slice(0, 60) || "client"}-${randomUUID().slice(0, 8)}`,
      })

  const { data, error } = await query
    .select("id, slug, name, brief, address, phone, website")
    .single()

  if (error) return { error: error.message }

  revalidatePath("/studio/clients")
  revalidatePath("/studio/works")
  revalidatePath("/studio/works/[id]", "page")
  revalidatePath("/portfolio")
  revalidatePath("/portfolio/[slug]", "page")

  return {
    client: {
      id: data.id,
      slug: data.slug,
      name: data.name,
      brief: data.brief ?? "",
      address: data.address ?? "",
      phone: data.phone ?? "",
      website: data.website ?? "",
    },
  }
}
