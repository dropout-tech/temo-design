"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Upload, Trash2, ArrowLeft, X, GripVertical } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { downscaleImage } from "@/lib/downscale-image"
import { isVideoUrl } from "@/lib/video"
import { cn } from "@/lib/utils"
import { SortableList, type DragHandleProps } from "@/components/studio/sortable-list"
import { saveWork, deleteWork, type WorkInput } from "@/app/studio/(app)/works/actions"
import type { WorkBlockRow } from "@/lib/studio/works"

type Options = {
  categories: { value: string; label: string }[]
  clients: { id: string; name: string }[]
  designers: { id: string; name: string; name_zh: string | null }[]
  industries: { value: string; label: string }[]
}

export type WorkFormInitial = {
  slug: string
  title: string
  subtitle: string
  category_group: string
  year: string
  client_id: string
  cover_url: string
  /** 內頁首圖，選填，留空＝沿用封面圖 */
  hero_url?: string
  video_url: string
  size: "large" | "medium" | "small"
  description: string
  services: string
  deliverables: string
  challenge: string
  approach: string
  result: string
  quote_text: string
  quote_author: string
  awards: string
  published: boolean
  industryValues: string[]
  designerIds: string[]
  /** 舊資料：僅用於表單初始化時的一次性 fallback，不再被編輯或送出 */
  gallery: { src: string; alt?: string; caption?: string }[]
  /** 內容區塊（新系統），有值時以此為準 */
  blocks?: WorkBlockRow[]
}

const EMPTY: WorkFormInitial = {
  slug: "", title: "", subtitle: "", category_group: "", year: "", client_id: "",
  cover_url: "", hero_url: "", video_url: "", size: "medium", description: "", services: "",
  deliverables: "", challenge: "", approach: "", result: "", quote_text: "",
  quote_author: "", awards: "", published: true, industryValues: [], designerIds: [],
  gallery: [], blocks: [],
}

// ── 內容區塊：表單內部工作形狀。用本地 key 給 React list，送出時才轉成 WorkInput 的 blocks。──
type BlockType = "image" | "video" | "text"

type FormBlock = {
  key: string
  type: BlockType
  /** UI 專用旗標：image 類型是否顯示第二張上傳格（DB 沒有這欄，由 src2 是否有值反推形狀） */
  dual: boolean
  src: string
  alt: string
  width?: number
  height?: number
  src2: string
  alt2: string
  width2?: number
  height2?: number
  text_content: string
  video_url: string
  caption: string
}

function newKey() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}

function emptyBlock(type: BlockType, dual = false): FormBlock {
  return {
    key: newKey(), type, dual, src: "", alt: "", width: undefined, height: undefined,
    src2: "", alt2: "", width2: undefined, height2: undefined,
    text_content: "", video_url: "", caption: "",
  }
}

function blockRowToForm(b: WorkBlockRow): FormBlock {
  return {
    key: b.id || newKey(),
    type: b.type,
    dual: b.type === "image" && !!b.src2,
    src: b.src ?? "",
    alt: b.alt ?? "",
    width: b.width ?? undefined,
    height: b.height ?? undefined,
    src2: b.src2 ?? "",
    alt2: b.alt2 ?? "",
    width2: b.width2 ?? undefined,
    height2: b.height2 ?? undefined,
    text_content: b.text_content ?? "",
    video_url: b.video_url ?? "",
    caption: b.caption ?? "",
  }
}

/** 表單初始內容區塊：有 blocks 就用 blocks；沒有但舊 gallery 有圖，轉成單圖區塊無痛接軌。 */
function initialBlocksFrom(initial?: WorkFormInitial): FormBlock[] {
  if (initial?.blocks && initial.blocks.length > 0) {
    return initial.blocks.map(blockRowToForm)
  }
  if (initial?.gallery && initial.gallery.length > 0) {
    return initial.gallery.map((g) => ({
      key: newKey(),
      type: "image" as const,
      dual: false,
      src: g.src,
      alt: g.alt ?? "",
      width: undefined,
      height: undefined,
      src2: "",
      alt2: "",
      width2: undefined,
      height2: undefined,
      text_content: "",
      video_url: "",
      caption: g.caption ?? "",
    }))
  }
  return []
}

