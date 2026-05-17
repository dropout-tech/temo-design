import type { Metadata } from "next"
import { FAQPageClient } from "@/components/pages/faq-page-client"

export const metadata: Metadata = {
  title: "常見問題 | TEMO DESIGN",
  description: "查看提摩設計的常見問題解答。了解我們的服務流程、價格預算、合作方式等相關問題。",
}

export default function FAQPage() {
  return <FAQPageClient />
}
