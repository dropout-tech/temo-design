"use client"

import { useState, useTransition } from "react"
import { Loader2, Plus, Trash2, Check, GripVertical } from "lucide-react"
import { saveSocialLink, deleteSocialLink, reorderSocialLinks } from "@/app/studio/(app)/settings/social-actions"
import { SOCIAL_PLATFORMS, SocialIcon } from "@/components/social-icons"
import { SortableList, type DragHandleProps } from "@/components/studio/sortable-list"

const inputCls =
  "w-full px-3 py-2.5 bg-white/[0.03] border border-white/10 text-temo-white text-sm placeholder:text-white/20 focus:border-temo-gold/60 focus:outline-none transition-all rounded-sm"
const labelCls = "text-[11px] tracking-wider text-temo-warm-gray/60 uppercase"

type SocialLinkRow = {
  id: string | null
  platform: string
  href: string
  visible: boolean
  sort: number
}

type ClientRow = SocialLinkRow & { key: string }

function randomKey() {
  return Math.random().toString(36).slice(2, 10)
}

export function SocialLinksManager({ rows: initialRows }: { rows: SocialLinkRow[] }) {
  const [rows, setRows] = useState<ClientRow[]>(
    initialRows.map((r) => ({ ...r, key: r.id ?? randomKey() }))
  )
  const [orderPending, startOrder] = useTransition()
  const [orderError, setOrderError] = useState("")

  function addRow() {
    const usedPlatforms = new Set(rows.map((r) => r.platform))
    const next = SOCIAL_PLATFORMS.find((p) => !usedPlatforms.has(p.key)) ?? SOCIAL_PLATFORMS[0]
    const maxSort = rows.reduce((m, r) => Math.max(m, r.sort), -1)
    setRows((p) => [
      ...p,
      { key: randomKey(), id: null, platform: next.key, href: "", visible: false, sort: maxSort + 1 },
    ])
  }
  function updateRow(key: string, patch: Partial<ClientRow>) {
    setRows((p) => p.map((r) => (r.key === key ? { ...r, ...patch } : r)))
  }
  function removeRow(key: string) {
    setRows((p) => p.filter((r) => r.key !== key))
  }
  function setId(key: string, id: string) {
    setRows((p) => p.map((r) => (r.key === key ? { ...r, id } : r)))
  }

  function reorderCommit(next: ClientRow[]) {
    const ids = next.filter((r) => r.id).map((r) => r.id!)
    // 同步每列的 sort 為這次落庫序列中的 index，避免之後單列 save 把舊 sort 蓋回去（CR-01）
    const synced = next.map((r) => (r.id ? { ...r, sort: ids.indexOf(r.id) } : r))
    setRows(synced)
    setOrderError("")
    startOrder(async () => {
      const res = await reorderSocialLinks(ids)
      if (res?.error) setOrderError(res.error)
    })
  }

  return (
    <div className="px-6 md:px-10 py-10 md:py-14 max-w-4xl">
      <div className="flex items-center justify-between mb-1">
        <div>
          <p className="text-[10px] tracking-[0.5em] text-temo-gold uppercase mb-2">Social</p>
          <h1 className="text-3xl md:text-4xl font-bold text-temo-white">社群連結</h1>
        </div>
        <button
          onClick={addRow}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-temo-gold text-temo-black text-xs font-bold tracking-[0.15em] uppercase rounded-sm hover:brightness-110 transition-all"
        >
          <Plus className="w-4 h-4" /> 新增
        </button>
      </div>
      <p className="text-temo-warm-gray/60 text-sm mt-1 mb-6">
        勾選「在頁尾顯示」且有填連結的才會出現在網站頁尾；可自由新增其他平台，用<span className="text-temo-warm-gray/80"> ⠿ 把手拖拉排序</span>。
        {orderPending && (
          <span className="inline-flex items-center gap-1.5 ml-2 text-temo-warm-gray/50">
            <Loader2 className="w-3 h-3 animate-spin" /> 儲存順序…
          </span>
        )}
        {orderError && (
          <span className="inline-flex items-center gap-1.5 ml-2 text-red-400/90">
            排序儲存失敗：{orderError}
          </span>
        )}
      </p>

      <SortableList
        items={rows}
        getKey={(r) => r.key}
        onReorder={setRows}
        onCommit={reorderCommit}
        className="space-y-3"
        renderItem={(row, handle) => (
          <SocialLinkCard
            row={row}
            handle={handle}
            onChange={(p) => updateRow(row.key, p)}
            onRemove={() => removeRow(row.key)}
            onSaved={(id) => setId(row.key, id)}
          />
        )}
      />
      {rows.length === 0 && (
        <p className="text-temo-warm-gray/50 text-sm py-6 text-center border border-dashed border-white/10 rounded-sm">
          還沒有任何社群連結，點「新增」開始。
        </p>
      )}
    </div>
  )
}

