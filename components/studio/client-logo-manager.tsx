"use client"

import { useState, useTransition } from "react"
import Image from "next/image"
import { Loader2, Plus, Trash2, Check, Upload, ImageIcon } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { saveClientLogo, deleteClientLogo } from "@/app/studio/(app)/clients/actions"

const inputCls =
  "w-full px-3 py-2.5 bg-white/[0.03] border border-white/10 text-temo-white text-sm placeholder:text-white/20 focus:border-temo-gold/60 focus:outline-none transition-all rounded-sm"
// 排序數字框：拿掉 w-full 只留固定寬，否則 w-full 會壓過 w-20 把整行吃滿
const numberInputCls = inputCls.replace("w-full", "w-20 shrink-0")

type Row = {
  key: string
  id?: string
  name: string
  image_url: string
  sort: number
}

export function ClientLogoManager({ initial }: { initial: Row[] }) {
  const [rows, setRows] = useState<Row[]>(initial)
  let keyCounter = 0

  function addRow() {
    const maxSort = rows.reduce((m, r) => Math.max(m, r.sort), -1)
    setRows((p) => [
      ...p,
      { key: `new-${p.length}-${keyCounter++}`, name: "", image_url: "", sort: maxSort + 1 },
    ])
  }

  function update(key: string, patch: Partial<Row>) {
    setRows((p) => p.map((r) => (r.key === key ? { ...r, ...patch } : r)))
  }

  function removeRow(key: string) {
    setRows((p) => p.filter((r) => r.key !== key))
  }

  return (
    <div className="px-6 md:px-10 py-10 md:py-14 max-w-5xl">
      <div className="flex items-end justify-between mb-8 gap-4">
        <div>
          <p className="text-[10px] tracking-[0.5em] text-temo-gold uppercase mb-2">Clients</p>
          <h1 className="text-3xl md:text-4xl font-bold text-temo-white">客戶 Logo</h1>
          <p className="text-temo-warm-gray/60 text-sm mt-1">
            共 {rows.length} 個 · 顯示在「關於我們」的客戶牆，數字越小越前面
          </p>
        </div>
        <button
          onClick={addRow}
          className="inline-flex items-center gap-2 px-5 py-3 bg-temo-gold text-temo-black text-xs font-bold tracking-[0.15em] uppercase rounded-sm hover:brightness-110 transition-all"
        >
          <Plus className="w-4 h-4" /> 新增 Logo
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {rows.map((r) => (
          <Card
            key={r.key}
            row={r}
            onChange={(patch) => update(r.key, patch)}
            onRemove={() => removeRow(r.key)}
          />
        ))}
      </div>
      {rows.length === 0 && (
        <p className="text-temo-warm-gray/50 text-sm py-10 text-center">
          還沒有客戶 Logo，點右上「新增 Logo」。
        </p>
      )}
    </div>
  )
}

function Card({
  row,
  onChange,
  onRemove,
}: {
  row: Row
  onChange: (p: Partial<Row>) => void
  onRemove: () => void
}) {
  const [pending, startTransition] = useTransition()
  const [uploading, setUploading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState("")

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError("")
    const supabase = createClient()
    const ext = (file.name.split(".").pop() || "png").toLowerCase()
    const path = `clients/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
    const { error: upErr } = await supabase.storage
      .from("media")
      .upload(path, file, { cacheControl: "3600", upsert: false })
    if (upErr) {
      setError("圖片上傳失敗：" + upErr.message)
    } else {
      const url = supabase.storage.from("media").getPublicUrl(path).data.publicUrl
      onChange({ image_url: url })
      setSaved(false)
    }
    setUploading(false)
    e.target.value = ""
  }

  function save() {
    setError("")
    startTransition(async () => {
      const res = await saveClientLogo(
        { name: row.name, image_url: row.image_url, sort: row.sort },
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
    if (row.id && !confirm("確定刪除這個客戶 Logo？")) return
    startTransition(async () => {
      if (row.id) {
        const res = await deleteClientLogo(row.id)
        if (res.error) {
          setError(res.error)
          return
        }
      }
      onRemove()
    })
  }

  const busy = pending || uploading

  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4 space-y-3">
      {/* 預覽（深底，因為白色 logo） */}
      <div className="relative flex items-center justify-center h-28 rounded-md border border-white/10 bg-[#1a1815] overflow-hidden">
        {row.image_url ? (
          <Image
            src={row.image_url}
            alt={row.name || "logo"}
            width={220}
            height={110}
            className="max-h-24 w-auto object-contain"
            unoptimized
          />
        ) : (
          <div className="flex flex-col items-center gap-1.5 text-temo-warm-gray/30">
            <ImageIcon className="w-6 h-6" />
            <span className="text-[11px]">尚未上傳圖片</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <input
          className={inputCls}
          value={row.name}
          onChange={(e) => {
            onChange({ name: e.target.value })
            setSaved(false)
          }}
          placeholder="客戶名稱"
        />
        <input
          type="number"
          className={numberInputCls}
          value={row.sort}
          onChange={(e) => {
            onChange({ sort: Number(e.target.value) })
            setSaved(false)
          }}
          title="排序"
        />
      </div>

      <label
        className={
          "inline-flex items-center gap-2 px-4 py-2.5 border border-white/15 text-temo-white text-xs tracking-wider rounded-sm cursor-pointer hover:border-temo-gold/50 transition-colors" +
          (uploading ? " opacity-60 pointer-events-none" : "")
        }
      >
        {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
        {uploading ? "上傳中…" : row.image_url ? "更換圖片" : "上傳 Logo"}
        <input type="file" accept="image/*" className="hidden" onChange={onFile} disabled={uploading} />
      </label>

      {error && <p className="text-xs text-red-400/90">{error}</p>}

      <div className="flex items-center gap-3">
        <button
          onClick={save}
          disabled={busy}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-temo-gold/90 text-temo-black text-xs font-bold tracking-wider rounded-sm hover:brightness-110 disabled:opacity-60 transition-all"
        >
          {pending ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : saved ? (
            <Check className="w-3.5 h-3.5" />
          ) : null}
          {saved ? "已儲存" : "儲存"}
        </button>
        <button
          onClick={del}
          disabled={busy}
          className="ml-auto inline-flex items-center gap-1.5 px-3 py-2 text-red-400/70 hover:text-red-400 text-xs transition-colors disabled:opacity-60"
        >
          <Trash2 className="w-3.5 h-3.5" /> 刪除
        </button>
      </div>
    </div>
  )
}
