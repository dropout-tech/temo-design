"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, ArrowUpRight, Instagram } from "lucide-react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { cn } from "@/lib/utils"
import { getCategoryLabel, type Designer, type Work } from "@/lib/portfolio-data"

export function TeamMemberClient({
  designer,
  works,
  categoryGroups,
}: {
  designer: Designer
  works: Work[]
  categoryGroups?: { value: string; label: string }[]
}) {
  // 分類 label：優先用 Supabase 傳入的清單，找不到時退回寫死的 helper
  const catLabel = (v: string) =>
    categoryGroups?.find((g) => g.value === v)?.label ?? getCategoryLabel(v as never)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80)
    return () => clearTimeout(t)
  }, [])

  return (
    <>
      <Navbar />
      <main className="pt-[68px] bg-[#0c0b09] text-white">
        {/* Back link */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-10">
          <Link
            href="/about"
            className="inline-flex items-center gap-2 text-[11px] tracking-[0.3em] uppercase text-white/40 hover:text-temo-gold transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            回到團隊
          </Link>
        </div>

        {/* Hero */}
        <section className="relative py-16 md:py-24 overflow-hidden">
          <div
            className="absolute inset-0 flex items-center justify-end pr-8 pointer-events-none select-none overflow-hidden"
            aria-hidden="true"
          >
            <span className="text-[18vw] font-black text-white/[0.025] leading-none tracking-tighter">
              {designer.name}
            </span>
          </div>

          <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div
              className="grid md:grid-cols-[420px_1fr] gap-12 items-start"
              style={{
                transition: "opacity 0.9s ease, transform 0.9s ease",
                opacity: visible ? 1 : 0,
                transform: visible ? "translateY(0)" : "translateY(24px)",
              }}
            >
              {/* Photo */}
              <div className="relative aspect-[3/4] overflow-hidden rounded-sm border border-white/10">
                <Image
                  src={designer.photo}
                  alt={designer.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 420px"
                  priority
                />
              </div>

              {/* Bio */}
              <div>
                <p className="text-[10px] tracking-[0.5em] text-temo-gold uppercase mb-5">Designer</p>
                <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-2 tracking-tight">
                  {designer.name}
                </h1>
                {designer.nameZh && (
                  <p className="text-white/50 text-lg mb-4">{designer.nameZh}</p>
                )}
                <p className="text-white/60 text-sm tracking-wider uppercase mb-8">
                  {designer.role}
                </p>

                <div className="space-y-4 text-white/70 text-[15px] leading-relaxed max-w-xl">
                  {designer.bio.map((line, i) => (
                    <p key={i}>{line}</p>
                  ))}
                </div>

                {/* Expertise */}
                {designer.expertise.length > 0 && (
                  <div className="mt-8">
                    <p className="text-[10px] tracking-[0.3em] text-white/30 uppercase mb-3">擅長領域</p>
                    <div className="flex flex-wrap gap-2">
                      {designer.expertise.map((e) => (
                        <span
                          key={e}
                          className="px-3 py-1.5 text-[11px] tracking-wider border border-temo-gold/30 text-temo-gold rounded-sm"
                        >
                          {catLabel(e)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Social */}
                <div className="flex items-center gap-4 mt-8 pt-8 border-t border-white/8">
                  {designer.instagram && (
                    <Link
                      href={designer.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 py-3 text-white/50 hover:text-temo-gold transition-colors text-xs tracking-widest"
                    >
                      <Instagram className="w-4 h-4" />
                      INSTAGRAM
                    </Link>
                  )}
                  <Link
                    href="/contact"
                    className="ml-auto inline-flex items-center gap-2 px-6 py-3 bg-temo-gold text-black text-[11px] font-bold tracking-[0.25em] uppercase rounded-sm hover:brightness-110 transition-all"
                  >
                    合作邀約
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Designer's works */}
        <section className="py-20 md:py-28 border-t border-white/8">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between mb-12">
              <div>
                <p className="text-[10px] tracking-[0.5em] text-temo-gold uppercase mb-3">Works</p>
                <h2 className="text-3xl md:text-4xl font-bold">
                  {designer.name} 的作品
                </h2>
              </div>
              <span className="text-[11px] tracking-widest text-white/30">
                {works.length} 件作品
              </span>
            </div>

            {works.length === 0 ? (
              <div className="py-16 text-center text-white/40 text-sm">
                目前沒有公開的作品
              </div>
            ) : (
              <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
                {works.map((work, i) => (
                  <Link
                    key={work.id}
                    href={`/portfolio?designer=${designer.slug}#work-${work.id}`}
                    className="break-inside-avoid block group"
                    style={{
                      transition: `opacity 0.6s ease ${i * 0.05}s, transform 0.6s ease ${i * 0.05}s`,
                      opacity: visible ? 1 : 0,
                      transform: visible ? "translateY(0)" : "translateY(20px)",
                    }}
                  >
                    <div
                      className={cn(
                        "relative overflow-hidden",
                        work.size === "large"
                          ? "aspect-[4/5]"
                          : work.size === "medium"
                          ? "aspect-square"
                          : "aspect-[4/3]"
                      )}
                    >
                      <Image
                        src={work.cover}
                        alt={work.title}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                      <div
                        className="absolute inset-0 opacity-50 group-hover:opacity-100 transition-opacity duration-400"
                        style={{
                          background:
                            "linear-gradient(to top, rgba(12,11,9,0.92) 0%, rgba(12,11,9,0.2) 50%, transparent 100%)",
                        }}
                      />
                      <div className="absolute bottom-0 left-0 right-0 p-5">
                        <p className="text-[10px] tracking-[0.3em] text-temo-gold uppercase mb-1">
                          {catLabel(work.categoryGroup)}
                        </p>
                        <h3 className="text-base font-bold leading-tight">{work.title}</h3>
                        <p className="text-[11px] text-white/40 mt-0.5">{work.subtitle}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* CTA */}
            <div className="mt-20 pt-12 border-t border-white/8 text-center">
              <Link
                href="/portfolio"
                className="inline-flex items-center gap-2 text-xs tracking-[0.25em] uppercase text-white/50 hover:text-temo-gold transition-colors"
              >
                查看所有作品
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
