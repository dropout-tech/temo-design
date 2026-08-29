"use client"

import { useState, useTransition } from "react"
import Image from "next/image"
import { Loader2, Check, Upload } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { downscaleImage } from "@/lib/downscale-image"
import { saveSettings, type SettingsInput } from "@/app/studio/(app)/settings/actions"
import { PORTFOLIO_FILTER_LANGUAGE_OPTIONS } from "@/lib/portfolio-filter-language"

const inputCls =
  "w-full px-4 py-3 bg-white/[0.03] border border-white/10 text-temo-white text-sm placeholder:text-white/20 focus:border-temo-gold/60 focus:bg-white/[0.05] focus:outline-none transition-all rounded-sm"
const labelCls = "block text-[11px] tracking-[0.2em] text-temo-warm-gray/70 uppercase mb-2"

function SettingsField({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string
  value: string
  placeholder?: string
  onChange: (value: string) => void
}) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      <input
        className={inputCls}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
      />
    </div>
  )
}

export function SettingsForm({ initial }: { initial: SettingsInput }) {
  const [f, setF] = useState<SettingsInput>(initial)
  const [pending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState("")
  const [uploading, setUploading] = useState(false)

  const set = <K extends keyof SettingsInput>(k: K, v: SettingsInput[K]) => {
    setF((p) => ({ ...p, [k]: v }))
    setSaved(false)
  }

  async function onQrFile(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.files?.[0]
    if (!raw) return
    setUploading(true)
    setError("")
    // QR 要能掃 → 保守上限、高品質，正常尺寸不動
    const file = await downscaleImage(raw, 1200, 0.92)
    const supabase = createClient()
    const ext = (file.name.split(".").pop() || "png").toLowerCase()
    const path = `line/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
    const { error: upErr } = await supabase.storage
      .from("media")
      .upload(path, file, { cacheControl: "3600", upsert: false })
    if (upErr) setError("QR 圖片上傳失敗：" + upErr.message)
    else set("line_qr_url", supabase.storage.from("media").getPublicUrl(path).data.publicUrl)
    setUploading(false)
    e.target.value = ""
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    startTransition(async () => {
      const res = await saveSettings(f)
      if (res.error) setError(res.error)
      else setSaved(true)
    })
  }

  return (
    <form onSubmit={submit} className="px-6 md:px-10 py-10 md:py-14 max-w-2xl space-y-8">
      <div>
        <p className="text-[10px] tracking-[0.5em] text-temo-gold uppercase mb-3">Settings</p>
        <h1 className="text-3xl md:text-4xl font-bold text-temo-white">網站設定</h1>
        <p className="text-temo-warm-gray/60 text-sm mt-1">管理前台作品篩選、聯絡資訊與營業時間。社群連結在下方另外管理。</p>
      </div>

      <fieldset className="space-y-4 rounded-sm border border-white/[0.08] bg-white/[0.02] p-5">
        <legend className="text-[10px] tracking-[0.4em] text-temo-gold uppercase">
          作品篩選顯示語言
        </legend>
        <p className="text-xs leading-relaxed text-temo-warm-gray/55">
          統一控制作品列表與服務頁的篩選欄位；前台訪客不會看到切換按鈕。
        </p>
        <div className="grid grid-cols-3 gap-2" aria-label="作品篩選顯示語言">
          {PORTFOLIO_FILTER_LANGUAGE_OPTIONS.map((option) => {
            const active = f.portfolio_filter_language === option.value
            return (
              <label
                key={option.value}
                className={
                  "flex min-h-12 cursor-pointer items-center justify-center rounded-sm border px-3 text-xs tracking-[0.12em] transition-colors focus-within:ring-2 focus-within:ring-temo-gold/60 " +
                  (active
                    ? "border-temo-gold bg-temo-gold text-temo-black"
                    : "border-white/10 bg-white/[0.02] text-temo-warm-gray hover:border-white/25 hover:text-temo-white")
                }
              >
                <input
                  type="radio"
                  name="portfolio_filter_language"
                  value={option.value}
                  checked={active}
                  onChange={() => set("portfolio_filter_language", option.value)}
                  className="sr-only"
                />
                {option.label}
              </label>
            )
          })}
        </div>
      </fieldset>

      <div className="space-y-5">
        <SettingsField label="品牌名稱" value={f.name} onChange={(value) => set("name", value)} />
        <div>
          <label className={labelCls}>品牌簡述</label>
          <textarea className={inputCls + " min-h-20 resize-y"} value={f.description} onChange={(e) => set("description", e.target.value)} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <SettingsField label="Email" value={f.email} onChange={(value) => set("email", value)} placeholder="info@temo.design" />
          <SettingsField label="電話" value={f.phone} onChange={(value) => set("phone", value)} placeholder="0913-322-070" />
        </div>
        <SettingsField label="地址" value={f.address} onChange={(value) => set("address", value)} />
      </div>

      {/* 營業時間 */}
      <div className="space-y-3 pt-4 border-t border-white/[0.06]">
        <p className="text-[10px] tracking-[0.4em] text-temo-gold uppercase">營業時間</p>
        <div>
          <textarea
            className={inputCls + " min-h-24 resize-y font-mono"}
            value={f.business_hours}
            onChange={(e) => set("business_hours", e.target.value)}
            placeholder={"週一 — 週五｜09:00 – 21:00\n週六 · 週日｜休息"}
          />
          <p className="text-[11px] text-temo-warm-gray/50 mt-2 leading-relaxed">
            一行一個時段。用「<span className="text-temo-gold/80">|</span>」（或全形「<span className="text-temo-gold/80">｜</span>」）分隔左右兩欄，例如
            <span className="text-temo-white/70">「週一 — 週五 | 09:00 – 21:00」</span>。不加分隔線的整行會整段顯示。
          </p>
        </div>
      </div>

      {/* LINE 官方帳號 */}
      <div className="space-y-5 pt-4 border-t border-white/[0.06]">
        <p className="text-[10px] tracking-[0.4em] text-temo-gold uppercase">LINE 官方帳號</p>
        <SettingsField label="LINE 連結" value={f.line_url} onChange={(value) => set("line_url", value)} placeholder="https://lin.ee/xxxxxx" />
        <div>
          <label className={labelCls}>LINE QR 圖片</label>
          <div className="flex items-center gap-4">
            <div className="relative w-24 h-24 rounded-md overflow-hidden bg-[#1a1815] shrink-0 flex items-center justify-center border border-white/10">
              {f.line_qr_url ? (
                <Image src={f.line_qr_url} alt="LINE QR" fill unoptimized className="object-contain p-1" />
              ) : (
                <span className="text-[9px] tracking-[0.2em] text-temo-warm-gray/40 text-center px-1">尚未上傳</span>
              )}
            </div>
            <label
              className={
                "inline-flex items-center gap-2 px-4 py-2.5 border border-white/15 text-temo-white text-xs tracking-wider rounded-sm cursor-pointer hover:border-temo-gold/50 transition-colors" +
                (uploading ? " opacity-60 pointer-events-none" : "")
              }
            >
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {uploading ? "上傳中…" : f.line_qr_url ? "更換 QR" : "上傳 QR"}
              <input type="file" accept="image/*" className="hidden" onChange={onQrFile} disabled={uploading} />
            </label>
          </div>
        </div>
      </div>

      {error && <p className="text-sm text-red-400/90">{error}</p>}

      <div className="flex items-center gap-3 pt-2">
        <button type="submit" disabled={pending || uploading} className="inline-flex items-center gap-2 px-6 py-3 bg-temo-gold text-temo-black text-xs font-bold tracking-[0.2em] uppercase hover:brightness-110 active:scale-[0.98] disabled:opacity-60 transition-all rounded-sm">
          {pending && <Loader2 className="w-4 h-4 animate-spin" />}
          儲存設定
        </button>
        {saved && !pending && (
          <span className="inline-flex items-center gap-1.5 text-sm text-temo-gold">
            <Check className="w-4 h-4" /> 已儲存
          </span>
        )}
      </div>
    </form>
  )
}
