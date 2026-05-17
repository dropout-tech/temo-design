"use client"

import { useEffect, useRef, useState } from "react"
import { useInView } from "@/hooks/use-in-view"
import Link from "next/link"

type ChartType = "bars" | "scatter" | "ring" | "radar"

const stats: {
  value: number
  suffix: string
  label: string
  sublabel: string
  description: string
  chart: ChartType
}[] = [
  {
    value: 200,
    suffix: "+",
    label: "專案數量",
    sublabel: "Projects Completed",
    description: "橫跨品牌、產品、工藝等多個領域，每一件作品都是精心雕琢的成果。",
    chart: "bars",
  },
  {
    value: 20,
    suffix: "+",
    label: "跨界經驗約",
    sublabel: "Industries Served",
    description: "涵蓋各行業領域，從科技到餐飲，從時尚到工業，提供跨界整合的設計服務。",
    chart: "scatter",
  },
  {
    value: 85,
    suffix: "%",
    label: "回頭率",
    sublabel: "Client Retention",
    description: "超過八成客戶選擇長期合作，是對我們專業能力與服務品質的最高認可。",
    chart: "ring",
  },
  {
    value: 5,
    suffix: "+",
    label: "設計經驗",
    sublabel: "Countries Served",
    description: "設計力量跨越國界，為不同文化背景的品牌創造具全球視野的設計解決方案。",
    chart: "radar",
  },
]

function useProgress(run: boolean, duration = 1600) {
  const [p, setP] = useState(0)
  const raf = useRef<number>(0)
  useEffect(() => {
    if (!run) return
    let start: number | null = null
    function tick(ts: number) {
      if (start === null) start = ts
      const t = Math.min((ts - start) / duration, 1)
      setP(1 - Math.pow(1 - t, 3))
      if (t < 1) raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf.current)
  }, [run, duration])
  return p
}

function Counter({ value, suffix, progress }: { value: number; suffix: string; progress: number }) {
  return <>{Math.round(progress * value)}{suffix}</>
}

