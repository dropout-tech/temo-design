"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowUpRight, ArrowLeft } from "lucide-react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { cn } from "@/lib/utils"
import {
  PortfolioGrid,
  INITIAL_FILTERS,
  type FilterState,
} from "@/components/pages/portfolio-page-client"
import { WORKS as DEMO_WORKS } from "@/lib/portfolio-data"
import type { CategoryLanding } from "@/lib/category-landing-data"

// ─── Hero ─────────────────────────────────────────────────────────────────────

function LandingHero({ landing }: { landing: CategoryLanding }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80)
    return () => clearTimeout(t)
  }, [])

  return (
    <section className="relative pt-24 md:pt-32 pb-12 md:pb-16 overflow-hidden bg-[#0c0b09]">
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
          <h1 className="text-6xl md:text-8xl lg:text-9xl font-black text-white leading-[0.95] tracking-tight">
            {landing.titleEn.map((line, i) => {
              const isAmpersand = line.trim() === "&"
              return (
                <span
                  key={i}
                  className={cn(
                    "block",
                    isAmpersand && "text-4xl md:text-6xl font-light text-white/40 my-1 md:my-2"
                  )}
                >
                  {line}
                </span>
              )
            })}
          </h1>

          {/* 右：中英描述 + CTA */}
          <div className="md:pt-16 lg:pt-24">
            <p className="text-white/75 text-base md:text-lg leading-relaxed mb-5 whitespace-pre-line">
              {landing.taglineZh}
            </p>
            <p className="text-[11px] md:text-xs tracking-[0.22em] text-white/35 uppercase leading-relaxed whitespace-pre-line">
              {landing.taglineEn}
            </p>

            {landing.cta && (
              <Link
                href={landing.cta.href}
                className="mt-8 inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-white/[0.06] hover:bg-temo-gold border border-white/15 hover:border-temo-gold text-white/85 hover:text-black text-sm font-medium tracking-wider transition-all"
              >
                {landing.cta.label}
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        </div>

        {/* 底部橢圓 pills */}
        {landing.ovals && landing.ovals.length > 0 && (
          <div className="mt-14 md:mt-20 flex items-center justify-between gap-4 md:gap-6 max-w-5xl mx-auto flex-wrap">
            {landing.ovals.map((label) => (
              <div
                key={label}
                className="flex items-center justify-center w-[80px] h-[140px] md:w-[120px] md:h-[210px] rounded-full border-2 border-white/20 bg-white/[0.02] text-white/65 text-xl md:text-3xl font-light tracking-[0.4em] hover:border-temo-gold/60 hover:text-white transition-colors"
                style={{
                  writingMode: "vertical-rl",
                  textOrientation: "upright",
                }}
              >
                {label}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function CategoryLandingClient({ landing }: { landing: CategoryLanding }) {
  const [filters, setFilters] = useState<FilterState>({
    ...INITIAL_FILTERS,
    group: landing.portfolioGroup,
  })

  return (
    <>
      <Navbar />
      <main className="pt-[68px]">
        <LandingHero landing={landing} />
        <PortfolioGrid works={DEMO_WORKS} filters={filters} setFilters={setFilters} />
      </main>
      <Footer />
    </>
  )
}
