"use client"

import { useRef, useState, useTransition } from "react"
import { ChevronDown, Loader2, Plus, Trash2, Check, GripVertical } from "lucide-react"
import { saveFaq, deleteFaq, reorderFaqs } from "@/app/studio/(app)/faqs/actions"
import { SortableList, type DragHandleProps } from "@/components/studio/sortable-list"
import { cn } from "@/lib/utils"

const inputCls =
  "w-full px-3 py-2.5 bg-white/[0.03] border border-white/10 text-temo-white text-sm placeholder:text-white/20 focus:border-temo-gold/60 focus:outline-none transition-all rounded-sm"

type Row = {
  key: string
  id?: string
  question: string
  answer: string
  category: string
  sort: number
}

const CATEGORIES = ["服務相關", "合作流程", "價格和預算", "設計相關"]

export function FaqManager({ initial }: { initial: Row[] }) {
  const [rows, setRows] = useState<Row[]>(initial)
  const [orderPending, startOrder] = useTransition()
  const [orderError, setOrderError] = useState("")
  const keyCounter = useRef(0)

  function addRow() {
    const maxSort = rows.reduce((m, r) => Math.max(m, r.sort), -1)
    setRows((p) => [
      ...p,
      { key: `new-${p.length}-${keyCounter.current++}`, question: "", answer: "", category: CATEGORIES[0], sort: maxSort + 1 },
    ])
  }

  function update(key: string, patch: Partial<Row>) {
    setRows((p) => p.map((r) => (r.key === key ? { ...r, ...patch } : r)))
  }

  function removeRow(key: string) {
    setRows((p) => p.filter((r) => r.key !== key))
  }

  function reorderCommit(next: Row[]) {
    const ids = next.filter((r) => r.id).map((r) => r.id!)
    // 同步每列的 sort 為這次落庫序列中的 index，避免之後單列 save 把舊 sort 蓋回去（CR-01）
    const synced = next.map((r) => (r.id ? { ...r, sort: ids.indexOf(r.id) } : r))
    setRows(synced)
    setOrderError("")
    startOrder(async () => {
      const res = await reorderFaqs(ids)
      if (res?.error) setOrderError(res.error)
    })
  }

  return (
    <div className="px-6 md:px-10 py-10 md:py-14 max-w-3xl">
      <div className="flex items-end justify-between mb-8 gap-4">
        <div>
          <p className="text-[10px] tracking-[0.5em] text-temo-gold uppercase mb-2">FAQ</p>
          <h1 className="text-3xl md:text-4xl font-bold text-temo-white">常見問答</h1>
          <p className="text-temo-warm-gray/60 text-sm mt-1">
            共 {rows.length} 題 · 可用<span className="text-temo-warm-gray/80"> ⠿ 把手拖拉排序</span>
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
        </div>
        <button
          type="button"
          onClick={addRow}
          className="inline-flex items-center gap-2 px-5 py-3 bg-temo-gold text-temo-black text-xs font-bold tracking-[0.15em] uppercase rounded-sm hover:brightness-110 transition-all"
        >
          <Plus className="w-4 h-4" /> 新增一題
        </button>
      </div>

      <SortableList
        items={rows}
        getKey={(r) => r.key}
        onReorder={setRows}
        onCommit={reorderCommit}
        className="space-y-4"
        renderItem={(r, handle) => (
          <FaqCard row={r} handle={handle} onChange={(patch) => update(r.key, patch)} onRemove={() => removeRow(r.key)} />
        )}
      />
      <datalist id="faq-cats">
        {CATEGORIES.map((c) => <option key={c} value={c} />)}
      </datalist>
      {rows.length === 0 && <p className="text-temo-warm-gray/50 text-sm py-8 text-center">還沒有問答，點右上「新增一題」。</p>}
    </div>
  )
}

function FaqCard({
  row,
  handle,
  onChange,
  onRemove,
}: {
  row: Row
  handle: DragHandleProps
  onChange: (p: Partial<Row>) => void
  onRemove: () => void
}) {
  const [open, setOpen] = useState(!row.id)
  const [pending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState("")

  function save() {
    setError("")
    startTransition(async () => {
      const res = await saveFaq(
        { question: row.question, answer: row.answer, category: row.category, sort: row.sort },
        row.id
      )
      if (res.error) setError(res.error)
      else {
        if (res.id && !row.id) onChange({ id: res.id })
        setSaved(true)
      }
    })
  }

  function del() {
    if (row.id && !confirm("確定刪除這題？")) return
    startTransition(async () => {
      if (row.id) {
        const res = await deleteFaq(row.id)
        if (res.error) { setError(res.error); return }
      }
      onRemove()
    })
  }

  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.02] overflow-hidden">
      <div className="flex items-center gap-2 pl-2 pr-3">
        <button
          type="button"
          aria-label="拖拉排序"
          className="text-temo-warm-gray/40 hover:text-temo-warm-gray active:cursor-grabbing shrink-0 py-3"
          {...handle}
        >
          <GripVertical className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="flex-1 min-w-0 py-3 text-left"
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="rounded-full bg-temo-gold/10 px-2 py-1 text-[10px] text-temo-gold shrink-0">
              {row.category || "未分類"}
            </span>
            {!row.id && (
              <span className="rounded-full bg-white/[0.06] px-2 py-1 text-[10px] text-temo-warm-gray/65 shrink-0">
                尚未儲存
              </span>
            )}
            <p className="text-sm font-medium text-temo-white truncate">{row.question || "未命名問題"}</p>
          </div>
          <p className="mt-1 text-[11px] text-temo-warm-gray/45 truncate">
            {row.answer || "尚未填寫答案"}
          </p>
        </button>
        <ChevronDown className={cn("w-4 h-4 text-temo-warm-gray/40 shrink-0 transition-transform", open && "rotate-180")} />
      </div>

      {open && (
        <div className="border-t border-white/8 p-4 space-y-3">
          <div className="flex gap-3 items-center">
            <input
              list="faq-cats"
              className={inputCls + " flex-1"}
              value={row.category}
              onChange={(e) => { onChange({ category: e.target.value }); setSaved(false) }}
              placeholder="分類"
            />
          </div>
          <input
            className={inputCls}
            value={row.question}
            onChange={(e) => { onChange({ question: e.target.value }); setSaved(false) }}
            placeholder="問題"
          />
          <textarea
            className={inputCls + " min-h-20 resize-y"}
            value={row.answer}
            onChange={(e) => { onChange({ answer: e.target.value }); setSaved(false) }}
            placeholder="答案"
          />
          {error && <p className="text-xs text-red-400/90">{error}</p>}
          <div className="flex items-center gap-3">
            <button type="button" onClick={save} disabled={pending} className="inline-flex items-center gap-1.5 px-4 py-2 bg-temo-gold/90 text-temo-black text-xs font-bold tracking-wider rounded-sm hover:brightness-110 disabled:opacity-60 transition-all">
              {pending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : saved ? <Check className="w-3.5 h-3.5" /> : null}
              {saved ? "已儲存" : "儲存"}
            </button>
            <button type="button" onClick={del} disabled={pending} className="ml-auto inline-flex items-center gap-1.5 px-3 py-2 text-red-400/70 hover:text-red-400 text-xs transition-colors disabled:opacity-60">
              <Trash2 className="w-3.5 h-3.5" /> 刪除
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