function MiniChart({ type, progress, active }: { type: ChartType; progress: number; active: boolean }) {
  const baseColor = active ? "rgba(205,169,109,0.95)" : "rgba(176,172,161,0.32)"
  const accent = active ? "rgba(205,169,109,1)" : "rgba(205,169,109,0.5)"
  const dim = "rgba(176,172,161,0.1)"

  if (type === "bars") {
    const heights = [0.22, 0.3, 0.26, 0.42, 0.38, 0.5, 0.45, 0.62, 0.58, 0.74, 0.7, 0.86, 0.82, 0.98]
    return (
      <svg viewBox="0 0 120 40" className="w-full h-full" preserveAspectRatio="none">
        {heights.map((h, i) => {
          const bp = Math.max(0, Math.min(1, progress * (heights.length + 2) - i))
          const barH = h * 38 * bp
          const isLast = i === heights.length - 1
          return (
            <rect
              key={i}
              x={i * 8.2 + 1}
              y={40 - barH}
              width={2.6}
              height={barH}
              fill={isLast ? accent : baseColor}
              style={{ transition: "fill 0.4s ease" }}
            />
          )
        })}
      </svg>
    )
  }

  if (type === "scatter") {
    const dots: [number, number][] = [
      [6, 28], [16, 14], [22, 30], [32, 20], [40, 8],
      [46, 26], [56, 18], [64, 32], [72, 12], [82, 24],
      [90, 16], [100, 30], [110, 20], [116, 10],
    ]
    return (
      <svg viewBox="0 0 120 40" className="w-full h-full" preserveAspectRatio="none">
        <polyline
          points={dots.map(([x, y]) => `${x},${y}`).join(" ")}
          fill="none"
          stroke={baseColor}
          strokeWidth={0.4}
          opacity={progress * 0.4}
          style={{ transition: "stroke 0.4s ease" }}
        />
        {dots.map(([x, y], i) => {
          const dp = Math.max(0, Math.min(1, progress * dots.length - i * 0.7))
          const isAccent = i === dots.length - 2
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r={isAccent ? 1.8 : 1.3}
              fill={isAccent ? accent : baseColor}
              opacity={dp}
              style={{ transition: "fill 0.4s ease" }}
            />
          )
        })}
      </svg>
    )
  }

  if (type === "ring") {
    const target = 0.85
    const r = 15
    const c = 2 * Math.PI * r
    const offset = c - c * target * progress
    return (
      <svg viewBox="0 0 40 40" className="h-full" style={{ aspectRatio: "1 / 1" }}>
        <circle cx="20" cy="20" r={r} fill="none" stroke={dim} strokeWidth="1" />
        <circle
          cx="20"
          cy="20"
          r={r}
          fill="none"
          stroke={accent}
          strokeWidth="1.5"
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 20 20)"
          style={{ transition: "stroke 0.4s ease" }}
        />
        <circle cx="20" cy="20" r="1" fill={accent} opacity={progress} style={{ transition: "fill 0.4s ease" }} />
      </svg>
    )
  }

  if (type === "radar") {
    const values = [0.85, 0.7, 0.92, 0.78, 0.88]
    const cx = 20, cy = 20, R = 15
    const axisPts = values.map((_, i) => {
      const a = (Math.PI * 2 * i) / values.length - Math.PI / 2
      return [cx + Math.cos(a) * R, cy + Math.sin(a) * R] as [number, number]
    })
    const dataPts = values.map((v, i) => {
      const a = (Math.PI * 2 * i) / values.length - Math.PI / 2
      const r = R * v * progress
      return [cx + Math.cos(a) * r, cy + Math.sin(a) * r] as [number, number]
    })
    return (
      <svg viewBox="0 0 40 40" className="h-full" style={{ aspectRatio: "1 / 1" }}>
        {axisPts.map(([x, y], i) => (
          <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke={dim} strokeWidth="0.4" />
        ))}
        <polygon
          points={axisPts.map(([x, y]) => `${x},${y}`).join(" ")}
          fill="none"
          stroke={dim}
          strokeWidth="0.5"
        />
        <polygon
          points={dataPts.map(([x, y]) => `${x},${y}`).join(" ")}
          fill={accent}
          fillOpacity={active ? 0.12 : 0.06}
          stroke={accent}
          strokeWidth="1"
          strokeLinejoin="round"
          style={{ transition: "stroke 0.4s ease, fill 0.4s ease, fill-opacity 0.4s ease" }}
        />
        {dataPts.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="1" fill={accent} opacity={progress} style={{ transition: "fill 0.4s ease" }} />
        ))}
      </svg>
    )
  }

  return null
}

