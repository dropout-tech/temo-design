"use client"

import { useState } from "react"
import { useInView } from "@/hooks/use-in-view"
import { Plus, Minus } from "lucide-react"

const philosophyPoints = [
  {
    id: "core",
    labelEn: "CORE",
    titleZh: "設計是療癒，也是解方",
    bodyZh: "在提摩，我們始終相信——設計不只是造型，更是一種療癒與解方。我們以「以人為本」為核心，相信設計師並非只是替品牌打造外觀的 maker，而更像是以洞察為診斷、以創意為處方的「品牌醫生」。",
    bodyEn: "At TEMO, we believe that design is not merely about appearance—it is a form of healing and a solution. With a people-centered philosophy at our core, we see designers not simply as makers who craft a brand's exterior, but as \"brand doctors\" who diagnose through insight and prescribe through creativity.",
  },
  {
    id: "doctor",
    labelEn: "APPROACH",
    titleZh: "精準觀察，對症下藥",
    bodyZh: "透過精準觀察市場、消費者行為、與生活中的細微問題，我們為每一位客戶精心診斷、量身打造最適合的設計解決方案。在業界洪流之中，替品牌找出一條獨特的發展道路。",
    bodyEn: "By precisely observing the market, consumer behavior, and the subtle details of everyday life, we meticulously diagnose with precision and deliver tailored design solutions for every client.",
  },
  {
    id: "name",
    labelEn: "NAMING",
    titleZh: "提摩：分海的信念",
    bodyZh: "品牌名稱「TEMO」源自摩西分紅海的故事。「提」象徵提拔、帶領；「摩」代表摩西。無論市場再怎麼飽和，我們都能替品牌撥開市場的紅海，開拓一條專屬的航道。",
    bodyEn: "The name 'TEMO' is inspired by the biblical story of Moses parting the Red Sea. Regardless of how saturated the market may be, we can help part the Red Sea of the market, carving out a unique path exclusively for your brand.",
  },
  {
    id: "promise",
    labelEn: "PROMISE",
    titleZh: "最堅實的品牌後盾",
    bodyZh: "TEMO 像徵信念與保護的盾牌。當品牌在洪流中感到害怕、迷惘或停滯時，我們將陪伴你一起，讓你的品牌成為業界最亮眼的一顆星——在商業藍海的巨浪中領航前進。",
    bodyEn: "We believe that even the most impossible obstacles can reveal new opportunities through insight, strategy, and tireless companionship, opening hearts for brands to thrive beyond expectation.",
  },
]

export function PhilosophySection() {
  const { ref, isInView } = useInView<HTMLElement>({ once: true, amount: 0.1 })
  const [openId, setOpenId] = useState<string | null>("core")

  return (
    <section id="philosophy" ref={ref} className="relative py-24 md:py-36 bg-temo-black overflow-hidden">
      {/* Subtle vertical lines */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[15, 35, 65, 85].map((left) => (
          <div key={left} className="absolute top-0 bottom-0 w-px bg-white/[0.025]" style={{ left: `${left}%` }} />
        ))}
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-[1fr_1.3fr] gap-16 lg:gap-24 items-start">

          {/* LEFT — sticky label block */}
          <div
            className="lg:sticky lg:top-32"
            style={{
              transition: "opacity 0.9s ease, transform 0.9s ease",
              opacity: isInView ? 1 : 0,
              transform: isInView ? "translateY(0)" : "translateY(28px)",
            }}
          >
            <p className="text-[10px] tracking-[0.5em] text-temo-gold mb-5 uppercase">Brand Philosophy</p>
            <h2 className="text-5xl md:text-6xl font-black text-white mb-8 leading-none tracking-[0.05em]">
              品<br />牌<br />理<br />念
            </h2>
            <div className="w-12 h-px bg-temo-gold mb-8" />
            <p className="text-sm text-temo-warm-gray/60 leading-relaxed max-w-xs">
              設計不只是造型，更是品牌與世界溝通的語言。
            </p>
            {/* Big watermark number */}
            <div
              className="mt-12 text-[140px] font-black leading-none text-temo-gold/[0.04] select-none"
              style={{ lineHeight: 1 }}
            >
              {String(philosophyPoints.findIndex((p) => p.id === openId) + 1).padStart(2, "0")}
            </div>
          </div>

          {/* RIGHT — accordion */}
          <div
            style={{
              transition: "opacity 0.9s ease 0.2s, transform 0.9s ease 0.2s",
              opacity: isInView ? 1 : 0,
              transform: isInView ? "translateY(0)" : "translateY(28px)",
            }}
            className="space-y-2"
          >
            {philosophyPoints.map((point, i) => {
              const isOpen = openId === point.id
              return (
                <div
                  key={point.id}
                  className="border transition-all duration-300 overflow-hidden"
                  style={{
                    borderColor: isOpen ? "rgba(205,169,109,0.5)" : "rgba(255,255,255,0.07)",
                    background: isOpen ? "rgba(205,169,109,0.04)" : "transparent",
                    transitionDelay: isInView ? `${i * 0.08}s` : "0s",
                  }}
                >
                  <button
                    className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left"
                    onClick={() => setOpenId(isOpen ? null : point.id)}
                  >
                    <div className="flex items-center gap-5">
                      <span
                        className="text-[10px] tracking-[0.35em] font-bold transition-colors duration-300"
                        style={{ color: isOpen ? "var(--temo-gold)" : "rgba(176,172,161,0.4)" }}
                      >
                        {String(i + 1).padStart(2, "0")} — {point.labelEn}
                      </span>
                      <h3
                        className="text-sm md:text-base font-bold transition-colors duration-300"
                        style={{ color: isOpen ? "white" : "rgba(255,255,255,0.75)" }}
                      >
                        {point.titleZh}
                      </h3>
                    </div>
                    <div
                      className="shrink-0 w-7 h-7 rounded-full border flex items-center justify-center transition-all duration-300"
                      style={{
                        borderColor: isOpen ? "var(--temo-gold)" : "rgba(255,255,255,0.1)",
                        color: isOpen ? "var(--temo-gold)" : "rgba(255,255,255,0.3)",
                      }}
                    >
                      {isOpen ? <Minus className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                    </div>
                  </button>

                  <div
                    style={{
                      maxHeight: isOpen ? "300px" : "0",
                      opacity: isOpen ? 1 : 0,
                      overflow: "hidden",
                      transition: "max-height 0.45s ease, opacity 0.3s ease",
                    }}
                  >
                    <div className="px-6 pb-6 space-y-3 border-t border-white/[0.05]">
                      <p className="text-sm text-temo-warm-gray leading-relaxed pt-4">{point.bodyZh}</p>
                      <p className="text-[11px] text-temo-warm-gray/45 leading-relaxed italic">{point.bodyEn}</p>
                    </div>
                  </div>
                </div>
              )
            })}

            {/* Closing statement */}
            <div
              className="pt-6 border-l-2 border-temo-gold/40 pl-5"
              style={{
                transition: "opacity 0.9s ease 0.6s",
                opacity: isInView ? 1 : 0,
              }}
            >
              <p className="text-temo-gold text-sm leading-relaxed font-medium">
                讓我們陪你一起，讓你的品牌成為業界最亮眼的一顆星——在商業藍海的巨浪中領航前進。
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
