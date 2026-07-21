"use client"

import { useState, useTransition } from "react"
import { Loader2, Plus, Trash2, Check, GripVertical } from "lucide-react"
import { saveFaq, deleteFaq, reorderFaqs } from "@/app/studio/(app)/faqs/actions"
import { SortableList, type DragHandleProps } from "@/components/studio/sortable-list"

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
  let keyCounter = 0

  function addRow() {
    const maxSort = rows.reduce((m, r) => Math.max(m, r.sort), -1)
    setRows((p) => [
      ...p,
      { key: `new-${p.length}-${keyCounter++}`, question: "", answer: "", category: CATEGORIES[0], sort: maxSort + 1 },
    ])
  }

  function update(key: string, patch: Partial<Row>) {
    setRows((p) => p.map((r) => (r.key === key ? { ...r, ...patch } : r)))
  }

  function removeRow(key: string) {
    setRows((p) => p.filter((r) => r.key !== key))
  }

  function reorderCommit(next: Row[]) {
    setRows(next)
    const ids = next.filter((r) => r.id).map((r) => r.id!)
    startOrder(async () => {
      await reorderFaqs(ids)
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
          </p>
        </div>
        <button
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
    <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4 space-y-3">
      <div className="flex gap-3 items-center">
        <button
          type="button"
          aria-label="拖拉排序"
          className="text-temo-warm-gray/40 hover:text-temo-warm-gray active:cursor-grabbing shrink-0"
          {...handle}
        >
          <GripVertical className="w-4 h-4" />
        </button>
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
        <button onClick={save} disabled={pending} className="inline-flex items-center gap-1.5 px-4 py-2 bg-temo-gold/90 text-temo-black text-xs font-bold tracking-wider rounded-sm hover:brightness-110 disabled:opacity-60 transition-all">
          {pending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : saved ? <Check className="w-3.5 h-3.5" /> : null}
          {saved ? "已儲存" : "儲存"}
        </button>
        <button onClick={del} disabled={pending} className="ml-auto inline-flex items-center gap-1.5 px-3 py-2 text-red-400/70 hover:text-red-400 text-xs transition-colors disabled:opacity-60">
          <Trash2 className="w-3.5 h-3.5" /> 刪除
        </button>
      </div>
      <datalist id="faq-cats">
        {CATEGORIES.map((c) => <option key={c} value={c} />)}
      </datalist>
    </div>
  )
}