export function StatsSection() {
  const { ref, isInView } = useInView<HTMLElement>({ once: true, amount: 0.25 })
  const [hovered, setHovered] = useState<number | null>(null)
  const progress = useProgress(isInView, 1600)

  return (
    <section
      ref={ref}
      className="relative bg-[#141210] overflow-hidden"
    >
      {/* Top rule */}
      <div
        className="h-px w-full"
        style={{
          background: "linear-gradient(90deg, transparent, rgba(205,169,109,0.25) 30%, rgba(205,169,109,0.25) 70%, transparent)",
          transition: "opacity 1s ease",
          opacity: isInView ? 1 : 0,
        }}
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        {/* Section label row */}
        <div
          className="flex items-center gap-6 py-10 border-b"
          style={{
            borderColor: "rgba(176,172,161,0.08)",
            transition: "opacity 0.7s ease",
            opacity: isInView ? 1 : 0,
          }}
        >
          <span className="text-[10px] tracking-[0.55em] text-temo-warm-gray/40 uppercase shrink-0">
            Our Numbers
          </span>
          <div className="h-px flex-1" style={{ background: "rgba(176,172,161,0.1)" }} />
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4">
          {stats.map((stat, i) => {
            const active = hovered === i
            const isLast = i === stats.length - 1

            return (
              <div
                key={i}
                className="relative py-14 px-6 md:px-10 cursor-default select-none"
                style={{
                  borderRight: isLast ? "none" : "1px solid rgba(176,172,161,0.08)",
                  transition: `opacity 0.8s ease ${i * 0.1}s, transform 0.8s ease ${i * 0.1}s`,
                  opacity: isInView ? 1 : 0,
                  transform: isInView ? "translateY(0)" : "translateY(32px)",
                }}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
              >
                {/* Active background wash */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: "radial-gradient(ellipse 80% 70% at 30% 50%, rgba(205,169,109,0.04), transparent)",
                    opacity: active ? 1 : 0,
                    transition: "opacity 0.4s ease",
                  }}
                />

                {/* Number */}
                <div
                  className="text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-3 leading-none"
                  style={{
                    color: active ? "var(--temo-warm)" : "rgba(240,234,221,0.18)",
                    transition: "color 0.4s ease",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  <Counter value={stat.value} suffix={stat.suffix} progress={progress} />
                </div>

                {/* Mini chart */}
                <div className="h-9 mb-4 flex items-end">
                  <MiniChart type={stat.chart} progress={progress} active={active} />
                </div>

                {/* Thin rule */}
                <div
                  className="mb-4 h-px w-8"
                  style={{
                    background: active ? "var(--temo-gold)" : "rgba(176,172,161,0.2)",
                    transition: "background 0.4s ease, width 0.4s ease",
                    width: active ? "2.5rem" : "2rem",
                  }}
                />

                {/* Chinese label */}
                <p
                  className="text-sm font-medium mb-1 tracking-wide"
                  style={{
                    color: active ? "var(--temo-warm)" : "rgba(240,234,221,0.55)",
                    transition: "color 0.4s ease",
                  }}
                >
                  {stat.label}
                </p>

                {/* English sublabel */}
                <p
                  className="text-[10px] tracking-[0.35em] uppercase"
                  style={{
                    color: "rgba(176,172,161,0.3)",
                    transition: "opacity 0.4s ease",
                    opacity: active ? 0.7 : 0.45,
                  }}
                >
                  {stat.sublabel}
                </p>

                {/* Description slide-in */}
                <div
                  style={{
                    maxHeight: active ? "80px" : "0",
                    opacity: active ? 1 : 0,
                    overflow: "hidden",
                    transition: "max-height 0.45s ease, opacity 0.35s ease 0.08s",
                  }}
                >
                  <p className="text-[11px] leading-relaxed pt-4" style={{ color: "rgba(176,172,161,0.45)" }}>
                    {stat.description}
                  </p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Bottom CTA row */}
        <div
          className="flex items-center justify-between py-8 border-t"
          style={{
            borderColor: "rgba(176,172,161,0.08)",
            transition: "opacity 0.7s ease 0.5s",
            opacity: isInView ? 1 : 0,
          }}
        >
          <span className="text-[10px] tracking-[0.4em] text-temo-warm-gray/25 uppercase">
            Since 2020
          </span>
          <Link
            href="/contact"
            className="group flex items-center gap-3 text-[11px] tracking-[0.4em] uppercase transition-colors duration-300"
            style={{ color: "rgba(205,169,109,0.6)" }}
            onMouseEnter={e => (e.currentTarget.style.color = "rgba(205,169,109,1)")}
            onMouseLeave={e => (e.currentTarget.style.color = "rgba(205,169,109,0.6)")}
          >
            好評回饋
            <span
              className="inline-block h-px transition-all duration-300 group-hover:w-10"
              style={{ width: "1.5rem", background: "currentColor" }}
            />
          </Link>
        </div>
      </div>

      {/* Bottom rule */}
      <div
        className="h-px w-full"
        style={{
          background: "linear-gradient(90deg, transparent, rgba(205,169,109,0.15) 30%, rgba(205,169,109,0.15) 70%, transparent)",
          opacity: isInView ? 1 : 0,
          transition: "opacity 1s ease 0.3s",
        }}
      />
    </section>
  )
}
