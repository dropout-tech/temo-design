"use client"

import { useState, useTransition } from "react"
import { Loader2, Plus, Trash2, Check } from "lucide-react"
import {
  saveCategoryGroup,
  deleteCategoryGroup,
  saveIndustry,
  deleteIndustry,
} from "@/app/studio/(app)/categories/actions"

const inputCls =
  "w-full px-3 py-2.5 bg-white/[0.03] border border-white/10 text-temo-white text-sm placeholder:text-white/20 focus:border-temo-gold/60 focus:outline-none transition-all rounded-sm"
const labelCls = "text-[11px] tracking-wider text-temo-warm-gray/60 uppercase"

type FacetRow = { value: string; label: string; sort: number }

function randomValue(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`
}

export function CategoryManager({
  categoryGroups,
  industries,
}: {
  categoryGroups: FacetRow[]
  industries: FacetRow[]
}) {
  const [groups, setGroups] = useState<FacetRow[]>(categoryGroups)
  const [inds, setInds] = useState<FacetRow[]>(industries)

  function addGroup() {
    const maxSort = groups.reduce((m, g) => Math.max(m, g.sort), -1)
    setGroups((p) => [...p, { value: randomValue("cat"), label: "", sort: maxSort + 1 }])
  }
  function updateGroup(value: string, patch: Partial<FacetRow>) {
    setGroups((p) => p.map((g) => (g.value === value ? { ...g, ...patch } : g)))
  }
  function removeGroup(value: string) {
    setGroups((p) => p.filter((g) => g.value !== value))
  }

  function addIndustry() {
    const maxSort = inds.reduce((m, i) => Math.max(m, i.sort), -1)
    setInds((p) => [...p, { value: randomValue("ind"), label: "", sort: maxSort + 1 }])
  }
  function updateIndustry(value: string, patch: Partial<FacetRow>) {
    setInds((p) => p.map((i) => (i.value === value ? { ...i, ...patch } : i)))
  }
  function removeIndustry(value: string) {
    setInds((p) => p.filter((i) => i.value !== value))
  }

  return (
    <div className="px-6 md:px-10 py-10 md:py-14 max-w-4xl">
      <div className="mb-8">
        <p className="text-[10px] tracking-[0.5em] text-temo-gold uppercase mb-2">Taxonomy</p>
        <h1 className="text-3xl md:text-4xl font-bold text-temo-white">作品分類</h1>
        <p className="text-temo-warm-gray/60 text-sm mt-1">
          這裡改的分類會同步到前台作品篩選與作品後台的下拉選單。
        </p>
      </div>

      {/* 執行項目 */}
      <div className="flex items-center justify-between mt-2 mb-3">
        <h2 className="text-sm font-bold text-temo-white tracking-wide">
          執行項目（單選）
          <span className="text-temo-warm-gray/50 font-normal ml-2">共 {groups.length} 項</span>
        </h2>
        <button
          onClick={addGroup}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-temo-gold text-temo-black text-xs font-bold tracking-[0.15em] uppercase rounded-sm hover:brightness-110 transition-all"
        >
          <Plus className="w-4 h-4" /> 新增
        </button>
      </div>
      <div className="space-y-3">
        {groups
          .slice()
          .sort((a, b) => a.sort - b.sort)
          .map((g) => (
            <FacetCard
              key={g.value}
              row={g}
              onChange={(p) => updateGroup(g.value, p)}
              onRemove={() => removeGroup(g.value)}
              save={saveCategoryGroup}
              del={deleteCategoryGroup}
              deleteConfirmMessage="確定刪除這個執行項目分類？刪除後，使用此分類的作品會失去這個分類標籤。"
            />
          ))}
        {groups.length === 0 && (
          <p className="text-temo-warm-gray/50 text-sm py-6 text-center border border-dashed border-white/10 rounded-sm">
            還沒有任何執行項目，點「新增」開始。
          </p>
        )}
      </div>

      {/* 行業分類 */}
      <div className="mt-14 pt-8 border-t border-white/10">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-temo-white tracking-wide">
            行業分類（複選）
            <span className="text-temo-warm-gray/50 font-normal ml-2">共 {inds.length} 項</span>
          </h2>
          <button
            onClick={addIndustry}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/[0.06] text-temo-white text-xs font-bold tracking-[0.15em] uppercase rounded-sm hover:bg-white/[0.1] transition-all"
          >
            <Plus className="w-4 h-4" /> 新增
          </button>
        </div>
        <div className="space-y-3">
          {inds
            .slice()
            .sort((a, b) => a.sort - b.sort)
            .map((i) => (
              <FacetCard
                key={i.value}
                row={i}
                onChange={(p) => updateIndustry(i.value, p)}
                onRemove={() => removeIndustry(i.value)}
                save={saveIndustry}
                del={deleteIndustry}
                deleteConfirmMessage="確定刪除這個行業分類？刪除後，使用此分類的作品會失去這個分類標籤。"
              />
            ))}
          {inds.length === 0 && (
            <p className="text-temo-warm-gray/50 text-sm py-6 text-center border border-dashed border-white/10 rounded-sm">
              還沒有任何行業分類，點「新增」開始。
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// 單列分類卡（執行項目 / 行業分類共用）
// ─────────────────────────────────────────────
function FacetCard({
  row,
  onChange,
  onRemove,
  save,
  del,
  deleteConfirmMessage,
}: {
  row: FacetRow
  onChange: (p: Partial<FacetRow>) => void
  onRemove: () => void
  save: (input: FacetRow) => Promise<{ ok?: true; error?: string }>
  del: (value: string) => Promise<{ error?: string }>
  deleteConfirmMessage: string
}) {
  const [pending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState("")
  const dirty = (p: Partial<FacetRow>) => {
    onChange(p)
    setSaved(false)
  }

  function handleSave() {
    setError("")
    startTransition(async () => {
      const res = await save({ value: row.value, label: row.label, sort: row.sort })
      if (res.error) setError(res.error)
      else setSaved(true)
    })
  }

  function handleDelete() {
    if (!confirm(deleteConfirmMessage)) return
    startTransition(async () => {
      const res = await del(row.value)
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
        <label className="space-y-1 flex-1 min-w-[180px]">
          <span className={labelCls}>顯示名稱</span>
          <input
            className={inputCls}
            value={row.label}
            onChange={(e) => dirty({ label: e.target.value })}
            placeholder="例：品牌企劃"
          />
        </label>
        <label className="space-y-1 w-24">
          <span className={labelCls}>排序</span>
          <input
            type="number"
            className={inputCls}
            value={row.sort}
            onChange={(e) => dirty({ sort: Number(e.target.value) })}
          />
        </label>
      </div>
      <p className="text-[11px] text-temo-warm-gray/40 mt-2">代碼：{row.value}</p>
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
