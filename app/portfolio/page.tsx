import type { Metadata } from "next"
import { Suspense } from "react"
import { PortfolioPageClient } from "@/components/pages/portfolio-page-client"
import { getAllWorks } from "@/lib/portfolio-supabase"

export const metadata: Metadata = {
  title: "作品集 | TEMO DESIGN",
  description: "查看提摩設計的完整作品集。超過 200+ 成功案例，涵蓋品牌設計、包裝設計、工藝設計等多個領域。",
}

// 從 Supabase 撈已發布作品，傳入 client 元件；ISR 每 60 秒更新一次。
export const revalidate = 60

export default async function PortfolioPage() {
  const works = await getAllWorks()
  // Suspense 包住是因為 PortfolioPageClient 內部用了 useSearchParams（讀 ?group=）
  return (
    <Suspense fallback={null}>
      <PortfolioPageClient works={works} />
    </Suspense>
  )
}
