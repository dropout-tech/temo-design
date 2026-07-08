"use client"

import { useState, useTransition } from "react"
import { Loader2, Check } from "lucide-react"
import { saveLanding, type LandingInput } from "@/app/studio/(app)/landings/actions"

const inputCls =
  "w-full px-3 py-2.5 bg-white/[0.03] border border-white/10 text-temo-white text-sm placeholder:text-white/20 focus:border-temo-gold/60 focus:outline-none transition-all rounded-sm"
const labelCls = "text-[11px] tracking-wider text-temo-warm-gray/60 uppercase"

export type LandingRow = {
  slug: string
  num: string | null
  title_en: string[] | null
  tagline_zh: string | null
  tagline_en: string | null
  cta_label: string | null
  cta_href: string | null
  portfolio_group: string | null
  hide_filters: boolean | null
  sort: number | null
}

type CategoryOption = { value: string; label: string }

type EditableLanding = {
  slug: string
  num: string
  title_en: string
  tagline_zh: string
  tagline_en: string
  cta_label: string
  cta_href: string
  portfolio_group: string
  hide_filters: boolean
  sort: number
}

function toEditable(row: LandingRow): EditableLanding {
  return {
    slug: row.slug,
    num: row.num ?? "",
    title_en: (row.title_en ?? []).join("\n"),
    tagline_zh: row.tagline_zh ?? "",
    tagline_en: row.tagline_en ?? "",
    cta_label: row.cta_label ?? "",
    cta_href: row.cta_href ?? "",
    portfolio_group: row.portfolio_group ?? "all",
    hide_filters: row.hide_filters ?? false,
    sort: row.sort ?? 0,
  }
}

export function LandingManager({
  landings,
  categoryOptions,
}: {
  landings: LandingRow[]
  categoryOptions: CategoryOption[]
}) {
  const [rows, setRows] = useState<EditableLanding[]>(landings.map(toEditable))

  function updateRow(slug: string, patch: Partial<EditableLanding>) {
    setRows((p) => p.map((r) => (r.slug === slug ? { ...r, ...patch } : r)))
  }

  return (
    <div className="px-6 md:px-10 py-10 md:py-14 max-w-4xl">
      <div className="mb-8">
        <p className="text-[10px] tracking-[0.5em] text-temo-gold uppercase mb-2">Landings</p>
        <h1 className="text-3xl md:text-4xl font-bold text-temo-white">服務落地頁</h1>
        <p className="text-temo-warm-gray/60 text-sm mt-1">
          編輯 4 個服務介紹頁（/services/…）的 Hero 文案。網址（slug）不可更改。
        </p>
      </div>

      <div className="space-y-4">
        {rows
          .slice()
          .sort((a, b) => a.sort - b.sort)
          .map((row) => (
            <LandingCard
              key={row.slug}
              row={row}
              categoryOptions={categoryOptions}
              onChange={(p) => updateRow(row.slug, p)}
            />
          ))}
      </div>
    </div>
  )
}

function LandingCard({
  row,
  categoryOptions,
  onChange,
}: {
  row: EditableLanding
  categoryOptions: CategoryOption[]
  onChange: (p: Partial<EditableLanding>) => void
}) {
  const [pending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState("")

  const dirty = (p: Partial<EditableLanding>) => {
    onChange(p)
    setSaved(false)
  }

  function handleSave() {
    setError("")
    const input: LandingInput = {
      slug: row.slug,
      num: row.num,
      title_en: row.title_en
        .split("\n")
        .map((s) => s.trim())
        .filter((s) => s !== ""),
      tagline_zh: row.tagline_zh,
      tagline_en: row.tagline_en,
      cta_label: row.cta_label,
      cta_href: row.cta_href,
      portfolio_group: row.portfolio_group,
      hide_filters: row.hide_filters,
      sort: row.sort,
    }
    startTransition(async () => {
      const res = await saveLanding(input)
      if (res.error) setError(res.error)
      else setSaved(true)
    })
  }

  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4 md:p-5">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-temo-gold text-sm font-bold">{row.num || "—"}</span>
        <span className="text-temo-warm-gray/50 text-sm">{row.slug}</span>
      </div>

      <div className="grid gap-4">
        <label className="space-y-1 block">
          <span className={labelCls}>大標（英文，一行一個字，例：BRAND / & / GRAPHIC）</span>
          <textarea
            className={`${inputCls} min-h-[90px] resize-y`}
            value={row.title_en}
            onChange={(e) => dirty({ title_en: e.target.value })}
            placeholder={"BRAND\n&\nGRAPHIC"}
          />
        </label>

        <label className="space-y-1 block">
          <span className={labelCls}>中文標語（可換行）</span>
          <textarea
            className={`${inputCls} min-h-[70px] resize-y`}
            value={row.tagline_zh}
            onChange={(e) => dirty({ tagline_zh: e.target.value })}
          />
        </label>

        <label className="space-y-1 block">
          <span className={labelCls}>英文標語（可換行）</span>
          <textarea
            className={`${inputCls} min-h-[70px] resize-y`}
            value={row.tagline_en}
            onChange={(e) => dirty({ tagline_en: e.target.value })}
          />
        </label>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="space-y-1 block">
            <span className={labelCls}>按鈕文字</span>
            <input
              className={inputCls}
              value={row.cta_label}
              onChange={(e) => dirty({ cta_label: e.target.value })}
              placeholder="例：價格試算表單"
            />
          </label>
          <label className="space-y-1 block">
            <span className={labelCls}>按鈕連結</span>
            <input
              className={inputCls}
              value={row.cta_href}
              onChange={(e) => dirty({ cta_href: e.target.value })}
              placeholder="例：/contact"
            />
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-4 items-end">
          <label className="space-y-1 block">
            <span className={labelCls}>作品預設篩選（執行項目）</span>
            <select
              className={inputCls}
              value={row.portfolio_group}
              onChange={(e) => dirty({ portfolio_group: e.target.value })}
            >
              <option value="all">全部</option>
              {categoryOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex items-center gap-2 pb-2.5 whitespace-nowrap">
            <input
              type="checkbox"
              checked={row.hide_filters}
              onChange={(e) => dirty({ hide_filters: e.target.checked })}
              className="w-4 h-4 accent-temo-gold"
            />
            <span className="text-sm text-temo-warm-gray/70">隱藏作品篩選列</span>
          </label>

          <label className="space-y-1 block w-24">
            <span className={labelCls}>排序</span>
            <input
              type="number"
              className={inputCls}
              value={row.sort}
              onChange={(e) => dirty({ sort: Number(e.target.value) })}
            />
          </label>
        </div>
      </div>

      {error && <p className="text-xs text-red-400/90 mt-3">{error}</p>}

      <div className="flex items-center gap-3 mt-4">
        <SaveButton pending={pending} saved={saved} onClick={handleSave} />
      </div>
    </div>
  )
}

function SaveButton({
  pending,
  saved,
  onClick,
}: {
  pending: boolean
  saved: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      disabled={pending}
      className="inline-flex items-center gap-1.5 px-4 py-2 bg-temo-gold/90 text-temo-black text-xs font-bold tracking-wider rounded-sm hover:brightness-110 disabled:opacity-60 transition-all"
    >
      {pending ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : saved ? (
        <Check className="w-3.5 h-3.5" />
      ) : null}
      {saved ? "已儲存" : "儲存"}
    </button>
  )
}
