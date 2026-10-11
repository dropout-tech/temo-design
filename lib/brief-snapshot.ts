import { z } from "zod"

export const BRIEF_PREFIX = "TEMO_BRIEF_V1\n"
export const briefSnapshotSchema = z.object({
  version: z.literal(1),
  services: z.array(z.string().max(100)).min(1).max(10),
  sections: z.array(z.object({
    id: z.string().max(100),
    title: z.string().max(200),
    rows: z.array(z.object({
      id: z.string().max(100),
      question: z.string().min(1).max(500),
      answer: z.union([z.string().max(10_000), z.array(z.string().max(1000)).max(100)]),
    })).max(100),
  })).max(30),
})
export type BriefSnapshot = z.infer<typeof briefSnapshotSchema>

export function readBriefSnapshot(message: string): BriefSnapshot | null {
  if (!message.startsWith(BRIEF_PREFIX)) return null
  try {
    const result = briefSnapshotSchema.safeParse(JSON.parse(message.slice(BRIEF_PREFIX.length)))
    return result.success ? result.data : null
  } catch { return null }
}

export function briefPlainText(snapshot: BriefSnapshot) {
  return ["【設計需求 Brief】", `服務範疇：${snapshot.services.join("、")}`, "",
    ...snapshot.sections.flatMap((section) => [
      `— ${section.title} —`,
      ...section.rows.map((row) => `${row.question}：${Array.isArray(row.answer) ? row.answer.join("、") : row.answer}`), "",
    ]),
  ].join("\n")
}

export function submissionPlainText(message: string) {
  const snapshot = readBriefSnapshot(message)
  return snapshot ? briefPlainText(snapshot) : message
}

export function validSubmissionMessage(message: string) {
  if (!message.startsWith(BRIEF_PREFIX)) return message.length <= 10_000
  const snapshot = readBriefSnapshot(message)
  return snapshot !== null && briefPlainText(snapshot).length <= 10_000
}