function SocialLinkCard({
  row,
  handle,
  onChange,
  onRemove,
  onSaved,
}: {
  row: ClientRow
  handle: DragHandleProps
  onChange: (p: Partial<ClientRow>) => void
  onRemove: () => void
  onSaved: (id: string) => void
}) {
  const [pending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState("")
  const dirty = (p: Partial<ClientRow>) => {
    onChange(p)
    setSaved(false)
  }

  function handleSave() {
    setError("")
    startTransition(async () => {
      const res = await saveSocialLink(
        {
          platform: row.platform,
          href: row.href,
          visible: row.visible,
          sort: row.sort,
        },
        row.id ?? undefined
      )
      if (res.error) {
        setError(res.error)
        return
      }
      if (res.id && !row.id) onSaved(res.id)
      setSaved(true)
    })
  }

  function handleDelete() {
    if (!confirm("確定刪除這個社群連結？")) return
    if (!row.id) {
      onRemove()
      return
    }
    startTransition(async () => {
      const res = await deleteSocialLink(row.id as string)
      if (res.error) {
        setError(res.error)
        return
      }
      onRemove()
    })
  }

  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.02] p-3">
      <div className="flex flex-wrap items-end gap-3">
        <button
          type="button"
          aria-label="拖拉排序"
          className="text-temo-warm-gray/40 hover:text-temo-warm-gray active:cursor-grabbing shrink-0 pb-2.5"
          {...handle}
        >
          <GripVertical className="w-4 h-4" />
        </button>
        <div className="w-11 h-11 shrink-0 rounded-sm bg-white/[0.04] border border-white/10 flex items-center justify-center text-temo-gold">
          <SocialIcon platform={row.platform} className="w-5 h-5" />
        </div>
        <label className="space-y-1 min-w-[140px]">
          <span className={labelCls}>平台</span>
          <select
            className={inputCls}
            value={row.platform}
            onChange={(e) => dirty({ platform: e.target.value })}
          >
            {SOCIAL_PLATFORMS.map((p) => (
              <option key={p.key} value={p.key} className="bg-temo-black">
                {p.label}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1 flex-1 min-w-[200px]">
          <span className={labelCls}>連結網址</span>
          <input
            className={inputCls}
            value={row.href}
            onChange={(e) => dirty({ href: e.target.value })}
            placeholder="https://..."
          />
        </label>
        <label className="flex items-center gap-2 pb-2.5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={row.visible}
            onChange={(e) => dirty({ visible: e.target.checked })}
            className="w-4 h-4 accent-temo-gold"
          />
          <span className="text-xs text-temo-warm-gray/80">在頁尾顯示</span>
        </label>
      </div>
      {error && <p className="text-xs text-red-400/90 mt-2">{error}</p>}
      <div className="flex items-center gap-3 mt-3">
        <SaveButton pending={pending} saved={saved} onClick={handleSave} label="儲存" />
        <button
          onClick={handleDelete}
          disabled={pending}
          className="ml-auto inline-flex items-center gap-1.5 px-3 py-2 text-red-400/70 hover:text-red-400 text-xs transition-colors disabled:opacity-60"
        >
          <Trash2 className="w-3.5 h-3.5" /> 刪除
        </button>
      </div>
    </div>
  )
}

function SaveButton({
  pending,
  saved,
  onClick,
  label,
}: {
  pending: boolean
  saved: boolean
  onClick: () => void
  label: string
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
      {saved ? "已儲存" : label}
    </button>
  )
}
