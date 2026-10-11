import { submissionPlainText, validSubmissionMessage } from "./brief-snapshot"
import { parseSubmissionContent } from "./submission-content"
import { z } from "zod"

export const CONTACT_SUBJECT_LABELS = {
  brand: "品牌識別設計",
  graphic: "平面 / 包裝設計",
  product: "產品設計",
  crafts: "工藝設計",
  other: "其他諮詢",
} as const

export type ContactSubject = keyof typeof CONTACT_SUBJECT_LABELS

export const contactSubmissionSchema = z.object({
  requestId: z.string().uuid(),
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(254),
  company: z.string().trim().max(150).optional().default(""),
  phone: z.string().trim().max(50).optional().default(""),
  subject: z.enum(["brand", "graphic", "product", "crafts", "other"]),
  message: z.string().trim().min(1).max(60_000).refine(validSubmissionMessage, "內容總長度不可超過 10,000 字"),
  // Hidden honeypot. Legitimate visitors never fill this field.
  website: z.string().max(500).optional().default(""),
})

export type ContactSubmissionInput = z.infer<typeof contactSubmissionSchema>

export function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;")
}

export function buildContactEmail(input: ContactSubmissionInput) {
  const serviceLabel = CONTACT_SUBJECT_LABELS[input.subject]
  const company = input.company || "未填寫"
  const phone = input.phone || "未填寫"
  const subject = `[TEMO 官網表單] ${serviceLabel}｜${input.name}`
  const text = [
    "TEMO 官網收到新的聯絡表單",
    "",
    `姓名：${input.name}`,
    `Email：${input.email}`,
    `公司：${company}`,
    `電話：${phone}`,
    `服務項目：${serviceLabel}`,
    "",
    "訊息內容：",
    submissionPlainText(input.message),
  ].join("\n")

  const rows = [
    ["姓名", input.name],
    ["Email", input.email],
    ["公司", company],
    ["電話", phone],
    ["服務項目", serviceLabel],
  ]
    .map(
      ([label, value]) =>
        `<tr><th style="padding:8px 12px;text-align:left;vertical-align:top;color:#777;font-weight:500;border-bottom:1px solid #eee">${escapeHtml(label)}</th><td style="padding:8px 12px;color:#222;border-bottom:1px solid #eee">${escapeHtml(value)}</td></tr>`
    )
    .join("")

  const sections = parseSubmissionContent(input.message)
  const contentHtml = sections?.length ? sections.map((section) => `
    <h2 style="font-size:17px;margin:28px 0 12px;color:#71552e">${escapeHtml(section.title)}</h2>
    <table style="width:100%;table-layout:fixed;border-collapse:collapse">${section.rows.map((row) => `
      <tr><th scope="row" style="width:30%;padding:14px;text-align:left;vertical-align:top;background:#f7f5f1;border:1px solid #e4dfd5;font-size:13px;font-weight:500;overflow-wrap:anywhere">${escapeHtml(row.question ?? "補充內容")}</th>
      <td style="padding:14px;vertical-align:top;border:1px solid #e4dfd5;white-space:pre-wrap;line-height:1.8;overflow-wrap:anywhere">${escapeHtml(row.answer.trim() || "未填寫")}</td></tr>`).join("")}</table>`).join("")
    : `<div style="padding:16px;background:#f7f5f1;white-space:pre-wrap;line-height:1.7;overflow-wrap:anywhere">${escapeHtml(input.message)}</div>`

  const html = `
    <div style="font-family:Arial,'Noto Sans TC',sans-serif;max-width:680px;margin:0 auto;color:#222">
      <h1 style="font-size:22px;margin:0 0 20px">TEMO 官網收到新的聯絡表單</h1>
      <table style="width:100%;border-collapse:collapse;margin-bottom:24px">${rows}</table>
      <h2 style="font-size:16px;margin:0 0 10px">訊息內容</h2>
      ${contentHtml}
      <p style="margin-top:20px;color:#777;font-size:12px">直接回覆此封信，即可回覆給 ${escapeHtml(input.email)}。</p>
    </div>
  `.trim()

  // Apps Script accepts at most 60,000 HTML characters. Very large/custom
  // questionnaires still deliver in full using a compact text-safe fallback.
  const compactHtml = `<div style="font-family:Arial,sans-serif;white-space:pre-wrap;line-height:1.8">${text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")}</div>`
  return { subject, text, html: html.length <= 60_000 ? html : compactHtml }
}
