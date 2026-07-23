"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { useSearchParams } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { cn } from "@/lib/utils"
import { ArrowUpRight, X, Search } from "lucide-react"
import {
  WORKS as DEMO_WORKS,
  CATEGORY_GROUPS,
  INDUSTRIES,
  CLIENT_MAP,
  DESIGNER_MAP,
  getCategoryLabel,
  getIndustryLabel,
  proxyImage,
  type Work,
  type CategoryGroupValue,
} from "@/lib/portfolio-data"

export type { Work }

// 作品分類選項（可由 Supabase 傳入；未傳入時 fallback 到 portfolio-data 的常數）。
type Facet = { value: string; label: string }

// 以 DB facet 為主、找不到時退回寫死的 label helper，建立 value→label 查詢函式
function makeCatLabel(groups?: Facet[]) {
  const map = new Map((groups ?? CATEGORY_GROUPS).map((g) => [g.value, g.label]))
  return (v: string) => map.get(v) ?? getCategoryLabel(v as CategoryGroupValue)
}
function makeIndLabel(inds?: Facet[]) {
  const map = new Map((inds ?? INDUSTRIES).map((i) => [i.value, i.label]))
  return (v: string) => map.get(v) ?? getIndustryLabel(v)
}

// 客戶／設計師／年份三顆下拉的選項改由「實際作品資料」動態推導，不再用寫死的
// DESIGNERS/CLIENTS/getAllYears 靜態清單 —— 這樣選單必與後台資料庫連動，且選項
// 一定篩得到東西。名稱優先用既有的 CLIENT_MAP/DESIGNER_MAP 對照，對照不到（例如
// 後台剛新增、map 尚未同步）就退回顯示 slug 本身，不讓選單開天窗。
function deriveClientOptions(works: Work[]): Facet[] {
  const seen = new Map<string, string>()
  works.forEach((w) => {
    const slug = w.clientSlug?.trim()
    if (!slug || seen.has(slug)) return
    seen.set(slug, w.clientName || CLIENT_MAP[slug]?.name || slug)
  })
  return Array.from(seen, ([value, label]) => ({ value, label })).sort((a, b) =>
    a.label.localeCompare(b.label, "zh-Hant")
  )
}

function deriveDesignerOptions(works: Work[]): Facet[] {
  const seen = new Map<string, string>()
  works.forEach((w) => {
    ;(w.designerSlugs ?? []).forEach((slug, i) => {
      const s = slug?.trim()
      if (!s || seen.has(s)) return
      seen.set(s, w.designerNames?.[i] || DESIGNER_MAP[s]?.name || s)
    })
  })
  return Array.from(seen, ([value, label]) => ({ value, label })).sort((a, b) =>
    a.label.localeCompare(b.label, "zh-Hant")
  )
}

function deriveYearOptions(works: Work[]): string[] {
  const years = new Set<string>()
  works.forEach((w) => {
    const y = w.year?.trim()
    if (y) years.add(y)
  })
  return Array.from(years).sort((a, b) => b.localeCompare(a))
}


// ─── Filter Bar ────────────────────────────────────────────────────────────────

export type FilterState = {
  query: string
  group: string  // 執行項目（單選）："all" 或分類 value（可為後台新增的動態分類）
  industries: string[]               // 行業分類（複選，獨立維度）
  designer: string  // "all" or slug
  client: string    // "all" or slug
  year: string      // "all" or year
}

export const INITIAL_FILTERS: FilterState = {
  query: "",
  group: "all",
  industries: [],
  designer: "all",
  client: "all",
  year: "all",
}

