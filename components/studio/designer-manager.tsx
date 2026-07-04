"use client"

import { useState, useTransition } from "react"
import Image from "next/image"
import {
  Loader2,
  Plus,
  Trash2,
  Check,
  Upload,
  ChevronDown,
  User,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { saveDesigner, deleteDesigner } from "@/app/studio/(app)/designers/actions"
import { cn } from "@/lib/utils"

const inputCls =
  "w-full px-3 py-2.5 bg-white/[0.03] border border-white/10 text-temo-white text-sm placeholder:text-white/20 focus:border-temo-gold/60 focus:outline-none transition-all rounded-sm"
const labelCls = "block text-[11px] tracking-[0.15em] text-temo-warm-gray/60 uppercase mb-1.5"

type Row = {
  key: string
  id?: string
  slug: string
  name: string
  name_zh: string
  role: string
  category: string
  photo_url: string
  instagram: string
  bio: string // multiline
  achievements: string // multiline
  tags: string // multiline
  has_page: boolean
  sort: number
}

export function DesignerManager({
  initial,
  categories,
}: {
  initial: Row[]
  categories: string[]
}) {
  const [rows, setRows] = useState<Row[]>(initial)
  let keyCounter = 0

  function addRow() {
    const maxSort = rows.reduce((m, r) => Math.max(m, r.sort), -1)
    setRows((p) => [
      ...p,
      {
        key: `new-${p.length}-${keyCounter++}`,
        slug: "",
        name: "",
        name_zh: "",
        role: "",
        category: categories[0] ?? "DESIGNER",
        photo_url: "",
        instagram: "",
        bio: "",
        achievements: "",
        tags: "",
        has_page: false,
        sort: maxSort + 1,
      },
    ])
  }

  function update(key: string, patch: Partial<Row>) {
    setRows((p) => p.map((r) => (r.key === key ? { ...r, ...patch } : r)))
  }

  function removeRow(key: string) {
    setRows((p) => p.filter((r) => r.key !== key))
  }

  const allCats = Array.from(new Set([...categories, ...rows.map((r) => r.category)])).filter(Boolean)

  return (
    <div className="px-6 md:px-10 py-10 md:py-14 max-w-3xl">
      <datalist id="team-categories">
        {allCats.map((c) => (
          <option key={c} value={c} />
        ))}
      </datalist>

      <div className="flex items-end justify-between mb-8 gap-4">
        <div>
          <p className="text-[10px] tracking-[0.5em] text-temo-gold uppercase mb-2">Team</p>
          <h1 className="text-3xl md:text-4xl font-bold text-temo-white">設計師 / 團隊</h1>
          <p className="text-temo-warm-gray/60 text-sm mt-1">
            共 {rows.length} 人 · 顯示在「關於我們」的團隊區，可切換分類；數字越小越前面
          </p>
        </div>
        <button
          onClick={addRow}
          className="inline-flex items-center gap-2 px-5 py-3 bg-temo-gold text-temo-black text-xs font-bold tracking-[0.15em] uppercase rounded-sm hover:brightness-110 transition-all shrink-0"
        >
          <Plus className="w-4 h-4" /> 新增成員
        </button>
      </div>

      <div className="space-y-3">
        {rows.map((r) => (
          <Card
            key={r.key}
            row={r}
            onChange={(patch) => update(r.key, patch)}
            onRemove={() => removeRow(r.key)}
          />
        ))}
        {rows.length === 0 && (
          <p className="text-temo-warm-gray/50 text-sm py-10 text-center">
            還沒有團隊成員，點右上「新增成員」。
          </p>
        )}
      </div>
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
  const [open, setOpen] = useState(!row.id) // 新卡片預設展開
  const [pending, startTransition] = useTransition()
  const [uploading, setUploading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState("")

  const set = (patch: Partial<Row>) => {
    onChange(patch)
    setSaved(false)
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError("")
    const supabase = createClient()
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase()
    const path = `team/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
    const { error: upErr } = await supabase.storage
      .from("media")
      .upload(path, file, { cacheControl: "3600", upsert: false })
    if (upErr) setError("圖片上傳失敗：" + upErr.message)
    else set({ photo_url: supabase.storage.from("media").getPublicUrl(path).data.publicUrl })
    setUploading(false)
    e.target.value = ""
  }

  function save() {
    setError("")
    startTransition(async () => {
      const res = await saveDesigner(
        {
          slug: row.slug,
          name: row.name,
          name_zh: row.name_zh,
          role: row.role,
          category: row.category,
          photo_url: row.photo_url,
          instagram: row.instagram,
          bio: row.bio.split("\n"),
          achievements: row.achievements.split("\n"),
          tags: row.tags.split("\n"),
          has_page: row.has_page,
          sort: row.sort,
        },
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
    if (row.id && !confirm(`確定刪除「${row.name || "此成員"}」？`)) return
    startTransition(async () => {
      if (row.id) {
        const res = await deleteDesigner(row.id)
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
    <div className="rounded-lg border border-white/10 bg-white/[0.02] overflow-hidden">
      {/* 收合列 */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-3 p-3 text-left hover:bg-white/[0.02] transition-colors"
      >
        <div className="relative w-11 h-11 rounded-md overflow-hidden bg-[#1a1815] shrink-0 flex items-center justify-center">
          {row.photo_url ? (
            <Image src={row.photo_url} alt={row.name} fill unoptimized className="object-cover" />
          ) : (
            <User className="w-5 h-5 text-temo-warm-gray/30" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-temo-white truncate">
            {row.name || "（未命名）"}
            {row.name_zh && <span className="text-temo-warm-gray/50 ml-2">{row.name_zh}</span>}
          </p>
          <p className="text-[11px] text-temo-warm-gray/50 truncate">
            <span className="text-temo-gold/80">{row.category}</span>
            {row.role && <span> · {row.role}</span>}
          </p>
        </div>
        <span className="text-[11px] text-temo-warm-gray/30 shrink-0">#{row.sort}</span>
        <ChevronDown
          className={cn("w-4 h-4 text-temo-warm-gray/40 shrink-0 transition-transform", open && "rotate-180")}
        />
      </button>

      {/* 展開編輯 */}
      {open && (
        <div className="border-t border-white/8 p-4 space-y-4">
          {/* 照片 */}
          <div className="flex items-center gap-4">
            <div className="relative w-20 h-24 rounded-md overflow-hidden bg-[#1a1815] shrink-0 flex items-center justify-center">
              {row.photo_url ? (
                <Image src={row.photo_url} alt={row.name} fill unoptimized className="object-cover" />
              ) : (
                <User className="w-6 h-6 text-temo-warm-gray/30" />
              )}
            </div>
            <label
              className={cn(
                "inline-flex items-center gap-2 px-4 py-2.5 border border-white/15 text-temo-white text-xs tracking-wider rounded-sm cursor-pointer hover:border-temo-gold/50 transition-colors",
                uploading && "opacity-60 pointer-events-none"
              )}
            >
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {uploading ? "上傳中…" : row.photo_url ? "更換照片" : "上傳照片"}
              <input type="file" accept="image/*" className="hidden" onChange={onFile} disabled={uploading} />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>英文名 *</label>
              <input className={inputCls} value={row.name} onChange={(e) => set({ name: e.target.value })} placeholder="KEVIN KUO" />
            </div>
            <div>
              <label className={labelCls}>中文名</label>
              <input className={inputCls} value={row.name_zh} onChange={(e) => set({ name_zh: e.target.value })} placeholder="郭孝淵" />
            </div>
          </div>

          <div>
            <label className={labelCls}>職稱 role</label>
            <input className={inputCls} value={row.role} onChange={(e) => set({ role: e.target.value })} placeholder="VISUAL DESIGNER 視覺設計師" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>分類（可自訂）*</label>
              <input list="team-categories" className={inputCls} value={row.category} onChange={(e) => set({ category: e.target.value })} placeholder="DESIGNER" />
            </div>
            <div>
              <label className={labelCls}>排序</label>
              <input type="number" className={inputCls} value={row.sort} onChange={(e) => set({ sort: Number(e.target.value) })} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>slug（獨立頁網址，可留空）</label>
              <input className={inputCls} value={row.slug} onChange={(e) => set({ slug: e.target.value })} placeholder="kevin" />
            </div>
            <div>
              <label className={labelCls}>Instagram 連結</label>
              <input className={inputCls} value={row.instagram} onChange={(e) => set({ instagram: e.target.value })} placeholder="https://instagram.com/..." />
            </div>
          </div>

          <div>
            <label className={labelCls}>自我介紹 bio（一行一段）</label>
            <textarea className={cn(inputCls, "min-h-24 resize-y")} value={row.bio} onChange={(e) => set({ bio: e.target.value })} placeholder="每按一次 Enter 換一段" />
          </div>

          <div>
            <label className={labelCls}>學經歷 / 得獎（一行一項）</label>
            <textarea className={cn(inputCls, "min-h-24 resize-y")} value={row.achievements} onChange={(e) => set({ achievements: e.target.value })} placeholder="一行一項條列" />
          </div>

          <div>
            <label className={labelCls}>專長標籤（一行一個）</label>
            <textarea className={cn(inputCls, "min-h-16 resize-y")} value={row.tags} onChange={(e) => set({ tags: e.target.value })} placeholder="品牌設計&#10;平面設計" />
          </div>

          <label className="flex items-center gap-2 text-xs text-temo-warm-gray/70 cursor-pointer">
            <input
              type="checkbox"
              checked={row.has_page}
              onChange={(e) => set({ has_page: e.target.checked })}
              className="accent-temo-gold w-4 h-4"
            />
            有獨立團隊頁 /team/{row.slug || "slug"}（需填 slug）
          </label>

          {error && <p className="text-xs text-red-400/90">{error}</p>}

          <div className="flex items-center gap-3 pt-1">
            <button
              onClick={save}
              disabled={busy}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-temo-gold/90 text-temo-black text-xs font-bold tracking-wider rounded-sm hover:brightness-110 disabled:opacity-60 transition-all"
            >
              {pending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : saved ? <Check className="w-3.5 h-3.5" /> : null}
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
      )}
    </div>
  )
}