function measureImage(url: string): Promise<{ width: number; height: number } | null> {
  return new Promise((resolve) => {
    const img = new window.Image()
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight })
    img.onerror = () => resolve(null)
    img.src = url
  })
}

const inputCls =
  "w-full px-4 py-3 bg-white/[0.03] border border-white/10 text-temo-white text-sm placeholder:text-white/20 focus:border-temo-gold/60 focus:bg-white/[0.05] focus:outline-none transition-all rounded-sm"
const labelCls =
  "block text-[11px] tracking-[0.2em] text-temo-warm-gray/70 uppercase mb-2"

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      {children}
      {hint && <p className="text-[11px] text-temo-warm-gray/40 mt-1.5">{hint}</p>}
    </div>
  )
}

const toLines = (s: string) => s.split("\n").map((x) => x.trim()).filter(Boolean)

export function WorkForm({
  initial,
  workId,
  options,
}: {
  initial?: WorkFormInitial
  workId?: string
  options: Options
}) {
  const router = useRouter()
  const [f, setF] = useState<WorkFormInitial>(initial ?? EMPTY)
  const [heroUrl, setHeroUrl] = useState(initial?.hero_url ?? "")
  const [blocks, setBlocks] = useState<FormBlock[]>(() => initialBlocksFrom(initial))
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")
  const [pending, startTransition] = useTransition()

  const set = <K extends keyof WorkFormInitial>(k: K, v: WorkFormInitial[K]) =>
    setF((prev) => ({ ...prev, [k]: v }))

  function toggle(list: string[], v: string) {
    return list.includes(v) ? list.filter((x) => x !== v) : [...list, v]
  }

  async function uploadToStorage(raw: File): Promise<string | null> {
    // 作品是大圖展示 → 上限放寬到 1920px（只砍超大怪圖，正常尺寸原檔不動）
    const file = await downscaleImage(raw, 1920, 0.9)
    const supabase = createClient()
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase()
    const path = `works/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
    const { error: upErr } = await supabase.storage
      .from("media")
      .upload(path, file, { cacheControl: "3600", upsert: false })
    if (upErr) {
      setError("圖片上傳失敗：" + upErr.message)
      return null
    }
    return supabase.storage.from("media").getPublicUrl(path).data.publicUrl
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError("")
    const url = await uploadToStorage(file)
    if (url) set("cover_url", url)
    setUploading(false)
    e.target.value = ""
  }

  async function onHeroFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError("")
    const url = await uploadToStorage(file)
    if (url) setHeroUrl(url)
    setUploading(false)
    e.target.value = ""
  }

  function clearHero() {
    setHeroUrl("")
  }

  function addBlock(type: BlockType) {
    setBlocks((prev) => [...prev, emptyBlock(type)])
  }

  function removeBlock(idx: number) {
    setBlocks((prev) => prev.filter((_, i) => i !== idx))
  }

  function moveBlock(idx: number, dir: -1 | 1) {
    setBlocks((prev) => {
      const next = [...prev]
      const j = idx + dir
      if (j < 0 || j >= next.length) return prev
      ;[next[idx], next[j]] = [next[j], next[idx]]
      return next
    })
  }

  function updateBlock(idx: number, patch: Partial<FormBlock>) {
    setBlocks((prev) => prev.map((b, i) => (i === idx ? { ...b, ...patch } : b)))
  }

  /** 區塊圖片上傳：slot 1＝主圖（單圖／雙圖第一張），slot 2＝雙圖第二張；上傳完量出實際像素尺寸存起來，前台靠它做形狀自適應。 */
  async function onBlockImage(idx: number, slot: 1 | 2, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError("")
    const url = await uploadToStorage(file)
    if (url) {
      const dim = await measureImage(url)
      updateBlock(
        idx,
        slot === 1
          ? { src: url, width: dim?.width, height: dim?.height }
          : { src2: url, width2: dim?.width, height2: dim?.height }
      )
    }
    setUploading(false)
    e.target.value = ""
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    const input: WorkInput = {
      slug: f.slug, title: f.title, subtitle: f.subtitle,
      category_group: f.category_group, year: f.year, client_id: f.client_id,
      cover_url: f.cover_url, hero_url: heroUrl, video_url: f.video_url, size: f.size,
      description: f.description, services: toLines(f.services),
      deliverables: toLines(f.deliverables), challenge: f.challenge,
      approach: f.approach, result: f.result, quote_text: f.quote_text,
      quote_author: f.quote_author, awards: toLines(f.awards),
      published: f.published, industryValues: f.industryValues, designerIds: f.designerIds,
      blocks: blocks.map((b) => ({
        type: b.type,
        src: b.src,
        alt: b.alt,
        width: b.width ?? null,
        height: b.height ?? null,
        src2: b.src2,
        alt2: b.alt2,
        width2: b.width2 ?? null,
        height2: b.height2 ?? null,
        text_content: b.text_content,
        video_url: b.video_url,
        caption: b.caption,
      })),
    }
    startTransition(async () => {
      const res = await saveWork(input, workId)
      if (res?.error) setError(res.error)
    })
  }

  function onDelete() {
    if (!workId) return
    if (!confirm(`確定要刪除「${f.title}」嗎？此動作無法復原。`)) return
    startTransition(async () => {
      const res = await deleteWork(workId)
      if (res?.error) setError(res.error)
    })
  }

  const busy = pending || uploading

  return (
    <form onSubmit={submit} className="px-6 md:px-10 py-8 md:py-12 max-w-3xl space-y-10">
      <div>
        <button
          type="button"
          onClick={() => router.push("/studio/works")}
          className="inline-flex items-center gap-1.5 text-temo-warm-gray/60 hover:text-temo-gold text-sm mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> 返回作品列表
        </button>
        <h1 className="text-2xl md:text-3xl font-bold text-temo-white">
          {workId ? "編輯作品" : "新增作品"}
        </h1>
      </div>

      {/* 基本資料 */}
      <section className="space-y-5">
        <SectionTitle>基本資料</SectionTitle>
        <Field label="標題（中文）*">
          <input className={inputCls} value={f.title} onChange={(e) => set("title", e.target.value)} required />
        </Field>
        <Field label="英文副標">
          <input className={inputCls} value={f.subtitle} onChange={(e) => set("subtitle", e.target.value)} />
        </Field>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Field label="網址 slug *" hint="用於 /portfolio/[slug]，英數與連字號">
            <input className={inputCls} value={f.slug} onChange={(e) => set("slug", e.target.value)} required placeholder="tea-brand" />
          </Field>
          <Field label="年份">
            <input className={inputCls} value={f.year} onChange={(e) => set("year", e.target.value)} placeholder="2025" />
          </Field>
        </div>
      </section>

      {/* 分類與關聯 */}
      <section className="space-y-5">
        <SectionTitle>分類與關聯</SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Field label="執行項目（單選）">
            <select className={inputCls} value={f.category_group} onChange={(e) => set("category_group", e.target.value)}>
              <option value="">（未選）</option>
              {options.categories.map((c) => (
                <option key={c.value} value={c.value} className="bg-[#201d1a]">{c.label}</option>
              ))}
            </select>
          </Field>
          <Field label="版面尺寸">
            <select className={inputCls} value={f.size} onChange={(e) => set("size", e.target.value as WorkFormInitial["size"])}>
              <option value="large" className="bg-[#201d1a]">large（直立大圖）</option>
              <option value="medium" className="bg-[#201d1a]">medium（正方）</option>
              <option value="small" className="bg-[#201d1a]">small（橫式小圖）</option>
            </select>
          </Field>
        </div>
        <Field label="客戶">
          <select className={inputCls} value={f.client_id} onChange={(e) => set("client_id", e.target.value)}>
            <option value="">（未選）</option>
            {options.clients.map((c) => (
              <option key={c.id} value={c.id} className="bg-[#201d1a]">{c.name}</option>
            ))}
          </select>
        </Field>
        <Field label="行業分類（可複選）">
          <ChipGroup
            items={options.industries.map((i) => ({ value: i.value, label: i.label }))}
            selected={f.industryValues}
            onToggle={(v) => set("industryValues", toggle(f.industryValues, v))}
          />
        </Field>
        <Field label="設計師（可複選）">
          <ChipGroup
            items={options.designers.map((d) => ({ value: d.id, label: d.name_zh ? `${d.name}（${d.name_zh}）` : d.name }))}
            selected={f.designerIds}
            onToggle={(v) => set("designerIds", toggle(f.designerIds, v))}
          />
        </Field>
      </section>

      {/* 封面與影片 */}
      <section className="space-y-5">
        <SectionTitle>封面與影片</SectionTitle>
        <Field label="封面圖">
          <div className="flex items-start gap-4">
            <div className="w-32 h-32 rounded-lg overflow-hidden bg-white/[0.04] border border-white/10 shrink-0">
              {f.cover_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={f.cover_url} alt="封面預覽" className="w-full h-full object-cover" />
              )}
            </div>
            <div className="flex-1 space-y-2">
              <label className={cn("inline-flex items-center gap-2 px-4 py-2.5 border border-white/15 text-temo-white text-xs tracking-wider rounded-sm cursor-pointer hover:border-temo-gold/50 transition-colors", uploading && "opacity-60 pointer-events-none")}>
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {uploading ? "上傳中…" : "上傳圖片"}
                <input type="file" accept="image/*" className="hidden" onChange={onFile} disabled={uploading} />
              </label>
              <input className={inputCls} value={f.cover_url} onChange={(e) => set("cover_url", e.target.value)} placeholder="或直接貼圖片網址 /images/portfolio/xxx.jpg" />
            </div>
          </div>
        </Field>
        <Field label="內頁首圖（選填）" hint="留空＝沿用封面圖；作品內頁最上方顯示的大圖">
          <div className="flex items-start gap-4">
            <div className="w-32 h-32 rounded-lg overflow-hidden bg-white/[0.04] border border-white/10 shrink-0">
              {heroUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={heroUrl} alt="內頁首圖預覽" className="w-full h-full object-cover" />
              )}
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <label className={cn("inline-flex items-center gap-2 px-4 py-2.5 border border-white/15 text-temo-white text-xs tracking-wider rounded-sm cursor-pointer hover:border-temo-gold/50 transition-colors", uploading && "opacity-60 pointer-events-none")}>
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  {uploading ? "上傳中…" : "上傳圖片"}
                  <input type="file" accept="image/*" className="hidden" onChange={onHeroFile} disabled={uploading} />
                </label>
                {heroUrl && (
                  <button type="button" onClick={clearHero} className="inline-flex items-center gap-1 px-3 py-2.5 text-red-400/70 hover:text-red-400 text-xs tracking-wider transition-colors">
                    <X className="w-3.5 h-3.5" /> 清除，改用封面圖
                  </button>
                )}
              </div>
              <input className={inputCls} value={heroUrl} onChange={(e) => setHeroUrl(e.target.value)} placeholder="或直接貼圖片網址（留空則沿用封面圖）" />
            </div>
          </div>
        </Field>
        <Field label="首圖影片（YouTube / Vimeo 連結，選填）" hint="有值時內頁最上方以影片呈現，取代首圖">
          <input className={inputCls} value={f.video_url} onChange={(e) => set("video_url", e.target.value)} placeholder="https://youtu.be/..." />
          {f.video_url.trim() && !isVideoUrl(f.video_url) && (
            <p className="text-[11px] text-red-400/80 mt-1.5">看起來不是支援的 YouTube / Vimeo 連結</p>
          )}
        </Field>
      </section>

      {/* 內容區塊：Adobe Portfolio 式彈性內頁編排 */}
      <section className="space-y-5">
        <SectionTitle>內容區塊</SectionTitle>
        <p className="text-xs text-temo-warm-gray/50 -mt-2">
          自由編排作品內頁的內容，由上而下依序呈現。可新增單圖、雙圖並排、文字段落、影片區塊，並用上移／下移調整順序。
        </p>

        {blocks.length > 0 && (
          <SortableList
            items={blocks}
            getKey={(b) => b.key}
            onReorder={(next) => setBlocks(next)}
            onCommit={(next) => setBlocks(next)}
            className="space-y-3"
            renderItem={(b, handle) => {
              const i = blocks.findIndex((x) => x.key === b.key)
              return (
                <BlockCard
                  block={b}
                  index={i}
                  total={blocks.length}
                  uploading={uploading}
                  dragHandle={handle}
                  onMove={(dir) => moveBlock(i, dir)}
                  onRemove={() => removeBlock(i)}
                  onChange={(patch) => updateBlock(i, patch)}
                  onUploadImage={(slot, e) => onBlockImage(i, slot, e)}
                />
              )
            }}
          />
        )}

        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] tracking-[0.2em] text-temo-warm-gray/60 uppercase mr-1">新增區塊</span>
          <button type="button" onClick={() => setBlocks((prev) => [...prev, emptyBlock("image", false)])} className="px-3 py-2 text-xs border border-white/15 text-temo-white rounded-sm hover:border-temo-gold/50 transition-colors">+ 單圖</button>
          <button type="button" onClick={() => setBlocks((prev) => [...prev, emptyBlock("image", true)])} className="px-3 py-2 text-xs border border-white/15 text-temo-white rounded-sm hover:border-temo-gold/50 transition-colors">+ 雙圖</button>
          <button type="button" onClick={() => addBlock("text")} className="px-3 py-2 text-xs border border-white/15 text-temo-white rounded-sm hover:border-temo-gold/50 transition-colors">+ 文字</button>
          <button type="button" onClick={() => addBlock("video")} className="px-3 py-2 text-xs border border-white/15 text-temo-white rounded-sm hover:border-temo-gold/50 transition-colors">+ 影片</button>
        </div>
      </section>

      {/* 案例內容 */}
      <section className="space-y-5">
        <SectionTitle>案例內容</SectionTitle>
        <Field label="簡述">
          <textarea className={cn(inputCls, "min-h-20 resize-y")} value={f.description} onChange={(e) => set("description", e.target.value)} />
        </Field>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Field label="服務範疇" hint="一行一項">
            <textarea className={cn(inputCls, "min-h-24 resize-y")} value={f.services} onChange={(e) => set("services", e.target.value)} placeholder={"品牌策略\nLogo 設計"} />
          </Field>
          <Field label="交付項目" hint="一行一項">
            <textarea className={cn(inputCls, "min-h-24 resize-y")} value={f.deliverables} onChange={(e) => set("deliverables", e.target.value)} />
          </Field>
        </div>
        <Field label="挑戰 Challenge">
          <textarea className={cn(inputCls, "min-h-20 resize-y")} value={f.challenge} onChange={(e) => set("challenge", e.target.value)} />
        </Field>
        <Field label="做法 Approach">
          <textarea className={cn(inputCls, "min-h-20 resize-y")} value={f.approach} onChange={(e) => set("approach", e.target.value)} />
        </Field>
        <Field label="成果 Result">
          <textarea className={cn(inputCls, "min-h-20 resize-y")} value={f.result} onChange={(e) => set("result", e.target.value)} />
        </Field>
        <Field label="獎項" hint="一行一項">
          <textarea className={cn(inputCls, "min-h-20 resize-y")} value={f.awards} onChange={(e) => set("awards", e.target.value)} />
        </Field>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Field label="引言內文">
            <input className={inputCls} value={f.quote_text} onChange={(e) => set("quote_text", e.target.value)} />
          </Field>
          <Field label="引言出處">
            <input className={inputCls} value={f.quote_author} onChange={(e) => set("quote_author", e.target.value)} />
          </Field>
        </div>
      </section>

      {/* 發布 */}
      <section className="space-y-5">
        <SectionTitle>發布</SectionTitle>
        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" checked={f.published} onChange={(e) => set("published", e.target.checked)} className="w-4 h-4 accent-temo-gold" />
          <span className="text-sm text-temo-white">上架顯示（取消勾選則存為草稿，前台不顯示）</span>
        </label>
      </section>

      {error && <p className="text-sm text-red-400/90">{error}</p>}

      {/* 動作列 */}
      <div className="flex items-center gap-3 pt-4 border-t border-white/[0.06]">
        <button type="submit" disabled={busy} className="inline-flex items-center gap-2 px-6 py-3 bg-temo-gold text-temo-black text-xs font-bold tracking-[0.2em] uppercase hover:brightness-110 active:scale-[0.98] disabled:opacity-60 transition-all rounded-sm">
          {pending && <Loader2 className="w-4 h-4 animate-spin" />}
          {workId ? "儲存變更" : "建立作品"}
        </button>
        <button type="button" onClick={() => router.push("/studio/works")} className="px-5 py-3 text-temo-warm-gray/70 hover:text-temo-white text-xs tracking-wider transition-colors">
          取消
        </button>
        {workId && (
          <button type="button" onClick={onDelete} disabled={busy} className="ml-auto inline-flex items-center gap-1.5 px-4 py-3 text-red-400/80 hover:text-red-400 text-xs tracking-wider transition-colors disabled:opacity-60">
            <Trash2 className="w-3.5 h-3.5" /> 刪除
          </button>
        )}
      </div>
    </form>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <p className="text-[10px] tracking-[0.4em] text-temo-gold uppercase pb-2 border-b border-white/[0.06]">{children}</p>
}

const blockTypeLabel = (b: { type: "image" | "video" | "text"; dual: boolean }) =>
  b.type === "image" ? (b.dual ? "雙圖" : "單圖") : b.type === "video" ? "影片" : "文字"

function BlockCard({
  block,
  index,
  total,
  uploading,
  dragHandle,
  onMove,
  onRemove,
  onChange,
  onUploadImage,
}: {
  block: FormBlock
  index: number
  total: number
  uploading: boolean
  dragHandle: DragHandleProps
  onMove: (dir: -1 | 1) => void
  onRemove: () => void
  onChange: (patch: Partial<FormBlock>) => void
  onUploadImage: (slot: 1 | 2, e: React.ChangeEvent<HTMLInputElement>) => void
}) {
  return (
    <div className="p-4 rounded-lg border border-white/10 bg-white/[0.02] space-y-3">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-[11px] tracking-[0.2em] text-temo-gold/80 uppercase">
          <button
            type="button"
            aria-label="拖拉排序"
            className="text-temo-warm-gray/40 hover:text-temo-warm-gray active:cursor-grabbing shrink-0"
            {...dragHandle}
          >
            <GripVertical className="w-4 h-4" />
          </button>
          {index + 1}. {blockTypeLabel(block)}
        </span>
        <div className="flex items-center gap-2 text-xs">
          <button type="button" onClick={() => onMove(-1)} disabled={index === 0} className="px-2 py-1 text-temo-warm-gray/60 hover:text-temo-white disabled:opacity-30 transition-colors">↑ 上移</button>
          <button type="button" onClick={() => onMove(1)} disabled={index === total - 1} className="px-2 py-1 text-temo-warm-gray/60 hover:text-temo-white disabled:opacity-30 transition-colors">↓ 下移</button>
          <button type="button" onClick={onRemove} className="px-2 py-1 text-red-400/70 hover:text-red-400 transition-colors">✕ 刪除</button>
        </div>
      </div>

      {block.type === "image" && !block.dual && (
        <div className="flex items-start gap-3">
          <div className="w-24 h-24 rounded-md overflow-hidden bg-white/[0.04] shrink-0 border border-white/10">
            {block.src && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={block.src} alt="" className="w-full h-full object-cover" />
            )}
          </div>
          <div className="flex-1 min-w-0 space-y-2">
            <label className={cn("inline-flex items-center gap-2 px-3 py-2 border border-white/15 text-temo-white text-xs tracking-wider rounded-sm cursor-pointer hover:border-temo-gold/50 transition-colors", uploading && "opacity-60 pointer-events-none")}>
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {block.src ? "更換圖片" : "上傳圖片"}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => onUploadImage(1, e)} disabled={uploading} />
            </label>
            <input className={inputCls} value={block.alt} onChange={(e) => onChange({ alt: e.target.value })} placeholder="圖片替代文字 alt（選填）" />
            <input className={inputCls} value={block.caption} onChange={(e) => onChange({ caption: e.target.value })} placeholder="圖片說明（選填）" />
          </div>
        </div>
      )}

      {block.type === "image" && block.dual && (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-3">
            {[1, 2].map((slot) => {
              const src = slot === 1 ? block.src : block.src2
              const alt = slot === 1 ? block.alt : block.alt2
              return (
                <div key={slot} className="space-y-2">
                  <div className="w-full aspect-square rounded-md overflow-hidden bg-white/[0.04] border border-white/10">
                    {src && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={src} alt="" className="w-full h-full object-cover" />
                    )}
                  </div>
                  <label className={cn("inline-flex items-center gap-2 px-3 py-2 border border-white/15 text-temo-white text-xs tracking-wider rounded-sm cursor-pointer hover:border-temo-gold/50 transition-colors w-full justify-center", uploading && "opacity-60 pointer-events-none")}>
                    {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    {src ? `更換第${slot}張` : `上傳第${slot}張`}
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => onUploadImage(slot as 1 | 2, e)} disabled={uploading} />
                  </label>
                  <input
                    className={inputCls}
                    value={alt}
                    onChange={(e) => onChange(slot === 1 ? { alt: e.target.value } : { alt2: e.target.value })}
                    placeholder={`第${slot}張 alt（選填）`}
                  />
                </div>
              )
            })}
          </div>
          <input className={inputCls} value={block.caption} onChange={(e) => onChange({ caption: e.target.value })} placeholder="共用說明文字（選填）" />
        </div>
      )}

      {block.type === "text" && (
        <div className="space-y-2">
          <textarea
            className={cn(inputCls, "min-h-28 resize-y")}
            value={block.text_content}
            onChange={(e) => onChange({ text_content: e.target.value })}
            placeholder="輸入段落文字，會以文字段落呈現在作品內頁"
          />
        </div>
      )}

      {block.type === "video" && (
        <div className="space-y-2">
          <input
            className={inputCls}
            value={block.video_url}
            onChange={(e) => onChange({ video_url: e.target.value })}
            placeholder="https://youtu.be/... 或 Vimeo 連結"
          />
          {block.video_url.trim() && !isVideoUrl(block.video_url) && (
            <p className="text-[11px] text-red-400/80">看起來不是支援的 YouTube / Vimeo 連結</p>
          )}
          <input className={inputCls} value={block.caption} onChange={(e) => onChange({ caption: e.target.value })} placeholder="影片說明（選填）" />
        </div>
      )}
    </div>
  )
}

function ChipGroup({
  items,
  selected,
  onToggle,
}: {
  items: { value: string; label: string }[]
  selected: string[]
  onToggle: (v: string) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((it) => {
        const active = selected.includes(it.value)
        return (
          <button
            key={it.value}
            type="button"
            onClick={() => onToggle(it.value)}
            className={cn(
              "px-3 py-1.5 text-xs rounded-full border transition-colors",
              active
                ? "bg-temo-gold/15 border-temo-gold/50 text-temo-gold"
                : "border-white/10 text-temo-warm-gray/60 hover:text-temo-white hover:border-white/25"
            )}
          >
            {it.label}
          </button>
        )
      })}
    </div>
  )
}
