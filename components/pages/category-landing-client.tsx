"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowUpRight, ArrowLeft } from "lucide-react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { cn } from "@/lib/utils"
import {
  PortfolioGrid,
  SearchBox,
  INITIAL_FILTERS,
  type FilterState,
} from "@/components/pages/portfolio-page-client"
import { WORKS as DEMO_WORKS, type Work } from "@/lib/portfolio-data"
import type { CategoryLanding } from "@/lib/category-landing-data"

// ─── Hero ─────────────────────────────────────────────────────────────────────

function LandingHero({ landing }: { landing: CategoryLanding }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80)
    return () => clearTimeout(t)
  }, [])

  return (
    <section className="relative pt-24 md:pt-32 pb-12 md:pb-16 overflow-hidden">
      {/* 中性純灰遮罩（R=G=B，不帶暖色）：把岩石背景壓成中灰，黑色粗標題與灰字都清楚 */}
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-[#6e6e6e]/90 via-[#606060]/90 to-[#545454]/92" />

      <div
        className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"
        style={{
          transition: "opacity 0.9s ease, transform 0.9s ease",
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(24px)",
        }}
      >
        {/* 返回 explore 的麵包屑 */}
        <Link
          href="/explore"
          className="inline-flex items-center gap-2 text-[10px] tracking-[0.3em] text-white/40 hover:text-white transition-colors uppercase mb-10"
        >
          <ArrowLeft className="w-3 h-3" />
          Today
          <span className="text-white/20 mx-1">/</span>
          <span className="text-temo-gold/70">{landing.num}</span>
        </Link>

        {/* 兩欄：左大標 / 右描述 + 按鈕 */}
        <div className="grid md:grid-cols-[1.1fr_1fr] gap-10 md:gap-16 items-start">
          {/* 左：大標 */}
          <h1 className="text-[clamp(2.5rem,12vw,3.75rem)] md:text-8xl lg:text-9xl font-black text-temo-black leading-[0.95] tracking-tight break-words">
            {landing.titleEn.map((line, i) => {
              const isAmpersand = line.trim() === "&"
              return (
                <span
                  key={i}
                  className={cn(
                    "block",
                    isAmpersand && "text-4xl md:text-6xl my-1 md:my-2"
                  )}
                >
                  {line}
                </span>
              )
            })}
          </h1>

          {/* 右：中英描述 + CTA */}
          <div className="md:pt-16 lg:pt-24">
            <p className="text-white/70 text-base md:text-lg leading-relaxed mb-5 whitespace-pre-line">
              {landing.taglineZh}
            </p>
            <p className="text-[11px] md:text-xs tracking-[0.22em] text-white/40 uppercase leading-relaxed whitespace-pre-line">
              {landing.taglineEn}
            </p>

            {landing.cta && (
              <Link
                href={landing.cta.href}
                className="mt-8 inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-temo-warm-gray hover:bg-temo-cool-gray border border-temo-warm-gray hover:border-temo-cool-gray text-temo-black hover:text-white text-sm font-medium tracking-wider transition-all"
              >
                {landing.cta.label}
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function CategoryLandingClient({
  landing,
  works,
  categoryGroups,
  allowedGroups,
}: {
  landing: CategoryLanding
  works?: Work[]
  // 歸屬本落地頁的執行項目（篩選下拉只列自家分類）；未傳＝fallback 全部
  categoryGroups?: { value: string; label: string }[]
  // 本落地頁只顯示這些執行項目的作品；未傳＝不限制（migration 未套用時的照舊行為）
  allowedGroups?: string[]
}) {
  const [filters, setFilters] = useState<FilterState>({
    ...INITIAL_FILTERS,
    group: landing.portfolioGroup,
  })

  return (
    <>
      <Navbar showSearch />
      {/* 整頁固定背景：改用首頁同一支影片，鋪滿視窗、隨捲動保持不動；Hero 與作品列表都疊在它上面 */}
      {/* 想換回岩石靜圖：把這段 <video> 換回 <img src="/images/category-landing-bg.jpg" .../> 即可（檔案仍保留） */}
      <div className="fixed inset-0 -z-10 pointer-events-none bg-temo-black">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover"
        >
          <source
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/freepik_-_kling_720p_16-9_24fps_57860-mPIC49MLEKEyvjV5OZbCDTi7rgIrbv.mp4"
            type="video/mp4"
          />
        </video>
      </div>
      <main className="pt-[68px]">
        <LandingHero landing={landing} />
        {/* lg 以下 navbar 的 SEARCH 框會隱藏，改在內容區補位；行為同 /portfolio：即時過濾本頁作品 */}
        <div className="lg:hidden mx-auto max-w-7xl px-4 sm:px-6">
          <SearchBox
            value={filters.query}
            onChange={(q) => setFilters({ ...filters, query: q })}
          />
        </div>
        <PortfolioGrid
          works={works && works.length > 0 ? works : DEMO_WORKS}
          filters={filters}
          setFilters={setFilters}
          showFilters={!landing.hideFilters}
          transparentBg
          categoryGroups={categoryGroups}
          allowedGroups={allowedGroups}
        />
      </main>
      <Footer />
    </>
  )
}
