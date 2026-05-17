import type { Metadata } from "next"
import { AboutPageClient } from "@/components/pages/about-page-client"

export const metadata: Metadata = {
  title: "關於我們 | TEMO DESIGN",
  description: "認識提摩設計工作室。以人為本的品牌設計理念，服務超過 200+ 品牌，幫助企業在競爭激烈的市場中建立穩固品牌基礎。",
}

export default function AboutPage() {
  return <AboutPageClient />
}
