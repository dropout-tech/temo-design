import type { BriefQuestionType } from "@/lib/quote-brief-questions"

export type BriefQuestionDbRow = {
  id?: string
  section_id?: string
  qid: string
  label: string
  hint: string | null
  type: BriefQuestionType
  required: boolean | null
  options: string[] | null
  placeholder: string | null
  allow_other: boolean | null
  sort: number | null
}

export type BriefSectionDbRow = {
  id: string
  title: string
  title_en: string | null
  description: string | null
  applies_to: ("brand" | "product" | "crafts")[] | null
  sort: number
  brief_questions: BriefQuestionDbRow[] | null
}
