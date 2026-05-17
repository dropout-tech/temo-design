"use client"

import { useInView } from "@/hooks/use-in-view"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

export function BottomCTASection() {
  const { ref, isInView } = useInView<HTMLElement>({ once: true, amount: 0.25 })

  return (
    <section ref={ref} className="relative py-28 md:py-40 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-temo-black via-temo-dark to-temo-black" />

      {/* Subtle glow */}
      <div
        className="absolute top-0 right-0 w-96 h-96 rounded-full bg-temo-gold/8 blur-3xl pointer-events-none"
        style={{
          transition: "opacity 1s ease",
          opacity: isInView ? 1 : 0,
        }}
      />
      <div
        className="absolute bottom-0 left-0 w-80 h-80 rounded-full bg-temo-gold/5 blur-3xl pointer-events-none"
        style={{
          transition: "opacity 1s ease 0.3s",
          opacity: isInView ? 1 : 0,
        }}
      />

      <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div
          style={{
            transition: "opacity 0.9s ease, transform 0.9s ease",
            opacity: isInView ? 1 : 0,
            transform: isInView ? "translateY(0)" : "translateY(36px)",
          }}
          className="text-center"
        >
          <p className="text-xs tracking-[0.4em] text-temo-gold mb-6 uppercase">Ready to Start?</p>

          <h2 className="text-4xl md:text-6xl font-bold text-temo-white mb-6 leading-tight text-balance">
            準備好為您的品牌
            <br />
            開闢新航道了嗎？
          </h2>

          <p className="text-lg text-temo-warm-gray mb-12 max-w-2xl mx-auto leading-relaxed">
            無論您的品牌正面臨什麼挑戰，提摩都準備好成為您最堅實的後盾，一起創造市場迴響。
          </p>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-9 py-4 bg-temo-gold text-temo-black font-semibold tracking-wider hover:brightness-110 transition-all duration-300 hover:scale-105 active:scale-95"
            >
              立即諮詢
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/portfolio"
              className="inline-flex items-center gap-2 px-9 py-4 border border-temo-gold text-temo-gold font-semibold tracking-wider hover:bg-temo-gold/10 transition-all duration-300 hover:scale-105 active:scale-95"
            >
              查看作品集
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Footer note */}
          <p
            style={{
              transition: "opacity 0.8s ease 0.4s",
              opacity: isInView ? 1 : 0,
            }}
            className="mt-12 text-xs text-temo-warm-gray"
          >
            有任何疑問或特殊需求嗎？{" "}
            <Link href="/contact" className="text-temo-gold hover:underline">
              直接與我們聯繫
            </Link>
          </p>
        </div>
      </div>
    </section>
  )
}
