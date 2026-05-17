"use client"

import { useEffect, useState, useRef } from "react"
import type { MouseEvent as ReactMouseEvent } from "react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { LogoMeaningSection } from "@/components/sections/logo-meaning-section"
import { StatsSection } from "@/components/sections/stats-section"
import { ClientsHonorsSection } from "@/components/sections/clients-honors-section"
import { ArrowUpRight, ChevronDown, Instagram, X } from "lucide-react"
import Link from "next/link"

type Person = {
  name: string
  nameZh?: string
  role: string
  image: string
  instagram?: string
  bio?: string[]
}

const DEFAULT_BIO = [
  "在物以類聚的設計領域中，扮演重要角色。",
  "※ 歡迎廠商複製以下簡歷做為提案使用",
  "以理性邏輯與感性美學交融至作品之中，於專業領域持續耕耘，打造兼具商業價值與藝術深度的設計核心。",
]

const CATEGORY_ORDER = ["DESIGNER", "VENDOR", "CONSULTANT", "PARTNER"] as const
type Category = (typeof CATEGORY_ORDER)[number]

const categories: Record<Category, Person[]> = {
  DESIGNER: [
    {
      name: "ELISE",
      nameZh: "王子豪 / 子麵",
      role: "Founder 負責人 / Creative Director 創意總監",
      image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=600&fit=crop&crop=face",
      instagram: "https://instagram.com/",
      bio: [
        "在物以類聚擔任船長",
        "※ 歡迎廠商複製以下簡歷做為提案使用",
        "職業舞者與理工背景出身，將理性邏輯與次文化底蘊融合至作品之中，以大量手寫字及影像合成作品，迅速在流行文化與表演藝術領域打響知名度，並於 2018 年成立物以類聚視覺整合。",
        "擅長將設計結合市場思維，找出客戶品牌定位及獨特價值，並以「商業與藝術價值並進」為設計核心。",
      ],
    },
    { name: "YVONNE", role: "Creative Director", image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=600&fit=crop&crop=face", instagram: "https://instagram.com/", bio: DEFAULT_BIO },
    { name: "KEVIN", role: "Art Director", image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=600&fit=crop&crop=face", instagram: "https://instagram.com/", bio: DEFAULT_BIO },
    { name: "SHIRLEY", role: "Design Lead", image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=600&fit=crop&crop=face", instagram: "https://instagram.com/", bio: DEFAULT_BIO },
    { name: "SIM", role: "Senior Designer", image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=600&fit=crop&crop=face", instagram: "https://instagram.com/", bio: DEFAULT_BIO },
  ],
  VENDOR: [
    { name: "VENDOR 01", role: "印刷夥伴", image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=600&fit=crop&crop=face" },
    { name: "VENDOR 02", role: "影像製作", image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=600&fit=crop&crop=face" },
    { name: "VENDOR 03", role: "後製團隊", image: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&h=600&fit=crop&crop=face" },
    { name: "VENDOR 04", role: "特殊工藝", image: "https://images.unsplash.com/photo-1521119989659-a83eee488004?w=400&h=600&fit=crop&crop=face" },
    { name: "VENDOR 05", role: "物料供應", image: "https://images.unsplash.com/photo-1463453091185-61582044d556?w=400&h=600&fit=crop&crop=face" },
  ],
  CONSULTANT: [
    { name: "CONSULTANT 01", role: "品牌顧問", image: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400&h=600&fit=crop&crop=face" },
    { name: "CONSULTANT 02", role: "行銷顧問", image: "https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=400&h=600&fit=crop&crop=face" },
    { name: "CONSULTANT 03", role: "策略顧問", image: "https://images.unsplash.com/photo-1607746882042-944635dfe10e?w=400&h=600&fit=crop&crop=face" },
    { name: "CONSULTANT 04", role: "數據顧問", image: "https://images.unsplash.com/photo-1573497019418-b400bb3ab074?w=400&h=600&fit=crop&crop=face" },
    { name: "CONSULTANT 05", role: "法務顧問", image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=600&fit=crop&crop=face" },
  ],
  PARTNER: [
    { name: "PARTNER 01", role: "創意夥伴", image: "https://images.unsplash.com/photo-1542909168-82c3e7fdca5c?w=400&h=600&fit=crop&crop=face" },
    { name: "PARTNER 02", role: "技術夥伴", image: "https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=400&h=600&fit=crop&crop=face" },
    { name: "PARTNER 03", role: "媒體夥伴", image: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=400&h=600&fit=crop&crop=face" },
    { name: "PARTNER 04", role: "通路夥伴", image: "https://images.unsplash.com/photo-1607990281513-2c110a25bd8c?w=400&h=600&fit=crop&crop=face" },
    { name: "PARTNER 05", role: "國際夥伴", image: "https://images.unsplash.com/photo-1513956589380-bad6acb9b9d4?w=400&h=600&fit=crop&crop=face" },
  ],
}

function DesignerCard({ person, onClick }: { person: Person; onClick?: () => void }) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [tilt, setTilt] = useState<string>("")
  const [hovered, setHovered] = useState(false)

  const handleMouseMove = (e: ReactMouseEvent<HTMLDivElement>) => {
    const el = cardRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const dx = (x - rect.width / 2) / (rect.width / 2)
    const dy = (y - rect.height / 2) / (rect.height / 2)
    const rotateY = dx * 10
    const rotateX = -dy * 10
    const translateX = dx * 8
    const translateY = dy * 8
    setTilt(
      `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translate3d(${translateX}px, ${translateY}px, 0) scale(1.04)`
    )
  }

  const handleMouseLeave = () => {
    setHovered(false)
    setTilt("")
  }

  return (
    <div
      ref={cardRef}
      onMouseEnter={() => setHovered(true)}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => (e.key === "Enter" || e.key === " ") && onClick() : undefined}
      className="group relative shrink-0 w-40 h-64 md:w-48 md:h-80 cursor-pointer"
      style={{
        transform: tilt || "perspective(900px)",
        transition: hovered ? "transform 0.08s ease-out" : "transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
        transformStyle: "preserve-3d",
        willChange: "transform",
      }}
    >
      <div
        className="relative overflow-hidden rounded-[80px] md:rounded-[100px] w-full h-full"
        style={{
          boxShadow: hovered
            ? "0 30px 60px -15px rgba(0, 0, 0, 0.65)"
            : "0 15px 35px -15px rgba(0, 0, 0, 0.4)",
          transition: "box-shadow 0.4s ease",
        }}
      >
        <img
          src={person.image}
          alt={person.name}
          className="w-full h-full object-cover transition-all duration-500 filter grayscale group-hover:grayscale-0"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute bottom-6 md:bottom-8 left-0 right-0 text-center px-2">
          <span className="font-bold text-white tracking-wider text-lg md:text-xl block">
            {person.name}
          </span>
        </div>
      </div>
    </div>
  )
}

function DesignerDetailPanel({
  person,
  onClose,
}: {
  person: Person | null
  onClose: () => void
}) {
  const open = !!person

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        aria-hidden="true"
        className={`fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm transition-opacity duration-500 ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      />
      {/* Slide-in panel */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-hidden={!open}
        className={`fixed top-0 right-0 z-[101] h-full w-full md:w-[min(1080px,94vw)] bg-temo-black border-l border-white/10 shadow-[0_0_80px_rgba(0,0,0,0.6)] transition-transform duration-[500ms] ease-[cubic-bezier(0.4,0,0.2,1)] ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {person && (
          <div className="relative h-full overflow-y-auto">
            <button
              type="button"
              onClick={onClose}
              aria-label="關閉"
              className="absolute top-6 right-6 z-10 w-11 h-11 rounded-full border border-white/20 flex items-center justify-center text-white/70 hover:text-white hover:border-white/60 hover:bg-white/5 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="grid md:grid-cols-[auto_1fr] gap-10 md:gap-16 p-8 md:p-16 lg:p-20 min-h-full">
              {/* Portrait */}
              <div className="relative w-full max-w-[340px] md:w-[340px] aspect-[3/4] md:h-[560px] md:aspect-auto rounded-[160px] md:rounded-[180px] overflow-hidden bg-white/5 mx-auto md:mx-0">
                <img
                  src={person.image}
                  alt={person.name}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Info */}
              <div className="flex flex-col gap-5 pt-2 md:pt-8 max-w-xl">
                <h2 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight text-white leading-[0.95]">
                  {person.name}
                </h2>

                {person.nameZh && (
                  <p className="text-sm md:text-base text-white pt-2">
                    <span className="font-bold">{person.name}</span>
                    <span className="text-white/70"> {person.nameZh}</span>
                  </p>
                )}

                <p className="text-xs md:text-sm text-white/60 tracking-wide">
                  {person.role}
                </p>

                {person.instagram && (
                  <a
                    href={person.instagram}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="Instagram"
                    className="inline-flex w-10 h-10 rounded-full border border-white/20 items-center justify-center text-white/70 hover:text-white hover:border-white/60 hover:bg-white/5 transition"
                  >
                    <Instagram className="w-4 h-4" />
                  </a>
                )}

                {person.bio && person.bio.length > 0 && (
                  <div className="space-y-4 text-white/80 leading-[2] text-sm md:text-[15px] mt-4">
                    {person.bio.map((p, i) => (
                      <p key={i}>{p}</p>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  )
}

export function AboutPageClient() {
  const [visible, setVisible] = useState(false)
  const [activeCategory, setActiveCategory] = useState<Category>("DESIGNER")
  const [menuOpen, setMenuOpen] = useState(false)
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const marqueeContainerRef = useRef<HTMLDivElement>(null)
  const marqueeTrackRef = useRef<HTMLDivElement>(null)
  const mouseXRef = useRef<number | null>(null)
  const translateXRef = useRef(0)

  const currentList = categories[activeCategory]

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80)
    return () => clearTimeout(t)
  }, [])

  // Reset marquee position when switching category
  useEffect(() => {
    translateXRef.current = 0
    if (marqueeTrackRef.current) {
      marqueeTrackRef.current.style.transform = "translate3d(0, 0, 0)"
    }
  }, [activeCategory])

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!menuOpen) return
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [menuOpen])

  useEffect(() => {
    let rafId = 0
    const MAX_SPEED = 5 // px per frame
    const EDGE_RATIO = 0.3 // 30% from each edge is the trigger zone

    const tick = () => {
      const container = marqueeContainerRef.current
      const track = marqueeTrackRef.current
      if (container && track) {
        const containerWidth = container.clientWidth
        // Use the offsetLeft of the duplicated set's first item as the exact wrap distance
        const secondSetFirst = track.children[currentList.length] as HTMLElement | undefined
        const wrapWidth = secondSetFirst?.offsetLeft ?? track.scrollWidth / 2

        let speed = 0
        const mouseX = mouseXRef.current
        if (mouseX !== null && wrapWidth > 0) {
          const edgeZone = containerWidth * EDGE_RATIO
          if (mouseX < edgeZone) {
            const intensity = 1 - mouseX / edgeZone
            speed = intensity * MAX_SPEED // positive = track moves right
          } else if (mouseX > containerWidth - edgeZone) {
            const intensity = (mouseX - (containerWidth - edgeZone)) / edgeZone
            speed = -intensity * MAX_SPEED
          }
        }

        if (speed !== 0 && wrapWidth > 0) {
          translateXRef.current += speed
          if (translateXRef.current > 0) translateXRef.current -= wrapWidth
          else if (translateXRef.current < -wrapWidth) translateXRef.current += wrapWidth
          track.style.transform = `translate3d(${translateXRef.current}px, 0, 0)`
        }
      }
      rafId = requestAnimationFrame(tick)
    }
    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
  }, [currentList.length])

  const handleMarqueeMouseMove = (e: ReactMouseEvent<HTMLDivElement>) => {
    const rect = marqueeContainerRef.current?.getBoundingClientRect()
    if (!rect) return
    mouseXRef.current = e.clientX - rect.left
  }

  const handleMarqueeMouseLeave = () => {
    mouseXRef.current = null
  }

  return (
    <>
      <Navbar />
      <main className="pt-20">
        {/* Hero — light-themed manifesto */}
        <section className="relative min-h-[88vh] flex flex-col overflow-hidden bg-[#bdbcb7]">
          {/* Background：整張岩石圖 + 白色遮罩 */}
          <div className="absolute inset-0 pointer-events-none">
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage: `url("/images/about/hero.jpg")`,
                filter: "grayscale(100%)",
              }}
            />
            {/* 白色遮罩：把整張照片柔化成淺色紋理 */}
            <div className="absolute inset-0 bg-white/65" />
          </div>

          {/* 右下角斜線裝飾 */}
          <div
            aria-hidden="true"
            className="absolute bottom-20 right-6 md:right-12 z-10 pointer-events-none"
            style={{
              transition: "opacity 1.1s ease 0.6s",
              opacity: visible ? 0.55 : 0,
            }}
          >
            <svg
              width="56"
              height="56"
              viewBox="0 0 56 56"
              fill="none"
              className="text-[#2a2a28]"
            >
              <line x1="6" y1="50" x2="50" y2="6" stroke="currentColor" strokeWidth="1.5" />
              <line x1="20" y1="50" x2="50" y2="20" stroke="currentColor" strokeWidth="1.5" />
              <line x1="34" y1="50" x2="50" y2="34" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </div>

          {/* 主內容：左右雙欄；靠上對齊讓文字停在岩石上方乾淨區 */}
          <div className="relative z-10 flex-1 flex items-start">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-12 w-full pt-20 md:pt-24 pb-12">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
                {/* 左欄：英文 manifesto，三段層級 */}
                <div className="lg:col-span-7">
                  <h1
                    style={{
                      transition: "opacity 0.9s ease, transform 0.9s ease",
                      opacity: visible ? 1 : 0,
                      transform: visible ? "translateY(0)" : "translateY(28px)",
                    }}
                    className="text-4xl md:text-5xl lg:text-6xl font-bold text-[#2a2a28] leading-[1.05] tracking-tight"
                  >
                    WE DESIGN WHAT LASTS
                  </h1>

                  <div
                    style={{
                      transition: "opacity 0.9s ease 0.18s, transform 0.9s ease 0.18s",
                      opacity: visible ? 1 : 0,
                      transform: visible ? "translateY(0)" : "translateY(20px)",
                    }}
                    className="mt-8 md:mt-10 space-y-1.5"
                  >
                    <p className="text-xs md:text-sm tracking-[0.32em] text-[#4a4a47] uppercase font-medium">
                      Shaped by time
                    </p>
                    <p className="text-xs md:text-sm tracking-[0.32em] text-[#6e6e6a] uppercase font-medium">
                      Defined by precision
                    </p>
                  </div>

                  <h2
                    style={{
                      transition: "opacity 0.9s ease 0.3s, transform 0.9s ease 0.3s",
                      opacity: visible ? 1 : 0,
                      transform: visible ? "translateY(0)" : "translateY(20px)",
                    }}
                    className="mt-10 md:mt-14 text-2xl md:text-3xl lg:text-4xl font-bold text-[#2a2a28] tracking-tight"
                  >
                    BUILT TO BECOME
                  </h2>
                </div>

                {/* 右欄：中文敘事 + CTA */}
                <div
                  className="lg:col-span-5 lg:pt-2"
                  style={{
                    transition: "opacity 0.9s ease 0.4s, transform 0.9s ease 0.4s",
                    opacity: visible ? 1 : 0,
                    transform: visible ? "translateY(0)" : "translateY(20px)",
                  }}
                >
                  <div className="space-y-5 text-[#3a3a37] text-[15px] md:text-base leading-[1.85] max-w-md lg:max-w-none">
                    <p>
                      提摩不為短暫的流行而設計，而是專注於創造能夠長久存在的價值。每一個品牌，都是在時間中被塑造；每一個細節，都是精準思考後的結果。
                    </p>
                    <p>
                      我們相信，真正有力量的設計，不只是被看見，而是能夠被記住、被信任，最終成為品牌的一部分。
                    </p>
                    <p>
                      不是瞬間的亮點，而是能夠沉澱、承載，並持續發生影響的存在。
                    </p>
                  </div>

                  <Link
                    href="/quote"
                    className="group mt-10 inline-flex items-center gap-3 px-7 py-3.5 border border-[#2a2a28] rounded-full text-sm text-[#2a2a28] hover:bg-[#2a2a28] hover:text-[#e7e6e2] transition-colors"
                  >
                    <span className="tracking-wider">填寫設計報價表單</span>
                    <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* 底部標語三段：TIME BUILT · PRECISION DRIVEN · LEGACY FORMED */}
          <div
            className="relative z-10 border-t border-[#2a2a28]/15"
            style={{
              transition: "opacity 0.9s ease 0.55s",
              opacity: visible ? 1 : 0,
            }}
          >
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-12 py-5 md:py-6 grid grid-cols-3 gap-4 text-[10px] md:text-[11px] tracking-[0.4em] uppercase text-[#3a3a37]">
              <span className="text-left">Time Built</span>
              <span className="text-center">Precision Driven</span>
              <span className="text-right">Legacy Formed</span>
            </div>
          </div>
        </section>

        {/* Designer Team Section */}
        <section className="relative py-16 bg-gradient-to-b from-temo-black to-temo-dark overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-temo-gold/20 to-transparent" />
          </div>

          <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {/* Section Label */}
            <div
              className="flex items-center justify-center gap-6 md:gap-12 mb-12"
              style={{
                transition: "opacity 0.8s ease",
                opacity: visible ? 1 : 0,
              }}
            >
              <div className="h-px w-16 md:w-24 bg-white/20" />

              <div ref={menuRef} className="relative">
                <button
                  type="button"
                  onClick={() => setMenuOpen((o) => !o)}
                  className="flex items-center gap-3 px-6 md:px-8 py-3 border border-white/30 rounded-full hover:bg-white/5 transition-colors"
                  aria-haspopup="listbox"
                  aria-expanded={menuOpen}
                >
                  <span className="text-xs md:text-sm tracking-[0.3em] text-temo-white uppercase font-medium">
                    {activeCategory}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-temo-white transition-transform duration-300 ${menuOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {menuOpen && (
                  <div
                    role="listbox"
                    className="absolute top-full left-1/2 -translate-x-1/2 mt-3 min-w-[200px] bg-temo-black/95 backdrop-blur-sm border border-white/20 rounded-2xl py-2 z-50 shadow-2xl"
                  >
                    {CATEGORY_ORDER.map((cat) => {
                      const isActive = cat === activeCategory
                      return (
                        <button
                          key={cat}
                          type="button"
                          role="option"
                          aria-selected={isActive}
                          onClick={() => {
                            setActiveCategory(cat)
                            setMenuOpen(false)
                          }}
                          className={`w-full px-6 py-2.5 text-xs tracking-[0.3em] uppercase text-left transition-colors ${
                            isActive
                              ? "text-temo-gold"
                              : "text-white/60 hover:text-white hover:bg-white/5"
                          }`}
                        >
                          {cat}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>

              <div className="h-px w-16 md:w-24 bg-white/20" />
            </div>

            {/* Designer Cards — edge-hover-driven rotation, equal size */}
            <div
              ref={marqueeContainerRef}
              onMouseMove={handleMarqueeMouseMove}
              onMouseLeave={handleMarqueeMouseLeave}
              className="relative w-full overflow-hidden py-4"
              style={{
                transition: "opacity 0.8s ease 0.2s",
                opacity: visible ? 1 : 0,
                maskImage:
                  "linear-gradient(to right, transparent, black 8%, black 92%, transparent)",
                WebkitMaskImage:
                  "linear-gradient(to right, transparent, black 8%, black 92%, transparent)",
              }}
            >
              <div
                ref={marqueeTrackRef}
                className="flex gap-6 md:gap-8 w-max will-change-transform"
              >
                {[...currentList, ...currentList].map((person, i) => (
                  <DesignerCard
                    key={`${activeCategory}-${person.name}-${i}`}
                    person={person}
                    onClick={() => setSelectedPerson(person)}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ─── 影片底圖 wrapper：跨「品牌理念 + Logo Meaning」兩段共用一份影片 ─── */}
        <div className="relative bg-temo-black overflow-hidden">
          {/* 單一影片，cover 兩段全部高度 */}
          <div className="absolute inset-0 pointer-events-none">
            <video
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              aria-hidden="true"
              className="absolute inset-0 w-full h-full object-cover motion-reduce:hidden"
              style={{ filter: "grayscale(60%) brightness(0.85)" }}
            >
              <source src="/videos/philosophy-bg.mp4" type="video/mp4" />
            </video>

            {/* 主遮罩：均勻 72% 黑覆蓋全長度，兩段對比一致 */}
            <div className="absolute inset-0 bg-temo-black/72" />

            {/* 頂部 vignette：與上一段（設計師團隊）銜接 */}
            <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-temo-black to-transparent" />
            {/* 底部 vignette：與下一段 StatsSection 銜接 */}
            <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-temo-black to-transparent" />

            {/* 微微 radial 聚焦 */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  "radial-gradient(ellipse at center, transparent 0%, transparent 40%, rgba(0,0,0,0.30) 100%)",
              }}
            />
          </div>

          {/* 品牌理念 section（透明，疊在影片上） */}
          <section className="relative py-24 md:py-32 overflow-hidden">

          <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {/* Big title */}
            <div className="flex items-center gap-6 mb-16">
              <div className="h-px flex-1 bg-gradient-to-r from-temo-gold/30 to-transparent" />
              <h2 className="text-4xl md:text-5xl font-black text-temo-white tracking-[0.15em]">品牌理念</h2>
              <div className="h-px flex-1 bg-gradient-to-l from-temo-gold/30 to-transparent" />
            </div>

            {/* Single column — Chinese on top, English below */}
            <div className="max-w-3xl mx-auto border-l border-temo-gold/30 pl-8 space-y-10">

              {/* Chinese paragraphs */}
              <div className="space-y-5">
                <p className="text-temo-white text-sm leading-[2] font-light">
                  在提摩，我們始終相信⸺設計不只是造型，更是一種療癒與解方。
                  我們以「以人為本」為核心，相信設計師並非只是替品牌打造外觀的 maker，
                  而更像是以洞察為診斷、以創意為處方的「品牌醫生」。透過精準觀察市場、
                  消費者與生活中的細微問題，對症下藥，替每一位客戶找出最適合的設計解決方案，
                  讓品牌真正被看見、被理解、被選擇。
                </p>
                <p className="text-temo-white text-sm leading-[2] font-light">
                  品牌名稱「提摩」源自摩西分紅海的故事。「提」象徵提拔、提筆、帶領，「摩」代表摩西。
                  寓意無論市場再怎麼飽和、競爭再怎麼激烈，只要找到提摩，我們都能像摩西分海般⸺
                  替品牌分開紅海，開出一條屬於自己的獨特道路。
                </p>
                <p className="text-temo-white text-sm leading-[2] font-light">
                  當品牌在洪流中感到害怕、迷惘或停滯時，提摩就是那面象徵信念與保護的盾牌，
                  是面對困境時最堅實的靠山。我們相信，就算是看似不可能的挑戰，
                  也能透過洞察、策略與設計手法找到突破口，為品牌打開新的航道。
                </p>
                <p className="text-temo-gold text-sm leading-[2] font-medium">
                  讓我們陪你一起，讓你的品牌成為業界最亮眼的一顆星⸺
                  在商業藍海的巨浪中領航前進，激起屬於你的市場迴響。
                </p>
              </div>

              {/* Divider */}
              <div className="w-12 h-px bg-temo-gold/30" />

              {/* English paragraphs */}
              <div className="space-y-5">
                <p className="text-temo-white text-xs leading-[2.2] font-light">
                  At TEMO, we believe that design is not merely about appearance—it is a form of healing and a solution.
                  With a people-centered philosophy at our core, we see designers not simply as makers who craft a brand&apos;s exterior,
                  but as &quot;brand doctors&quot; who diagnose through insight and prescribe through creativity.
                  By carefully observing the market, consumer behavior, and the subtle details of everyday life,
                  we identify problems with precision and deliver tailored design solutions for every client—
                  allowing brands to truly be seen, understood, and chosen.
                </p>
                <p className="text-temo-white text-xs leading-[2.2] font-light">
                  The name TEMO is inspired by the biblical story of Moses parting the Red Sea.
                  &quot;Te&quot; symbolizes lifting, leading, and creation; &quot;Mo&quot; represents Moses.
                  The name reflects our belief that no matter how saturated the market or how fierce the competition may be,
                  when brands find TEMO, we can help part the Red Sea of the marketplace, opening a unique path forward.
                </p>
                <p className="text-temo-white text-xs leading-[2.2] font-light">
                  When brands feel uncertain, overwhelmed, or stagnant in the current of competition,
                  TEMO becomes a shield of belief and protection—a reliable force in moments of challenge.
                  We believe that even the most impossible obstacles can reveal new opportunities through insight,
                  strategy, and design innovation, opening fresh routes for brands to move forward.
                </p>
                <p className="text-temo-gold/80 text-xs leading-[2.2] font-light">
                  Let us walk alongside you and help your brand become one of the brightest stars in the industry—
                  navigating the vast blue ocean of business and creating waves that resonate across the market.
                </p>
              </div>
            </div>
          </div>
        </section>

          <LogoMeaningSection />
        </div>
        {/* ─── 影片底圖 wrapper 結束 ─── */}

        <StatsSection />
        <ClientsHonorsSection />
      </main>
      <Footer />
      <DesignerDetailPanel person={selectedPerson} onClose={() => setSelectedPerson(null)} />
    </>
  )
}
