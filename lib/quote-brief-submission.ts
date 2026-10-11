import type { BriefSection } from "./quote-brief-questions"

// Only these answers are carried separately by the contact form. All other
// basic questions must remain in the message, including future custom fields.
const contactFields = new Set(["name", "email", "company", "phone"])

export function buildBriefText(
  serviceLabels: string[],
  sections: BriefSection[],
  answers: Record<string, string | string[]>
) {
  const lines = ["【設計需求 Brief】", `服務範疇：${serviceLabels.join("、")}`, ""]
  for (const section of sections) {
    const filled = section.questions.filter((question) => {
      if (section.id === "basic" && contactFields.has(question.id)) return false
      const value = answers[question.id]
      return Array.isArray(value) ? value.length > 0 : Boolean(value?.trim())
    })
    if (!filled.length) continue
    lines.push(section.id === "basic"
      ? "— 公司與開票資料 COMPANY & BILLING —"
      : `— ${section.title} ${section.titleEn} —`)
    for (const question of filled) {
      const value = answers[question.id]
      lines.push(`${question.label}：${Array.isArray(value) ? value.join("、") : value}`)
    }
    lines.push("")
  }
  return lines.join("\n")
}