// 把每件作品攤平成一段可搜尋的小寫字串，包含作品名、客戶、設計師、標籤等
function buildSearchHaystack(
  w: Work,
  catLabel: (v: string) => string,
  indLabel: (v: string) => string
): string {
  const parts: string[] = [
    w.title,
    w.subtitle,
    w.description,
    w.year,
    catLabel(w.categoryGroup),
    ...w.industries.map((i) => indLabel(i)),
  ]
  const client = CLIENT_MAP[w.clientSlug]
  if (client) {
    parts.push(client.name)
    if (client.brief) parts.push(client.brief)
  }
  w.designerSlugs.forEach((s) => {
    const d = DESIGNER_MAP[s]
    if (d) {
      parts.push(d.name)
      if (d.nameZh) parts.push(d.nameZh)
    }
  })
  return parts.join(" ").toLowerCase()
}

function FilterBar({
  filters,
  setFilters,
  works,
  filteredCount,
  categoryGroups,
  industries,
}: {
  filters: FilterState
  setFilters: (f: FilterState) => void
  works: Work[]
  filteredCount: number
  categoryGroups?: Facet[]
  industries?: Facet[]
}) {
  const years = useMemo(() => deriveYearOptions(works), [works])
  const clientOptions = useMemo(() => deriveClientOptions(works), [works])
  const designerOptions = useMemo(() => deriveDesignerOptions(works), [works])
  const groups = categoryGroups ?? CATEGORY_GROUPS
  const inds = industries ?? INDUSTRIES
  const catLabel = useMemo(() => makeCatLabel(categoryGroups), [categoryGroups])
  const indLabel = useMemo(() => makeIndLabel(industries), [industries])

  function toggleIndustry(value: string) {
    const next = filters.industries.includes(value)
      ? filters.industries.filter((i) => i !== value)
      : [...filters.industries, value]
    setFilters({ ...filters, industries: next })
  }

  // 行業分類是獨立維度，切換執行項目時不重設它
  function setGroup(group: string) {
    setFilters({ ...filters, group })
  }

  const hasActive =
    filters.query.trim() !== "" ||
    filters.group !== "all" ||
    filters.industries.length > 0 ||
    filters.designer !== "all" ||
    filters.client !== "all" ||
    filters.year !== "all"

  return (
    <div className="mb-12 space-y-6">
      {/* 五顆下拉選單：手機兩欄、桌面單列（chip 牆已退役） */}
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-x-3 gap-y-4 md:flex md:flex-wrap md:items-end md:gap-4">
          <FilterSelect
            label="執行項目"
            value={filters.group}
            onChange={setGroup}
            fullWidth
            options={[
              { value: "all", label: `全部（${works.length}）` },
              ...groups.map((cat) => ({
                value: cat.value,
                label: `${cat.label}（${works.filter((w) => w.categoryGroup === cat.value).length}）`,
              })),
            ]}
          />
          <IndustryMultiSelect
            industries={inds}
            selected={filters.industries}
            onToggle={toggleIndustry}
          />
          <FilterSelect
            label="客戶"
            value={filters.client}
            onChange={(v) => setFilters({ ...filters, client: v })}
            fullWidth
            options={[
              { value: "all", label: "全部客戶" },
              ...clientOptions,
            ]}
          />
          <FilterSelect
            label="設計師"
            value={filters.designer}
            onChange={(v) => setFilters({ ...filters, designer: v })}
            fullWidth
            options={[
              { value: "all", label: "全部設計師" },
              ...designerOptions,
            ]}
          />
          <FilterSelect
            label="年份"
            value={filters.year}
            onChange={(v) => setFilters({ ...filters, year: v })}
            fullWidth
            options={[
              { value: "all", label: "全部年份" },
              ...years.map((y) => ({ value: y, label: y })),
            ]}
          />
          {/* 桌面：件數與清除鈕跟下拉同列靠右 */}
          <div className="hidden md:flex md:ml-auto items-center gap-4 pb-2">
            {hasActive && (
              <button
                onClick={() => setFilters(INITIAL_FILTERS)}
                className="text-[10px] tracking-widest text-white/40 hover:text-temo-gold transition-colors uppercase"
              >
                清除全部
              </button>
            )}
            <span className="text-[10px] text-white/25 tracking-widest">
              {filteredCount} 件作品
            </span>
          </div>
        </div>
        {/* 手機：件數與清除鈕獨立一列 */}
        <div className="flex md:hidden items-center justify-between">
          <span className="text-[10px] text-white/25 tracking-widest">
            {filteredCount} 件作品
          </span>
          {hasActive && (
            <button
              onClick={() => setFilters(INITIAL_FILTERS)}
              className="py-2.5 text-[10px] tracking-widest text-white/40 hover:text-temo-gold transition-colors uppercase"
            >
              清除全部
            </button>
          )}
        </div>
      </div>

      {/* Active filter pills */}
      {hasActive && (
        <div className="flex items-center gap-1.5 flex-wrap pt-1">
          {filters.query.trim() !== "" && (
            <ActivePill
              label={`「${filters.query.trim()}」`}
              onRemove={() => setFilters({ ...filters, query: "" })}
            />
          )}
          {filters.group !== "all" && (
            <ActivePill label={catLabel(filters.group)} onRemove={() => setGroup("all")} />
          )}
          {filters.industries.map((i) => (
            <ActivePill
              key={i}
              label={indLabel(i)}
              onRemove={() => toggleIndustry(i)}
            />
          ))}
          {filters.client !== "all" && (
            <ActivePill
              label={CLIENT_MAP[filters.client]?.name ?? filters.client}
              onRemove={() => setFilters({ ...filters, client: "all" })}
            />
          )}
          {filters.designer !== "all" && (
            <ActivePill
              label={DESIGNER_MAP[filters.designer]?.name ?? filters.designer}
              onRemove={() => setFilters({ ...filters, designer: "all" })}
            />
          )}
          {filters.year !== "all" && (
            <ActivePill
              label={filters.year}
              onRemove={() => setFilters({ ...filters, year: "all" })}
            />
          )}
        </div>
      )}
    </div>
  )
}

