"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"

export type FaqInput = {
  question: string
  answer: string
  category: string
  sort: number
}

export async function saveFaq(
  input: FaqInput,
  id?: string
): Promise<{ id?: string; error?: string }> {
  const supabase = await createClient()
  if (!input.question.trim() || !input.answer.trim()) {
    return { error: "問題與答案為必填" }
  }
  const row = {
    question: input.question.trim(),
    answer: input.answer.trim(),
    category: input.category.trim() || null,
    sort: input.sort,
  }
  if (id) {
    const { error } = await supabase.from("faqs").update(row).eq("id", id)
    if (error) return { error: error.message }
    revalidatePath("/faq")
    return { id }
  }
  const { data, error } = await supabase.from("faqs").insert(row).select("id").single()
  if (error) return { error: error.message }
  revalidatePath("/faq")
  return { id: data.id }
}

export async function deleteFaq(id: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase.from("faqs").delete().eq("id", id)
  if (error) return { error: error.message }
  revalidatePath("/faq")
  return {}
}

/** 拖拉排序後把新順序寫回（依陣列索引重寫 sort） */
export async function reorderFaqs(ids: string[]): Promise<{ error?: string }> {
  const supabase = await createClient()
  const results = await Promise.all(
    ids.map((id, i) => supabase.from("faqs").update({ sort: i }).eq("id", id))
  )
  const failed = results.find((r) => r.error)
  if (failed?.error) return { error: failed.error.message }
  revalidatePath("/faq")
  return {}
}
