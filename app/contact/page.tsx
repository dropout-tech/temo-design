import type { Metadata } from "next"
import { ContactPageClient } from "@/components/pages/contact-page-client"
import { getSiteSettings } from "@/lib/content-supabase"

export const metadata: Metadata = {
  title: "聯絡我們 | TEMO DESIGN",
  description: "聯繫提摩設計。準備好開始您的設計之旅？讓我們一起創造品牌奇蹟。",
}

export const revalidate = 60

export default async function ContactPage() {
  const s = await getSiteSettings()
  return (
    <ContactPageClient
      contact={{
        email: s?.email ?? "temo.design0531@gmail.com",
        phone: s?.phone ?? "0913-322-070",
        address: s?.address ?? "台中市西區台灣大道二段229號13樓之2",
      }}
    />
  )
}
