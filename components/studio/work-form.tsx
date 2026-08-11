"use client"

import { useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Upload, Trash2, ArrowLeft, X, GripVertical, Minus, Move, Plus, RotateCcw } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { downscaleImage } from "@/lib/downscale-image"
import { isVideoUrl } from "@/lib/video"
import { isUploadedVideoUrl } from "@/lib/media-url"
import { cn } from "@/lib/utils"
import { SortableList, type DragHandleProps } from "@/components/studio/sortable-list"
import { saveWork, deleteWork, type WorkInput } from "@/app/studio/(app)/works/actions"
import type { WorkBlockRow } from "@/lib/studio/works"
import { RichTextEditor, looksLikeHtml, plainTextToHtml } from "@/components/studio/rich-text-editor"
import { normalizeWorkSlug } from "@/lib/work-slug"
import {
  COVER_POSITION_MAX,
  COVER_POSITION_MIN,
  COVER_ZOOM_MAX,
  COVER_ZOOM_MIN,
  DEFAULT_COVER_CROP,
  getCoverCropStyle,
  normalizeCoverCrop,
  type CoverCrop,
} from "@/lib/cover-crop"

type Options = {
  categories: { value: string; label: string }[]
  clients: {
    id: string
    name: string
    address?: string | null
    phone?: string | null
    website?: string | null
  }[]
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
  cover_zoom: number
  cover_position_x: number
  cover_position_y: number
  /** 內頁首圖，選填，留空＝沿用封面圖 */
  hero_url?: string
  /** 客戶 LOGO，選填可多張（一件作品可能有多位客戶）；顯示於作品內頁右側資訊欄最頂端 */
  client_logo_urls?: string[]
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
  press: string
  published: boolean
  industryValues: string[]
  /** 不在既有行業分類中的作品專屬顯示名稱 */
  customIndustryNames: string[]
  designerIds: string[]
  /** 不在正式團隊名冊中的單次合作設計師，只在這件作品前台顯示名稱 */
  guestDesignerNames: string[]
  /** 舊資料：僅用於表單初始化時的一次性 fallback，不再被編輯或送出 */
  gallery: { src: string; alt?: string; caption?: string }[]
  /** 內容區塊（新系統），有值時以此為準 */
  blocks?: WorkBlockRow[]
}

const EMPTY: WorkFormInitial = {
  slug: "", title: "", subtitle: "", category_group: "", year: "", client_id: "",
  cover_url: "", cover_zoom: DEFAULT_COVER_CROP.zoom, cover_position_x: DEFAULT_COVER_CROP.positionX,
  cover_position_y: DEFAULT_COVER_CROP.positionY, hero_url: "", client_logo_urls: [], video_url: "", size: "medium", description: "", services: "",
  deliverables: "", challenge: "", approach: "", result: "", quote_text: "",
  quote_author: "", awards: "", press: "", published: true, industryValues: [], customIndustryNames: [], designerIds: [],
  guestDesignerNames: [],
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
  caption_mobile: string
}

function newKey() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}

function emptyBlock(type: BlockType, dual = false): FormBlock {
  return {
    key: newKey(), type, dual, src: "", alt: "", width: undefined, height: undefined,
    src2: "", alt2: "", width2: undefined, height2: undefined,
    text_content: "", video_url: "", caption: "", caption_mobile: "",
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
    // 舊資料若還是純文字（非 HTML），開進編輯器前先轉成段落結構，無痛接軌既有內容。
    text_content:
      b.text_content && !looksLikeHtml(b.text_content)
        ? plainTextToHtml(b.text_content)
        : b.text_content ?? "",
    video_url: b.video_url ?? "",
    caption: b.caption ?? "",
    caption_mobile: b.caption_mobile ?? "",
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
      caption_mobile: "",
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

function ResponsiveCaptionFields({
  block,
  contextLabel,
  onChange,
}: {
  block: FormBlock
  contextLabel: string
  onChange: (patch: Partial<FormBlock>) => void
}) {
  const textareaCls = `${inputCls} min-h-28 resize-y leading-relaxed [&::placeholder]:text-temo-warm-gray/50`

  return (
    <div className="grid gap-3 pt-1 md:grid-cols-2">
      <label>
        <span className={labelCls}>桌機版說明</span>
        <textarea
          rows={4}
          className={textareaCls}
          value={block.caption}
          onChange={(e) => onChange({ caption: e.target.value })}
          placeholder={`${contextLabel}，可依桌機寬度換行`}
        />
      </label>
      <label>
        <span className={labelCls}>手機版說明（選填）</span>
        <textarea
          rows={4}
          className={textareaCls}
          value={block.caption_mobile}
          onChange={(e) => onChange({ caption_mobile: e.target.value })}
          placeholder={`${contextLabel}，可依手機寬度重新換行`}
        />
        <span className="mt-1.5 block text-[11px] leading-relaxed text-temo-warm-gray/55">
          留空時會自動沿用桌機版說明。
        </span>
      </label>
    </div>
  )
}

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      {children}
      {hint && <p className="text-[11px] text-temo-warm-gray/40 mt-1.5">{hint}</p>}
    </div>
  )
}

