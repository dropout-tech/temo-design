"use client"

import { useState, useTransition } from "react"
import { Loader2, Plus, Trash2, Check } from "lucide-react"
import { saveTestimonial, deleteTestimonial } from "@/app/studio/(app)/testimonials/actions"

const inputCls =
  "w-full px-3 py-2.5 bg-white/[0.03] border border-white/10 text-temo-white text-sm placeholder:text-white/20 focus:border-temo-gold/60 focus:outline-none transition-all rounded-sm"

type Row = {
  key: string
  id?: string
  text: string
  author: string
  company: string
  rating: number
  sort: number
}

export function TestimonialManager({ initial }: { initial: Row[] }) {
  const [rows, setRows] = useState<Row[]>(initial)
  let keyCounter = 0

  function addRow() {
    const maxSort = rows.reduce((m, r) => Math.max(m, r.sort), -1)
    setRows((p) => [
      ...p,
      { key: `new-${p.length}-${keyCounter++}`, text: "", author: "", company: "", rating: 5, sort: maxSort + 1 },
    ])
  }

  function update(key: string, patch: Partial<Row>) {
    setRows((p) => p.map((r) => (r.key === key ? { ...r, ...patch } : r)))
  }

  function removeRow(key: string) {
    setRows((p) => p.filter((r) => r.key !== key))
  }

  return (
    <div className="px-6 md:px-10 py-10 md:py-14 max-w-3xl">
      <div className="flex items-end justify-between mb-8 gap-4">
        <div>
          <p className="text-[10px] tracking-[0.5em] text-temo-gold uppercase mb-2">Testimonials</p>
          <h1 className="text-3xl md:text-4xl font-bold text-temo-white">客戶見證</h1>
          <p className="text-temo-warm-gray/60 text-sm mt-1">共 {rows.length} 則</p>
        </div>
        <button onClick={addRow} className="inline-flex items-center gap-2 px-5 py-3 bg-temo-gold text-temo-black text-xs font-bold tracking-[0.15em] uppercase rounded-sm hover:brightness-110 transition-all">
          <Plus className="w-4 h-4" /> 新增一則
        </button>
      </div>

      <div className="space-y-4">
        {rows.map((r) => (
          <Card key={r.key} row={r} onChange={(patch) => update(r.key, patch)} onRemove={() => removeRow(r.key)} />
        ))}
        {rows.length === 0 && <p className="text-temo-warm-gray/50 text-sm py-8 text-center">還沒有見證，點右上「新增一則」。</p>}
      </div>
    </div>
  )
}

function Card({ row, onChange, onRemove }: { row: Row; onChange: (p: Partial<Row>) => void; onRemove: () => void }) {
  const [pending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState("")

  function save() {
    setError("")
    startTransition(async () => {
      const res = await saveTestimonial(
        { text: row.text, author: row.author, company: row.company, rating: row.rating, sort: row.sort },
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
    if (row.id && !confirm("確定刪除這則見證？")) return
    startTransition(async () => {
      if (row.id) {
        const res = await deleteTestimonial(row.id)
        if (res.error) { setError(res.error); return }
      }
      onRemove()
    })
  }

  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4 space-y-3">
      <textarea
        className={inputCls + " min-h-24 resize-y"}
        value={row.text}
        onChange={(e) => { onChange({ text: e.target.value }); setSaved(false) }}
        placeholder="見證內容"
      />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <input className={inputCls + " col-span-1"} value={row.author} onChange={(e) => { onChange({ author: e.target.value }); setSaved(false) }} placeholder="姓名" />
        <input className={inputCls + " col-span-2"} value={row.company} onChange={(e) => { onChange({ company: e.target.value }); setSaved(false) }} placeholder="職稱 / 公司" />
        <input type="number" min={1} max={5} className={inputCls} value={row.rating} onChange={(e) => { onChange({ rating: Number(e.target.value) }); setSaved(false) }} title="評分 1-5" />
      </div>
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
    </div>
  )
}
