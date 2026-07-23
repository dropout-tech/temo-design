"use client"

// 後台「文字」區塊用的富文本編輯器（Quill）。內容以 HTML 字串進出，實際落地前
// server action 會再跑一次 lib/sanitize-rich-text.ts 消毒，這裡只負責編輯體驗。
import dynamic from "next/dynamic"
import "react-quill-new/dist/quill.snow.css"

const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false })

/** Quill 空內容是 `<p><br></p>`；client 端判空用簡單 regex，不依賴 server 專用的 sanitize-html。 */
export function richTextLooksEmpty(html: string): boolean {
  if (!html) return true
  return html.replace(/<[^>]*>/g, "").trim() === ""
}

/** 判斷一段舊資料是不是已經是 HTML（否則視為純文字，交給 plainTextToHtml 轉換）。 */
export function looksLikeHtml(text: string): boolean {
  return /<[a-z][\s\S]*>/i.test(text)
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

/** 舊的純文字段落資料開進編輯器前，先轉成 Quill 認得的 <p> 段落結構。 */
export function plainTextToHtml(text: string): string {
  if (!text) return ""
  return text
    .split("\n\n")
    .map((para) => `<p>${escapeHtml(para).replace(/\n/g, "<br>")}</p>`)
    .join("")
}

const TOOLBAR_MODULES = {
  toolbar: [
    [{ size: ["small", false, "large", "huge"] }],
    ["bold", "italic", "underline", "strike"],
    [{ color: [] }, { background: [] }],
    [{ list: "ordered" }, { list: "bullet" }],
    [{ align: [] }],
    ["link"],
    ["clean"],
  ],
}

export function RichTextEditor({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (html: string) => void
  placeholder?: string
}) {
  return (
    <div className="studio-rte">
      <ReactQuill
        theme="snow"
        value={value}
        // getSemanticHTML() 會丟掉 li 的 data-list 與對齊 class（列表存檔後前台會壞），
        // 改取 Quill 內部 HTML；白名單與前台 CSS 都是照內部格式寫的。
        useSemanticHTML={false}
        onChange={(html) => onChange(richTextLooksEmpty(html) ? "" : html)}
        modules={TOOLBAR_MODULES}
        placeholder={placeholder}
      />
    </div>
  )
}
