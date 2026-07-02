"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ChevronRight, Instagram, Facebook } from "lucide-react"

const socialLinks = [
  {
    href: "https://www.behance.net/temodesign",
    label: "Behance",
    icon: (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M22 7h-7v-2h7v2zm1.726 10c-.442 1.297-2.029 3-5.101 3-3.074 0-5.564-1.729-5.564-5.675 0-3.91 2.325-5.92 5.466-5.92 3.082 0 4.964 1.782 5.375 4.426.078.506.109 1.188.095 2.14h-8.027c.13 3.211 3.483 3.312 4.588 2.029h3.168zm-7.686-4h4.965c-.105-1.547-1.136-2.219-2.477-2.219-1.466 0-2.277.768-2.488 2.219zm-9.574 6.988h-6.466v-14.967h6.953c5.476.081 5.58 5.444 2.72 6.906 3.461 1.26 3.577 8.061-3.207 8.061zm-3.466-8.988h3.584c2.508 0 2.906-3-.312-3h-3.272v3zm3.391 3h-3.391v3.016h3.341c3.055 0 2.868-3.016.05-3.016z" />
      </svg>
    ),
  },
  {
    href: "https://www.instagram.com/_temo_design/",
    label: "Instagram",
    icon: <Instagram className="h-4 w-4" />,
  },
  {
    href: "https://www.facebook.com/temodesignss",
    label: "Facebook",
    icon: <Facebook className="h-4 w-4" />,
  },
]

export function HeroSection() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80)
    return () => clearTimeout(t)
  }, [])

  return (
    <section className="relative min-h-screen flex flex-col overflow-hidden">

      {/* Background video — full section */}
      <div className="absolute inset-0 z-0">
        <video
          autoPlay loop muted playsInline
          className="absolute inset-0 w-full h-full object-cover"
          poster="/images/hero-poster.jpg"
        >
          <source
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/freepik_-_kling_720p_16-9_24fps_57860-mPIC49MLEKEyvjV5OZbCDTi7rgIrbv.mp4"
            type="video/mp4"
          />
        </video>
        {/* Darker overlay on top half so title is readable */}
        <div className="absolute inset-0 bg-gradient-to-b from-temo-black/80 via-temo-black/55 to-temo-black/30" />
      </div>

      {/* Content — flex col fills full screen height */}
      <div className="relative z-10 flex flex-col flex-1 min-h-screen w-full max-w-[1400px] mx-auto px-8 md:px-24 lg:px-32 xl:px-40">

        {/* ── TOP BLOCK: Title left, Description right ────────────────── */}
        <div
          className="flex flex-col md:flex-row md:items-center gap-8 md:gap-10 lg:gap-14 flex-1 pt-28 md:pt-32 pb-8 md:pb-10"
          style={{
            transition: "opacity 1s ease, transform 1s ease",
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(36px)",
          }}
        >
          {/* Left — logo image (TEMO / DESIGN already split vertically) */}
          <div className="flex-shrink-0">
            <img
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/%E6%87%B6-76grBtgC5j14MJ6i6SK7dP9HfdTgDw.png"
              alt="TEMO DESIGN"
              className="w-full h-auto max-w-[440px] object-contain"
            />
          </div>

          {/* Right — description (sits close to title, left-aligned) */}
          <div
            className="w-full md:max-w-[440px] lg:max-w-[480px] space-y-4 flex-shrink"
            style={{
              transition: "opacity 1s ease 0.3s",
              opacity: visible ? 1 : 0,
            }}
          >
            <p className="text-white/90 text-xs md:text-sm leading-[1.9] font-light">
              提摩設計自 2020 年成立以來，<br />
              致力於將 品牌視覺 / 氛圍感塑造 / 使用情境模擬 / 創意策略四者融合。<br />
              透過一條龍的整合技術，為各品牌開拓創新的道路，旨在創造出最有效的品牌商業價值！
            </p>
            <p className="text-white/55 text-[10px] md:text-[11px] leading-[2] font-light">
              Since its establishment in 2020,<br />
              TEMO DESIGN has been dedicated to integrating brand visuals, atmosphere creation, usage scenario simulation, and market marketing. Utilizing end-to-end integrated technologies, the company paves innovative paths for various brands, aiming to generate the most effective brand commercial value.
            </p>
          </div>
        </div>

        {/* ── FULL-WIDTH DIVIDER ───────────────────────────────────────── */}
        <div
          className="h-px bg-white/20 -mx-8 md:-mx-24 lg:-mx-32 xl:-mx-40"
          style={{
            transition: "opacity 1s ease 0.5s",
            opacity: visible ? 1 : 0,
          }}
        />

        {/* ── BOTTOM BLOCK: tagline left, circle CTA right ────────────── */}
        <div className="flex flex-col md:flex-row md:items-center gap-8 md:gap-12 flex-1 pb-8 md:pb-10">
          {/* Left — tagline + social */}
          <div
            className="flex-1 flex flex-col justify-between min-h-[160px]"
            style={{
              transition: "opacity 1s ease 0.6s, transform 1s ease 0.6s",
              opacity: visible ? 1 : 0,
              transform: visible ? "translateY(0)" : "translateY(20px)",
            }}
          >
            <div className="space-y-2 md:space-y-3">
              <p className="text-white font-bold text-lg md:text-xl lg:text-2xl tracking-wide">
                點擊右邊按鈕
              </p>
              <p className="text-white font-bold text-lg md:text-xl lg:text-2xl tracking-wide">
                探索您的理想設計旅程
              </p>
            </div>

            {/* Social icons anchored to bottom-left */}
            <div
              className="flex items-center gap-3 md:gap-4 pt-6 md:pt-0"
              style={{
                transition: "opacity 1s ease 0.8s",
                opacity: visible ? 1 : 0,
              }}
            >
              {socialLinks.map(({ href, label, icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="w-9 h-9 md:w-10 md:h-10 lg:w-11 lg:h-11 rounded-full border border-white/40 flex items-center justify-center text-white/70 hover:border-white hover:text-white hover:scale-110 transition-all duration-300"
                >
                  {icon}
                </a>
              ))}
            </div>
          </div>

          {/* Right — large circle CTA */}
          <div
            className="flex items-center justify-center md:justify-end flex-shrink-0 md:mr-8 lg:mr-16 xl:mr-24"
            style={{
              transition: "opacity 1.2s ease 0.7s, transform 1.2s ease 0.7s",
              opacity: visible ? 1 : 0,
              transform: visible ? "scale(1)" : "scale(0.85)",
            }}
          >
            <Link
              href="/explore"
              className="group relative z-20 flex items-center justify-center w-32 h-32 md:w-40 md:h-40 lg:w-48 lg:h-48 rounded-full border-2 border-white/60 hover:border-temo-gold transition-colors duration-300"
            >
              <ChevronRight className="h-10 w-10 md:h-14 md:w-14 lg:h-16 lg:w-16 text-white group-hover:text-temo-gold group-hover:translate-x-2 transition-all duration-300" />
              {/* Gold ping ring — behind the button */}
              <span className="absolute inset-0 rounded-full border border-temo-gold/50 opacity-0 group-hover:opacity-100 group-hover:animate-ping pointer-events-none" />
              <span className="absolute inset-[-10px] rounded-full border border-temo-gold/20 opacity-0 group-hover:opacity-100 group-hover:animate-ping pointer-events-none" style={{ animationDelay: "0.4s" }} />
            </Link>
          </div>
        </div>

      </div>
    </section>
  )
}