export function SearchBox({
  value,
  onChange,
}: {
  value: string
  onChange: (v: string) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  // 鍵盤捷徑：「/」聚焦搜尋框（避開使用者正在輸入時觸發）
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== "/") return
      const el = e.target as HTMLElement | null
      const tag = el?.tagName
      if (tag === "INPUT" || tag === "TEXTAREA" || el?.isContentEditable) return
      e.preventDefault()
      inputRef.current?.focus()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  return (
    <div className="relative">
      <Search
        className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none"
        aria-hidden="true"
      />
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape" && value) {
            e.preventDefault()
            onChange("")
          }
        }}
        placeholder="搜尋作品、客戶、設計師、標籤…"
        aria-label="搜尋作品"
        className="w-full bg-[#161412] border border-white/10 hover:border-white/20 focus:border-temo-gold text-white placeholder:text-white/30 text-base md:text-sm pl-11 pr-24 py-3.5 rounded-sm focus:outline-none transition-colors"
      />
      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
        {value ? (
          <button
            onClick={() => onChange("")}
            aria-label="清除搜尋"
            className="w-6 h-6 rounded-full flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        ) : (
          <kbd className="hidden sm:inline-flex items-center justify-center w-6 h-6 rounded-sm border border-white/15 text-[11px] text-white/40 font-mono">
            /
          </kbd>
        )}
      </div>
    </div>
  )
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
  fullWidth = false,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
  fullWidth?: boolean
}) {
  return (
    <label className={cn("flex flex-col gap-1.5", fullWidth && "w-full md:w-auto")}>
      <span className="text-[10px] tracking-[0.3em] text-white/30 uppercase">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "bg-[#161412] border border-white/10 hover:border-white/25 text-white/80 text-base md:text-xs px-3 py-2.5 md:py-2 rounded-sm focus:outline-none focus:border-temo-gold transition-colors min-w-[140px] cursor-pointer",
          fullWidth && "w-full min-w-0 md:w-auto md:min-w-[140px]"
        )}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} className="bg-[#161412] text-white">
            {o.label}
          </option>
        ))}
      </select>
    </label>
  )
}

