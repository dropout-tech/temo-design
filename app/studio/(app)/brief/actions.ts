"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"

function revalidate() {
  revalidatePath("/contact")
  revalidatePath("/studio/brief")
}

// ── 區塊 ──────────────────────────────────────────────
export type SectionInput = {
  id: string
  title: string
  title_en: string
  description: string
  applies_to: string[] | null
  sort: number
}

export async function saveSection(input: SectionInput): Promise<{ ok?: true; error?: string }> {
  const supabase = await createClient()
  if (!input.title.trim()) return { error: "區塊標題為必填" }
  const row = {
    id: input.id,
    title: input.title.trim(),
    title_en: input.title_en.trim(),
    description: input.description.trim(),
    applies_to: input.applies_to && input.applies_to.length > 0 ? input.applies_to : null,
    sort: input.sort,
  }
  const { error } = await supabase.from("brief_sections").upsert(row, { onConflict: "id" })
  if (error) return { error: error.message }
  revalidate()
  return { ok: true }
}

export async function deleteSection(id: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  // 底下的題目靠 on delete cascade 一併移除
  const { error } = await supabase.from("brief_sections").delete().eq("id", id)
  if (error) return { error: error.message }
  revalidate()
  return {}
}

// ── 題目 ──────────────────────────────────────────────
export type QuestionInput = {
  section_id: string
  qid: string
  label: string
  hint: string
  type: string
  required: boolean
  options: string[]
  placeholder: string
  allow_other: boolean
  sort: number
}

export async function saveQuestion(
  input: QuestionInput,
  id?: string
): Promise<{ id?: string; error?: string }> {
  const supabase = await createClient()
  if (!input.label.trim()) return { error: "題目文字為必填" }
  if (!input.qid.trim()) return { error: "欄位代碼（qid）為必填" }
  const row = {
    section_id: input.section_id,
    qid: input.qid.trim(),
    label: input.label.trim(),
    hint: input.hint.trim() || null,
    type: input.type,
    required: input.required,
    options: input.options,
    placeholder: input.placeholder.trim() || null,
    allow_other: input.allow_other,
    sort: input.sort,
  }
  if (id) {
    const { error } = await supabase.from("brief_questions").update(row).eq("id", id)
    if (error) return { error: error.message }
    revalidate()
    return { id }
  }
  const { data, error } = await supabase.from("brief_questions").insert(row).select("id").single()
  if (error) return { error: error.message }
  revalidate()
  return { id: data.id }
}

export async function deleteQuestion(id: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase.from("brief_questions").delete().eq("id", id)
  if (error) return { error: error.message }
  revalidate()
  return {}
}
