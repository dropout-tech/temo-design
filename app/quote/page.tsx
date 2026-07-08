import type { Metadata } from "next"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { QuoteCalculator } from "@/components/quote/quote-calculator"
import { getQuotePricing } from "@/lib/content-supabase"

export const metadata: Metadata = {
  title: "即時報價試算 | TEMO DESIGN 提摩設計",
  description:
    "線上報價試算工具 — 選擇品牌設計、產品設計或工藝設計服務套餐，即時計算參考報價。",
}

export const dynamic = "force-dynamic"

export default async function QuotePage() {
  const { categories } = await getQuotePricing()
  return (
    <>
      <Navbar />
      <main className="pt-20 bg-temo-black min-h-screen">
        <QuoteCalculator categories={categories} />
      </main>
      <Footer />
    </>
  )
}
