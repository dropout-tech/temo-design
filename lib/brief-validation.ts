import { z } from "zod"
import type { BriefQuestion } from "./quote-brief-questions"

export function briefAnswerError(question: BriefQuestion, value: string | string[] | undefined) {
  const filled = Array.isArray(value) ? value.length > 0 : Boolean(value?.trim())
  if (!filled) return question.required ? "請填寫此題" : ""
  if (question.type === "checkbox") {
    return Array.isArray(value) && value.every((answer) => answer.length <= 1000) ? "" : "每個選項請勿超過 1,000 字"
  }
  if (typeof value !== "string") return "請確認填寫格式"
  if (question.type === "email" && !z.string().email().safeParse(value.trim()).success) return "請填寫有效的 Email，例如 name@example.com"
  const limit = ({ name: 100, email: 254, company: 150, phone: 50 } as Record<string, number>)[question.id] ?? 10_000
  return value.trim().length > limit ? `此欄位最多 ${limit.toLocaleString()} 字` : ""
}