function CoverCropEditor({
  src,
  size,
  crop: cropInput,
  onChange,
}: {
  src: string
  size: WorkFormInitial["size"]
  crop: CoverCrop
  onChange: (crop: CoverCrop) => void
}) {
  const frameRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{
    pointerId: number
    clientX: number
    clientY: number
    positionX: number
    positionY: number
  } | null>(null)
  const crop = normalizeCoverCrop(cropInput)
  const aspectLabel = size === "large" ? "直式 4:5" : size === "small" ? "橫式 4:3" : "正方形 1:1"

  function update(patch: Partial<CoverCrop>) {
    onChange(normalizeCoverCrop({ ...crop, ...patch }))
  }

  function onPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return
    event.currentTarget.setPointerCapture(event.pointerId)
    dragRef.current = {
      pointerId: event.pointerId,
      clientX: event.clientX,
      clientY: event.clientY,
      positionX: crop.positionX,
      positionY: crop.positionY,
    }
  }

  function onPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current
    const frame = frameRef.current
    if (!drag || drag.pointerId !== event.pointerId || !frame) return
    const rect = frame.getBoundingClientRect()
    const sensitivity = 100 / crop.zoom
    update({
      positionX: drag.positionX - ((event.clientX - drag.clientX) / rect.width) * sensitivity,
      positionY: drag.positionY - ((event.clientY - drag.clientY) / rect.height) * sensitivity,
    })
  }

  function endPointer(event: React.PointerEvent<HTMLDivElement>) {
    if (dragRef.current?.pointerId !== event.pointerId) return
    dragRef.current = null
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    const step = event.shiftKey ? 5 : 1
    if (event.key === "ArrowLeft") update({ positionX: crop.positionX - step })
    else if (event.key === "ArrowRight") update({ positionX: crop.positionX + step })
    else if (event.key === "ArrowUp") update({ positionY: crop.positionY - step })
    else if (event.key === "ArrowDown") update({ positionY: crop.positionY + step })
    else return
    event.preventDefault()
  }

  return (
    <div className="space-y-4 rounded-lg border border-white/10 bg-white/[0.025] p-4 md:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-temo-white">調整作品探索的封面構圖</p>
          <p className="mt-1 text-xs leading-relaxed text-temo-warm-gray/55">
            直接拖曳圖片調整位置；下方可精準縮放與移動。
          </p>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-temo-warm-gray/60">
          <span className="rounded-full bg-white/[0.06] px-2.5 py-1">{aspectLabel}</span>
          <span className="rounded-full bg-temo-gold/10 px-2.5 py-1 text-temo-gold">
            {Math.round(crop.zoom * 100)}%
          </span>
        </div>
      </div>

      <div
        ref={frameRef}
        role="application"
        tabIndex={0}
        aria-label="封面構圖預覽。可拖曳圖片，或使用方向鍵調整位置。"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endPointer}
        onPointerCancel={endPointer}
        onKeyDown={onKeyDown}
        className={cn(
          "relative mx-auto w-full max-w-md cursor-grab touch-none select-none overflow-hidden rounded-lg bg-black outline-none ring-offset-2 ring-offset-temo-black active:cursor-grabbing focus-visible:ring-2 focus-visible:ring-temo-gold/70",
          size === "large" ? "aspect-[4/5] max-w-sm" : size === "small" ? "aspect-[4/3]" : "aspect-square max-w-sm"
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt="作品探索封面構圖預覽"
          draggable={false}
          className="pointer-events-none absolute inset-0 h-full w-full object-cover"
          style={getCoverCropStyle(crop)}
        />
        <div className="pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3 opacity-50" aria-hidden="true">
          {Array.from({ length: 9 }).map((_, index) => (
            <span key={index} className="border-[0.5px] border-white/25" />
          ))}
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-center gap-2 bg-black/65 px-3 py-2 text-[11px] text-white/85">
          <Move className="h-3.5 w-3.5" />
          拖曳圖片調整位置
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <CropRange
          label="縮放"
          value={crop.zoom}
          min={COVER_ZOOM_MIN}
          max={COVER_ZOOM_MAX}
          step={0.01}
          displayValue={`${Math.round(crop.zoom * 100)}%`}
          onChange={(zoom) => update({ zoom })}
        />
        <CropRange
          label="水平位置"
          value={crop.positionX}
          min={COVER_POSITION_MIN}
          max={COVER_POSITION_MAX}
          step={1}
          displayValue={`${Math.round(crop.positionX)}%`}
          onChange={(positionX) => update({ positionX })}
        />
        <CropRange
          label="垂直位置"
          value={crop.positionY}
          min={COVER_POSITION_MIN}
          max={COVER_POSITION_MAX}
          step={1}
          displayValue={`${Math.round(crop.positionY)}%`}
          onChange={(positionY) => update({ positionY })}
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.07] pt-4">
        <p className="text-[11px] leading-relaxed text-temo-warm-gray/45">
          前台會使用相同的卡片比例、縮放與位置設定。
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => update({ zoom: Math.max(COVER_ZOOM_MIN, crop.zoom - 0.1) })}
            className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-white/10 text-temo-warm-gray/70 transition-colors hover:border-temo-gold/40 hover:text-temo-gold"
            aria-label="縮小封面"
          >
            <Minus className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => update({ zoom: Math.min(COVER_ZOOM_MAX, crop.zoom + 0.1) })}
            className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-white/10 text-temo-warm-gray/70 transition-colors hover:border-temo-gold/40 hover:text-temo-gold"
            aria-label="放大封面"
          >
            <Plus className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onChange(DEFAULT_COVER_CROP)}
            className="inline-flex h-10 items-center gap-2 rounded-md border border-white/10 px-3 text-xs text-temo-warm-gray/70 transition-colors hover:border-temo-gold/40 hover:text-temo-gold"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            回到置中
          </button>
        </div>
      </div>
    </div>
  )
}

