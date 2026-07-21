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
  GripVertical,
  Pencil,
  X,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { downscaleImage } from "@/lib/downscale-image"
import {
  saveDesigner,
  deleteDesigner,
  reorderDesigners,
  addTeamCategory,
  renameTeamCategory,
  deleteTeamCategory,
  reorderTeamCategories,
} from "@/app/studio/(app)/designers/actions"
import type { TeamCategory } from "@/lib/content-supabase"
import { SortableList, type DragHandleProps } from "@/components/studio/sortable-list"
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
  facebook: string
  website: string
  phone: string
  address: string
  email: string
  show_contact: boolean
  bio: string // multiline
  achievements: string // multiline
  tags: string // multiline
  has_page: boolean
  sort: number
}

type Cat = { id: string; name: string }

export function DesignerManager({
  initial,
  categories,
}: {
  initial: Row[]
  categories: TeamCategory[]
}) {
  const [rows, setRows] = useState<Row[]>(initial)
  const [cats, setCats] = useState<Cat[]>(categories.map((c) => ({ id: c.id, name: c.name })))
  const [activeCat, setActiveCat] = useState<string>("全部")
  const [orderPending, startOrder] = useTransition()
  let keyCounter = 0

  // 顯示用分類順序：已登錄分類在前，未登錄的舊分類（成員身上有、但沒建大項目的）接在後面
  const registeredNames = cats.map((c) => c.name)
  const legacyNames = Array.from(new Set(rows.map((r) => r.category)))
    .filter((c) => c && !registeredNames.includes(c))
  const displayCats = [...registeredNames, ...legacyNames]

  function addRow() {
    const maxSort = rows.reduce((m, r) => Math.max(m, r.sort), -1)
    const cat = activeCat !== "全部" ? activeCat : displayCats[0] ?? "DESIGNER"
    setRows((p) => [
      ...p,
      {
        key: `new-${p.length}-${keyCounter++}`,
        slug: "",
        name: "",
        name_zh: "",
        role: "",
        category: cat,
        photo_url: "",
        instagram: "",
        facebook: "",
        website: "",
        phone: "",
        address: "",
        email: "",
        show_contact: false,
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

  // 依 displayCats 順序 + 某分類的新成員順序，重建整份 rows（含未變分類）
  function rebuildRows(cat: string, nextGroup: Row[]): Row[] {
    const next: Row[] = []
    for (const c of displayCats) {
      next.push(...(c === cat ? nextGroup : rows.filter((r) => r.category === c)))
    }
    return next
  }

  function reorderGroupLive(cat: string, nextGroup: Row[]) {
    setRows(rebuildRows(cat, nextGroup))
  }

  function reorderGroupCommit(cat: string, nextGroup: Row[]) {
    const next = rebuildRows(cat, nextGroup)
    setRows(next)
    const ids = next.filter((r) => r.id).map((r) => r.id!)
    startOrder(async () => {
      await reorderDesigners(ids)
    })
  }

  return (
    <div className="px-6 md:px-10 py-10 md:py-14 max-w-3xl">
      <div className="flex items-end justify-between mb-8 gap-4">
        <div>
          <p className="text-[10px] tracking-[0.5em] text-temo-gold uppercase mb-2">Team</p>
          <h1 className="text-3xl md:text-4xl font-bold text-temo-white">團隊成員</h1>
          <p className="text-temo-warm-gray/60 text-sm mt-1">
            共 {rows.length} 人 · 顯示在「關於我們」的團隊區。用下方「分類大項目」把成員分組（設計師、攝影師、顧問…），每個分類在前台是一個分頁；成員與分類都可用<span className="text-temo-warm-gray/80"> ⠿ 把手拖拉排序</span>。
          </p>
        </div>
        <button
          onClick={addRow}
          className="inline-flex items-center gap-2 px-5 py-3 bg-temo-gold text-temo-black text-xs font-bold tracking-[0.15em] uppercase rounded-sm hover:brightness-110 transition-all shrink-0"
        >
          <Plus className="w-4 h-4" /> 新增成員
        </button>
      </div>

      {/* 分類大項目管理 */}
      <CategoryManager
        cats={cats}
        setCats={setCats}
        legacyNames={legacyNames}
        rows={rows}
        setRows={setRows}
      />

      {/* 成員分類篩選 */}
      <div className="flex flex-wrap gap-2 mb-7">
        {["全部", ...displayCats].map((c) => {
          const count = c === "全部" ? rows.length : rows.filter((r) => r.category === c).length
          const active = activeCat === c
          return (
            <button
              key={c}
              onClick={() => setActiveCat(c)}
              className={cn(
                "inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs tracking-wider border transition-colors",
                active
                  ? "bg-temo-gold/15 border-temo-gold/50 text-temo-gold"
                  : "border-white/10 text-temo-warm-gray/60 hover:text-temo-white hover:border-white/25"
              )}
            >
              {c}
              <span className="opacity-50">{count}</span>
            </button>
          )
        })}
        {orderPending && (
          <span className="inline-flex items-center gap-1.5 text-[11px] text-temo-warm-gray/50 ml-1">
            <Loader2 className="w-3 h-3 animate-spin" /> 儲存順序…
          </span>
        )}
      </div>

      {/* 依分類分組，每組內拖拉排序 */}
      {(activeCat === "全部" ? displayCats : [activeCat]).map((cat) => {
        const groupRows = rows.filter((r) => r.category === cat)
        return (
          <div key={cat} className="mb-8">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-[11px] tracking-[0.25em] text-temo-gold uppercase whitespace-nowrap">{cat}</span>
              <span className="text-[11px] text-temo-warm-gray/40 whitespace-nowrap">{groupRows.length} 人</span>
              <div className="flex-1 h-px bg-white/8" />
            </div>
            <SortableList
              items={groupRows}
              getKey={(r) => r.key}
              onReorder={(next) => reorderGroupLive(cat, next)}
              onCommit={(next) => reorderGroupCommit(cat, next)}
              className="space-y-3"
              renderItem={(r, handle) => (
                <Card
                  row={r}
                  cats={displayCats}
                  handle={handle}
                  onChange={(patch) => update(r.key, patch)}
                  onRemove={() => removeRow(r.key)}
                />
              )}
            />
            {groupRows.length === 0 && (
              <p className="text-temo-warm-gray/40 text-xs py-3">此分類還沒有成員。</p>
            )}
          </div>
        )
      })}

      {rows.length === 0 && (
        <p className="text-temo-warm-gray/50 text-sm py-10 text-center">
          還沒有團隊成員，點右上「新增成員」。
        </p>
      )}
    </div>
  )
}

// ── 分類大項目管理區塊 ────────────────────────────────────────────────────────
function CategoryManager({
  cats,
  setCats,
  legacyNames,
  rows,
  setRows,
}: {
  cats: Cat[]
  setCats: React.Dispatch<React.SetStateAction<Cat[]>>
  legacyNames: string[]
  rows: Row[]
  setRows: React.Dispatch<React.SetStateAction<Row[]>>
}) {
  const [open, setOpen] = useState(false)
  const [newName, setNewName] = useState("")
  const [editing, setEditing] = useState<string | null>(null) // cat id
  const [editVal, setEditVal] = useState("")
  const [error, setError] = useState("")
  const [pending, startTransition] = useTransition()

  function add() {
    const name = newName.trim()
    if (!name) return
    setError("")
    startTransition(async () => {
      const res = await addTeamCategory(name)
      if (res.error) return setError(res.error)
      if (res.id) setCats((p) => [...p, { id: res.id!, name }])
      setNewName("")
    })
  }

  function commitRename(cat: Cat) {
    const name = editVal.trim()
    if (!name || name === cat.name) {
      setEditing(null)
      return
    }
    setError("")
    startTransition(async () => {
      const res = await renameTeamCategory(cat.id, cat.name, name)
      if (res.error) return setError(res.error)
      setCats((p) => p.map((c) => (c.id === cat.id ? { ...c, name } : c)))
      // 同步把成員身上的舊分類名改成新名
      setRows((p) => p.map((r) => (r.category === cat.name ? { ...r, category: name } : r)))
      setEditing(null)
    })
  }

  function del(cat: Cat) {
    const count = rows.filter((r) => r.category === cat.name).length
    if (count > 0) {
      setError(`「${cat.name}」底下還有 ${count} 位成員，請先把他們移到其他分類再刪。`)
      return
    }
    if (!confirm(`確定刪除分類「${cat.name}」？`)) return
    setError("")
    startTransition(async () => {
      const res = await deleteTeamCategory(cat.id, cat.name)
      if (res.error) return setError(res.error)
      setCats((p) => p.filter((c) => c.id !== cat.id))
    })
  }

  function commitOrder(next: Cat[]) {
    setCats(next)
    startTransition(async () => {
      await reorderTeamCategories(next.map((c) => c.id))
    })
  }

  return (
    <div className="mb-8 rounded-lg border border-white/10 bg-white/[0.02] overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-3 p-3.5 text-left hover:bg-white/[0.02] transition-colors"
      >
        <span className="text-[11px] tracking-[0.25em] text-temo-gold uppercase">分類大項目</span>
        <span className="text-[11px] text-temo-warm-gray/40">{cats.length} 類 · 可新增 / 改名 / 拖拉排序</span>
        <ChevronDown
          className={cn("w-4 h-4 text-temo-warm-gray/40 ml-auto shrink-0 transition-transform", open && "rotate-180")}
        />
      </button>

      {open && (
        <div className="border-t border-white/8 p-4 space-y-3">
          <SortableList
            items={cats}
            getKey={(c) => c.id}
            onReorder={(next) => setCats(next)}
            onCommit={commitOrder}
            className="space-y-2"
            renderItem={(cat, handle) => {
              const count = rows.filter((r) => r.category === cat.name).length
              const isEditing = editing === cat.id
              return (
                <div className="flex items-center gap-2 rounded-sm border border-white/10 bg-white/[0.02] px-2.5 py-2">
                  <button
                    type="button"
                    aria-label="拖拉排序"
                    className="text-temo-warm-gray/40 hover:text-temo-warm-gray active:cursor-grabbing shrink-0"
                    {...handle}
                  >
                    <GripVertical className="w-4 h-4" />
                  </button>
                  {isEditing ? (
                    <>
                      <input
                        autoFocus
                        className={cn(inputCls, "py-1.5")}
                        value={editVal}
                        onChange={(e) => setEditVal(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") commitRename(cat)
                          if (e.key === "Escape") setEditing(null)
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => commitRename(cat)}
                        className="text-temo-gold hover:brightness-125 shrink-0 p-1"
                        aria-label="確定"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditing(null)}
                        className="text-temo-warm-gray/50 hover:text-temo-white shrink-0 p-1"
                        aria-label="取消"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="text-sm text-temo-white flex-1 truncate">{cat.name}</span>
                      <span className="text-[11px] text-temo-warm-gray/40 shrink-0">{count} 人</span>
                      <button
                        type="button"
                        onClick={() => {
                          setEditing(cat.id)
                          setEditVal(cat.name)
                        }}
                        className="text-temo-warm-gray/50 hover:text-temo-white shrink-0 p-1"
                        aria-label="改名"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => del(cat)}
                        className="text-red-400/60 hover:text-red-400 shrink-0 p-1"
                        aria-label="刪除"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              )
            }}
          />

          {legacyNames.length > 0 && (
            <p className="text-[11px] text-temo-warm-gray/50 leading-relaxed">
              下列分類還沒登錄成大項目（成員身上有、但不能排序）：
              <span className="text-temo-warm-gray/80"> {legacyNames.join("、")}</span>
              。想排序的話，用上面「新增」打一樣的名字即可收編。
            </p>
          )}

          <div className="flex items-center gap-2 pt-1">
            <input
              className={cn(inputCls, "py-2")}
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && add()}
              placeholder="新分類名稱，例如 PHOTOGRAPHER 攝影師"
            />
            <button
              type="button"
              onClick={add}
              disabled={pending || !newName.trim()}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-temo-gold/90 text-temo-black text-xs font-bold tracking-wider rounded-sm hover:brightness-110 disabled:opacity-50 transition-all shrink-0"
            >
              {pending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />} 新增分類
            </button>
          </div>

          {error && <p className="text-xs text-red-400/90">{error}</p>}
        </div>
      )}
    </div>
  )
}

function Card({
  row,
  cats,
  handle,
  onChange,
  onRemove,
}: {
  row: Row
  cats: string[]
  handle: DragHandleProps
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

  // 成員身上的分類若不在大項目清單（舊資料），仍把它列進選單避免遺失
  const catOptions = cats.includes(row.category) || !row.category ? cats : [row.category, ...cats]

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.files?.[0]
    if (!raw) return
    setUploading(true)
    setError("")
    const file = await downscaleImage(raw, 1000)
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
          facebook: row.facebook,
          website: row.website,
          phone: row.phone,
          address: row.address,
          email: row.email,
          show_contact: row.show_contact,
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
      {/* 收合列（含拖拉把手） */}
      <div className="flex items-center gap-1 pl-2 pr-3">
        <button
          type="button"
          aria-label="拖拉排序"
          className="text-temo-warm-gray/30 hover:text-temo-warm-gray/70 active:cursor-grabbing shrink-0 py-3"
          {...handle}
        >
          <GripVertical className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex-1 flex items-center gap-3 py-3 text-left min-w-0"
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
          <ChevronDown
            className={cn("w-4 h-4 text-temo-warm-gray/40 shrink-0 transition-transform", open && "rotate-180")}
          />
        </button>
      </div>

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

          <div>
            <label className={labelCls}>分類大項目 *</label>
            <select
              className={cn(inputCls, "appearance-none")}
              value={row.category}
              onChange={(e) => set({ category: e.target.value })}
            >
              {catOptions.length === 0 && <option value="">（請先在上方新增分類）</option>}
              {catOptions.map((c) => (
                <option key={c} value={c} className="bg-temo-black">
                  {c}
                </option>
              ))}
            </select>
          </div>
          <p className="text-[10px] text-temo-warm-gray/50 leading-relaxed -mt-2">
            同一分類的成員在「關於我們」是同一個分頁。要新的分類（攝影師、顧問、行銷…）請在上方「分類大項目」新增。
            <br />
            ⚠️ 只有分類是 <span className="text-temo-gold/80">DESIGNER</span> 的成員，才會出現在「作品」的設計師選單裡。
          </p>

          <div>
            <label className={labelCls}>slug（獨立頁網址，可留空）</label>
            <input className={inputCls} value={row.slug} onChange={(e) => set({ slug: e.target.value })} placeholder="kevin" />
          </div>

          {/* 社群連結（前台成員卡會顯示 icon） */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Instagram 連結</label>
              <input className={inputCls} value={row.instagram} onChange={(e) => set({ instagram: e.target.value })} placeholder="https://instagram.com/..." />
            </div>
            <div>
              <label className={labelCls}>Facebook 連結</label>
              <input className={inputCls} value={row.facebook} onChange={(e) => set({ facebook: e.target.value })} placeholder="https://facebook.com/..." />
            </div>
          </div>
          <div>
            <label className={labelCls}>個人網站連結</label>
            <input className={inputCls} value={row.website} onChange={(e) => set({ website: e.target.value })} placeholder="https://..." />
          </div>

          {/* 個人聯絡（是否公開由下方開關控制） */}
          <div className="rounded-md border border-white/8 bg-white/[0.015] p-3.5 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>聯絡電話</label>
                <input className={inputCls} value={row.phone} onChange={(e) => set({ phone: e.target.value })} placeholder="0912-345-678" />
              </div>
              <div>
                <label className={labelCls}>信箱</label>
                <input className={inputCls} value={row.email} onChange={(e) => set({ email: e.target.value })} placeholder="name@temo.design" />
              </div>
            </div>
            <div>
              <label className={labelCls}>地址</label>
              <input className={inputCls} value={row.address} onChange={(e) => set({ address: e.target.value })} placeholder="台中市…" />
            </div>
            <label className="flex items-center gap-2 text-xs text-temo-warm-gray/70 cursor-pointer">
              <input
                type="checkbox"
                checked={row.show_contact}
                onChange={(e) => set({ show_contact: e.target.checked })}
                className="accent-temo-gold w-4 h-4"
              />
              在公開團隊頁顯示此人的電話 / 地址 / 信箱（預設不公開，避免個資外露）
            </label>
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
