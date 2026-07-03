"use client"

import { useRef, useState, useEffect } from "react"
import { useInView } from "@/hooks/use-in-view"

const logoMeanings = [
  {
    id: "face",
    titleZh: "人臉",
    titleEn: "FACE",
    subtitle: "以人為本的設計哲學",
    description:
      "LOGO 中隱含「人臉」的意象，象徵始終以人為本，從使用者的需求、品牌的故事與情感出發。每一項設計，皆從理解開始，最終回歸感動，透過關懷、洞察與真誠溝通，創造真正有溫度的品牌體驗。",
    points: [
      "代表：關懷、洞察、溝通、真誠。",
      "每一項設計，都從理解「人」開始，最後回到感動「人」。",
    ],
  },
  {
    id: "shield",
    titleZh: "盾牌",
    titleEn: "SHIELD",
    subtitle: "成為品牌最堅實的後盾",
    description:
      "盾牌是品牌守護的象徵，穩固、信賴與信任。TEMO 不只是設計的執行者，更是品牌成長過程中的後盾，協助企業在競爭激烈的市場中建立穩固基礎，形塑足以抵禦紅海壓力的品牌防禦力。",
    points: [
      "象徵：專業後盾、穩固品質、品牌防禦力。",
      "在競爭激烈的市場裡，我們讓品牌擁有能抵抗紅海壓力的護盾。",
    ],
  },
  {
    id: "cross",
    titleZh: "十字架",
    titleEn: "CROSS",
    subtitle: "字母 T — 信念、力量與陪伴",
    description:
      "LOGO 的中心可被解讀為「十字架」或字母「T」，TEMO 在西班牙文中有「敬畏、敬重」的含義，我們將信念加以轉化為品牌力量！當品牌面臨未知、迷惘或挑戰時，TEMO 將成為指引方向的存在。",
    points: [
      "當品牌面臨未知、迷惘或挑戰時，TEMO 成為信仰般的指引與依靠。",
    ],
  },
]

// ─── 霧化玉珠：邊緣不收硬邊，整顆球漸漸暈散到背景 ──────────────────────────
function FoggySphere({
  titleZh,
  titleEn,
  isActive,
}: {
  titleZh: string
  titleEn: string
  isActive: boolean
}) {
  const wrapRef = useRef<HTMLDivElement>(null)

  // 滑鼠移到球上時，把座標寫進 CSS 變數讓內部光暈追隨游標
  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = wrapRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    el.style.setProperty("--mx", `${x}%`)
    el.style.setProperty("--my", `${y}%`)
  }

  function handleMouseLeave() {
    const el = wrapRef.current
    if (!el) return
    el.style.setProperty("--mx", `50%`)
    el.style.setProperty("--my", `50%`)
  }

  return (
    <div
      ref={wrapRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="group relative select-none w-40 h-40 md:w-44 md:h-44 lg:w-48 lg:h-48 flex items-center justify-center cursor-pointer"
      style={
        {
          "--mx": "50%",
          "--my": "50%",
          animation: "sphereFloat 7s ease-in-out infinite",
        } as React.CSSProperties
      }
    >
      {/* Aura — 外圍大範圍霧光（hover 放大、加亮） */}
      <div
        aria-hidden="true"
        className="absolute -inset-16 md:-inset-20 rounded-full pointer-events-none transition-all duration-700 group-hover:scale-110"
        style={{
          background:
            "radial-gradient(circle, rgba(205,169,109,0.20) 0%, rgba(205,169,109,0.09) 30%, rgba(205,169,109,0.02) 58%, transparent 78%)",
          opacity: isActive ? 1 : 0.55,
          filter: "blur(18px)",
        }}
      />

      {/* 球體 — 對稱從中心往外淡出（hover 微放大、saturate 提升） */}
      <div
        aria-hidden="true"
        className="absolute inset-0 rounded-full transition-all duration-500 ease-out pointer-events-none group-hover:scale-[1.06]"
        style={{
          // 漸層原點綁 CSS 變數，會隨滑鼠位置流動
          background: `
            radial-gradient(circle at var(--mx) var(--my),
              rgba(255,242,214,0.16) 0%,
              rgba(205,169,109,0.10) 30%,
              rgba(205,169,109,0.04) 60%,
              rgba(255,255,255,0.01) 85%,
              rgba(255,255,255,0) 100%
            )
          `,
          backdropFilter: isActive
            ? "blur(28px) saturate(1.18) brightness(1.03)"
            : "blur(22px) saturate(1.08)",
          WebkitBackdropFilter: isActive
            ? "blur(28px) saturate(1.18) brightness(1.03)"
            : "blur(22px) saturate(1.08)",
          boxShadow: isActive
            ? "0 0 38px rgba(205,169,109,0.20)"
            : "0 0 26px rgba(0,0,0,0.22)",
          WebkitMaskImage:
            "radial-gradient(circle, black 32%, rgba(0,0,0,0.85) 50%, rgba(0,0,0,0.55) 68%, rgba(0,0,0,0.20) 85%, transparent 100%)",
          maskImage:
            "radial-gradient(circle, black 32%, rgba(0,0,0,0.85) 50%, rgba(0,0,0,0.55) 68%, rgba(0,0,0,0.20) 85%, transparent 100%)",
          filter: "blur(0.8px)",
        }}
      />

      {/* 滑鼠跟隨的暖光點：hover 時浮現，跟著游標位置在球內漂浮 */}
      <div
        aria-hidden="true"
        className="absolute inset-0 rounded-full pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background:
            "radial-gradient(circle at var(--mx) var(--my), rgba(255,220,160,0.22) 0%, rgba(205,169,109,0.10) 18%, transparent 38%)",
          WebkitMaskImage:
            "radial-gradient(circle, black 32%, rgba(0,0,0,0.55) 65%, transparent 95%)",
          maskImage:
            "radial-gradient(circle, black 32%, rgba(0,0,0,0.55) 65%, transparent 95%)",
          filter: "blur(6px)",
        }}
      />

      {/* 標題嵌入球心（hover 微微亮起） */}
      <div className="relative z-10 flex flex-col items-center text-center px-3 transition-transform duration-500 group-hover:scale-[1.03]">
        <span className="text-2xl md:text-[28px] font-bold text-temo-white/95 transition-colors duration-500 group-hover:text-white leading-none">
          {titleZh}
        </span>
        <span className="mt-2.5 text-[10px] md:text-[11px] tracking-[0.4em] text-temo-gold/85 group-hover:text-temo-gold uppercase transition-colors duration-500">
          {titleEn}
        </span>
      </div>
    </div>
  )
}

