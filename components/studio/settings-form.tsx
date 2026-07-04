"use client"

import { useState, useTransition } from "react"
import { Loader2, Check } from "lucide-react"
import { saveSettings, type SettingsInput } from "@/app/studio/(app)/settings/actions"

const inputCls =
  "w-full px-4 py-3 bg-white/[0.03] border border-white/10 text-temo-white text-sm placeholder:text-white/20 focus:border-temo-gold/60 focus:bg-white/[0.05] focus:outline-none transition-all rounded-sm"
const labelCls = "block text-[11px] tracking-[0.2em] text-temo-warm-gray/70 uppercase mb-2"

export function SettingsForm({ initial }: { initial: SettingsInput }) {
  const [f, setF] = useState<SettingsInput>(initial)
  const [pending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState("")

  const set = (k: keyof SettingsInput, v: string) => {
    setF((p) => ({ ...p, [k]: v }))
    setSaved(false)
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

  const Field = ({ label, k, placeholder }: { label: string; k: keyof SettingsInput; placeholder?: string }) => (
    <div>
      <label className={labelCls}>{label}</label>
      <input className={inputCls} value={f[k]} onChange={(e) => set(k, e.target.value)} placeholder={placeholder} />
    </div>
  )

  return (
    <form onSubmit={submit} className="px-6 md:px-10 py-10 md:py-14 max-w-2xl space-y-8">
      <div>
        <p className="text-[10px] tracking-[0.5em] text-temo-gold uppercase mb-3">Settings</p>
        <h1 className="text-3xl md:text-4xl font-bold text-temo-white">網站設定</h1>
        <p className="text-temo-warm-gray/60 text-sm mt-1">聯絡資訊與社群連結，改完會顯示在聯絡頁與頁尾。</p>
      </div>

      <div className="space-y-5">
        <Field label="品牌名稱" k="name" />
        <div>
          <label className={labelCls}>品牌簡述</label>
          <textarea className={inputCls + " min-h-20 resize-y"} value={f.description} onChange={(e) => set("description", e.target.value)} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Field label="Email" k="email" placeholder="info@temo.design" />
          <Field label="電話" k="phone" placeholder="+886-2-..." />
        </div>
        <Field label="地址" k="address" />
      </div>

      <div className="space-y-5 pt-4 border-t border-white/[0.06]">
        <p className="text-[10px] tracking-[0.4em] text-temo-gold uppercase">社群連結</p>
        <Field label="Instagram" k="instagram" placeholder="https://instagram.com/..." />
        <Field label="Facebook" k="facebook" placeholder="https://facebook.com/..." />
        <Field label="Behance" k="behance" placeholder="https://behance.net/..." />
      </div>

      {error && <p className="text-sm text-red-400/90">{error}</p>}

      <div className="flex items-center gap-3 pt-2">
        <button type="submit" disabled={pending} className="inline-flex items-center gap-2 px-6 py-3 bg-temo-gold text-temo-black text-xs font-bold tracking-[0.2em] uppercase hover:brightness-110 active:scale-[0.98] disabled:opacity-60 transition-all rounded-sm">
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
