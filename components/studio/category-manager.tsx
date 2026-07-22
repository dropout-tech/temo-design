"use client"

import { useEffect, useRef, useState, useTransition } from "react"
import { GripVertical, Plus, Trash2, Check, X, Loader2 } from "lucide-react"
import {
  saveCategoryGroup,
  deleteCategoryGroup,
  reorderCategoryGroups,
  saveIndustry,
  deleteIndustry,
  reorderIndustries,
} from "@/app/studio/(app)/categories/actions"
import { SortableList, type DragHandleProps } from "@/components/studio/sortable-list"
import { cn } from "@/lib/utils"

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

  function removeGroup(value: string) {
    setGroups((p) => p.filter((g) => g.value !== value))
  }
  function removeIndustry(value: string) {
    setInds((p) => p.filter((i) => i.value !== value))
  }

  async function addGroup(label: string): Promise<string | undefined> {
    const maxSort = groups.reduce((m, g) => Math.max(m, g.sort), -1)
    const value = randomValue("cat")
    const res = await saveCategoryGroup({ value, label, sort: maxSort + 1 })
    if (res.error) return res.error
    setGroups((p) => [...p, { value, label, sort: maxSort + 1 }])
  }

  async function addIndustry(label: string): Promise<string | undefined> {
    const maxSort = inds.reduce((m, i) => Math.max(m, i.sort), -1)
    const value = randomValue("ind")
    const res = await saveIndustry({ value, label, sort: maxSort + 1 })
    if (res.error) return res.error
    setInds((p) => [...p, { value, label, sort: maxSort + 1 }])
  }

  return (
    <div className="px-6 md:px-10 py-10 md:py-14 max-w-2xl">
      <div className="mb-8">
        <p className="text-[10px] tracking-[0.5em] text-temo-gold uppercase mb-2">Taxonomy</p>
        <h1 className="text-3xl md:text-4xl font-bold text-temo-white">作品分類</h1>
        <p className="text-temo-warm-gray/60 text-sm mt-1">
          這裡改的分類會同步到前台作品篩選與作品後台的下拉選單。拖曳
          <span className="text-temo-warm-gray/80"> ⠿ 把手 </span>
          可調整順序，點名稱可直接改名。
        </p>
      </div>

      <FacetSection
        title="執行項目"
        description="作品的單選主分類，每件作品只能選一個。"
        addButtonLabel="新增執行項目"
        addPlaceholder="例：品牌企劃"
        accent
        rows={groups}
        setRows={setGroups}
        persistOrder={(values) => reorderCategoryGroups(values)}
        onAdd={addGroup}
        onRemove={removeGroup}
        save={saveCategoryGroup}
        del={deleteCategoryGroup}
        deleteConfirmMessage="確定刪除這個執行項目分類？刪除後，使用此分類的作品會失去這個分類標籤。"
      />

      <div className="mt-10 pt-8 border-t border-white/10">
        <FacetSection
          title="行業分類"
          description="作品可複選的行業標籤，用來做多維度篩選。"
          addButtonLabel="新增行業分類"
          addPlaceholder="例：餐飲業"
          rows={inds}
          setRows={setInds}
          persistOrder={(values) => reorderIndustries(values)}
          onAdd={addIndustry}
          onRemove={removeIndustry}
          save={saveIndustry}
          del={deleteIndustry}
          deleteConfirmMessage="確定刪除這個行業分類？刪除後，使用此分類的作品會失去這個分類標籤。"
        />
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// 單一分類清單區塊（執行項目 / 行業分類共用）
// ─────────────────────────────────────────────
function FacetSection({
  title,
  description,
  addButtonLabel,
  addPlaceholder,
  accent,
  rows,
  setRows,
  persistOrder,
  onAdd,
  onRemove,
  save,
  del,
  deleteConfirmMessage,
}: {
  title: string
  description: string
  addButtonLabel: string
  addPlaceholder: string
  accent?: boolean
  rows: FacetRow[]
  setRows: React.Dispatch<React.SetStateAction<FacetRow[]>>
  persistOrder: (values: string[]) => Promise<{ error?: string } | void>
  onAdd: (label: string) => Promise<string | undefined>
  onRemove: (value: string) => void
  save: (input: FacetRow) => Promise<{ ok?: true; error?: string }>
  del: (value: string) => Promise<{ error?: string }>
  deleteConfirmMessage: string
}) {
  const [orderPending, startOrder] = useTransition()
  const [orderError, setOrderError] = useState("")

  return (
    <div>
      <div className="flex items-baseline gap-3 mb-1">
        <h2 className="text-sm font-bold text-temo-white tracking-wide">{title}</h2>
        <span className="text-[11px] text-temo-warm-gray/50">共 {rows.length} 項</span>
        {orderPending && (
          <span className="inline-flex items-center gap-1 text-[11px] text-temo-warm-gray/40">
            <Loader2 className="w-3 h-3 animate-spin" /> 儲存順序…
          </span>
        )}
        {orderError && (
          <span className="inline-flex items-center gap-1 text-[11px] text-red-400/90">
            排序儲存失敗：{orderError}
          </span>
        )}
      </div>
      <p className="text-xs text-temo-warm-gray/50 mb-3">{description}</p>

      <div className="rounded-lg border border-white/10 bg-white/[0.02] overflow-hidden">
        {rows.length > 0 ? (
          <SortableList
            items={rows}
            getKey={(r) => r.value}
            className="divide-y divide-white/[0.06]"
            onReorder={(next) => setRows(next)}
            onCommit={(next) => {
              const values = next.map((r) => r.value)
              // 同步每列的 sort 為這次落庫序列中的 index，避免之後單列 save 把舊 sort 蓋回去（CR-01）
              const synced = next.map((r, i) => ({ ...r, sort: i }))
              setRows(synced)
              setOrderError("")
              startOrder(async () => {
                const res = await persistOrder(values)
                if (res?.error) setOrderError(res.error)
              })
            }}
            renderItem={(row, handle) => (
              <FacetItem
                row={row}
                handle={handle}
                onLabelChange={(label) =>
                  setRows((p) => p.map((r) => (r.value === row.value ? { ...r, label } : r)))
                }
                onRemove={() => onRemove(row.value)}
                save={save}
                del={del}
                deleteConfirmMessage={deleteConfirmMessage}
              />
            )}
          />
        ) : (
          <p className="text-temo-warm-gray/50 text-sm py-6 text-center">
            還沒有任何{title}，在下方新增。
          </p>
        )}
        <div className={rows.length > 0 ? "border-t border-white/[0.06]" : undefined}>
          <AddRow onAdd={onAdd} placeholder={addPlaceholder} label={addButtonLabel} accent={accent} />
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// 單列分類（拖曳把手 + inline 改名 + 代碼 badge + 刪除）
// ─────────────────────────────────────────────
function FacetItem({
  row,
  handle,
  onLabelChange,
  onRemove,
  save,
  del,
  deleteConfirmMessage,
}: {
  row: FacetRow
  handle: DragHandleProps
  onLabelChange: (label: string) => void
  onRemove: () => void
  save: (input: FacetRow) => Promise<{ ok?: true; error?: string }>
  del: (value: string) => Promise<{ error?: string }>
  deleteConfirmMessage: string
}) {
  const [pending, startTransition] = useTransition()
  const [savedState, setSavedState] = useState<"idle" | "visible" | "fading">("idle")
  const [error, setError] = useState("")
  const committed = useRef(row.label)
  const timeouts = useRef<ReturnType<typeof setTimeout>[]>([])

  useEffect(() => {
    return () => timeouts.current.forEach(clearTimeout)
  }, [])

  function flashSaved() {
    setSavedState("visible")
    timeouts.current.push(
      setTimeout(() => setSavedState("fading"), 1200),
      setTimeout(() => setSavedState("idle"), 1700)
    )
  }

  function handleBlur() {
    const label = row.label.trim()
    if (!label) {
      onLabelChange(committed.current)
      return
    }
    if (label === committed.current) return
    setError("")
    startTransition(async () => {
      const res = await save({ value: row.value, label, sort: row.sort })
      if (res.error) {
        setError(res.error)
        onLabelChange(committed.current)
      } else {
        committed.current = label
        flashSaved()
      }
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
    <div className="flex items-center gap-2 px-3 py-2.5 bg-transparent">
      <button
        type="button"
        aria-label="拖拉排序"
        className="text-temo-warm-gray/30 hover:text-temo-warm-gray/70 active:cursor-grabbing shrink-0"
        {...handle}
      >
        <GripVertical className="w-4 h-4" />
      </button>
      <input
        className="flex-1 min-w-0 bg-transparent border border-transparent px-2 py-1.5 rounded-sm text-sm text-temo-white hover:bg-white/[0.03] focus:bg-white/[0.03] focus:border-temo-gold/50 focus:outline-none transition-colors"
        value={row.label}
        onChange={(e) => onLabelChange(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={(e) => {
          if (e.key === "Enter") (e.target as HTMLInputElement).blur()
        }}
        disabled={pending}
      />
      <span className="text-[10px] text-white/25 font-mono px-1.5 py-0.5 rounded bg-white/[0.03] shrink-0">
        {row.value}
      </span>
      {pending && <Loader2 className="w-3.5 h-3.5 text-temo-warm-gray/40 animate-spin shrink-0" />}
      {savedState !== "idle" && !pending && (
        <span
          className={cn(
            "text-[11px] text-temo-gold/80 shrink-0 transition-opacity duration-500",
            savedState === "fading" ? "opacity-0" : "opacity-100"
          )}
        >
          已儲存
        </span>
      )}
      {error && <span className="text-[11px] text-red-400/90 shrink-0">{error}</span>}
      <button
        type="button"
        onClick={handleDelete}
        disabled={pending}
        aria-label="刪除"
        className="text-red-400/50 hover:text-red-400 shrink-0 p-1 disabled:opacity-50 transition-colors"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}

// ─────────────────────────────────────────────
// 清單底部「＋新增」列：點了變 inline input，Enter 或按確認新增
// ─────────────────────────────────────────────
function AddRow({
  onAdd,
  placeholder,
  label,
  accent,
}: {
  onAdd: (label: string) => Promise<string | undefined>
  placeholder: string
  label: string
  accent?: boolean
}) {
  const [active, setActive] = useState(false)
  const [value, setValue] = useState("")
  const [error, setError] = useState("")
  const [pending, startTransition] = useTransition()
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (active) inputRef.current?.focus()
  }, [active])

  function cancel() {
    setActive(false)
    setValue("")
    setError("")
  }

  function commit() {
    const trimmed = value.trim()
    if (!trimmed) return
    setError("")
    startTransition(async () => {
      const err = await onAdd(trimmed)
      if (err) {
        setError(err)
        return
      }
      setValue("")
      setActive(false)
    })
  }

  if (!active) {
    return (
      <button
        type="button"
        onClick={() => setActive(true)}
        className={cn(
          "w-full flex items-center gap-2 px-3 py-2.5 text-xs tracking-wider transition-colors",
          accent
            ? "text-temo-gold hover:bg-temo-gold/[0.06]"
            : "text-temo-warm-gray/60 hover:bg-white/[0.03] hover:text-temo-white"
        )}
      >
        <Plus className="w-3.5 h-3.5" /> {label}
      </button>
    )
  }

  return (
    <div className="px-3 py-2.5">
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          className="flex-1 min-w-0 px-2 py-1.5 bg-white/[0.03] border border-temo-gold/40 text-temo-white text-sm rounded-sm focus:outline-none focus:border-temo-gold/70"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          disabled={pending}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit()
            if (e.key === "Escape") cancel()
          }}
        />
        <button
          type="button"
          onClick={commit}
          disabled={pending || !value.trim()}
          aria-label="確定新增"
          className="text-temo-gold hover:brightness-125 disabled:opacity-40 shrink-0 p-1.5 transition-opacity"
        >
          {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
        </button>
        <button
          type="button"
          onClick={cancel}
          disabled={pending}
          aria-label="取消"
          className="text-temo-warm-gray/50 hover:text-temo-white shrink-0 p-1.5 disabled:opacity-40 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      {error && <p className="text-[11px] text-red-400/90 mt-1.5">{error}</p>}
    </div>
  )
}