export function LogoMeaningSection() {
  const { ref, isInView } = useInView<HTMLElement>({ once: true, amount: 0.15 })
  const [activeIndex, setActiveIndex] = useState(0)
  const [progressKey, setProgressKey] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!isInView) return
    intervalRef.current = setInterval(() => {
      setActiveIndex((p) => {
        setProgressKey((k) => k + 1)
        return (p + 1) % logoMeanings.length
      })
    }, 5000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isInView])

  function handleHover(i: number) {
    if (intervalRef.current) clearInterval(intervalRef.current)
    setActiveIndex(i)
    setProgressKey((k) => k + 1)
  }

  return (
    <section ref={ref} className="relative py-24 md:py-36 overflow-hidden">
      {/* 背景影片由父層 wrapper 提供，本段透明 */}

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Logo hero */}
        <div
          className="flex justify-center mb-16"
          style={{
            transition: "opacity 1s ease, transform 1s ease",
            opacity: isInView ? 1 : 0,
            transform: isInView ? "scale(1)" : "scale(0.88)",
          }}
        >
          <img
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo-17-7KdvO1A2YbJzYmo4y1zm35MCjefkkC.png"
            alt="TEMO DESIGN Logo"
            className="h-56 md:h-80 lg:h-96 w-auto"
            style={{ animation: "logoFadeLoop 4s ease-in-out infinite" }}
          />
        </div>

        {/* Rows — 3 段交錯排版：球｜文 → 文｜球 → 球｜文 */}
        <div className="space-y-0">
          {logoMeanings.map((meaning, index) => {
            const isActive = activeIndex === index
            const sphereOnLeft = index % 2 === 0 // 0, 2 = 左；1 = 右

            return (
              <div
                key={meaning.id}
                className="relative border-t border-temo-warm-gray/15 py-14 md:py-20 group cursor-pointer"
                style={{
                  transition: `opacity 0.8s ease ${index * 0.12}s, transform 0.8s ease ${index * 0.12}s`,
                  opacity: isInView ? 1 : 0,
                  transform: isInView ? "translateY(0)" : "translateY(24px)",
                }}
                onMouseEnter={() => handleHover(index)}
              >
                <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-16 items-center">
                  {/* ─── 發光玉珠 ─── */}
                  <div
                    className={[
                      "md:col-span-4 flex justify-center",
                      sphereOnLeft ? "md:order-1" : "md:order-2",
                    ].join(" ")}
                  >
                    <FoggySphere
                      titleZh={meaning.titleZh}
                      titleEn={meaning.titleEn}
                      isActive={isActive}
                    />
                  </div>

                  {/* ─── 文案區 ─── */}
                  <div
                    className={[
                      "md:col-span-8",
                      sphereOnLeft ? "md:order-2" : "md:order-1",
                    ].join(" ")}
                  >
                    <h3 className="text-xl md:text-2xl font-bold text-temo-white mb-5 tracking-wide">
                      {meaning.titleZh}{" "}
                      <span className="text-temo-warm-gray/80 font-medium">{meaning.titleEn}</span>{" "}
                      <span className="text-temo-warm-gray/40 mx-1">—</span>{" "}
                      <span className="text-temo-gold">{meaning.subtitle}</span>
                    </h3>

                    <p className="text-sm md:text-[15px] text-temo-warm-gray leading-[1.85] mb-6 max-w-2xl">
                      {meaning.description}
                    </p>

                    <ul className="space-y-2.5 max-w-2xl">
                      {meaning.points.map((pt) => (
                        <li key={pt} className="flex items-start gap-2.5">
                          <span className="text-temo-gold mt-1 text-xs shrink-0">→</span>
                          <span className="text-xs md:text-sm text-temo-warm-gray/90 leading-relaxed">
                            {pt}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Progress bar — 行底細線 */}
                <div className="absolute bottom-0 left-0 right-0 h-px overflow-hidden">
                  {isActive && (
                    <div
                      key={`${meaning.id}-${progressKey}`}
                      className="h-full bg-temo-gold/60"
                      style={{ animation: "progressFill 5s linear forwards" }}
                    />
                  )}
                </div>
              </div>
            )
          })}
          {/* 最末行的下分隔線 */}
          <div className="border-t border-temo-warm-gray/15" />
        </div>
      </div>

      <style>{`
        @keyframes logoFadeLoop {
          0%, 100% { opacity: 0; }
          50% { opacity: 1; }
        }
        @keyframes progressFill {
          from { width: 0%; }
          to { width: 100%; }
        }
        @keyframes sphereFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        @media (prefers-reduced-motion: reduce) {
          [style*="sphereFloat"] { animation: none !important; }
        }
      `}</style>
    </section>
  )
}
