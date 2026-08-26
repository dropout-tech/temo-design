"use client"

import { useMemo, useRef, useState, useTransition } from "react"
import Link from "next/link"
import {
  ExternalLink,
  Eye,
  EyeOff,
  Filter,
  GripVertical,
  ImageOff,
  Loader2,
  Pencil,
  Plus,
  Search,
} from "lucide-react"
import {
  reorderWorks,
  setWorkCardSize,
  setWorkPublished,
} from "@/app/studio/(app)/works/actions"
import { SortableList, type DragHandleProps } from "@/components/studio/sortable-list"
import { cn } from "@/lib/utils"

export type StudioWorkRow = {
  id: string
  slug: string
  title: string
  subtitle: string | null
  cover_url: string | null
  year: string | null
  published: boolean
  size: "large" | "medium" | "small"
  sort: number
  category_groups: { label: string } | null
  work_category_groups?: {
    sort: number
    category_groups: { label: string } | null
  }[]
  clients: { name: string } | null
}

function categoryLabels(work: StudioWorkRow): string[] {
  const labels = (work.work_category_groups ?? [])
    .slice()
    .sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0))
    .map((relation) => relation.category_groups?.label)
    .filter((label): label is string => Boolean(label))
  if (labels.length > 0) return labels
  return work.category_groups?.label ? [work.category_groups.label] : []
}

type StatusFilter = "all" | "published" | "draft" | "missing-cover"

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "全部" },
  { value: "published", label: "已上架" },
  { value: "draft", label: "草稿" },
  { value: "missing-cover", label: "缺封面" },
]

