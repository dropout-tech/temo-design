"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"

export type TestimonialInput = {
  text: string
  author: string
  company: string
  rating: number
  sort: number
}

export async function saveTestimonial(
  input: TestimonialInput,
  id?: string
): Promise<{ id?: string; error?: string }> {
  const supabase = await createClient()
  if (!input.text.trim() || !input.author.trim()) {
    return { error: "見證內容與姓名為必填" }
  }
  const row = {
    text: input.text.trim(),
    author: input.author.trim(),
    company: input.company.trim() || null,
    rating: Math.min(5, Math.max(1, input.rating || 5)),
    sort: input.sort,
  }
  if (id) {
    const { error } = await supabase.from("testimonials").update(row).eq("id", id)
    if (error) return { error: error.message }
    revalidatePath("/")
    return { id }
  }
  const { data, error } = await supabase.from("testimonials").insert(row).select("id").single()
  if (error) return { error: error.message }
  revalidatePath("/")
  return { id: data.id }
}

export async function deleteTestimonial(id: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase.from("testimonials").delete().eq("id", id)
  if (error) return { error: error.message }
  revalidatePath("/")
  return {}
}
