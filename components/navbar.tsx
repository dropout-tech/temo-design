"use client"

import { useState, useEffect, type FormEvent } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { X, AlignJustify, Search, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"

const navLinks = [
  { href: "/contact", label: "CONTACT US", labelZh: "聯絡我們" },
  { href: "/about", label: "ABOUT US", labelZh: "關於我們" },
]

const menuLinks = [
  { href: "/", label: "HOME", labelZh: "首頁" },
  { href: "/about", label: "ABOUT", labelZh: "關於我們" },
  { href: "/explore", label: "WORKS", labelZh: "作品探索" },
  { href: "/faq", label: "FAQ", labelZh: "常見問題" },
  { href: "/contact", label: "CONTACT", labelZh: "聯絡我們" },
]

export function Navbar({ showSearch = false }: { showSearch?: boolean }) {
  const pathname = usePathname()
  const router = useRouter()
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [q, setQ] = useState("")

  const handleSearch = (e: FormEvent) => {
    e.preventDefault()
    const query = q.trim()
    router.push(query ? `/portfolio?q=${encodeURIComponent(query)}` : "/portfolio")
  }

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 60)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : ""
    return () => { document.body.style.overflow = "" }
  }, [menuOpen])

  // Hide entirely on full-screen explore page
  if (pathname === "/explore") return null

  return (
    <>
      {/* ── Fixed Header ── */}
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
          scrolled ? "bg-[#0f0e0c]/90 backdrop-blur-xl border-b border-white/5" : "bg-transparent"
        )}
        style={{
          transform: mounted ? "translateY(0)" : "translateY(-100%)",
          transition: "transform 0.65s cubic-bezier(0.22,1,0.36,1), background 0.4s, border-color 0.4s",
        }}
      >
        <div className="mx-auto max-w-[1600px] px-5 sm:px-8 lg:px-10">
          <div className="relative flex h-[68px] items-center justify-between gap-6">
            {/* Logo */}
            <Link href="/" className="shrink-0 flex items-center h-12 relative z-10" aria-label="TEMO DESIGN">
              <img
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo-17-gxNRwXn7tMwIRkd2cGdAdl3qzorZib.png"
                alt="TEMO DESIGN"
                className="h-full w-auto object-contain"
              />
            </Link>

            {/* 中間：分類落地頁顯示搜尋框，其餘頁面維持原本的 CONTACT / ABOUT 連結 */}
            {showSearch ? (
              <form
                onSubmit={handleSearch}
                className="hidden lg:block absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[38vw] max-w-[440px]"
              >
                <div className="relative">
                  <input
                    type="text"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="SEARCH"
                    aria-label="搜尋作品"
                    className="w-full bg-white/[0.03] border border-white/25 rounded-full pl-6 pr-12 py-2.5 text-[11px] tracking-[0.3em] uppercase text-white placeholder:text-white/40 focus:border-white/60 focus:bg-white/[0.06] focus:outline-none transition-all"
                  />
                  <button
                    type="submit"
                    aria-label="搜尋"
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors"
                  >
                    <Search className="h-4 w-4" />
                  </button>
                </div>
              </form>
            ) : (
              <nav className="hidden lg:flex items-center gap-12 xl:gap-16 absolute left-1/2 top-1/2 -translate-y-1/2 translate-x-[16%]">
                {navLinks.map((item) => {
                  const active = pathname === item.href
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "group relative flex items-baseline gap-2 transition-colors duration-200",
                        active ? "text-temo-gold" : "text-white/90 hover:text-white"
                      )}
                    >
                      <span className="text-[12px] tracking-[0.25em] font-medium">{item.label}</span>
                      <span className="text-[11px] text-white/70 group-hover:text-white transition-colors">{item.labelZh}</span>
                      <span className={cn(
                        "absolute -bottom-1 left-0 h-px bg-temo-gold transition-all duration-300",
                        active ? "w-full" : "w-0 group-hover:w-full"
                      )} />
                    </Link>
                  )
                })}
              </nav>
            )}

            {/* Hamburger — top thick, middle medium, bottom thin */}
            <button
              onClick={() => setMenuOpen(true)}
              className="group flex h-11 w-11 -mr-2.5 flex-col items-end justify-center gap-[5px] pr-2.5 relative z-10"
              aria-label="Open menu"
            >
              <span className="block w-6 h-[2.5px] bg-white/85 group-hover:bg-white transition-colors" />
              <span className="block w-6 h-[1.5px] bg-white/85 group-hover:bg-white transition-colors" />
              <span className="block w-6 h-[0.5px] bg-white/85 group-hover:bg-white transition-colors" />
            </button>
          </div>
        </div>
      </header>

      {/* ── Full-screen Menu Overlay ── */}
      <div
        className="fixed inset-0 z-[200] flex"
        style={{
          pointerEvents: menuOpen ? "auto" : "none",
          visibility: menuOpen ? "visible" : "hidden",
        }}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-[#0c0b09]"
          style={{
            opacity: menuOpen ? 1 : 0,
            transition: "opacity 0.4s ease",
          }}
        />

        {/* Content */}
        <div className="relative w-full flex flex-col justify-between px-8 sm:px-16 py-10 overflow-y-auto">
          {/* Top bar */}
          <div className="flex items-center justify-between">
            <Link href="/" onClick={() => setMenuOpen(false)} aria-label="TEMO DESIGN">
              <img
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo-17-gxNRwXn7tMwIRkd2cGdAdl3qzorZib.png"
                alt="TEMO DESIGN"
                className="h-12 w-auto object-contain"
              />
            </Link>
            <button
              onClick={() => setMenuOpen(false)}
              className="flex h-11 w-11 -m-2.5 items-center justify-center text-white/50 hover:text-white transition-colors"
              aria-label="Close menu"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Search */}
          <div
            className="mt-8"
            style={{
              transition: `opacity 0.4s ease ${menuOpen ? "0.08s" : "0s"}`,
              opacity: menuOpen ? 1 : 0,
            }}
          >
            <div className="relative max-w-md">
              <input
                type="text"
                placeholder="搜尋服務、作品..."
                className="w-full bg-white/5 border border-white/12 rounded-sm px-5 py-3.5 text-sm text-white placeholder:text-white/25 focus:border-temo-gold/60 focus:bg-white/8 focus:outline-none transition-all"
              />
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/25" />
            </div>
          </div>

          {/* Nav items */}
          <nav className="flex flex-col gap-1 my-auto pt-8 pb-4">
            {menuLinks.map((item, i) => {
              const active = pathname === item.href
              return (
                <div
                  key={item.href}
                  style={{
                    transition: `opacity 0.5s ease ${menuOpen ? 0.1 + i * 0.06 : 0}s, transform 0.5s cubic-bezier(0.22,1,0.36,1) ${menuOpen ? 0.1 + i * 0.06 : 0}s`,
                    opacity: menuOpen ? 1 : 0,
                    transform: menuOpen ? "translateX(0)" : "translateX(-24px)",
                  }}
                >
                  <Link
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    className={cn(
                      "group flex items-baseline gap-3 py-2.5 border-b border-white/5 transition-colors",
                      active ? "text-temo-gold" : "text-white/80 hover:text-white"
                    )}
                  >
                    <span className="text-[10px] text-white/20 w-5 tabular-nums tracking-wider">{String(i + 1).padStart(2, "0")}</span>
                    <span className="text-3xl sm:text-5xl font-bold tracking-tight leading-tight">{item.label}</span>
                    <span className="text-base text-white/30 group-hover:text-white/50 transition-colors">{item.labelZh}</span>
                  </Link>
                </div>
              )
            })}
          </nav>

          {/* Footer in menu */}
          <div
            style={{
              transition: `opacity 0.5s ease ${menuOpen ? 0.55 : 0}s`,
              opacity: menuOpen ? 1 : 0,
            }}
            className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-white/8"
          >
            <p className="text-xs text-white/30 tracking-wider">www.temo.design</p>
            <Link
              href="/contact"
              onClick={() => setMenuOpen(false)}
              className="inline-flex items-center gap-2 bg-temo-gold text-temo-black text-xs font-bold tracking-[0.2em] px-6 py-2.5 rounded-full hover:brightness-110 transition-all"
            >
              立即諮詢
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
