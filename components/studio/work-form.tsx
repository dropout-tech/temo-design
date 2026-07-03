"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Upload, Trash2, ArrowLeft } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { saveWork, deleteWork, type WorkInput } from "@/app/studio/(app)/works/actions"

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
  gallery: { src: string; alt?: string; caption?: string }[]
}

const EMPTY: WorkFormInitial = {
  slug: "", title: "", subtitle: "", category_group: "", year: "", client_id: "",
  cover_url: "", video_url: "", size: "medium", description: "", services: "",
  deliverables: "", challenge: "", approach: "", result: "", quote_text: "",
  quote_author: "", awards: "", published: true, industryValues: [], designerIds: [],
  gallery: [],
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
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")
  const [pending, startTransition] = useTransition()

  const set = <K extends keyof WorkFormInitial>(k: K, v: WorkFormInitial[K]) =>
    setF((prev) => ({ ...prev, [k]: v }))

  function toggle(list: string[], v: string) {
    return list.includes(v) ? list.filter((x) => x !== v) : [...list, v]
  }

  async function uploadToStorage(file: File): Promise<string | null> {
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

  async function onAddGalleryImages(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (files.length === 0) return
    setUploading(true)
    setError("")
    const uploaded: { src: string; caption?: string }[] = []
    for (const file of files) {
      const url = await uploadToStorage(file)
      if (url) uploaded.push({ src: url })
    }
    if (uploaded.length > 0) {
      setF((prev) => ({ ...prev, gallery: [...prev.gallery, ...uploaded] }))
    }
    setUploading(false)
    e.target.value = ""
  }

  function removeGalleryImage(idx: number) {
    setF((prev) => ({ ...prev, gallery: prev.gallery.filter((_, i) => i !== idx) }))
  }

  function moveGalleryImage(idx: number, dir: -1 | 1) {
    setF((prev) => {
      const next = [...prev.gallery]
      const j = idx + dir
      if (j < 0 || j >= next.length) return prev
      ;[next[idx], next[j]] = [next[j], next[idx]]
      return { ...prev, gallery: next }
    })
  }

  function setGalleryCaption(idx: number, caption: string) {
    setF((prev) => ({
      ...prev,
      gallery: prev.gallery.map((g, i) => (i === idx ? { ...g, caption } : g)),
    }))
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    const input: WorkInput = {
      slug: f.slug, title: f.title, subtitle: f.subtitle,
      category_group: f.category_group, year: f.year, client_id: f.client_id,
      cover_url: f.cover_url, video_url: f.video_url, size: f.size,
      description: f.description, services: toLines(f.services),
      deliverables: toLines(f.deliverables), challenge: f.challenge,
      approach: f.approach, result: f.result, quote_text: f.quote_text,
      quote_author: f.quote_author, awards: toLines(f.awards),
      published: f.published, industryValues: f.industryValues, designerIds: f.designerIds,
      gallery: f.gallery.map((g) => ({ src: g.src, alt: g.alt ?? "", caption: g.caption ?? "" })),
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
        <Field label="影片連結（YouTube / Vimeo，選填）" hint="貼上後詳情頁會自動嵌入播放器">
          <input className={inputCls} value={f.video_url} onChange={(e) => set("video_url", e.target.value)} placeholder="https://youtu.be/..." />
        </Field>
      </section>

      {/* 作品圖片（多張 gallery） */}
      <section className="space-y-5">
        <SectionTitle>作品圖片（多張）</SectionTitle>
        <p className="text-xs text-temo-warm-gray/50 -mt-2">
          除了封面之外，可再上傳多張圖片，會顯示在作品詳情頁下方的圖庫。可一次選多張。
        </p>

        {f.gallery.length > 0 && (
          <div className="space-y-3">
            {f.gallery.map((g, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg border border-white/10 bg-white/[0.02]">
                <div className="w-20 h-20 rounded-md overflow-hidden bg-white/[0.04] shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={g.src} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0 space-y-2">
                  <input
                    className={inputCls}
                    value={g.caption ?? ""}
                    onChange={(e) => setGalleryCaption(i, e.target.value)}
                    placeholder="圖片說明（選填）"
                  />
                  <div className="flex items-center gap-2 text-xs">
                    <button type="button" onClick={() => moveGalleryImage(i, -1)} disabled={i === 0} className="px-2 py-1 text-temo-warm-gray/60 hover:text-temo-white disabled:opacity-30 transition-colors">↑ 上移</button>
                    <button type="button" onClick={() => moveGalleryImage(i, 1)} disabled={i === f.gallery.length - 1} className="px-2 py-1 text-temo-warm-gray/60 hover:text-temo-white disabled:opacity-30 transition-colors">↓ 下移</button>
                    <button type="button" onClick={() => removeGalleryImage(i)} className="ml-auto px-2 py-1 text-red-400/70 hover:text-red-400 transition-colors">移除</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <label className={cn("inline-flex items-center gap-2 px-4 py-2.5 border border-white/15 text-temo-white text-xs tracking-wider rounded-sm cursor-pointer hover:border-temo-gold/50 transition-colors", uploading && "opacity-60 pointer-events-none")}>
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          {uploading ? "上傳中…" : "新增圖片（可多選）"}
          <input type="file" accept="image/*" multiple className="hidden" onChange={onAddGalleryImages} disabled={uploading} />
        </label>
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
