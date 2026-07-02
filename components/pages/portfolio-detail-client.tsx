"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { ArrowUpRight, Award, ChevronLeft } from "lucide-react"
import { useInView } from "@/hooks/use-in-view"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { VideoEmbed } from "@/components/video-embed"
import { isVideoUrl } from "@/lib/video"
import { proxyImage } from "@/lib/portfolio-data"

export type DetailDesigner = {
  slug: string
  name: string
  nameZh?: string
  role: string
  photo: string
}

export type DetailRelated = {
  slug: string
  title: string
  subtitle: string
  cover: string
  categoryLabel: string
  year: string
}

export type DetailIndustry = {
  value: string
  label: string
}

export type DetailProject = {
  slug: string
  title: string
  subtitle: string
  categoryLabel: string
  categoryGroup?: string         // 用來在導覽列連回 /portfolio?group=xxx
  industryLabels: string[]
  industries?: DetailIndustry[]  // 帶 value 的版本，可用於連結
  year: string
  clientName?: string
  clientSlug?: string
  clientBrief?: string
  description: string
  cover: string
  videoUrl?: string
  services?: string[]
  deliverables?: string[]
  challenge?: string
  approach?: string
  result?: string
  gallery?: { src: string; alt?: string; caption?: string }[]
  quote?: { text: string; author?: string }
  awards?: string[]
  designers: DetailDesigner[]
  related: DetailRelated[]
}

interface PortfolioDetailClientProps {
  project: DetailProject | null
}

