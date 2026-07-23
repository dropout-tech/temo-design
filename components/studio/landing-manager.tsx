"use client"

import { useEffect, useRef, useState, useTransition } from "react"
import { Loader2, Check, Plus, Trash2, X } from "lucide-react"
import {
  saveLanding,
  createLanding,
  deleteLanding,
  type LandingInput,
  type LandingRecord,
} from "@/app/studio/(app)/landings/actions"

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

  function addRow(record: LandingRecord) {
    setRows((p) => [...p, toEditable(record)])
  }

  function removeRow(slug: string) {
    setRows((p) => p.filter((r) => r.slug !== slug))
  }

  return (
    <div className="px-6 md:px-10 py-10 md:py-14 max-w-4xl">
      <div className="mb-8">
        <p className="text-[10px] tracking-[0.5em] text-temo-gold uppercase mb-2">Landings</p>
        <h1 className="text-3xl md:text-4xl font-bold text-temo-white">服務落地頁</h1>
        <p className="text-temo-warm-gray/60 text-sm mt-1">
          管理服務介紹頁（/services/…）的大分類。新增後會自動產生對應網址，也會出現在「作品分類」頁執行項目的服務頁下拉選單；網址（slug）建立後不可更改。
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
              onDeleted={() => removeRow(row.slug)}
            />
          ))}
      </div>

      <div className="mt-6">
        <AddLandingRow onAdded={addRow} />
      </div>
    </div>
  )
}

function LandingCard({
  row,
  categoryOptions,
  onChange,
  onDeleted,
}: {
  row: EditableLanding
  categoryOptions: CategoryOption[]
  onChange: (p: Partial<EditableLanding>) => void
  onDeleted: () => void
}) {
  const [pending, startTransition] = useTransition()
  const [deleting, startDeleteTransition] = useTransition()
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState("")

  function handleDelete() {
    const ok = confirm(
      `確定刪除「${row.slug}」這個服務落地頁？刪除後 /services/${row.slug} 頁面會消失，掛在此分類底下的執行項目會變成未歸屬（不影響作品本身，只是不再出現在這個服務頁下方）。`
    )
    if (!ok) return
    setError("")
    startDeleteTransition(async () => {
      const res = await deleteLanding(row.slug)
      if (res.error) setError(res.error)
      else onDeleted()
    })
  }

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
        <div className="flex-1" />
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting || pending}
          aria-label="刪除此落地頁"
          className="text-red-400/50 hover:text-red-400 shrink-0 p-1 disabled:opacity-50 transition-colors"
        >
          {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
        </button>
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

        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4 items-end">
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

// ─────────────────────────────────────────────
// 清單底部「＋新增落地頁」：點了展開表單，確認後呼叫 createLanding
// ─────────────────────────────────────────────
function AddLandingRow({ onAdded }: { onAdded: (record: LandingRecord) => void }) {
  const [active, setActive] = useState(false)
  const [slug, setSlug] = useState("")
  const [num, setNum] = useState("")
  const [titleEn, setTitleEn] = useState("")
  const [taglineZh, setTaglineZh] = useState("")
  const [taglineEn, setTaglineEn] = useState("")
  const [error, setError] = useState("")
  const [pending, startTransition] = useTransition()
  const slugInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (active) slugInputRef.current?.focus()
  }, [active])

  function cancel() {
    setActive(false)
    setSlug("")
    setNum("")
    setTitleEn("")
    setTaglineZh("")
    setTaglineEn("")
    setError("")
  }

  function commit() {
    if (!slug.trim()) {
      setError("網址代碼為必填")
      return
    }
    setError("")
    startTransition(async () => {
      const res = await createLanding({
        slug: slug.trim(),
        num: num.trim(),
        title_en: titleEn
          .split("\n")
          .map((s) => s.trim())
          .filter((s) => s !== ""),
        tagline_zh: taglineZh,
        tagline_en: taglineEn,
      })
      if (res.error) {
        setError(res.error)
        return
      }
      if (res.row) onAdded(res.row)
      cancel()
    })
  }

  if (!active) {
    return (
      <button
        type="button"
        onClick={() => setActive(true)}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-dashed border-white/15 text-temo-gold text-xs tracking-wider hover:bg-temo-gold/[0.06] hover:border-temo-gold/40 transition-colors"
      >
        <Plus className="w-3.5 h-3.5" /> 新增落地頁
      </button>
    )
  }

  return (
    <div className="rounded-lg border border-temo-gold/40 bg-white/[0.02] p-4 md:p-5">
      <div className="flex items-center justify-between mb-4">
        <span className="text-[11px] tracking-wider text-temo-gold uppercase">新增落地頁</span>
        <button
          type="button"
          onClick={cancel}
          disabled={pending}
          aria-label="取消"
          className="text-temo-warm-gray/50 hover:text-temo-white shrink-0 p-1 disabled:opacity-40 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="grid gap-4">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4">
          <label className="space-y-1 block">
            <span className={labelCls}>網址代碼（slug，例：new-service，建立後不可更改）</span>
            <input
              ref={slugInputRef}
              className={inputCls}
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="例：interior-design"
              disabled={pending}
            />
          </label>
          <label className="space-y-1 block">
            <span className={labelCls}>編號（留空自動編號）</span>
            <input
              className={`${inputCls} md:w-24`}
              value={num}
              onChange={(e) => setNum(e.target.value)}
              placeholder="05"
              disabled={pending}
            />
          </label>
        </div>

        <label className="space-y-1 block">
          <span className={labelCls}>大標（英文，一行一個字，例：BRAND / & / GRAPHIC）</span>
          <textarea
            className={`${inputCls} min-h-[90px] resize-y`}
            value={titleEn}
            onChange={(e) => setTitleEn(e.target.value)}
            placeholder={"BRAND\n&\nGRAPHIC"}
            disabled={pending}
          />
        </label>

        <label className="space-y-1 block">
          <span className={labelCls}>中文標語（可換行）</span>
          <textarea
            className={`${inputCls} min-h-[70px] resize-y`}
            value={taglineZh}
            onChange={(e) => setTaglineZh(e.target.value)}
            disabled={pending}
          />
        </label>

        <label className="space-y-1 block">
          <span className={labelCls}>英文標語（可換行）</span>
          <textarea
            className={`${inputCls} min-h-[70px] resize-y`}
            value={taglineEn}
            onChange={(e) => setTaglineEn(e.target.value)}
            disabled={pending}
          />
        </label>
      </div>

      {error && <p className="text-xs text-red-400/90 mt-3">{error}</p>}

      <div className="flex items-center gap-3 mt-4">
        <button
          type="button"
          onClick={commit}
          disabled={pending || !slug.trim()}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-temo-gold/90 text-temo-black text-xs font-bold tracking-wider rounded-sm hover:brightness-110 disabled:opacity-60 transition-all"
        >
          {pending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
          建立
        </button>
      </div>
    </div>
  )
}
