import type { Metadata } from "next"
import { ContactPageClient } from "@/components/pages/contact-page-client"

export const metadata: Metadata = {
  title: "聯絡我們 | TEMO DESIGN",
  description: "聯繫提摩設計。準備好開始您的設計之旅？讓我們一起創造品牌奇蹟。",
}

export default function ContactPage() {
  return <ContactPageClient />
}