export function PortfolioDetailClient({ project }: PortfolioDetailClientProps) {
  const [heroVisible, setHeroVisible] = useState(false)
  const { ref: bodyRef, isInView: bodyInView } = useInView<HTMLDivElement>({
    once: true,
    amount: 0.05,
  })

  useEffect(() => {
    const t = setTimeout(() => setHeroVisible(true), 60)
    return () => clearTimeout(t)
  }, [])

  if (!project) {
    return (
      <>
        <Navbar />
        <main className="pt-20 min-h-screen flex items-center justify-center bg-temo-black">
          <p className="text-temo-warm-gray">找不到此案例</p>
        </main>
        <Footer />
      </>
    )
  }

  const hasNarrative = Boolean(project.challenge || project.approach || project.result)
  const hasMeta =
    project.services?.length ||
    project.deliverables?.length ||
    project.designers.length ||
    project.clientName

  return (
    <>
      <Navbar />
      <main className="pt-20 bg-temo-black text-temo-white">
        {/* ─── Breadcrumb ───────────────────────────────────────────── */}
        <div className="border-b border-temo-warm-gray/10">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-5 flex items-center gap-2 text-xs tracking-wider text-temo-warm-gray/70">
            <Link href="/" className="hover:text-temo-gold transition-colors">
              首頁
            </Link>
            <span>/</span>
            <Link href="/portfolio" className="hover:text-temo-gold transition-colors">
              作品集
            </Link>
            <span>/</span>
            <span className="text-temo-white/80 truncate">{project.title}</span>
          </div>
        </div>

        {/* ─── 相關導覽列：分類 / 細項 / 客戶 / 設計師（皆可點） ─────── */}
        <RelatedNav project={project} />

        {/* ─── Hero ─────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-16 md:pt-24 pb-12 md:pb-20">
            <div
              style={{
                transition: "opacity 0.9s ease, transform 0.9s ease",
                opacity: heroVisible ? 1 : 0,
                transform: heroVisible ? "translateY(0)" : "translateY(28px)",
              }}
            >
              <p className="text-[10px] tracking-[0.5em] text-temo-gold mb-6 uppercase">
                {project.categoryLabel} · {project.year}
              </p>
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-temo-white leading-[1.1] tracking-tight mb-5">
                {project.title}
              </h1>
              {project.subtitle && (
                <p className="text-base md:text-lg text-temo-warm-gray/80 tracking-wide mb-8">
                  {project.subtitle}
                </p>
              )}
              <p className="text-lg md:text-xl text-temo-warm-gray max-w-3xl leading-relaxed">
                {project.description}
              </p>

            </div>
          </div>

          {/* Hero media — 有影片就放播放器，否則放滿版封面圖 */}
          {isVideoUrl(project.videoUrl) ? (
            <div
              style={{
                transition: "opacity 1.1s ease 0.2s",
                opacity: heroVisible ? 1 : 0,
              }}
            >
              <VideoEmbed
                url={project.videoUrl!}
                poster={project.cover}
                title={project.title}
              />
            </div>
          ) : (
            <div
              className="relative w-full aspect-[16/9] md:aspect-[21/9] overflow-hidden bg-temo-warm-gray/5"
              style={{
                transition: "opacity 1.1s ease 0.2s",
                opacity: heroVisible ? 1 : 0,
              }}
            >
              <Image
                src={proxyImage(project.cover)}
                alt={project.title}
                fill
                priority
                className="object-cover"
                sizes="100vw"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-temo-black/40 via-transparent to-transparent" />
            </div>
          )}
        </section>

        {/* ─── Body：敘事 + 側欄 ───────────────────────────────────── */}
        <section ref={bodyRef} className="py-20 md:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div
              className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16"
              style={{
                transition: "opacity 0.9s ease, transform 0.9s ease",
                opacity: bodyInView ? 1 : 0,
                transform: bodyInView ? "translateY(0)" : "translateY(28px)",
              }}
            >
              {/* Narrative */}
              <div className="lg:col-span-8 space-y-14">
                {project.challenge && (
                  <NarrativeBlock label="01 — 挑戰" title="Challenge" body={project.challenge} />
                )}
                {project.approach && (
                  <NarrativeBlock label="02 — 做法" title="Approach" body={project.approach} />
                )}
                {project.result && (
                  <NarrativeBlock label="03 — 成果" title="Result" body={project.result} />
                )}

                {!hasNarrative && (
                  <p className="text-temo-warm-gray/70 leading-relaxed">
                    本案例的完整介紹將在 CMS 上線後由我們上傳，敬請期待。
                  </p>
                )}

                {project.quote && (
                  <blockquote className="mt-4 border-l-2 border-temo-gold pl-6 py-2">
                    <p className="text-xl md:text-2xl text-temo-white/90 leading-relaxed font-light">
                      &ldquo;{project.quote.text}&rdquo;
                    </p>
                    {project.quote.author && (
                      <footer className="mt-4 text-xs tracking-[0.3em] text-temo-gold uppercase">
                        — {project.quote.author}
                      </footer>
                    )}
                  </blockquote>
                )}

                {project.awards && project.awards.length > 0 && (
                  <div className="mt-4 pt-10 border-t border-temo-warm-gray/15">
                    <p className="text-[10px] tracking-[0.4em] text-temo-gold uppercase mb-5">
                      Recognition
                    </p>
                    <ul className="space-y-3">
                      {project.awards.map((a) => (
                        <li
                          key={a}
                          className="flex items-start gap-3 text-temo-warm-gray text-sm md:text-base"
                        >
                          <Award className="w-4 h-4 mt-1 text-temo-gold flex-shrink-0" />
                          <span>{a}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Meta sidebar */}
              {hasMeta && (
                <aside className="lg:col-span-4">
                  <div className="lg:sticky lg:top-28 space-y-8 lg:border-l lg:border-temo-warm-gray/15 lg:pl-10">
                    {project.clientName && (
                      <MetaItem label="客戶 Client">
                        {project.clientSlug ? (
                          <Link
                            href={`/portfolio?client=${project.clientSlug}`}
                            className="group inline-flex items-center gap-1.5 text-temo-white font-medium hover:text-temo-gold transition-colors"
                          >
                            {project.clientName}
                            <ArrowUpRight className="w-3.5 h-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                          </Link>
                        ) : (
                          <p className="text-temo-white font-medium">{project.clientName}</p>
                        )}
                        {project.clientBrief && (
                          <p className="text-temo-warm-gray/70 text-sm mt-1">{project.clientBrief}</p>
                        )}
                      </MetaItem>
                    )}

                    <MetaItem label="年份 Year">
                      <p className="text-temo-white">{project.year}</p>
                    </MetaItem>

                    <MetaItem label="分類 Category">
                      <p className="text-temo-white">{project.categoryLabel}</p>
                    </MetaItem>

                    {project.services && project.services.length > 0 && (
                      <MetaItem label="服務範疇 Services">
                        <ul className="space-y-1.5">
                          {project.services.map((s) => (
                            <li key={s} className="text-temo-warm-gray text-sm">
                              ─ {s}
                            </li>
                          ))}
                        </ul>
                      </MetaItem>
                    )}

                    {project.deliverables && project.deliverables.length > 0 && (
                      <MetaItem label="交付項目 Deliverables">
                        <ul className="space-y-1.5">
                          {project.deliverables.map((d) => (
                            <li key={d} className="text-temo-warm-gray text-sm">
                              ─ {d}
                            </li>
                          ))}
                        </ul>
                      </MetaItem>
                    )}

                    {project.designers.length > 0 && (
                      <MetaItem label="設計團隊 Team">
                        <ul className="space-y-1">
                          {project.designers.map((d) => (
                            <li key={d.slug}>
                              <Link
                                href={`/team/${d.slug}`}
                                className="group flex items-center gap-3 -mx-2 px-2 py-1.5 rounded-lg hover:bg-temo-warm-gray/5 transition-colors"
                              >
                                <div className="relative w-10 h-10 rounded-full overflow-hidden border border-temo-warm-gray/20 group-hover:border-temo-gold/50 flex-shrink-0 transition-colors">
                                  <Image
                                    src={proxyImage(d.photo)}
                                    alt={d.name}
                                    fill
                                    className="object-cover"
                                    sizes="40px"
                                    referrerPolicy="no-referrer"
                                  />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-temo-white group-hover:text-temo-gold text-sm tracking-wider transition-colors">
                                    {d.name}
                                  </p>
                                  <p className="text-temo-warm-gray/60 text-xs truncate">{d.role}</p>
                                </div>
                                <ArrowUpRight className="w-3.5 h-3.5 ml-auto text-temo-warm-gray/0 group-hover:text-temo-gold transition-colors" />
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </MetaItem>
                    )}
                  </div>
                </aside>
              )}
            </div>
          </div>
        </section>

        {/* ─── Gallery（有資料才顯示） ──────────────────────────────── */}
        {project.gallery && project.gallery.length > 0 && (
          <section className="pb-20 md:pb-28">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <p className="text-[10px] tracking-[0.4em] text-temo-gold uppercase mb-8">
                Gallery
              </p>
              <div className="space-y-6 md:space-y-10">
                {project.gallery.map((g, i) => (
                  <figure key={i} className="space-y-3">
                    <div className="relative w-full aspect-video overflow-hidden bg-temo-warm-gray/5">
                      <Image
                        src={proxyImage(g.src)}
                        alt={g.alt ?? `${project.title} ${i + 1}`}
                        fill
                        className="object-cover"
                        sizes="(max-width: 1280px) 100vw, 1280px"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    {g.caption && (
                      <figcaption className="text-xs text-temo-warm-gray/60 tracking-wider">
                        {g.caption}
                      </figcaption>
                    )}
                  </figure>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ─── Related ─────────────────────────────────────────────── */}
        {project.related.length > 0 && (
          <section className="py-20 md:py-28 border-t border-temo-warm-gray/10">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="flex items-end justify-between mb-10">
                <div>
                  <p className="text-[10px] tracking-[0.4em] text-temo-gold uppercase mb-3">
                    Next Cases
                  </p>
                  <h2 className="text-3xl md:text-4xl font-bold text-temo-white">其他案例</h2>
                </div>
                <Link
                  href="/portfolio"
                  className="hidden sm:inline-flex items-center gap-2 text-sm text-temo-warm-gray hover:text-temo-gold transition-colors"
                >
                  看全部作品 <ArrowUpRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                {project.related.map((r) => (
                  <Link
                    key={r.slug}
                    href={`/portfolio/${r.slug}`}
                    className="group block"
                  >
                    <div className="relative aspect-[4/5] overflow-hidden bg-temo-warm-gray/5 mb-4">
                      <Image
                        src={proxyImage(r.cover)}
                        alt={r.title}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-temo-black/70 via-transparent to-transparent" />
                    </div>
                    <p className="text-[10px] tracking-[0.3em] text-temo-gold uppercase mb-1.5">
                      {r.categoryLabel} · {r.year}
                    </p>
                    <h3 className="text-lg md:text-xl text-temo-white group-hover:text-temo-gold transition-colors">
                      {r.title}
                    </h3>
                    <p className="text-sm text-temo-warm-gray/60 mt-1">{r.subtitle}</p>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ─── Footer CTA ──────────────────────────────────────────── */}
        <section className="py-16 md:py-20 border-t border-temo-warm-gray/10 bg-temo-black">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <Link
              href="/portfolio"
              className="inline-flex items-center gap-2 text-temo-warm-gray hover:text-temo-gold transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>返回作品集</span>
            </Link>
            <Link
              href="/quote"
              className="group inline-flex items-center gap-3 border border-temo-gold/60 px-7 py-4 text-temo-gold hover:bg-temo-gold hover:text-temo-black transition-colors"
            >
              <span className="text-sm tracking-[0.2em] uppercase">啟動您的專案</span>
              <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}

// ──────────────────────────────────────────────────────────────────
function NarrativeBlock({
  label,
  title,
  body,
}: {
  label: string
  title: string
  body: string
}) {
  return (
    <div>
      <p className="text-[10px] tracking-[0.4em] text-temo-gold uppercase mb-3">{label}</p>
      <h3 className="text-2xl md:text-3xl text-temo-white font-bold mb-5 tracking-tight">
        {title}
      </h3>
      <div className="space-y-5">
        {body.split("\n\n").map((p, i) => (
          <p
            key={i}
            className="text-base md:text-lg text-temo-warm-gray leading-relaxed whitespace-pre-line"
          >
            {p}
          </p>
        ))}
      </div>
    </div>
  )
}

function MetaItem({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] tracking-[0.4em] text-temo-gold uppercase mb-3">{label}</p>
      {children}
    </div>
  )
}

// ─── 相關導覽列 ──────────────────────────────────────────────────────────────

function RelatedNav({ project }: { project: DetailProject }) {
  const hasAny =
    project.categoryGroup ||
    (project.industries && project.industries.length > 0) ||
    project.clientSlug ||
    project.designers.length > 0

  if (!hasAny) return null

  const pillClass =
    "inline-flex items-center gap-1.5 px-3.5 py-2.5 md:px-3 md:py-1.5 rounded-full border border-temo-warm-gray/20 hover:border-temo-gold/60 text-xs text-temo-warm-gray/80 hover:text-temo-gold transition-colors"

  return (
    <div className="border-b border-temo-warm-gray/10 bg-temo-black/40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 flex flex-wrap items-center gap-x-6 gap-y-3">
        {/* 執行項目 */}
        {project.categoryGroup && (
          <NavGroup label="執行項目">
            <Link
              href={`/portfolio?group=${project.categoryGroup}`}
              className={pillClass}
            >
              {project.categoryLabel}
            </Link>
          </NavGroup>
        )}

        {/* 行業分類 */}
        {project.industries && project.industries.length > 0 && (
          <NavGroup label="行業">
            {project.industries.map((t) => (
              <Link
                key={t.value}
                href={`/portfolio?industry=${t.value}`}
                className={pillClass}
              >
                {t.label}
              </Link>
            ))}
          </NavGroup>
        )}

        {/* 客戶 */}
        {project.clientSlug && project.clientName && (
          <NavGroup label="客戶">
            <Link
              href={`/portfolio?client=${project.clientSlug}`}
              className={pillClass}
            >
              {project.clientName}
            </Link>
          </NavGroup>
        )}

        {/* 設計師 */}
        {project.designers.length > 0 && (
          <NavGroup label="設計師">
            {project.designers.map((d) => (
              <Link
                key={d.slug}
                href={`/team/${d.slug}`}
                className={pillClass}
              >
                <span className="relative w-5 h-5 rounded-full overflow-hidden bg-white/10">
                  <Image
                    src={proxyImage(d.photo)}
                    alt={d.name}
                    fill
                    className="object-cover"
                    sizes="20px"
                    referrerPolicy="no-referrer"
                  />
                </span>
                {d.name}
              </Link>
            ))}
          </NavGroup>
        )}
      </div>
    </div>
  )
}

function NavGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-[10px] tracking-[0.3em] text-temo-warm-gray/40 uppercase">
        {label}
      </span>
      {children}
    </div>
  )
}
