"use client"

import Image from "next/image"
import { useInView } from "@/hooks/use-in-view"

export type ClientLogoItem = { name: string; image_url: string }

const clients = [
  "Gogoro", "Cannondale", "OXO", "IOL", "Johnson & Johnson",
  "AMC", "新光三越", "大苑子", "KOTON", "APING",
  "LH 汽車", "神隆汽車", "Nvidia", "安信建議", "遠東集團",
  "美廉社", "台灣大學", "長榮航空",
]

const honors = [
  "Gogoro", "Cannondale", "OXO", "IOL", "台北大獎",
  "AMC", "新光三越", "大苑子", "KOTON", "APING",
  "LH 汽車", "神隆汽車", "Nvidia", "安信建議", "遠東集團",
]

function MarqueeRow({ items, speed = 40, reverse = false }: { items: string[]; speed?: number; reverse?: boolean }) {
  const doubled = [...items, ...items]
  return (
    <div className="relative flex overflow-hidden" style={{ maskImage: "linear-gradient(to right, transparent, black 8%, black 92%, transparent)" }}>
      <div
        className="marquee-track flex shrink-0 gap-4 items-center py-1"
        style={{
          animation: `marquee${reverse ? "Rev" : ""} ${speed}s linear infinite`,
          whiteSpace: "nowrap",
        }}
      >
        {doubled.map((name, i) => (
          <div
            key={i}
            className="group flex items-center justify-center min-w-[140px] px-6 py-3.5 border border-white/8 bg-white/[0.02] hover:border-temo-gold/50 hover:bg-temo-gold/[0.04] transition-all duration-300 cursor-default rounded-sm"
          >
            <span className="text-[11px] font-medium text-temo-warm-gray/60 group-hover:text-temo-gold transition-colors duration-300 whitespace-nowrap tracking-wider">
              {name}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function LogoMarqueeRow({
  items,
  speed = 40,
  reverse = false,
}: {
  items: ClientLogoItem[]
  speed?: number
  reverse?: boolean
}) {
  const doubled = [...items, ...items]
  return (
    <div className="relative flex overflow-hidden" style={{ maskImage: "linear-gradient(to right, transparent, black 8%, black 92%, transparent)" }}>
      <div
        className="marquee-track flex shrink-0 gap-4 items-center py-1"
        style={{
          animation: `marquee${reverse ? "Rev" : ""} ${speed}s linear infinite`,
          whiteSpace: "nowrap",
        }}
      >
        {doubled.map((logo, i) => (
          <div
            key={i}
            title={logo.name}
            className="group flex items-center justify-center h-20 min-w-[160px] px-8 border border-white/8 bg-white/[0.02] hover:border-temo-gold/50 hover:bg-temo-gold/[0.04] transition-all duration-300 rounded-sm"
          >
            <Image
              src={logo.image_url}
              alt={logo.name}
              width={200}
              height={72}
              unoptimized
              className="max-h-12 w-auto object-contain opacity-55 group-hover:opacity-100 transition-opacity duration-300"
            />
          </div>
        ))}
      </div>
    </div>
  )
}

export function ClientsHonorsSection({ clientLogos = [] }: { clientLogos?: ClientLogoItem[] }) {
  const { ref, isInView } = useInView<HTMLElement>({ once: true, amount: 0.1 })
  const hasLogos = clientLogos.length > 0
  // logo 數量夠多才分兩排；否則單排避免重複太密
  const half = Math.ceil(clientLogos.length / 2)
  const logoRowA = clientLogos.slice(0, half)
  const logoRowB = clientLogos.slice(half)

  return (
    <section ref={ref} className="relative py-24 md:py-32 bg-temo-black overflow-hidden">
      {/* Fine grain overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.018]"
        style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")" }}
      />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* OUR CLIENT */}
        <div
          style={{
            transition: "opacity 0.8s ease, transform 0.8s ease",
            opacity: isInView ? 1 : 0,
            transform: isInView ? "translateY(0)" : "translateY(20px)",
          }}
          className="mb-10"
        >
          <div className="flex items-baseline gap-4 mb-8">
            <p className="text-[10px] tracking-[0.5em] text-temo-gold uppercase">Partners</p>
            <div className="flex-1 h-px bg-white/8" />
            <h3 className="text-sm font-bold text-white tracking-[0.25em] uppercase">Our Client</h3>
          </div>
          {hasLogos ? (
            <>
              <LogoMarqueeRow items={logoRowA} speed={44} />
              {logoRowB.length > 0 && (
                <div className="mt-3">
                  <LogoMarqueeRow items={logoRowB} speed={38} reverse />
                </div>
              )}
            </>
          ) : (
            <>
              <MarqueeRow items={clients} speed={38} />
              <div className="mt-3">
                <MarqueeRow items={[...clients].reverse()} speed={32} reverse />
              </div>
            </>
          )}
        </div>

        {/* Divider */}
        <div
          style={{
            transition: "opacity 0.8s ease 0.3s, transform 0.8s ease 0.3s",
            opacity: isInView ? 1 : 0,
            transform: isInView ? "scaleX(1)" : "scaleX(0)",
            transformOrigin: "left",
          }}
          className="h-px bg-gradient-to-r from-transparent via-white/15 to-transparent my-16"
        />

        {/* OUR HONOR */}
        <div
          style={{
            transition: "opacity 0.8s ease 0.5s, transform 0.8s ease 0.5s",
            opacity: isInView ? 1 : 0,
            transform: isInView ? "translateY(0)" : "translateY(20px)",
          }}
        >
          <div className="flex items-baseline gap-4 mb-8">
            <p className="text-[10px] tracking-[0.5em] text-temo-gold uppercase">Recognition</p>
            <div className="flex-1 h-px bg-white/8" />
            <h3 className="text-sm font-bold text-white tracking-[0.25em] uppercase">Our Honor</h3>
          </div>
          <MarqueeRow items={honors} speed={45} reverse />
        </div>
      </div>

      <style>{`
        @keyframes marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        @keyframes marqueeRev {
          from { transform: translateX(-50%); }
          to { transform: translateX(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          .marquee-track { animation: none !important; }
        }
      `}</style>
    </section>
  )
}