export function WorksManager({ initialWorks }: { initialWorks: StudioWorkRow[] }) {
  const [works, setWorks] = useState(initialWorks)
  const committedWorks = useRef(initialWorks)
  const [query, setQuery] = useState("")
  const [status, setStatus] = useState<StatusFilter>("all")
  const [category, setCategory] = useState("all")
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [sizePendingId, setSizePendingId] = useState<string | null>(null)
  const [error, setError] = useState("")
  const [orderError, setOrderError] = useState("")
  const [publishPending, startPublishTransition] = useTransition()
  const [sizePending, startSizeTransition] = useTransition()
  const [orderPending, startOrderTransition] = useTransition()

  const categories = useMemo(() => {
    const labels = new Set<string>()
    works.forEach((work) => {
      categoryLabels(work).forEach((label) => labels.add(label))
    })
    return Array.from(labels).sort((a, b) => a.localeCompare(b, "zh-Hant"))
  }, [works])

  const counts = useMemo(
    () => ({
      total: works.length,
      published: works.filter((w) => w.published).length,
      draft: works.filter((w) => !w.published).length,
      missingCover: works.filter((w) => !w.cover_url).length,
      largeCards: works.filter((w) => w.size === "large").length,
      squareCards: works.filter((w) => w.size === "medium").length,
      smallCards: works.filter((w) => w.size === "small").length,
    }),
    [works]
  )

  const filteredWorks = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return works.filter((work) => {
      if (status === "published" && !work.published) return false
      if (status === "draft" && work.published) return false
      if (status === "missing-cover" && work.cover_url) return false
      const workCategories = categoryLabels(work)
      if (category !== "all" && !workCategories.includes(category)) return false
      if (!needle) return true
      const haystack = [
        work.title,
        work.subtitle,
        work.slug,
        work.year,
        ...workCategories,
        work.clients?.name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
      return haystack.includes(needle)
    })
  }, [category, query, status, works])

  function togglePublished(work: StudioWorkRow) {
    const nextPublished = !work.published
    setError("")
    setPendingId(work.id)
    setWorks((prev) =>
      prev.map((item) => (item.id === work.id ? { ...item, published: nextPublished } : item))
    )
    startPublishTransition(async () => {
      const res = await setWorkPublished(work.id, nextPublished)
      setPendingId(null)
      if (res.error) {
        setWorks((prev) =>
          prev.map((item) => (item.id === work.id ? { ...item, published: work.published } : item))
        )
        setError(res.error)
        return
      }
      committedWorks.current = committedWorks.current.map((item) =>
        item.id === work.id ? { ...item, published: nextPublished } : item
      )
    })
  }

  function changeCardSize(work: StudioWorkRow, size: StudioWorkRow["size"]) {
    if (work.size === size) return
    setError("")
    setSizePendingId(work.id)
    setWorks((prev) => prev.map((item) => (item.id === work.id ? { ...item, size } : item)))
    startSizeTransition(async () => {
      const res = await setWorkCardSize(work.id, size)
      setSizePendingId(null)
      if (res.error) {
        setWorks((prev) =>
          prev.map((item) => (item.id === work.id ? { ...item, size: work.size } : item))
        )
        setError(res.error)
        return
      }
      committedWorks.current = committedWorks.current.map((item) =>
        item.id === work.id ? { ...item, size } : item
      )
    })
  }

  function commitOrder(next: StudioWorkRow[]) {
    const normalized = next.map((work, index) => ({ ...work, sort: index + 1 }))
    const previous = committedWorks.current
    setWorks(normalized)
    setOrderError("")
    startOrderTransition(async () => {
      const res = await reorderWorks(normalized.map((work) => work.id))
      if (res.error) {
        setWorks(previous)
        setOrderError(res.error)
        return
      }
      committedWorks.current = normalized
    })
  }

  function moveWorkByKeyboard(id: string, key: string) {
    const fromIndex = works.findIndex((work) => work.id === id)
    if (fromIndex < 0) return

    let toIndex = fromIndex
    if (key === "ArrowUp" || key === "ArrowLeft") toIndex = fromIndex - 1
    if (key === "ArrowDown" || key === "ArrowRight") toIndex = fromIndex + 1
    if (key === "Home") toIndex = 0
    if (key === "End") toIndex = works.length - 1
    toIndex = Math.max(0, Math.min(works.length - 1, toIndex))
    if (toIndex === fromIndex) return

    const next = works.slice()
    const [moved] = next.splice(fromIndex, 1)
    next.splice(toIndex, 0, moved)
    setWorks(next)
    commitOrder(next)
  }

  function clearFilters() {
    setQuery("")
    setStatus("all")
    setCategory("all")
  }

  const hasFilters = Boolean(query.trim() || status !== "all" || category !== "all")
  const canReorder = !hasFilters

  function renderWorkRow(work: StudioWorkRow, handle?: DragHandleProps) {
    return (
      <div className="grid gap-3 py-3.5 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
        <div className="flex items-center gap-3 min-w-0">
          {handle && (
            <button
              type="button"
              aria-label={`拖曳「${work.title}」調整前台順序`}
              title="拖曳調整前台順序；也可聚焦後按方向鍵"
              disabled={orderPending || sizePending || publishPending}
              className="flex min-h-11 min-w-11 shrink-0 items-center justify-center text-temo-warm-gray/35 hover:text-temo-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-temo-gold/60 active:cursor-grabbing disabled:cursor-wait disabled:opacity-40"
              {...handle}
              onKeyDown={(event) => {
                if (!["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return
                event.preventDefault()
                moveWorkByKeyboard(work.id, event.key)
              }}
            >
              <GripVertical className="w-4 h-4" />
            </button>
          )}

          <div className="w-16 h-16 rounded-md overflow-hidden bg-white/[0.04] border border-white/10 shrink-0">
            {work.cover_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={work.cover_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-temo-warm-gray/30">
                <ImageOff className="w-5 h-5" />
              </div>
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <p className="text-temo-white font-medium truncate">{work.title}</p>
              {!work.published && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/[0.06] text-temo-warm-gray/60 shrink-0">
                  草稿
                </span>
              )}
              {!work.cover_url && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-400/10 text-red-300/85 shrink-0">
                  缺封面
                </span>
              )}
            </div>

            <div className="mt-1 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
              <p className="max-w-full truncate text-xs text-temo-warm-gray/50">
                {[categoryLabels(work).join("、"), work.clients?.name, work.year]
                  .filter(Boolean)
                  .join(" · ") || "尚未補分類資訊"}
              </p>
            </div>

            <p className="text-[11px] text-temo-warm-gray/30 font-mono truncate mt-1">
              /portfolio/{work.slug}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center sm:justify-end">
          <label
            className="inline-flex min-h-9 w-full items-center justify-between gap-2 rounded-sm border border-white/10 bg-temo-black/35 px-2.5 transition-colors hover:border-white/25 focus-within:border-temo-gold/60 sm:w-auto sm:justify-start"
            title="決定作品探索頁的卡片外框比例；圖片構圖請到「編輯 → 媒體」調整。"
          >
            <span className="text-[10px] font-medium tracking-[0.08em] text-temo-warm-gray/45">
              卡片比例
            </span>
            <select
              aria-label={`${work.title} 的探索卡片比例`}
              value={work.size}
              disabled={sizePending && sizePendingId === work.id}
              onChange={(event) =>
                changeCardSize(work, event.target.value as StudioWorkRow["size"])
              }
              className="min-h-9 bg-transparent text-xs text-temo-warm-gray/80 outline-none disabled:cursor-wait disabled:opacity-50"
            >
              <option value="large">直式 4:5</option>
              <option value="medium">正方 1:1</option>
              <option value="small">橫式 4:3</option>
            </select>
            {sizePending && sizePendingId === work.id && (
              <Loader2 className="h-3 w-3 animate-spin text-temo-gold" aria-label="儲存卡片比例" />
            )}
          </label>
          <button
            type="button"
            disabled={publishPending}
            onClick={() => togglePublished(work)}
            className={cn(
              "inline-flex min-h-9 items-center justify-center gap-1.5 px-3 py-2 text-xs border rounded-sm transition-colors disabled:opacity-60 sm:justify-start",
              work.published
                ? "border-temo-gold/35 text-temo-gold hover:bg-temo-gold/10"
                : "border-white/10 text-temo-warm-gray/65 hover:text-temo-white hover:border-white/25"
            )}
          >
            {publishPending && pendingId === work.id ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : work.published ? (
              <Eye className="w-3.5 h-3.5" />
            ) : (
              <EyeOff className="w-3.5 h-3.5" />
            )}
            {work.published ? "已上架" : "草稿"}
          </button>
          <Link
            href={`/portfolio/${work.slug}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-9 items-center justify-center gap-1.5 px-3 py-2 text-xs text-temo-warm-gray/65 hover:text-temo-gold border border-white/10 hover:border-temo-gold/40 rounded-sm transition-colors sm:justify-start"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            前台
          </Link>
          <Link
            href={`/studio/works/${work.id}`}
            className="inline-flex min-h-9 items-center justify-center gap-1.5 px-3 py-2 text-xs text-temo-warm-gray/70 hover:text-temo-gold border border-white/10 hover:border-temo-gold/40 rounded-sm transition-colors sm:justify-start"
          >
            <Pencil className="w-3.5 h-3.5" />
            編輯
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="px-6 md:px-10 py-10 md:py-14 max-w-6xl">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-8 gap-5">
        <div>
          <p className="text-[10px] tracking-[0.5em] text-temo-gold uppercase mb-2">Portfolio</p>
          <h1 className="text-3xl md:text-4xl font-bold text-temo-white">作品管理</h1>
          <p className="text-temo-warm-gray/60 text-sm mt-1">
            共 {counts.total} 件作品 · {counts.published} 件上架 · {counts.draft} 件草稿
          </p>
          <p className="mt-1 text-xs text-temo-warm-gray/40">
            探索卡片：直式 {counts.largeCards} · 正方 {counts.squareCards} · 橫式 {counts.smallCards}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/portfolio"
            target="_blank"
            className="inline-flex items-center gap-2 px-4 py-3 border border-white/12 text-temo-warm-gray/75 hover:text-temo-gold hover:border-temo-gold/40 text-xs font-bold tracking-[0.12em] uppercase rounded-sm transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            前台作品集
          </Link>
          <Link
            href="/studio/works/new"
            className="inline-flex items-center gap-2 px-5 py-3 bg-temo-gold text-temo-black text-xs font-bold tracking-[0.15em] uppercase rounded-sm hover:brightness-110 active:scale-[0.98] transition-all"
          >
            <Plus className="w-4 h-4" />
            新增作品
          </Link>
        </div>
      </div>

      <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4 mb-5">
        <div className="grid gap-3 lg:grid-cols-[minmax(260px,1fr)_auto_auto] lg:items-center">
          <label className="relative block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-temo-warm-gray/35" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-temo-black/40 border border-white/10 text-temo-white text-sm placeholder:text-temo-warm-gray/35 focus:border-temo-gold/60 focus:outline-none rounded-sm"
              placeholder="搜尋作品、客戶、年份、slug"
            />
          </label>

          <div className="flex flex-wrap items-center gap-2">
            {STATUS_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setStatus(option.value)}
                className={cn(
                  "px-3 py-2 rounded-sm border text-xs transition-colors",
                  status === option.value
                    ? "border-temo-gold/55 bg-temo-gold/12 text-temo-gold"
                    : "border-white/10 text-temo-warm-gray/65 hover:text-temo-white hover:border-white/25"
                )}
              >
                {option.label}
              </button>
            ))}
          </div>

          <label className="relative min-w-[180px]">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-temo-warm-gray/35" />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full pl-10 pr-8 py-3 bg-temo-black/40 border border-white/10 text-temo-warm-gray/85 text-sm focus:border-temo-gold/60 focus:outline-none rounded-sm"
            >
              <option value="all">全部分類</option>
              {categories.map((label) => (
                <option key={label} value={label} className="bg-temo-black">
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-4 border-t border-white/[0.06]">
          <p className="text-xs text-temo-warm-gray/45">
            目前顯示 {filteredWorks.length} 件 · 缺封面 {counts.missingCover} 件
          </p>
          {hasFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="text-xs text-temo-warm-gray/55 hover:text-temo-gold transition-colors"
            >
              清除篩選
            </button>
          )}
        </div>
      </div>

      {error && (
        <p className="mb-4 rounded-md border border-red-400/20 bg-red-400/8 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      )}

      {works.length > 1 && (
        <div className="mb-3 flex min-h-6 flex-wrap items-center gap-x-2 gap-y-1 text-xs text-temo-warm-gray/45">
          <GripVertical className="w-3.5 h-3.5" />
          {canReorder ? (
            <span>拖曳把手調整前台順序；聚焦把手後也可使用方向鍵。</span>
          ) : (
            <span>清除搜尋與篩選後即可拖曳排序。</span>
          )}
          {orderPending && (
            <span className="inline-flex items-center gap-1.5 text-temo-gold/75">
              <Loader2 className="w-3 h-3 animate-spin" /> 儲存順序…
            </span>
          )}
        </div>
      )}

      {orderError && (
        <p className="mb-4 rounded-md border border-red-400/20 bg-red-400/8 px-3 py-2 text-sm text-red-300">
          排序儲存失敗：{orderError}
        </p>
      )}

      {canReorder ? (
        <SortableList
          items={works}
          getKey={(work) => work.id}
          onReorder={setWorks}
          onCommit={commitOrder}
          className="divide-y divide-white/[0.06] border-y border-white/[0.06]"
          renderItem={(work, handle) => renderWorkRow(work, handle)}
        />
      ) : (
        <div className="divide-y divide-white/[0.06] border-y border-white/[0.06]">
          {filteredWorks.map((work) => (
            <div key={work.id}>{renderWorkRow(work)}</div>
          ))}
        </div>
      )}

      {filteredWorks.length === 0 && works.length > 0 && (
        <div className="rounded-lg border border-dashed border-white/12 py-12 text-center">
          <p className="text-temo-white text-sm">找不到符合條件的作品。</p>
          <button
            type="button"
            onClick={clearFilters}
            className="mt-3 text-xs text-temo-gold hover:brightness-125 transition"
          >
            清除篩選
          </button>
        </div>
      )}

      {works.length === 0 && (
        <div className="rounded-lg border border-dashed border-white/12 py-12 text-center">
          <p className="text-temo-warm-gray/50 text-sm">還沒有作品資料。</p>
          <Link
            href="/studio/works/new"
            className="mt-4 inline-flex items-center gap-2 px-5 py-3 bg-temo-gold text-temo-black text-xs font-bold tracking-[0.15em] uppercase rounded-sm hover:brightness-110 transition"
          >
            <Plus className="w-4 h-4" />
            新增第一件作品
          </Link>
        </div>
      )}
    </div>
  )
}
