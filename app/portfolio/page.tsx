import type { Metadata } from "next"
import { Suspense } from "react"
import { PortfolioPageClient } from "@/components/pages/portfolio-page-client"

export const metadata: Metadata = {
  title: "作品集 | TEMO DESIGN",
  description: "查看提摩設計的完整作品集。超過 200+ 成功案例，涵蓋品牌設計、包裝設計、工藝設計等多個領域。",
}

// demo 階段：不接 CMS，PortfolioPageClient 內部使用 lib/portfolio-data 的假資料。
// 未來接回 Payload 時，把 getAllPortfolio() 的結果對應到新 Work schema，
// 再透過 props 傳入 PortfolioPageClient。
export default function PortfolioPage() {
  // Suspense 包住是因為 PortfolioPageClient 內部用了 useSearchParams（讀 ?group=）
  return (
    <Suspense fallback={null}>
      <PortfolioPageClient />
    </Suspense>
  )
}
