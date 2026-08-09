"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { ArrowUpRight, Award, ChevronLeft, Newspaper } from "lucide-react"
import { useInView } from "@/hooks/use-in-view"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { VideoEmbed } from "@/components/video-embed"
import { isVideoUrl } from "@/lib/video"
import { isUploadedVideoUrl } from "@/lib/media-url"
import { proxyImage } from "@/lib/portfolio-data"
import type { WorkBlock } from "@/lib/portfolio-supabase"

export type DetailDesigner = {
  /** 只有正式團隊成員有 slug／個人頁；單次合作設計師只顯示名稱 */
  slug?: string
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
  /** 只有固定行業分類有 value／篩選連結；作品專屬行業只顯示名稱 */
  value?: string
  label: string
}

// 新聞報導單行解析：「媒體名稱 https://連結」→ { label, url }。
// 沒有網址就整行當純文字；只貼網址沒名稱就以網址本身當顯示文字。
function parsePressMention(raw: string): { label: string; url?: string } {
  const m = raw.match(/https?:\/\/\S+/)
  if (!m) return { label: raw.trim() }
  const url = m[0]
  const label = raw
    .slice(0, m.index)
    .trim()
    .replace(/[:：|\-—]+$/, "")
    .trim()
  return { label: label || url, url }
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
  clientAddress?: string
  clientPhone?: string
  clientWebsite?: string
  /** 客戶 LOGO，選填可多張（一件作品可能有多位客戶）；顯示於作品內頁右側資訊欄最頂端 */
  clientLogos?: string[]
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
  /** 新聞報導：一行一筆「媒體名稱 https://連結」（連結選填），有值才顯示 Press 區塊 */
  pressMentions?: string[]
  designers: DetailDesigner[]
  related: DetailRelated[]
  /** 內頁首圖，未提供時退回 cover（本地 demo fallback 資料無此欄位） */
  hero?: string
  /** Adobe Portfolio 式內容區塊，未提供時由 gallery 轉換而來（見元件內 buildBlocksFromGallery） */
  blocks?: WorkBlock[]
}

