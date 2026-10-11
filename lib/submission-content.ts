import { briefSections } from "./quote-brief-questions"

export type SubmissionContentSection = {
  title: string
  rows: { question: string | null; answer: string }[]
}

// Legacy submissions store a flat string. Match known question labels, rather
// than every colon: answer lines such as “1.庫存管理：缺藥預警” are not questions.
const questionLabels = briefSections.flatMap((section) =>
  section.questions.map((question) => question.label)
).sort((a, b) => b.length - a.length)

export function parseSubmissionContent(message: string): SubmissionContentSection[] | null {
  const lines = message.replace(/\r\n?/g, "\n").split("\n")
  if (lines[0]?.trim() !== "【設計需求 Brief】") return null

  const sections: SubmissionContentSection[] = []
  let section: SubmissionContentSection = { title: "需求摘要", rows: [] }
  sections.push(section)

  for (const line of lines.slice(1)) {
    const heading = line.match(/^— (.+) —$/)
    if (heading) {
      section = { title: heading[1], rows: [] }
      sections.push(section)
      continue
    }

    const label = ["服務範疇", ...questionLabels].find((label) => line.startsWith(`${label}：`))
    if (label) {
      section.rows.push({ question: label, answer: line.slice(label.length + 1) })
    } else {
      const previous = section.rows.at(-1)
      if (previous) previous.answer += `\n${line}`
      else if (line.trim()) section.rows.push({ question: null, answer: line })
    }
  }

  return sections.filter((section) => section.rows.length > 0)
}