// 行業分類複選下拉：value 固定停在提示列，選一項＝切換一項；
// 已選項目顯示在下方的金色 ActivePill，可點 ✕ 移除。
function IndustryMultiSelect({
  industries,
  selected,
  onToggle,
}: {
  industries: readonly Facet[]
  selected: string[]
  onToggle: (value: string) => void
}) {
  return (
    <label className="flex flex-col gap-1.5 w-full md:w-auto">
      <span className="text-[10px] tracking-[0.3em] text-white/30 uppercase">行業分類（可複選）</span>
      <select
        value=""
        onChange={(e) => {
          if (e.target.value) onToggle(e.target.value)
        }}
        className={cn(
          "w-full min-w-0 md:w-auto md:min-w-[150px] bg-[#161412] border text-base md:text-xs px-3 py-2.5 md:py-2 rounded-sm focus:outline-none focus:border-temo-gold hover:border-white/25 transition-colors cursor-pointer",
          selected.length > 0 ? "border-temo-gold/40 text-temo-gold" : "border-white/10 text-white/80"
        )}
      >
        <option value="" className="bg-[#161412] text-white">
          {selected.length > 0 ? `已選 ${selected.length} 項` : "全部行業"}
        </option>
        {industries.map((ind) => {
          const active = selected.includes(ind.value)
          return (
            <option key={ind.value} value={ind.value} className="bg-[#161412] text-white">
              {active ? `✓ ${ind.label}（點選移除）` : ind.label}
            </option>
          )
        })}
      </select>
    </label>
  )
}

function ActivePill({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <button
      onClick={onRemove}
      className="group inline-flex items-center gap-1.5 px-3 py-2 md:px-2.5 md:py-1 bg-temo-gold/10 border border-temo-gold/30 text-temo-gold text-[11px] tracking-wider rounded-full hover:bg-temo-gold/20 transition-all"
    >
      {label}
      <X className="w-3.5 h-3.5 md:w-3 md:h-3 opacity-70 group-hover:opacity-100" />
    </button>
  )
}

// ─── Category Ticker（Hero 與 Grid 之間的過渡帶） ──────────────────────────────

