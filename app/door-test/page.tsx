"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

const SECTIONS = [
  { num: "01", top: "品牌", bottom: "平面" },
  { num: "02", top: "裝置", bottom: "藝術" },
  { num: "03", top: "產品", bottom: "設計" },
  { num: "04", top: "工藝", bottom: "設計" },
]

const LINE_TOP = [21.4, 40.2, 59, 77.8, 96.6]
const LINE_BOT = [-11.1, 7.7, 26.5, 45.3, 64.1]

const SLIDE = 11

const WALL_BG = `
  radial-gradient(ellipse 50% 60% at 10% 20%, #a8a6a0 0%, transparent 55%),
  radial-gradient(ellipse 60% 70% at 85% 30%, #807e78 0%, transparent 50%),
  radial-gradient(ellipse 45% 40% at 70% 80%, #757370 0%, transparent 55%),
  radial-gradient(ellipse 35% 30% at 30% 70%, #94928d 0%, transparent 50%),
  #8a8884
`

const NOISE_URL = `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`

export default function DoorTestPage() {
  const [hovered, setHovered] = useState<number | null>(null)

  return (
    <main
      className="fixed inset-0 overflow-hidden select-none"
      style={{ background: "#8a8884", fontFamily: "'Barlow', 'Noto Sans TC', sans-serif" }}
    >
      <div className="absolute inset-0 z-0" style={{ background: WALL_BG }} />
      <div
        className="absolute inset-0 z-[1] pointer-events-none opacity-45 mix-blend-overlay"
        style={{ backgroundImage: NOISE_URL, backgroundSize: "200px 200px" }}
      />

      <CharRow row="solid" />
      <CharRow row="light" />

      <div className="absolute inset-0 z-[6] pointer-events-none">
        {SECTIONS.map((_, i) => {
          const isOpen = hovered === i
          const tL = LINE_TOP[i]
          const tR = LINE_TOP[i + 1]
          const bL = LINE_BOT[i]
          const bR = LINE_BOT[i + 1]
          const tM = (tL + tR) / 2
          const bM = (bL + bR) / 2
          return (
            <div key={i}>
              <Panel
                clip={`polygon(${tL}% 0, ${tM}% 0, ${bM}% 100%, ${bL}% 100%)`}
                slide={isOpen ? -SLIDE : 0}
                side="left"
              />
              <Panel
                clip={`polygon(${tM}% 0, ${tR}% 0, ${bR}% 100%, ${bM}% 100%)`}
                slide={isOpen ? SLIDE : 0}
                side="right"
              />
            </div>
          )
        })}
      </div>

      <div className="absolute inset-0 z-[7] pointer-events-none">
        {SECTIONS.map((s, i) => {
          const dim = hovered !== null && hovered !== i
          const active = hovered === i
          return (
            <div
              key={i}
              className="absolute"
              style={{
                top: "38%",
                left: `${17.2 + i * 18.8}%`,
                fontFamily: "'Barlow', sans-serif",
                fontWeight: 500,
                fontSize: "clamp(34px, 4.2vw, 56px)",
                letterSpacing: "0.06em",
                color: "#f0ede6",
                opacity: dim ? 0.4 : 0.95,
                transform: active ? "scale(1.12)" : "scale(1)",
                transition: "transform 0.45s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.4s ease",
                textShadow: "0 0 8px rgba(0,0,0,0.15)",
              }}
            >
              {s.num}
            </div>
          )
        })}
      </div>

      <svg
        className="absolute inset-0 z-[9] w-full h-full"
        viewBox="0 0 1170 660"
        preserveAspectRatio="none"
      >
        {SECTIONS.map((_, i) => (
          <polygon
            key={i}
            points={`${LINE_TOP[i] * 11.7},0 ${LINE_TOP[i + 1] * 11.7},0 ${LINE_BOT[i + 1] * 11.7},660 ${LINE_BOT[i] * 11.7},660`}
            style={{ fill: "transparent", cursor: "pointer", pointerEvents: "all" }}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
          />
        ))}
      </svg>

      <svg
        className="absolute inset-0 z-[10] w-full h-full pointer-events-none"
        viewBox="0 0 1170 660"
        preserveAspectRatio="none"
      >
        {LINE_TOP.map((t, i) => (
          <line
            key={i}
            x1={t * 11.7}
            y1={0}
            x2={LINE_BOT[i] * 11.7}
            y2={660}
            stroke="rgba(245,242,235,0.7)"
            strokeWidth="1.2"
            style={{ filter: "drop-shadow(0 0 2px rgba(245,242,235,0.3))" }}
          />
        ))}
      </svg>

      <Link
        href="/"
        className="absolute top-5 right-6 z-40 flex items-center gap-2 text-[10px] tracking-[0.3em] text-white/40 hover:text-white/70 transition-colors uppercase"
      >
        <ArrowLeft className="w-3 h-3" /> Back
      </Link>
    </main>
  )
}

function Panel({
  clip,
  slide,
  side,
}: {
  clip: string
  slide: number
  side: "left" | "right"
}) {
  return (
    <div
      className="absolute inset-0"
      style={{
        clipPath: clip,
        background: WALL_BG,
        backgroundAttachment: "fixed",
        transform: `translateX(${slide}%)`,
        transition: "transform 0.9s cubic-bezier(0.22, 1, 0.36, 1)",
        willChange: "transform",
        filter:
          side === "left"
            ? "drop-shadow(2px 0 6px rgba(0,0,0,0.18))"
            : "drop-shadow(-2px 0 6px rgba(0,0,0,0.18))",
      }}
    />
  )
}

function CharRow({ row }: { row: "solid" | "light" }) {
  const isSolid = row === "solid"
  return (
    <div
      className="absolute left-0 right-0 z-[4] pointer-events-none"
      style={{ bottom: isSolid ? "22%" : "7%" }}
    >
      {SECTIONS.map((s, i) => (
        <span
          key={i}
          className="absolute"
          style={{
            fontFamily: "'Noto Sans TC', sans-serif",
            fontWeight: 900,
            fontSize: "clamp(52px, 6.8vw, 96px)",
            letterSpacing: "-0.06em",
            lineHeight: 1,
            whiteSpace: "nowrap",
            left: `${(isSolid ? 11.5 : 13) + i * 18.8}%`,
            transform: "translateX(-50%)",
            bottom: 0,
            color: isSolid ? "rgba(15,15,12,0.92)" : "rgba(245,242,235,0.5)",
          }}
        >
          {isSolid ? s.top : s.bottom}
        </span>
      ))}
    </div>
  )
}
