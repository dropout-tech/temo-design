import type { Metadata } from "next"
import { ContactPageClient } from "@/components/pages/contact-page-client"
import { getSiteSettings } from "@/lib/content-supabase"

export const metadata: Metadata = {
  title: "聯絡我們 | TEMO DESIGN",
  description: "聯繫提摩設計。準備好開始您的設計之旅？讓我們一起創造品牌奇蹟。",
}

export const revalidate = 60

// 營業時間字串（一行一時段，用 | 或 ｜ 分左右欄）→ 結構化 rows
function parseHours(raw?: string | null): { label: string; value: string }[] {
  if (!raw?.trim()) {
    return [
      { label: "週一 — 週五", value: "09:00 – 21:00" },
      { label: "週六 · 週日", value: "休息" },
    ]
  }
  return raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [label, ...rest] = line.split(/\s*[|｜\t]\s*/)
      return { label: label.trim(), value: rest.join(" ").trim() }
    })
}

export default async function ContactPage() {
  const s = await getSiteSettings()
  return (
    <ContactPageClient
      contact={{
        email: s?.email ?? "temo.design0531@gmail.com",
        phone: s?.phone ?? "0913-322-070",
        address: s?.address ?? "台中市西區台灣大道二段229號13樓之2",
        businessHours: parseHours(s?.business_hours),
        lineUrl: s?.line_url ?? "",
        lineQrUrl: s?.line_qr_url ?? "",
      }}
    />
  )
}