function CategoryTicker({ works, categoryGroups }: { works: Work[]; categoryGroups?: Facet[] }) {
  // 依案例數量排序分類，只顯示有作品的類別
  const stats = useMemo(() => {
    const counts = new Map<string, number>()
    works.forEach((w) => counts.set(w.categoryGroup, (counts.get(w.categoryGroup) ?? 0) + 1))
    return (categoryGroups ?? CATEGORY_GROUPS)
      .filter((c) => counts.get(c.value))
      .map((c) => ({ label: c.label, count: counts.get(c.value) ?? 0 }))
  }, [works, categoryGroups])

  const years = useMemo(() => {
    const ys = Array.from(new Set(works.map((w) => w.year))).sort()
    if (ys.length === 0) return ""
    if (ys.length === 1) return ys[0]
    return `${ys[0]}–${ys[ys.length - 1]}`
  }, [works])

  return (
    <div className="border-y border-white/[0.06] bg-[#0c0b09]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-5 md:py-6 flex flex-wrap items-center gap-x-8 gap-y-3 text-[11px] tracking-[0.25em] uppercase">
        <span className="text-temo-gold/80 font-medium">Index</span>
        <span className="text-white/30">{years}</span>
        <span className="text-white/15">·</span>
        <span className="text-white/45">
          {works.length}
          <span className="text-white/30 ml-1.5 normal-case tracking-wider">件作品</span>
        </span>
        <span className="text-white/15 hidden sm:inline">·</span>
        <ul className="flex flex-wrap items-center gap-x-6 gap-y-2 text-white/40">
          {stats.map((s, i) => (
            <li key={s.label} className="flex items-center gap-2">
              {i > 0 && <span className="text-white/15 -ml-3">/</span>}
              <span>{s.label}</span>
              <span className="text-temo-gold/60 text-[10px]">{s.count}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

// ─── Portfolio Grid ────────────────────────────────────────────────────────────

export function PortfolioGrid({
  works,
  filters,
  setFilters,
  showFilters = true,
  transparentBg = false,
  categoryGroups,
  industries,
  allowedGroups,
}: {
  works: Work[]
  filters: FilterState
  setFilters: (f: FilterState) => void
  // 是否顯示上方整組篩選列；分類落地頁（公共藝術／產品／工藝）可傳 false 隱藏
  showFilters?: boolean
  // 分類落地頁鋪滿背景圖時傳 true：去掉本區深色實底，改半透明深色遮罩，露出後面的背景圖
  transparentBg?: boolean
  // 由 Supabase 傳入的分類選項；未傳入時 fallback 到 portfolio-data 常數
  categoryGroups?: Facet[]
  industries?: Facet[]
  // 分類落地頁用：只顯示這些執行項目的作品（使用者的篩選再疊加其上）；未傳＝不限制
  allowedGroups?: string[]
}) {
  const [hoveredId, setHoveredId] = useState<number | null>(null)
  const [visible, setVisible] = useState(false)
  const catLabel = useMemo(() => makeCatLabel(categoryGroups), [categoryGroups])
  const indLabel = useMemo(() => makeIndLabel(industries), [industries])

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100)
    return () => clearTimeout(t)
  }, [])

  // 預先計算每件作品的搜尋字串，避免每次輸入都重算
  const haystacks = useMemo(() => {
    const map = new Map<number, string>()
    works.forEach((w) => map.set(w.id, buildSearchHaystack(w, catLabel, indLabel)))
    return map
  }, [works, catLabel, indLabel])

  const filtered = useMemo(() => {
    // 支援空白分隔的多關鍵字（AND 邏輯）
    const tokens = filters.query
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean)

    return works.filter((w) => {
      if (allowedGroups && !allowedGroups.includes(w.categoryGroup)) return false
      if (filters.group !== "all" && w.categoryGroup !== filters.group) return false
      // 行業分類複選採「OR」：作品命中任一選取的產業即通過
      if (filters.industries.length > 0 && !filters.industries.some((i) => (w.industries as string[]).includes(i))) return false
      if (filters.designer !== "all" && !w.designerSlugs.includes(filters.designer)) return false
      if (filters.client !== "all" && w.clientSlug !== filters.client) return false
      if (filters.year !== "all" && w.year !== filters.year) return false
      if (tokens.length > 0) {
        const hay = haystacks.get(w.id) ?? ""
        if (!tokens.every((t) => hay.includes(t))) return false
      }
      return true
    })
  }, [works, filters, haystacks, allowedGroups])

  return (
    <section
      className={cn(
        "relative pt-10 md:pt-14 pb-24 md:pb-32",
        transparentBg ? "bg-transparent" : "bg-[#0c0b09]"
      )}
    >
      {/* 分類頁鋪背景圖時：半透明深色遮罩，讓白字／卡片在岩石圖上仍清晰 */}
      {transparentBg && <div className="absolute inset-0 bg-[#0c0b09]/80" />}
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {showFilters && (
          <div
            style={{
              transition: "opacity 0.6s ease",
              opacity: visible ? 1 : 0,
            }}
          >
            <FilterBar
              filters={filters}
              setFilters={setFilters}
              works={works}
              filteredCount={filtered.length}
              categoryGroups={categoryGroups}
              industries={industries}
            />
          </div>
        )}

        {/* Empty state：有篩選列時提示「清除篩選」；沒有篩選列（分類落地頁）時只說作品準備中 */}
        {filtered.length === 0 && (
          <div className="py-24 text-center">
            {showFilters ? (
              <>
                <p className="text-white/40 text-sm tracking-wider mb-3">沒有符合條件的作品</p>
                <button
                  onClick={() => setFilters(INITIAL_FILTERS)}
                  className="text-temo-gold text-xs tracking-widest uppercase hover:underline"
                >
                  清除篩選條件
                </button>
              </>
            ) : (
              <p className="text-white/40 text-sm tracking-wider">此分類的作品即將上線，敬請期待。</p>
            )}
          </div>
        )}

        {/* Masonry-style grid */}
        {filtered.length > 0 && (
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
            {filtered.map((work, i) => (
              <div
                key={work.id}
                className="break-inside-avoid"
                style={{
                  transition: `opacity 0.6s ease ${i * 0.05}s, transform 0.6s ease ${i * 0.05}s`,
                  opacity: visible ? 1 : 0,
                  transform: visible ? "translateY(0)" : "translateY(20px)",
                }}
              >
                <Link
                  href={`/portfolio/${work.slug}`}
                  className="relative w-full group overflow-hidden block text-left"
                  onMouseEnter={() => setHoveredId(work.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  aria-label={`查看 ${work.title}`}
                >
                  <div
                    className={cn(
                      "relative overflow-hidden",
                      work.size === "large" ? "aspect-[4/5]" : work.size === "medium" ? "aspect-square" : "aspect-[4/3]"
                    )}
                  >
                    <Image
                      src={proxyImage(work.cover)}
                      alt={work.title}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      referrerPolicy="no-referrer"
                    />

                    <div
                      className="absolute inset-0 transition-opacity duration-400"
                      style={{
                        background: "linear-gradient(to top, rgba(12,11,9,0.92) 0%, rgba(12,11,9,0.2) 50%, transparent 100%)",
                        opacity: hoveredId === work.id ? 1 : 0.5,
                      }}
                    />

                    <div
                      className="absolute top-4 right-4 w-8 h-8 rounded-full border border-white/30 bg-black/40 flex items-center justify-center transition-all duration-300"
                      style={{
                        opacity: hoveredId === work.id ? 1 : 0,
                        transform: hoveredId === work.id ? "scale(1)" : "scale(0.7)",
                      }}
                    >
                      <ArrowUpRight className="w-3.5 h-3.5 text-white" />
                    </div>

                    <div
                      className="absolute bottom-0 left-0 right-0 p-5 transition-transform duration-400"
                      style={{
                        transform: hoveredId === work.id ? "translateY(0)" : "translateY(6px)",
                      }}
                    >
                      <p className="text-[10px] tracking-[0.3em] text-temo-gold uppercase mb-1">
                        {catLabel(work.categoryGroup)}
                      </p>
                      <h3 className="text-base font-bold text-white leading-tight mb-0.5">{work.title}</h3>
                      <p className="text-[11px] text-white/40">{work.subtitle}</p>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        )}

        {/* Bottom CTA */}
        <div
          className="mt-20 pt-16 border-t border-white/8 flex flex-col sm:flex-row items-center justify-between gap-6"
          style={{
            transition: "opacity 0.7s ease 0.3s",
            opacity: visible ? 1 : 0,
          }}
        >
          <div>
            <p className="text-white/70 text-base font-medium mb-1">有設計需求？</p>
            <p className="text-white/35 text-sm">我們期待與您共同創作下一個故事。</p>
          </div>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 px-8 py-3 bg-temo-gold text-black text-xs font-bold tracking-[0.25em] uppercase rounded-sm hover:brightness-110 transition-all"
          >
            聯繫我們
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

    </section>
  )
}

// ─── Hero（簡單版：標題 + 描述 + stats + 大搜尋框） ─────────────────────────

function PortfolioHero({
  filters,
  setFilters,
}: {
  filters: FilterState
  setFilters: (f: FilterState) => void
}) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80)
    return () => clearTimeout(t)
  }, [])

  return (
    <section className="relative pt-24 md:pt-32 pb-12 md:pb-16 overflow-hidden bg-[#0c0b09]">
      <div
        className="absolute inset-x-0 bottom-0 flex items-end justify-end pr-4 md:pr-8 pointer-events-none select-none overflow-hidden"
        aria-hidden="true"
      >
        <span className="text-[20vw] font-black text-white/[0.04] leading-[0.8] tracking-tighter translate-y-[8%]">
          WORK
        </span>
      </div>

      <div
        className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"
        style={{
          transition: "opacity 0.9s ease, transform 0.9s ease",
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(24px)",
        }}
      >
        <p className="text-[10px] tracking-[0.5em] text-temo-gold uppercase mb-5">Portfolio</p>
        <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 text-balance leading-tight">
          作品集
        </h1>
        <p className="text-white/50 text-lg max-w-xl leading-relaxed">
          每個案例都是一段對話——聆聽品牌的需求，再用設計的語言回答。
        </p>

        <div className="flex gap-8 sm:gap-10 mt-10 mb-12 md:mb-14">
          {[
            { num: "200+", label: "完成案例" },
            { num: "8", label: "服務類別" },
            { num: "100%", label: "客戶回購率" },
          ].map((s) => (
            <div key={s.label}>
              <p className="text-2xl font-bold text-temo-gold">{s.num}</p>
              <p className="text-[11px] text-white/35 tracking-wider mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* 大搜尋框 */}
        <div className="max-w-3xl">
          <SearchBox
            value={filters.query}
            onChange={(q) => setFilters({ ...filters, query: q })}
          />
        </div>
      </div>
    </section>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function PortfolioPageClient({
  works,
  categoryGroups,
  industries,
}: {
  works?: Work[]
  categoryGroups?: Facet[]
  industries?: Facet[]
} = {}) {
  // 有從 Supabase 傳入就用，否則 fallback 到本地 DEMO_WORKS
  const effectiveWorks = works && works.length > 0 ? works : DEMO_WORKS

  // 支援由案例頁、explore 等地方透過 URL 參數帶入初始篩選
  // 支援的參數：?group=xxx&industry=xxx&client=xxx&designer=xxx&q=xxx
  const searchParams = useSearchParams()
  const initialFilters = useMemo<FilterState>(() => {
    const next: FilterState = { ...INITIAL_FILTERS }

    const groupParam = searchParams?.get("group")
    if (groupParam && (categoryGroups ?? CATEGORY_GROUPS).some((g) => g.value === groupParam)) {
      next.group = groupParam
    }

    const industryParam = searchParams?.get("industry")
    if (industryParam && (industries ?? INDUSTRIES).some((i) => i.value === industryParam)) {
      next.industries = [industryParam]
    }

    const clientParam = searchParams?.get("client")
    if (clientParam && effectiveWorks.some((w) => w.clientSlug === clientParam)) {
      next.client = clientParam
    }

    const designerParam = searchParams?.get("designer")
    if (designerParam && effectiveWorks.some((w) => w.designerSlugs.includes(designerParam))) {
      next.designer = designerParam
    }

    const queryParam = searchParams?.get("q")
    if (queryParam) next.query = queryParam

    return next
    // 只在第一次掛載時讀，後續使用者操作不再被 URL 蓋掉
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const [filters, setFilters] = useState<FilterState>(initialFilters)

  return (
    <>
      <Navbar />
      <main className="pt-[68px]">
        <PortfolioHero
          filters={filters}
          setFilters={setFilters}
        />

        {/* ─── 分類索引橫條（hero 與 grid 之間的視覺過渡） ─────────────── */}
        <CategoryTicker works={effectiveWorks} categoryGroups={categoryGroups} />

        <PortfolioGrid
          works={effectiveWorks}
          filters={filters}
          setFilters={setFilters}
          categoryGroups={categoryGroups}
          industries={industries}
        />
      </main>
      <Footer />
    </>
  )
}
