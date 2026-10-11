import { BRIEF_PREFIX, type BriefSnapshot } from "./brief-snapshot"
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

// Capture the labels and section ordering at submission time, so later edits
// to the questionnaire cannot reinterpret a customer's answers.
export function buildBriefSnapshot(serviceLabels: string[], sections: BriefSection[], answers: Record<string, string | string[]>) {
  const snapshot: BriefSnapshot = {
    version: 1,
    services: serviceLabels,
    sections: sections.map((section) => ({
      id: section.id,
      title: section.id === "basic" ? "公司與開票資料" : `${section.title} ${section.titleEn}`.trim(),
      rows: section.questions.filter((question) => !(section.id === "basic" && contactFields.has(question.id))).map((question) => ({
        id: question.id, question: question.label, answer: answers[question.id] ?? "",
      })),
    })),
  }
  return BRIEF_PREFIX + JSON.stringify(snapshot)
}