function CropRange({
  label,
  value,
  min,
  max,
  step,
  displayValue,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  displayValue: string
  onChange: (value: number) => void
}) {
  return (
    <label className="block rounded-md bg-black/25 p-3">
      <span className="mb-2 flex items-center justify-between gap-3 text-xs">
        <span className="text-temo-warm-gray/65">{label}</span>
        <span className="tabular-nums text-temo-white">{displayValue}</span>
      </span>
      <input
        type="range"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-2 w-full cursor-pointer accent-temo-gold"
      />
    </label>
  )
}

const toLines = (s: string) => s.split("\n").map((x) => x.trim()).filter(Boolean)
const CUSTOM_NAME_MAX = 100
const CUSTOM_NAME_LIMIT = 20

function normalizeCustomName(value: string) {
  return value.trim().replace(/\s+/g, " ")
}

type WorkFormTab = "basics" | "media" | "blocks" | "story" | "publish"

const FORM_TABS: { id: WorkFormTab; label: string; helper: string }[] = [
  { id: "basics", label: "基本", helper: "名稱、分類、關聯" },
  { id: "media", label: "媒體", helper: "封面、首圖、Logo、影片" },
  { id: "blocks", label: "內容區塊", helper: "內頁圖文編排" },
  { id: "story", label: "案例文字", helper: "簡述、獎項、報導" },
  { id: "publish", label: "發布", helper: "上架狀態" },
]

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
  const initialClient = options.clients.find((client) => client.id === initial?.client_id)
  const [clientContact, setClientContact] = useState({
    address: initialClient?.address ?? "",
    phone: initialClient?.phone ?? "",
    website: initialClient?.website ?? "",
  })
  const [clientContactDirty, setClientContactDirty] = useState(false)
  const [heroUrl, setHeroUrl] = useState(initial?.hero_url ?? "")
  const [clientLogos, setClientLogos] = useState<string[]>(initial?.client_logo_urls ?? [])
  const [clientLogoDraft, setClientLogoDraft] = useState("")
  const [blocks, setBlocks] = useState<FormBlock[]>(() => initialBlocksFrom(initial))
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")
  const [pending, startTransition] = useTransition()
  const [activeTab, setActiveTab] = useState<WorkFormTab>("basics")

  const set = <K extends keyof WorkFormInitial>(k: K, v: WorkFormInitial[K]) =>
    setF((prev) => ({ ...prev, [k]: v }))

  function selectClient(id: string) {
    set("client_id", id)
    const client = options.clients.find((item) => item.id === id)
    setClientContact({
      address: client?.address ?? "",
      phone: client?.phone ?? "",
      website: client?.website ?? "",
    })
    setClientContactDirty(false)
  }

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
      setError("檔案上傳失敗：" + upErr.message)
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
    if (url) {
      setF((prev) => ({
        ...prev,
        cover_url: url,
        cover_zoom: DEFAULT_COVER_CROP.zoom,
        cover_position_x: DEFAULT_COVER_CROP.positionX,
        cover_position_y: DEFAULT_COVER_CROP.positionY,
      }))
    }
    setUploading(false)
    e.target.value = ""
  }

  // 首圖影片上限：Supabase 免費方案單檔上限就是 50MB，這裡先擋下來給人話錯誤訊息
  const HERO_VIDEO_MAX_MB = 50

  async function onHeroFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.type.startsWith("video/") && file.size > HERO_VIDEO_MAX_MB * 1024 * 1024) {
      setError(
        `影片檔太大（${(file.size / 1024 / 1024).toFixed(0)}MB），請壓到 ${HERO_VIDEO_MAX_MB}MB 以下再上傳。建議：MP4 格式、1080p、20 秒內的循環短片。`
      )
      e.target.value = ""
      return
    }
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

  async function onClientLogoFile(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (files.length === 0) return
    setUploading(true)
    setError("")
    for (const file of files) {
      const url = await uploadToStorage(file)
      if (url) setClientLogos((prev) => [...prev, url])
    }
    setUploading(false)
    e.target.value = ""
  }

  function removeClientLogo(index: number) {
    setClientLogos((prev) => prev.filter((_, i) => i !== index))
  }

  function addClientLogoDraft() {
    const url = clientLogoDraft.trim()
    if (!url) return
    setClientLogos((prev) => [...prev, url])
    setClientLogoDraft("")
  }

  function addBlock(type: BlockType, dual = false, afterIndex?: number) {
    const nextBlock = emptyBlock(type, dual)
    setBlocks((prev) => {
      if (typeof afterIndex !== "number") return [...prev, nextBlock]
      const next = [...prev]
      next.splice(afterIndex + 1, 0, nextBlock)
      return next
    })
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
      client_address: clientContact.address,
      client_phone: clientContact.phone,
      client_website: clientContact.website,
      client_contact_dirty: clientContactDirty,
      cover_url: f.cover_url, cover_zoom: f.cover_zoom, cover_position_x: f.cover_position_x,
      cover_position_y: f.cover_position_y, hero_url: heroUrl, client_logo_urls: clientLogos, video_url: f.video_url, size: f.size,
      description: f.description, services: toLines(f.services),
      deliverables: toLines(f.deliverables), challenge: f.challenge,
      approach: f.approach, result: f.result, quote_text: f.quote_text,
      quote_author: f.quote_author, awards: toLines(f.awards), press_mentions: toLines(f.press),
      published: f.published, industryValues: f.industryValues, customIndustryNames: f.customIndustryNames, designerIds: f.designerIds,
      guestDesignerNames: f.guestDesignerNames,
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
        caption_mobile: b.caption_mobile,
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
  const missingBasics = !f.title.trim() || !f.slug.trim()
  const activeTabLabel = FORM_TABS.find((tab) => tab.id === activeTab)?.label ?? "基本"
  const mediaSummary = [
    f.cover_url ? "封面" : null,
    heroUrl ? "首圖" : null,
    clientLogos.length > 0 ? `${clientLogos.length} 張 Logo` : null,
    f.video_url.trim() ? "影片連結" : null,
  ].filter(Boolean)
  const storySummary = [
    f.description.trim() ? "簡述" : null,
    toLines(f.awards).length > 0 ? `${toLines(f.awards).length} 則獎項` : null,
    toLines(f.press).length > 0 ? `${toLines(f.press).length} 則報導` : null,
  ].filter(Boolean)

  return (
    <form onSubmit={submit} className="min-h-[calc(100svh-1px)] pb-28">
      <div className="px-6 md:px-10 py-8 md:py-12 max-w-6xl space-y-8">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5">
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
            <p className="text-sm text-temo-warm-gray/55 mt-2">
              目前在「{activeTabLabel}」工作區。底部固定列可隨時儲存，不必捲回頁尾。
            </p>
          </div>
          {f.slug.trim() && (
            <a
              href={`/portfolio/${f.slug.trim()}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center px-4 py-3 border border-white/12 text-temo-warm-gray/75 hover:text-temo-gold hover:border-temo-gold/40 text-xs font-bold tracking-[0.12em] uppercase rounded-sm transition-colors"
            >
              開啟前台頁
            </a>
          )}
        </div>

        <div className="sticky top-0 z-20 -mx-6 md:-mx-10 px-6 md:px-10 py-3 bg-temo-black/95 backdrop-blur border-y border-white/[0.06] overflow-x-auto">
          <div className="flex min-w-max gap-2">
            {FORM_TABS.map((tab) => {
              const active = activeTab === tab.id
              const needsAttention = tab.id === "basics" && missingBasics
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "min-w-32 rounded-md border px-3 py-2 text-left transition-colors",
                    active
                      ? "border-temo-gold/55 bg-temo-gold/10 text-temo-gold"
                      : "border-white/10 bg-white/[0.02] text-temo-warm-gray/70 hover:text-temo-white hover:border-white/25"
                  )}
                >
                  <span className="flex items-center gap-2 text-sm font-medium">
                    {tab.label}
                    {needsAttention && (
                      <span className="rounded-full bg-red-400/12 px-1.5 py-0.5 text-[10px] text-red-300">
                        必填
                      </span>
                    )}
                  </span>
                  <span className="block mt-0.5 text-[11px] opacity-55">{tab.helper}</span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_280px] items-start">
          <div className="space-y-8 min-w-0">
            {activeTab === "basics" && (
              <>
                <section className="space-y-5">
                  <SectionTitle>基本資料</SectionTitle>
                  <Field label="標題（中文）*">
                    <input className={inputCls} value={f.title} onChange={(e) => set("title", e.target.value)} />
                  </Field>
                  <Field label="英文副標">
                    <input className={inputCls} value={f.subtitle} onChange={(e) => set("subtitle", e.target.value)} />
                  </Field>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <Field label="網址 slug *" hint="網址會自動轉成小寫英數與連字號，例如 AsoBé 會變成 asobe">
                      <input
                        className={inputCls}
                        value={f.slug}
                        onChange={(e) => set("slug", normalizeWorkSlug(e.target.value))}
                        placeholder="tea-brand"
                        autoCapitalize="none"
                        spellCheck={false}
                      />
                    </Field>
                    <Field label="年份">
                      <input className={inputCls} value={f.year} onChange={(e) => set("year", e.target.value)} placeholder="2025" />
                    </Field>
                  </div>
                </section>

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
                    <select className={inputCls} value={f.client_id} onChange={(e) => selectClient(e.target.value)}>
                      <option value="">（未選）</option>
                      {options.clients.map((c) => (
                        <option key={c.id} value={c.id} className="bg-[#201d1a]">{c.name}</option>
                      ))}
                    </select>
                  </Field>
                  {f.client_id && (
                    <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4 space-y-4">
                      <div>
                        <p className="text-sm font-medium text-temo-white">客戶聯絡資料</p>
                        <p className="mt-1 text-[11px] leading-relaxed text-temo-warm-gray/45">
                          這些資料屬於客戶本身，其他使用同一客戶的作品也會共用；留空時前台不顯示。
                        </p>
                      </div>
                      <Field label="地址">
                        <input
                          className={inputCls}
                          value={clientContact.address}
                          onChange={(e) => {
                            setClientContact((prev) => ({ ...prev, address: e.target.value }))
                            setClientContactDirty(true)
                          }}
                          placeholder="例如：台北市信義區…"
                        />
                      </Field>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Field label="電話">
                          <input
                            className={inputCls}
                            type="tel"
                            value={clientContact.phone}
                            onChange={(e) => {
                              setClientContact((prev) => ({ ...prev, phone: e.target.value }))
                              setClientContactDirty(true)
                            }}
                            placeholder="02-1234-5678"
                          />
                        </Field>
                        <Field label="官方網站">
                          <input
                            className={inputCls}
                            inputMode="url"
                            value={clientContact.website}
                            onChange={(e) => {
                              setClientContact((prev) => ({ ...prev, website: e.target.value }))
                              setClientContactDirty(true)
                            }}
                            placeholder="https://example.com"
                          />
                        </Field>
                      </div>
                    </div>
                  )}
                  <Field label="行業分類（可複選）">
                    <ChipGroup
                      items={options.industries.map((i) => ({ value: i.value, label: i.label }))}
                      selected={f.industryValues}
                      onToggle={(v) => set("industryValues", toggle(f.industryValues, v))}
                    >
                      <CustomNameChips
                        values={f.customIndustryNames}
                        onChange={(values) => set("customIndustryNames", values)}
                        nameLabel="其他行業"
                        placeholder="行業名稱"
                        onError={setError}
                      />
                    </ChipGroup>
                  </Field>
                  <Field label="設計師（可複選）">
                    <ChipGroup
                      items={options.designers.map((d) => ({ value: d.id, label: d.name_zh ? `${d.name}（${d.name_zh}）` : d.name }))}
                      selected={f.designerIds}
                      onToggle={(v) => set("designerIds", toggle(f.designerIds, v))}
                    >
                      <CustomNameChips
                        values={f.guestDesignerNames}
                        onChange={(values) => set("guestDesignerNames", values)}
                        nameLabel="其他合作設計師"
                        placeholder="設計師名稱"
                        onError={setError}
                      />
                    </ChipGroup>
                  </Field>
                </section>
              </>
            )}

            {activeTab === "media" && (
              <section className="space-y-5">
                <SectionTitle>封面與影片</SectionTitle>
                <Field label="封面圖">
                  <div className="space-y-4">
                    <div className="grid gap-3 md:grid-cols-[auto_minmax(0,1fr)] md:items-center">
                      <label className={cn("inline-flex items-center gap-2 px-4 py-2.5 border border-white/15 text-temo-white text-xs tracking-wider rounded-sm cursor-pointer hover:border-temo-gold/50 transition-colors", uploading && "opacity-60 pointer-events-none")}>
                        {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                        {uploading ? "上傳中…" : "上傳圖片"}
                        <input type="file" accept="image/*" className="hidden" onChange={onFile} disabled={uploading} />
                      </label>
                      <input
                        className={inputCls}
                        value={f.cover_url}
                        onChange={(e) =>
                          setF((prev) => ({
                            ...prev,
                            cover_url: e.target.value,
                            cover_zoom: DEFAULT_COVER_CROP.zoom,
                            cover_position_x: DEFAULT_COVER_CROP.positionX,
                            cover_position_y: DEFAULT_COVER_CROP.positionY,
                          }))
                        }
                        placeholder="或直接貼圖片網址 /images/portfolio/xxx.jpg"
                      />
                    </div>
                    {f.cover_url && (
                      <CoverCropEditor
                        src={f.cover_url}
                        size={f.size}
                        crop={{
                          zoom: f.cover_zoom,
                          positionX: f.cover_position_x,
                          positionY: f.cover_position_y,
                        }}
                        onChange={(crop) =>
                          setF((prev) => ({
                            ...prev,
                            cover_zoom: crop.zoom,
                            cover_position_x: crop.positionX,
                            cover_position_y: crop.positionY,
                          }))
                        }
                      />
                    )}
                  </div>
                </Field>
                <Field label="內頁首圖（選填，可放影片）" hint="留空＝沿用封面圖；作品內頁最上方顯示的大圖。也可直接上傳影片（會靜音循環播放）：建議 MP4 格式、1080p、20 秒內、50MB 以下，越小網頁越順">
                  <div className="flex items-start gap-4">
                    <div className="w-32 h-32 rounded-lg overflow-hidden bg-white/[0.04] border border-white/10 shrink-0">
                      {heroUrl && (
                        isUploadedVideoUrl(heroUrl) ? (
                          <video src={heroUrl} muted loop playsInline autoPlay preload="metadata" className="w-full h-full object-cover" />
                        ) : (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={heroUrl} alt="內頁首圖預覽" className="w-full h-full object-cover" />
                        )
                      )}
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <label className={cn("inline-flex items-center gap-2 px-4 py-2.5 border border-white/15 text-temo-white text-xs tracking-wider rounded-sm cursor-pointer hover:border-temo-gold/50 transition-colors", uploading && "opacity-60 pointer-events-none")}>
                          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                          {uploading ? "上傳中…" : "上傳圖片或影片"}
                          <input type="file" accept="image/*,video/mp4,video/webm,video/quicktime,video/x-m4v" className="hidden" onChange={onHeroFile} disabled={uploading} />
                        </label>
                        {heroUrl && (
                          <button type="button" onClick={clearHero} className="inline-flex items-center gap-1 px-3 py-2.5 text-red-400/70 hover:text-red-400 text-xs tracking-wider transition-colors">
                            <X className="w-3.5 h-3.5" /> 清除，改用封面圖
                          </button>
                        )}
                      </div>
                      {isUploadedVideoUrl(heroUrl) && heroUrl.split(/[?#]/)[0].toLowerCase().endsWith(".mov") && (
                        <p className="text-[11px] text-yellow-400/80">.mov 檔（iPhone 直接拍的格式）在部分 Android / Windows 瀏覽器可能無法播放，建議轉成 MP4 再上傳</p>
                      )}
                      <input className={inputCls} value={heroUrl} onChange={(e) => setHeroUrl(e.target.value)} placeholder="或直接貼圖片／影片網址（留空則沿用封面圖）" />
                    </div>
                  </div>
                </Field>
                <Field label="客戶 LOGO（選填，可放多張）" hint="顯示於作品內頁右上角資訊欄頂端；一件作品有多位客戶時可放多張，依加入順序排列。深色底網站，建議上傳白色或淺色版本">
                  <div className="space-y-3">
                    {clientLogos.length > 0 && (
                      <div className="flex flex-wrap gap-3">
                        {clientLogos.map((url, i) => (
                          <div key={`${url}-${i}`} className="relative w-28 h-28 rounded-lg overflow-hidden bg-white/[0.04] border border-white/10 flex items-center justify-center p-2">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={url} alt={`客戶 LOGO ${i + 1} 預覽`} className="max-w-full max-h-full object-contain" />
                            <button
                              type="button"
                              onClick={() => removeClientLogo(i)}
                              className="absolute top-1 right-1 p-1 rounded bg-black/60 text-red-400/80 hover:text-red-400 transition-colors"
                              aria-label={`移除第 ${i + 1} 張客戶 LOGO`}
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center gap-2 flex-wrap">
                      <label className={cn("inline-flex items-center gap-2 px-4 py-2.5 border border-white/15 text-temo-white text-xs tracking-wider rounded-sm cursor-pointer hover:border-temo-gold/50 transition-colors", uploading && "opacity-60 pointer-events-none")}>
                        {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                        {uploading ? "上傳中…" : "上傳圖片（可一次選多張）"}
                        <input type="file" accept="image/*" multiple className="hidden" onChange={onClientLogoFile} disabled={uploading} />
                      </label>
                    </div>
                    <div className="flex gap-2">
                      <input
                        className={inputCls}
                        value={clientLogoDraft}
                        onChange={(e) => setClientLogoDraft(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault()
                            addClientLogoDraft()
                          }
                        }}
                        placeholder="或貼圖片網址後按「加入」（留空則不顯示）"
                      />
                      <button
                        type="button"
                        onClick={addClientLogoDraft}
                        className="shrink-0 px-4 py-2.5 border border-white/15 text-temo-white text-xs tracking-wider rounded-sm hover:border-temo-gold/50 transition-colors"
                      >
                        加入
                      </button>
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
            )}

            {activeTab === "blocks" && (
              <section className="space-y-5">
                <SectionTitle>內容區塊</SectionTitle>
                <p className="text-xs text-temo-warm-gray/50 -mt-2">
                  自由編排作品內頁的內容，由上而下依序呈現。可新增單圖、雙圖並排、文字段落、影片區塊，並用上移／下移調整順序。
                </p>

                <BlockAddBar
                  label={blocks.length > 0 ? "新增到最下方" : "新增第一個區塊"}
                  onAdd={(type, dual) => addBlock(type, dual)}
                />

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
                        <div className="space-y-2">
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
                          <BlockAddBar
                            compact
                            label={`在第 ${i + 1} 個區塊後插入`}
                            onAdd={(type, dual) => addBlock(type, dual, i)}
                          />
                        </div>
                      )
                    }}
                  />
                )}

                {blocks.length === 0 && (
                  <div className="rounded-lg border border-dashed border-white/12 py-10 text-center">
                    <p className="text-sm text-temo-warm-gray/55">還沒有內容區塊，請從上方選一種版型開始。</p>
                  </div>
                )}
              </section>
            )}

            {activeTab === "story" && (
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
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-[minmax(0,2fr)_minmax(220px,1fr)]">
                  <Field label="引言 Quote" hint="顯示於案例敘事區；留空時前台不顯示">
                    <textarea
                      className={cn(inputCls, "min-h-20 resize-y")}
                      value={f.quote_text}
                      onChange={(e) => set("quote_text", e.target.value)}
                      placeholder="輸入客戶引言或案例前言"
                    />
                  </Field>
                  <Field label="引言出處（選填）">
                    <input
                      className={inputCls}
                      value={f.quote_author}
                      onChange={(e) => set("quote_author", e.target.value)}
                      placeholder="例如：客戶姓名／品牌名稱"
                    />
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
                <Field label="新聞報導" hint="一行一則，格式「媒體名稱 網址」；網址可省略，省略就只顯示文字不能點">
                  <textarea className={cn(inputCls, "min-h-20 resize-y")} value={f.press} onChange={(e) => set("press", e.target.value)} placeholder={"經濟時報 https://money.udn.com/...\n華視新聞 https://news.cts.com.tw/..."} />
                </Field>
              </section>
            )}

            {activeTab === "publish" && (
              <section className="space-y-5">
                <SectionTitle>發布</SectionTitle>
                <div className="rounded-lg border border-white/10 bg-white/[0.02] p-5 space-y-4">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input type="checkbox" checked={f.published} onChange={(e) => set("published", e.target.checked)} className="w-4 h-4 mt-0.5 accent-temo-gold" />
                    <span>
                      <span className="block text-sm text-temo-white">上架顯示</span>
                      <span className="block text-xs text-temo-warm-gray/50 mt-1">
                        取消勾選則存為草稿，前台作品列表與作品頁不顯示。
                      </span>
                    </span>
                  </label>
                  {missingBasics && (
                    <p className="text-xs text-red-300/90">發布前請回「基本」補完標題與 slug。</p>
                  )}
                </div>
              </section>
            )}
          </div>

          <aside className="hidden lg:block sticky top-24 space-y-4">
            <div className="rounded-lg border border-white/10 bg-white/[0.025] p-4">
              <p className="text-[10px] tracking-[0.25em] text-temo-gold uppercase mb-3">狀態摘要</p>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-temo-warm-gray/55">發布狀態</span>
                  <span className={f.published ? "text-temo-gold" : "text-temo-warm-gray/70"}>
                    {f.published ? "上架" : "草稿"}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-temo-warm-gray/55">必填</span>
                  <span className={missingBasics ? "text-red-300" : "text-temo-gold"}>
                    {missingBasics ? "未完成" : "完成"}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-temo-warm-gray/55">內容區塊</span>
                  <span className="text-temo-white">{blocks.length}</span>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-white/10 bg-white/[0.025] p-4">
              <p className="text-[10px] tracking-[0.25em] text-temo-gold uppercase mb-3">已填內容</p>
              <div className="space-y-2 text-xs text-temo-warm-gray/55">
                <p>媒體：{mediaSummary.length > 0 ? mediaSummary.join("、") : "尚未補媒體"}</p>
                <p>文字：{storySummary.length > 0 ? storySummary.join("、") : "尚未補案例文字"}</p>
                <p>
                  關聯：{f.industryValues.length + f.customIndustryNames.length} 個行業 · {f.designerIds.length + f.guestDesignerNames.length} 位設計師
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>

      <div className="sticky bottom-0 z-30 border-t border-white/10 bg-[#141210]/95 backdrop-blur px-6 md:px-10 py-3">
        <div className="max-w-6xl flex flex-col md:flex-row md:items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs text-temo-warm-gray/55">
              {workId ? "編輯中" : "建立新作品"} · {f.published ? "儲存後會在前台顯示" : "儲存為草稿"}
            </p>
            {error && <p className="text-sm text-red-400/90 mt-1" role="alert">{error}</p>}
          </div>
          <div className="flex items-center gap-3">
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
        </div>
      </div>
    </form>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <p className="text-[10px] tracking-[0.4em] text-temo-gold uppercase pb-2 border-b border-white/[0.06]">{children}</p>
}

const blockTypeLabel = (b: { type: "image" | "video" | "text"; dual: boolean }) =>
  b.type === "image" ? (b.dual ? "雙圖" : "單圖") : b.type === "video" ? "影片" : "文字"

function BlockAddBar({
  label,
  compact = false,
  onAdd,
}: {
  label: string
  compact?: boolean
  onAdd: (type: BlockType, dual?: boolean) => void
}) {
  const buttons: { label: string; type: BlockType; dual?: boolean }[] = [
    { label: "單圖", type: "image" },
    { label: "雙圖", type: "image", dual: true },
    { label: "文字", type: "text" },
    { label: "影片", type: "video" },
  ]

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-lg border transition-colors",
        compact
          ? "border-white/[0.07] bg-white/[0.012] px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
          : "border-temo-gold/25 bg-temo-gold/[0.045] p-4 sm:flex-row sm:items-center sm:justify-between"
      )}
    >
      <span
        className={cn(
          "text-temo-warm-gray/65",
          compact ? "text-[11px]" : "text-sm font-medium text-temo-white"
        )}
      >
        {label}
      </span>
      <div className="flex flex-wrap items-center gap-2">
        {buttons.map((button) => (
          <button
            key={`${button.type}-${button.label}`}
            type="button"
            onClick={() => onAdd(button.type, button.dual)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-sm border text-xs transition-colors",
              compact
                ? "border-white/10 px-2.5 py-1.5 text-temo-warm-gray/65 hover:border-temo-gold/40 hover:text-temo-gold"
                : "border-white/15 bg-temo-black/25 px-3 py-2 text-temo-white hover:border-temo-gold/50 hover:text-temo-gold"
            )}
          >
            <Plus className="w-3.5 h-3.5" />
            {button.label}
          </button>
        ))}
      </div>
    </div>
  )
}

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
            <ResponsiveCaptionFields block={block} contextLabel="圖片說明" onChange={onChange} />
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
          <ResponsiveCaptionFields block={block} contextLabel="兩張圖片的共用說明" onChange={onChange} />
        </div>
      )}

      {block.type === "text" && (
        <div className="space-y-2">
          <RichTextEditor
            value={block.text_content}
            onChange={(html) => onChange({ text_content: html })}
            placeholder="輸入段落文字，支援粗體、顏色、列表等格式"
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
          <ResponsiveCaptionFields block={block} contextLabel="影片說明" onChange={onChange} />
        </div>
      )}
    </div>
  )
}

function ChipGroup({
  items,
  selected,
  onToggle,
  children,
}: {
  items: { value: string; label: string }[]
  selected: string[]
  onToggle: (v: string) => void
  children?: React.ReactNode
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
      {children}
    </div>
  )
}

function CustomNameChips({
  values,
  onChange,
  nameLabel,
  placeholder,
  onError,
}: {
  values: string[]
  onChange: (values: string[]) => void
  nameLabel: string
  placeholder: string
  onError: (message: string) => void
}) {
  const [draft, setDraft] = useState("")
  const [open, setOpen] = useState(false)

  function close() {
    setDraft("")
    setOpen(false)
    onError("")
  }

  function add() {
    const name = normalizeCustomName(draft)
    if (!name) return
    if (name.length > CUSTOM_NAME_MAX) {
      onError(`${nameLabel}名稱請控制在 ${CUSTOM_NAME_MAX} 個字內`)
      return
    }
    if (values.length >= CUSTOM_NAME_LIMIT) {
      onError(`每件作品最多可新增 ${CUSTOM_NAME_LIMIT} 個${nameLabel}`)
      return
    }

    const key = name.toLocaleLowerCase()
    if (values.some((existing) => normalizeCustomName(existing).toLocaleLowerCase() === key)) {
      onError(`這個${nameLabel}已經新增過了`)
      return
    }

    onChange([...values, name])
    close()
  }

  return (
    <>
      {values.map((name, index) => (
        <span
          key={`${name}-${index}`}
          className="inline-flex max-w-full items-center gap-1 rounded-full border border-temo-gold/40 bg-temo-gold/10 py-1.5 pl-3 pr-2 text-xs text-temo-gold"
        >
          <span className="truncate">{name}</span>
          <button
            type="button"
            onClick={() => {
              onChange(values.filter((_, i) => i !== index))
              onError("")
            }}
            aria-label={`移除${nameLabel} ${name}`}
            className="shrink-0 rounded-full p-0.5 transition-colors hover:bg-temo-gold/15 hover:text-temo-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-temo-gold/60"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </span>
      ))}

      {open ? (
        <div className="inline-flex max-w-full items-stretch overflow-hidden rounded-full border border-temo-gold/50 bg-temo-gold/[0.06]">
          <input
            autoFocus
            className="w-32 min-w-0 bg-transparent px-3 py-1 text-base text-temo-white placeholder:text-white/25 focus:outline-none sm:text-xs"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.nativeEvent.isComposing) {
                e.preventDefault()
                add()
              }
              if (e.key === "Escape") close()
            }}
            maxLength={CUSTOM_NAME_MAX}
            placeholder={placeholder}
            aria-label={`${nameLabel}名稱`}
          />
          <button
            type="button"
            onClick={add}
            disabled={!draft.trim() || values.length >= CUSTOM_NAME_LIMIT}
            aria-label={`新增${nameLabel}`}
            className="border-l border-temo-gold/25 px-2.5 text-xs text-temo-gold transition-colors hover:bg-temo-gold/10 disabled:cursor-not-allowed disabled:opacity-35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-temo-gold/60"
          >
            新增
          </button>
          <button
            type="button"
            onClick={close}
            aria-label={`取消新增${nameLabel}`}
            className="border-l border-temo-gold/15 px-2 text-temo-warm-gray/45 transition-colors hover:text-temo-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-temo-gold/60"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-white/20 px-3 py-1.5 text-xs text-temo-warm-gray/65 transition-colors hover:border-temo-gold/50 hover:text-temo-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-temo-gold/60"
        >
          <Plus className="h-3.5 w-3.5" />
          其他
        </button>
      )}
    </>
  )
}