/** 舊資料 fallback：把單欄 gallery 轉成 image 型別的 blocks，尺寸資料留空（渲染時退回自然比例） */
function buildBlocksFromGallery(
  gallery: DetailProject["gallery"]
): WorkBlock[] {
  return (gallery ?? []).map((g, i) => ({
    id: `legacy-gallery-${i}`,
    type: "image" as const,
    src: g.src,
    alt: g.alt ?? null,
    width: null,
    height: null,
    caption: g.caption ?? null,
  }))
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
    project.clientName ||
    project.clientLogos?.length

  // 內頁首圖：優先用後台設定的 hero，沒有就退回封面
  const heroSrc = project.hero || project.cover
  // 內容區塊：優先用 blocks（Supabase 已把舊 gallery 轉好），本地 demo fallback 資料沒有
  // blocks 欄位時，在這裡即時把既有 gallery 轉成單欄 image blocks
  const blocks: WorkBlock[] =
    project.blocks && project.blocks.length > 0
      ? project.blocks
      : buildBlocksFromGallery(project.gallery)

  return (
    <>
      <Navbar />
      <main className="pt-20 bg-temo-black text-temo-white">
        {/* ─── Breadcrumb ───────────────────────────────────────────── */}
        <div className="hidden md:block border-b border-temo-warm-gray/10">
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
        <MobileFilterNav project={project} />

        {/* ─── Hero ─────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden">
          <div className="hidden md:block mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-24 pb-20">
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
              <p className="text-lg md:text-xl text-temo-warm-gray max-w-3xl leading-relaxed whitespace-pre-line">
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
                poster={heroSrc}
                title={project.title}
              />
            </div>
          ) : isUploadedVideoUrl(heroSrc) ? (
            // 首圖是直接上傳的影片檔：原生 <video> 靜音循環播放（手機需 muted+playsInline 才能自動播）
            <div
              className="relative w-full aspect-[16/9] md:aspect-[21/9] overflow-hidden bg-temo-warm-gray/5"
              style={{
                transition: "opacity 1.1s ease 0.2s",
                opacity: heroVisible ? 1 : 0,
              }}
            >
              <video
                src={heroSrc}
                poster={
                  !isUploadedVideoUrl(project.cover) && project.cover !== heroSrc
                    ? proxyImage(project.cover)
                    : undefined
                }
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-temo-black/40 via-transparent to-transparent" />
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
                src={proxyImage(heroSrc)}
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
        <MobileProjectDetails project={project} hasNarrative={hasNarrative} />

        <section ref={bodyRef} className="hidden md:block py-20 md:py-28">
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

                {project.pressMentions && project.pressMentions.length > 0 && (
                  <div className="mt-4 pt-10 border-t border-temo-warm-gray/15">
                    <p className="text-[10px] tracking-[0.4em] text-temo-gold uppercase mb-5">
                      Press
                    </p>
                    <ul className="space-y-3">
                      {project.pressMentions.map((raw) => {
                        const { label, url } = parsePressMention(raw)
                        return (
                          <li
                            key={raw}
                            className="flex items-start gap-3 text-temo-warm-gray text-sm md:text-base"
                          >
                            <Newspaper className="w-4 h-4 mt-1 text-temo-gold flex-shrink-0" />
                            {url ? (
                              <a
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="break-words underline decoration-temo-warm-gray/30 underline-offset-4 transition-colors hover:text-temo-gold hover:decoration-temo-gold"
                              >
                                {label}
                                <ArrowUpRight className="inline-block w-3.5 h-3.5 ml-1 -mt-0.5" />
                              </a>
                            ) : (
                              <span className="break-words">{label}</span>
                            )}
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                )}
              </div>

              {/* Meta sidebar */}
              {hasMeta && (
                <aside className="lg:col-span-4">
                  <div className="lg:sticky lg:top-28 space-y-8 lg:border-l lg:border-temo-warm-gray/15 lg:pl-10">
                    {project.clientLogos && project.clientLogos.length > 0 && (
                      <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
                        {project.clientLogos.map((logo, i) => (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            key={`${logo}-${i}`}
                            src={proxyImage(logo)}
                            alt={
                              project.clientLogos!.length > 1
                                ? `${project.clientName || project.title} logo ${i + 1}`
                                : `${project.clientName || project.title} logo`
                            }
                            className="h-16 w-auto max-w-full object-contain"
                            referrerPolicy="no-referrer"
                          />
                        ))}
                      </div>
                    )}
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
                          {project.designers.map((d, index) => (
                            <li key={d.slug ?? `guest-${d.name}-${index}`}>
                              {d.slug ? (
                                <Link
                                  href={`/team/${d.slug}`}
                                  className="group flex items-center gap-3 -mx-2 px-2 py-1.5 rounded-lg hover:bg-temo-warm-gray/5 transition-colors"
                                >
                                  {d.photo && (
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
                                  )}
                                  <div className="min-w-0">
                                    <p className="text-temo-white group-hover:text-temo-gold text-sm tracking-wider transition-colors">
                                      {d.name}
                                    </p>
                                    {d.role && <p className="text-temo-warm-gray/60 text-xs truncate">{d.role}</p>}
                                  </div>
                                  <ArrowUpRight className="w-3.5 h-3.5 ml-auto text-temo-warm-gray/0 group-hover:text-temo-gold transition-colors" />
                                </Link>
                              ) : (
                                <div className="-mx-2 px-2 py-1.5 text-sm tracking-wider text-temo-white">
                                  {d.name}
                                </div>
                              )}
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

        {/* ─── 內容區塊（有資料才顯示）：圖片依原比例、可同列雙圖、文字、影片 ─── */}
        {blocks.length > 0 && (
          <BlocksSection blocks={blocks} projectTitle={project.title} />
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

              <div
                aria-label="其他案例，可左右滑動"
                className="-mx-4 flex touch-pan-x snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain scroll-smooth px-4 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-6 sm:overflow-visible sm:px-0 sm:pb-0 md:gap-8 lg:grid-cols-3"
              >
                {project.related.map((r) => (
                  <Link
                    key={r.slug}
                    href={`/portfolio/${r.slug}`}
                    className="group block w-[82vw] max-w-[320px] flex-none snap-start snap-always sm:w-auto sm:max-w-none"
                  >
                    <div className="relative aspect-[4/5] overflow-hidden bg-temo-warm-gray/5 mb-4">
                      <Image
                        src={proxyImage(r.cover)}
                        alt={r.title}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                        sizes="(max-width: 640px) 82vw, (max-width: 1024px) 50vw, 33vw"
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
            className="text-base md:text-lg text-temo-warm-gray leading-relaxed whitespace-pre-line break-words"
          >
            {p}
          </p>
        ))}
      </div>
    </div>
  )
}

// ─── 內容區塊渲染器（Adobe Portfolio 式：圖片依原比例／同列雙圖／文字／影片） ──────
function BlocksSection({
  blocks,
  projectTitle,
}: {
  blocks: WorkBlock[]
  projectTitle: string
}) {
  // 不觀察整個圖庫：長作品可能高達數萬 px，5% 可見比例會大於整個視窗，
  // IntersectionObserver 因而永遠不觸發，整區持續 opacity: 0。
  // 改由短小的 Gallery 標題觸發淡入，作品再長都能可靠顯示。
  const { ref: revealRef, isInView } = useInView<HTMLParagraphElement>({
    once: true,
    amount: 0.5,
    rootMargin: "0px 0px 120px 0px",
  })

  return (
    <section className="pb-20 md:pb-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <p
          ref={revealRef}
          className="text-[10px] tracking-[0.4em] text-temo-gold uppercase mb-8"
        >
          Gallery
        </p>
        <div
          className="space-y-8 md:space-y-12"
          style={{
            transition: "opacity 0.9s ease, transform 0.9s ease",
            opacity: isInView ? 1 : 0,
            transform: isInView ? "translateY(0)" : "translateY(28px)",
          }}
        >
          {blocks.map((block, i) => (
            <BlockItem key={block.id ?? i} block={block} index={i} projectTitle={projectTitle} />
          ))}
        </div>
      </div>
    </section>
  )
}

function BlockItem({
  block,
  index,
  projectTitle,
}: {
  block: WorkBlock
  index: number
  projectTitle: string
}) {
  if (block.type === "text") {
    if (!block.text) return null
    // 新資料是後台 Quill 富文本編輯器存下的 HTML（存檔時已消毒過）；舊資料仍是純文字，
    // 沿用原本的 "\n\n" 分段渲染，兩者向後相容並存。
    const isHtml = /<[a-z][\s\S]*>/i.test(block.text)
    return (
      <figure className="space-y-3">
        {isHtml ? (
          <div
            className="rich-text max-w-3xl mx-auto text-base md:text-lg text-temo-warm-gray leading-relaxed"
            dangerouslySetInnerHTML={{ __html: block.text }}
          />
        ) : (
          <div className="max-w-3xl mx-auto space-y-5">
            {block.text.split("\n\n").map((p, i) => (
              <p
                key={i}
                className="text-base md:text-lg text-temo-warm-gray leading-relaxed whitespace-pre-line break-words"
              >
                {p}
              </p>
            ))}
          </div>
        )}
        <ResponsiveBlockCaption
          desktop={block.caption}
          mobile={block.captionMobile}
          align="center"
        />
      </figure>
    )
  }

  if (block.type === "video") {
    if (!block.videoUrl) return null
    return (
      <figure className="space-y-3">
        <VideoEmbed url={block.videoUrl} title={projectTitle} />
        <ResponsiveBlockCaption desktop={block.caption} mobile={block.captionMobile} />
      </figure>
    )
  }

  // image：預設情境；src2 有值＝同列雙圖（桌面並排、手機堆疊，頂部對齊、不強制等高）
  if (!block.src) return null
  const hasSecond = Boolean(block.src2)

  return (
    <figure className="space-y-3">
      {hasSecond ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 items-start">
          <BlockImage
            src={block.src}
            alt={block.alt || `${projectTitle} ${index + 1}`}
            width={block.width}
            height={block.height}
          />
          <BlockImage
            src={block.src2!}
            alt={block.alt2 || `${projectTitle} ${index + 1}-2`}
            width={block.width2}
            height={block.height2}
          />
        </div>
      ) : (
        <BlockImage
          src={block.src}
          alt={block.alt || `${projectTitle} ${index + 1}`}
          width={block.width}
          height={block.height}
        />
      )}
      <ResponsiveBlockCaption desktop={block.caption} mobile={block.captionMobile} />
    </figure>
  )
}

function ResponsiveBlockCaption({
  desktop,
  mobile,
  align = "left",
}: {
  desktop?: string | null
  mobile?: string | null
  align?: "left" | "center"
}) {
  const desktopCaption = desktop?.trim() ? desktop : null
  const mobileCaption = mobile?.trim() ? mobile : desktopCaption
  const alignment = align === "center" ? "text-center" : "text-left"
  const captionClass = `whitespace-pre-line break-words text-xs leading-relaxed tracking-wider text-temo-warm-gray/60 ${alignment}`

  if (!desktopCaption && !mobileCaption) return null

  return (
    <>
      {mobileCaption && (
        <figcaption className={`${captionClass} md:hidden`}>{mobileCaption}</figcaption>
      )}
      {desktopCaption && (
        <figcaption className={`${captionClass} hidden md:block`}>{desktopCaption}</figcaption>
      )}
    </>
  )
}

/** 單張圖片：有原始尺寸就用 next/image 帶 width/height（自然比例、無版面跳動）；
 *  舊資料沒存尺寸時退回原生 img 的 w-full h-auto，一樣不裁切。 */
function BlockImage({
  src,
  alt,
  width,
  height,
}: {
  src: string
  alt: string
  width?: number | null
  height?: number | null
}) {
  if (width && height) {
    return (
      <Image
        src={proxyImage(src)}
        alt={alt}
        width={width}
        height={height}
        className="w-full h-auto"
        sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 640px"
        referrerPolicy="no-referrer"
      />
    )
  }
  return (
    // 沒有原始尺寸資料（舊資料）：用原生 img 讓瀏覽器依圖片本身比例呈現，不裁切
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={proxyImage(src)}
      alt={alt}
      className="w-full h-auto"
      loading="lazy"
      referrerPolicy="no-referrer"
    />
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

function MobileFilterNav({ project }: { project: DetailProject }) {
  const industries = project.industries ?? []
  const multipleIndustries = industries.length > 1

  return (
    <nav
      aria-label="作品篩選連結"
      className="md:hidden px-4 py-5"
    >
      <div
        className={
          multipleIndustries
            ? "grid grid-cols-2 gap-x-4 gap-y-5"
            : "grid grid-cols-3 gap-x-3"
        }
      >
        <MobileFilterLink
          label="年份"
          value={project.year || "未設定"}
          href={project.year ? `/portfolio?year=${encodeURIComponent(project.year)}` : "/portfolio"}
        />
        <MobileFilterLink
          label="執行項目"
          value={project.categoryLabel || "未分類"}
          href={
            project.categoryGroup
              ? `/portfolio?group=${encodeURIComponent(project.categoryGroup)}`
              : "/portfolio"
          }
        />

        {multipleIndustries ? (
          <div className="col-span-2 px-1 pt-1 text-center">
            <p className="mb-2 text-[9px] tracking-[0.24em] text-temo-warm-gray/45">行業</p>
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-1">
              {industries.map((industry) => (
                industry.value ? (
                  <Link
                    key={industry.value}
                    href={`/portfolio?industry=${encodeURIComponent(industry.value)}`}
                    className="inline-flex min-h-11 items-center gap-1.5 px-1 py-2 text-xs leading-snug text-temo-white underline decoration-temo-warm-gray/25 underline-offset-4 transition-colors hover:text-temo-gold hover:decoration-temo-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-temo-gold/70"
                  >
                    {industry.label}
                    <ArrowUpRight className="h-3 w-3 shrink-0 text-temo-gold" aria-hidden="true" />
                  </Link>
                ) : (
                  <span
                    key={`custom-${industry.label}`}
                    className="inline-flex min-h-11 items-center px-1 py-2 text-xs leading-snug text-temo-white"
                  >
                    {industry.label}
                  </span>
                )
              ))}
            </div>
          </div>
        ) : (
          <MobileFilterLink
            label="行業"
            value={industries[0]?.label || project.industryLabels[0] || "未分類"}
            href={
              industries[0]?.value
                ? `/portfolio?industry=${encodeURIComponent(industries[0].value)}`
                : undefined
            }
          />
        )}
      </div>
    </nav>
  )
}

function MobileFilterLink({
  label,
  value,
  href,
}: {
  label: string
  value: string
  href?: string
}) {
  const content = (
    <>
      <span className="text-[9px] tracking-[0.22em] text-temo-warm-gray/45">{label}</span>
      <span className="mt-1 line-clamp-2 text-[11px] font-medium leading-snug text-temo-white group-hover:text-temo-gold">
        {value}
      </span>
    </>
  )

  return href ? (
    <Link
      href={href}
      className="group flex min-h-14 min-w-0 flex-col items-center justify-center px-1 py-1 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-temo-gold/70"
    >
      {content}
    </Link>
  ) : (
    <div className="flex min-h-14 min-w-0 flex-col items-center justify-center px-1 py-1 text-center">
      {content}
    </div>
  )
}

function MobileProjectDetails({
  project,
  hasNarrative,
}: {
  project: DetailProject
  hasNarrative: boolean
}) {
  const hasClientContact = Boolean(
    project.clientAddress || project.clientPhone || project.clientWebsite
  )
  const hasClient = Boolean(
    project.clientLogos?.length || project.clientName || project.clientBrief || hasClientContact
  )
  const websiteHref = toWebsiteHref(project.clientWebsite)

  return (
    <article className="md:hidden px-4 pb-20">
      <header className="border-b border-temo-warm-gray/15 py-10">
        <h1 className="text-balance text-3xl font-bold leading-tight tracking-[-0.025em] text-temo-white">
          {project.title}
        </h1>
        {project.subtitle && (
          <p className="mt-3 text-sm leading-relaxed tracking-wide text-temo-warm-gray/65">
            {project.subtitle}
          </p>
        )}
      </header>

      {hasClient && (
        <section className="border-b border-temo-warm-gray/15 py-10">
          {project.clientLogos && project.clientLogos.length > 0 && (
            <div className="mb-7 flex flex-wrap items-center justify-center gap-6">
              {project.clientLogos.map((logo, index) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={`${logo}-${index}`}
                  src={proxyImage(logo)}
                  alt={
                    project.clientLogos!.length > 1
                      ? `${project.clientName || project.title} logo ${index + 1}`
                      : `${project.clientName || project.title} logo`
                  }
                  className="max-h-24 w-auto max-w-[min(70vw,18rem)] object-contain"
                  referrerPolicy="no-referrer"
                />
              ))}
            </div>
          )}

          {project.clientName && (
            <div className="text-center">
              {project.clientSlug ? (
                <Link
                  href={`/portfolio?client=${encodeURIComponent(project.clientSlug)}`}
                  className="inline-flex min-h-11 items-center justify-center gap-1.5 text-lg font-medium text-temo-white transition-colors hover:text-temo-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-temo-gold/70"
                >
                  {project.clientName}
                  <ArrowUpRight className="h-4 w-4 text-temo-gold" aria-hidden="true" />
                </Link>
              ) : (
                <p className="text-lg font-medium text-temo-white">{project.clientName}</p>
              )}
              {project.clientBrief && (
                <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-temo-warm-gray/60">
                  {project.clientBrief}
                </p>
              )}
            </div>
          )}

          {hasClientContact && (
            <div className="mt-8 border-t border-temo-warm-gray/10 pt-7">
              <MobileSectionHeading>客戶資訊</MobileSectionHeading>
              <dl className="mt-5 space-y-4 text-sm">
                {project.clientAddress && (
                  <div className="grid grid-cols-[4.5rem_minmax(0,1fr)] gap-3">
                    <dt className="text-temo-warm-gray/45">地址</dt>
                    <dd className="break-words text-temo-white/85">{project.clientAddress}</dd>
                  </div>
                )}
                {project.clientPhone && (
                  <div className="grid grid-cols-[4.5rem_minmax(0,1fr)] items-start gap-3">
                    <dt className="pt-3 text-temo-warm-gray/45">電話</dt>
                    <dd>
                      <a
                        href={`tel:${project.clientPhone.replace(/\s+/g, "")}`}
                        className="inline-flex min-h-11 items-center break-all text-temo-white/85 underline decoration-temo-warm-gray/30 underline-offset-4 hover:text-temo-gold"
                      >
                        {project.clientPhone}
                      </a>
                    </dd>
                  </div>
                )}
                {project.clientWebsite && (
                  <div className="grid grid-cols-[4.5rem_minmax(0,1fr)] items-start gap-3">
                    <dt className="pt-3 text-temo-warm-gray/45">官網</dt>
                    <dd>
                      {websiteHref ? (
                        <a
                          href={websiteHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex min-h-11 max-w-full items-center gap-1.5 break-all text-temo-white/85 underline decoration-temo-warm-gray/30 underline-offset-4 hover:text-temo-gold"
                        >
                          {project.clientWebsite}
                          <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-temo-gold" aria-hidden="true" />
                        </a>
                      ) : (
                        <span className="inline-flex min-h-11 items-center break-all text-temo-white/85">
                          {project.clientWebsite}
                        </span>
                      )}
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          )}
        </section>
      )}

      {(project.services?.length || project.deliverables?.length || project.designers.length > 0) && (
        <section className="space-y-7 border-b border-temo-warm-gray/15 py-10">
          {project.services && project.services.length > 0 && (
            <MobileEditorialMeta title="服務範疇" items={project.services} />
          )}
          {project.deliverables && project.deliverables.length > 0 && (
            <MobileEditorialMeta title="交付項目" items={project.deliverables} />
          )}
          {project.designers.length > 0 && (
            <MobileEditorialPeople designers={project.designers} />
          )}
        </section>
      )}

      {project.pressMentions && project.pressMentions.length > 0 && (
        <MobilePressMentions items={project.pressMentions} />
      )}

      {project.awards && project.awards.length > 0 && (
        <section className="border-b border-temo-warm-gray/15 py-10">
          <MobileSectionHeading>得獎與肯定</MobileSectionHeading>
          <ul className="mt-5 space-y-3">
            {project.awards.map((award) => (
              <li key={award} className="flex items-start gap-3 text-sm leading-relaxed text-temo-warm-gray">
                <Award className="mt-0.5 h-4 w-4 shrink-0 text-temo-gold" aria-hidden="true" />
                <span>{award}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {project.description && (
        <section className="border-b border-temo-warm-gray/15 py-12">
          <MobileSectionHeading>感言或前言</MobileSectionHeading>
          <p className="mt-5 whitespace-pre-line text-base leading-[1.85] text-temo-warm-gray">
            {project.description}
          </p>
        </section>
      )}

      {project.quote && (
        <section className="border-b border-temo-warm-gray/15 py-12">
          <MobileSectionHeading>客戶引言</MobileSectionHeading>
          <blockquote className="mt-5 border-l border-temo-gold/70 pl-5">
            <p className="text-xl font-light leading-relaxed text-temo-white/90">
              &ldquo;{project.quote.text}&rdquo;
            </p>
            {project.quote.author && (
              <footer className="mt-4 text-[10px] tracking-[0.24em] text-temo-gold uppercase">
                — {project.quote.author}
              </footer>
            )}
          </blockquote>
        </section>
      )}

      <section className="space-y-12 py-12">
        {project.challenge && <MobileNarrative title="Challenge" body={project.challenge} />}
        {project.approach && <MobileNarrative title="Approach" body={project.approach} />}
        {project.result && <MobileNarrative title="Result" body={project.result} />}
        {!hasNarrative && (
          <p className="text-sm leading-relaxed text-temo-warm-gray/65">
            本案例的完整介紹將在 CMS 上線後由我們上傳，敬請期待。
          </p>
        )}
      </section>
    </article>
  )
}

function MobileSectionHeading({ children }: { children: React.ReactNode }) {
  return <h2 className="text-sm font-medium tracking-[0.18em] text-temo-gold">{children}</h2>
}

function MobileEditorialMeta({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="grid grid-cols-[5.5rem_minmax(0,1fr)] items-start gap-x-4">
      <MobileSectionHeading>{title}</MobileSectionHeading>
      <p className="-mt-1 text-[17px] leading-[1.75] tracking-wide text-temo-white/90">
        {items.join(" · ")}
      </p>
    </div>
  )
}

function MobileEditorialPeople({ designers }: { designers: DetailDesigner[] }) {
  return (
    <div className="grid grid-cols-[5.5rem_minmax(0,1fr)] items-start gap-x-4">
      <MobileSectionHeading>參與人員</MobileSectionHeading>
      <ul className="-mt-2 space-y-3">
        {designers.map((designer) => (
          <li key={designer.slug}>
            <Link
              href={`/team/${designer.slug}`}
              className="group flex min-h-14 items-center gap-3 py-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-temo-gold/70"
            >
              <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-temo-warm-gray/20">
                <Image
                  src={proxyImage(designer.photo)}
                  alt={designer.name}
                  fill
                  className="object-cover"
                  sizes="40px"
                  referrerPolicy="no-referrer"
                />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium leading-snug text-temo-white group-hover:text-temo-gold">
                  {designer.nameZh || designer.name}
                </span>
                <span className="mt-1 block text-[11px] leading-snug text-temo-warm-gray/55">
                  {designer.role || "參與設計"}
                </span>
              </span>
              <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-temo-gold" aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

function MobilePressMentions({ items }: { items: string[] }) {
  return (
    <section className="border-b border-temo-warm-gray/15 py-10">
      <MobileSectionHeading>新聞與媒體連結</MobileSectionHeading>
      <ul className="mt-5 space-y-2">
        {items.map((raw) => {
          const { label, url } = parsePressMention(raw)
          return (
            <li key={raw}>
              {url ? (
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex min-h-11 items-center gap-3 border border-temo-warm-gray/10 px-3 py-2.5 text-sm leading-relaxed text-temo-warm-gray transition-colors hover:border-temo-gold/45 hover:text-temo-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-temo-gold/70"
                >
                  <Newspaper className="h-4 w-4 shrink-0 text-temo-gold" aria-hidden="true" />
                  <span className="min-w-0 flex-1 break-words">{label}</span>
                  <ArrowUpRight className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                </a>
              ) : (
                <div className="flex min-h-11 items-center gap-3 border border-temo-warm-gray/10 px-3 py-2.5 text-sm leading-relaxed text-temo-warm-gray">
                  <Newspaper className="h-4 w-4 shrink-0 text-temo-gold" aria-hidden="true" />
                  <span className="break-words">{label}</span>
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}

function MobileNarrative({ title, body }: { title: string; body: string }) {
  return (
    <div>
      <h2 className="text-2xl font-bold tracking-[-0.02em] text-temo-white">{title}</h2>
      <div className="mt-5 space-y-5">
        {body.split("\n\n").map((paragraph, index) => (
          <p
            key={index}
            className="whitespace-pre-line break-words text-base leading-[1.85] text-temo-warm-gray"
          >
            {paragraph}
          </p>
        ))}
      </div>
    </div>
  )
}

function toWebsiteHref(website?: string): string | undefined {
  const value = website?.trim()
  if (!value) return undefined
  if (/^https?:\/\//i.test(value)) return value
  if (/^[a-z][a-z\d+.-]*:/i.test(value)) return undefined
  return `https://${value}`
}

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
    <div className="hidden md:block border-b border-temo-warm-gray/10 bg-temo-black/40">
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
              t.value ? (
                <Link
                  key={t.value}
                  href={`/portfolio?industry=${encodeURIComponent(t.value)}`}
                  className={pillClass}
                >
                  {t.label}
                </Link>
              ) : (
                <span
                  key={`custom-${t.label}`}
                  className="inline-flex items-center rounded-full border border-temo-warm-gray/20 px-3.5 py-2.5 text-xs text-temo-warm-gray/80 md:px-3 md:py-1.5"
                >
                  {t.label}
                </span>
              )
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
            {project.designers.map((d, index) =>
              d.slug ? (
                <Link
                  key={d.slug}
                  href={`/team/${d.slug}`}
                  className={pillClass}
                >
                  {d.photo && (
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
                  )}
                  {d.name}
                </Link>
              ) : (
                <span
                  key={`guest-${d.name}-${index}`}
                  className="inline-flex items-center rounded-full border border-temo-warm-gray/20 px-3.5 py-2.5 text-xs text-temo-warm-gray/80 md:px-3 md:py-1.5"
                >
                  {d.name}
                </span>
              )
            )}
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
