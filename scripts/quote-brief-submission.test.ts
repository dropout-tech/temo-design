import assert from "node:assert/strict"
import { briefSections, type BriefSection } from "../lib/quote-brief-questions"
import { buildBriefText } from "../lib/quote-brief-submission"
import { buildContactEmail, contactSubmissionSchema } from "../lib/contact-submission"
import { parseSubmissionContent } from "../lib/submission-content"

const answers = {
  name: "測試窗口", email: "test@example.com", company: "測試公司", phone: "0900000000",
  address: "測試市測試路 123 號 2 樓", taxId: "TEST IDENTIFIER", invoice: "否",
  services: "1.品牌設計：識別規劃\n2.包裝設計：印刷協助",
}
const message = buildBriefText(["品牌設計"], briefSections, answers)
// Exercise the same URL prefill, request validation, and notification builders.
const params = new URLSearchParams({ message })
const input = contactSubmissionSchema.parse({
  ...answers, requestId: "00000000-0000-4000-8000-000000000001",
  subject: "brand", message: new URLSearchParams(params.toString()).get("message"),
})
const rows = parseSubmissionContent(input.message)!.flatMap((section) => section.rows)
for (const [question, answer] of [
  ["公司地址", answers.address], ["公司統編", answers.taxId],
  ["是否需要開立發票？", "否"], ["品牌的主要服務或商品內容", answers.services],
]) {
  assert.equal(rows.find((row) => row.question === question)?.answer.trim(), answer)
  assert.ok(buildContactEmail(input).text.includes(answer))
  assert.ok(buildContactEmail(input).html.includes(answer))
}
assert.ok(!message.includes("電子郵件："))
assert.ok(!message.includes("undefined"))
const custom: BriefSection[] = [{ id: "basic", title: "基本資料", titleEn: "BASIC INFO", questions: [
  { id: "custom", label: "其他合約資訊", type: "text" },
] }]
assert.ok(buildBriefText([], custom, { custom: "另附合約" }).includes("其他合約資訊：另附合約"))
assert.ok(buildBriefText([], briefSections, { invoice: "是（報價 +5% 稅金）" }).includes("是否需要開立發票？：是（報價 +5% 稅金）"))
console.log("Brief submission: billing fields survive prefill, validation, display parsing and email; custom basic answers retained.")
