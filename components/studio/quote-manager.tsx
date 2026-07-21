"use client"

import { useRef, useState, useTransition } from "react"
import { Loader2, Plus, Trash2, Check, Star } from "lucide-react"
import {
  saveCategory,
  deleteCategory,
  savePackage,
  deletePackage,
  saveAddon,
  deleteAddon,
  saveComponent,
  deleteComponent,
} from "@/app/studio/(app)/quote/actions"
import type { QuoteCategory, QuoteAddon, QuoteComponent } from "@/lib/content-supabase"
import { cn } from "@/lib/utils"

const inputCls =
  "w-full px-3 py-2.5 bg-white/[0.03] border border-white/10 text-temo-white text-sm placeholder:text-white/20 focus:border-temo-gold/60 focus:outline-none transition-all rounded-sm"
const labelCls = "text-[11px] tracking-wider text-temo-warm-gray/60 uppercase"

type CatRow = {
  key: string
  id?: string
  title: string
  titleEn: string
  description: string
  icon: string
  sort: number
}

type PkgRow = {
  key: string
  id?: string
  categoryId: string
  name: string
  nameEn: string
  basePrice: number
  originalPrice: number | null
  priceNote: string
  features: string // 一行一項，方便 textarea 編輯
  recommended: boolean
  showAddons: boolean
  componentIds: string[]
  sort: number
}

type AddonRow = { key: string; id?: string; label: string; price: number; sort: number }

type CompRow = { key: string; id?: string; name: string; deductValue: number; sort: number }

export function QuoteManager({
  categories,
  addons,
  components,
}: {
  categories: QuoteCategory[]
  addons: QuoteAddon[]
  components: QuoteComponent[]
}) {
  const counter = useRef(0)
  const newKey = () => `new-${counter.current++}`

  const [cats, setCats] = useState<CatRow[]>(
    categories.map((c) => ({
      key: c.id,
      id: c.id,
      title: c.title,
      titleEn: c.titleEn,
      description: c.description,
      icon: c.icon,
      sort: c.sort,
    }))
  )
  const [pkgs, setPkgs] = useState<PkgRow[]>(
    categories.flatMap((c) =>
      c.packages.map((p) => ({
        key: p.id,
        id: p.id,
        categoryId: c.id,
        name: p.name,
        nameEn: p.nameEn,
        basePrice: p.basePrice,
        originalPrice: p.originalPrice ?? null,
        priceNote: p.priceNote ?? "",
        features: p.features.join("\n"),
        recommended: !!p.recommended,
        showAddons: p.showAddons,
        componentIds: p.componentIds ?? [],
        sort: p.sort,
      }))
    )
  )
  const [addonRows, setAddonRows] = useState<AddonRow[]>(
    addons.map((a) => ({ key: a.id, id: a.id, label: a.label, price: a.price, sort: a.sort }))
  )
  const [compRows, setCompRows] = useState<CompRow[]>(
    components.map((c) => ({ key: c.id, id: c.id, name: c.name, deductValue: c.deductValue, sort: c.sort }))
  )

  const [activeKey, setActiveKey] = useState<string>(cats[0]?.key ?? "")
  const activeCat = cats.find((c) => c.key === activeKey) ?? cats[0]

  // ── 類別 ──
  function addCategory() {
    const maxSort = cats.reduce((m, c) => Math.max(m, c.sort), -1)
    const k = newKey()
    setCats((p) => [...p, { key: k, title: "", titleEn: "", description: "", icon: "", sort: maxSort + 1 }])
    setActiveKey(k)
  }
  function updateCat(key: string, patch: Partial<CatRow>) {
    setCats((p) => p.map((c) => (c.key === key ? { ...c, ...patch } : c)))
  }
  function removeCat(key: string) {
    setCats((prev) => {
      const next = prev.filter((c) => c.key !== key)
      if (key === activeKey) setActiveKey(next[0]?.key ?? "")
      return next
    })
    setPkgs((prev) => prev.filter((p) => p.categoryId !== cats.find((c) => c.key === key)?.id))
  }

  // ── 方案 ──
  function addPackage() {
    if (!activeCat?.id) return
    const inCat = pkgs.filter((p) => p.categoryId === activeCat.id)
    const maxSort = inCat.reduce((m, p) => Math.max(m, p.sort), -1)
    setPkgs((p) => [
      ...p,
      {
        key: newKey(),
        categoryId: activeCat.id!,
        name: "",
        nameEn: "",
        basePrice: 0,
        originalPrice: null,
        priceNote: "",
        features: "",
        recommended: false,
        showAddons: false,
        componentIds: [],
        sort: maxSort + 1,
      },
    ])
  }
  function updatePkg(key: string, patch: Partial<PkgRow>) {
    setPkgs((p) => p.map((r) => (r.key === key ? { ...r, ...patch } : r)))
  }
  function removePkg(key: string) {
    setPkgs((p) => p.filter((r) => r.key !== key))
  }

  // ── 加購 ──
  function addAddon() {
    const maxSort = addonRows.reduce((m, a) => Math.max(m, a.sort), -1)
    setAddonRows((p) => [...p, { key: newKey(), label: "", price: 0, sort: maxSort + 1 }])
  }
  function updateAddon(key: string, patch: Partial<AddonRow>) {
    setAddonRows((p) => p.map((a) => (a.key === key ? { ...a, ...patch } : a)))
  }
  function removeAddon(key: string) {
    setAddonRows((p) => p.filter((a) => a.key !== key))
  }

  // ── 內容元件 ──
  function addComponent() {
    const maxSort = compRows.reduce((m, c) => Math.max(m, c.sort), -1)
    setCompRows((p) => [...p, { key: newKey(), name: "", deductValue: 0, sort: maxSort + 1 }])
  }
  function updateComponent(key: string, patch: Partial<CompRow>) {
    setCompRows((p) => p.map((c) => (c.key === key ? { ...c, ...patch } : c)))
  }
  function removeComponent(key: string) {
    setCompRows((p) => p.filter((c) => c.key !== key))
  }
  // 只有「已儲存（有 id）」的元件才能掛到方案上
  const savedComponents = compRows.filter((c): c is CompRow & { id: string } => !!c.id)

  const activePkgs = activeCat?.id
    ? pkgs.filter((p) => p.categoryId === activeCat.id).sort((a, b) => a.sort - b.sort)
    : []

  return (
    <div className="px-6 md:px-10 py-10 md:py-14 max-w-4xl">
      <div className="mb-8">
        <p className="text-[10px] tracking-[0.5em] text-temo-gold uppercase mb-2">Estimate</p>
        <h1 className="text-3xl md:text-4xl font-bold text-temo-white">報價試算</h1>
        <p className="text-temo-warm-gray/60 text-sm mt-1">
          管理前台「即時報價試算」的服務類別、方案價格與共用加購項。改完按各卡片的「儲存」即時生效。
        </p>
      </div>

      {/* 類別分頁 */}
      <div className="flex flex-wrap items-center gap-2 border-b border-white/10 pb-3 mb-6">
        {cats.map((c) => (
          <button
            key={c.key}
            onClick={() => setActiveKey(c.key)}
            className={cn(
              "px-3.5 py-2 text-xs font-medium tracking-wide rounded-sm border transition-all",
              c.key === activeKey
                ? "border-temo-gold/60 bg-temo-gold/10 text-temo-gold"
                : "border-white/10 text-temo-warm-gray hover:text-white hover:border-white/25"
            )}
          >
            {c.title || "（未命名類別）"}
            {!c.id && <span className="ml-1 text-[10px] text-temo-gold/70">未儲存</span>}
          </button>
        ))}
        <button
          onClick={addCategory}
          className="px-3 py-2 text-xs text-temo-warm-gray/70 hover:text-temo-gold inline-flex items-center gap-1 rounded-sm border border-dashed border-white/15 hover:border-temo-gold/40 transition-all"
        >
          <Plus className="w-3.5 h-3.5" /> 新增類別
        </button>
      </div>

      {activeCat ? (
        <>
          <CategoryCard row={activeCat} onChange={(p) => updateCat(activeCat.key, p)} onRemove={() => removeCat(activeCat.key)} />

          <div className="flex items-center justify-between mt-8 mb-3">
            <h2 className="text-sm font-bold text-temo-white tracking-wide">
              「{activeCat.title || "此類別"}」的方案
              <span className="text-temo-warm-gray/50 font-normal ml-2">共 {activePkgs.length} 個</span>
            </h2>
            <button
              onClick={addPackage}
              disabled={!activeCat.id}
              title={activeCat.id ? "" : "請先儲存此類別，才能新增方案"}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-temo-gold text-temo-black text-xs font-bold tracking-[0.15em] uppercase rounded-sm hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <Plus className="w-4 h-4" /> 新增方案
            </button>
          </div>
          {!activeCat.id && (
            <p className="text-[11px] text-temo-gold/70 mb-3">↑ 這個類別還沒儲存，先在上方卡片按「儲存類別」，才能加方案。</p>
          )}

          <div className="space-y-4">
            {activePkgs.map((r) => (
              <PackageCard
                key={r.key}
                row={r}
                components={savedComponents}
                onChange={(p) => updatePkg(r.key, p)}
                onRemove={() => removePkg(r.key)}
              />
            ))}
            {activeCat.id && activePkgs.length === 0 && (
              <p className="text-temo-warm-gray/50 text-sm py-6 text-center border border-dashed border-white/10 rounded-sm">
                這個類別還沒有方案，點右上「新增方案」。
              </p>
            )}
          </div>
        </>
      ) : (
        <p className="text-temo-warm-gray/50 text-sm py-8 text-center">還沒有任何類別，點「新增類別」開始。</p>
      )}

      {/* 共用加購池 */}
      <div className="mt-14 pt-8 border-t border-white/10">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-sm font-bold text-temo-white tracking-wide">
            共用加購池
            <span className="text-temo-warm-gray/50 font-normal ml-2">共 {addonRows.length} 項</span>
          </h2>
          <button
            onClick={addAddon}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/[0.06] text-temo-white text-xs font-bold tracking-[0.15em] uppercase rounded-sm hover:bg-white/[0.1] transition-all"
          >
            <Plus className="w-4 h-4" /> 新增加購項
          </button>
        </div>
        <p className="text-[11px] text-temo-warm-gray/50 mb-4">
          這些加購項會出現在「有勾選『顯示加購池』的方案」底下，讓客戶自由加選。
        </p>
        <div className="space-y-3">
          {addonRows.map((a) => (
            <AddonCard key={a.key} row={a} onChange={(p) => updateAddon(a.key, p)} onRemove={() => removeAddon(a.key)} />
          ))}
          {addonRows.length === 0 && (
            <p className="text-temo-warm-gray/50 text-sm py-6 text-center border border-dashed border-white/10 rounded-sm">
              還沒有加購項。
            </p>
          )}
        </div>
      </div>

      {/* 內容元件（重疊自動扣抵）*/}
      <div className="mt-14 pt-8 border-t border-white/10">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-sm font-bold text-temo-white tracking-wide">
            內容元件（重疊自動扣抵）
            <span className="text-temo-warm-gray/50 font-normal ml-2">共 {compRows.length} 項</span>
          </h2>
          <button
            onClick={addComponent}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/[0.06] text-temo-white text-xs font-bold tracking-[0.15em] uppercase rounded-sm hover:bg-white/[0.1] transition-all"
          >
            <Plus className="w-4 h-4" /> 新增元件
          </button>
        </div>
        <p className="text-[11px] text-temo-warm-gray/50 mb-4 leading-relaxed">
          內容元件＝方案「內含的東西」（例：LOGO、名片、社群背景）。<strong className="text-temo-warm-gray/80">抵扣值</strong>通常填該品項單獨購買的價格。
          當客人同時選到兩個都含同一元件的方案時，系統會自動扣掉重複那份的抵扣值，不重複計價。<br />
          設好元件後，回上方每個「方案」卡片勾選它包含哪些元件即可生效。<span className="text-temo-gold/70">建議抵扣值寧可少填一點，避免多扣＝少收錢。</span>
        </p>
        <div className="space-y-3">
          {compRows.map((c) => (
            <ComponentCard key={c.key} row={c} onChange={(p) => updateComponent(c.key, p)} onRemove={() => removeComponent(c.key)} />
          ))}
          {compRows.length === 0 && (
            <p className="text-temo-warm-gray/50 text-sm py-6 text-center border border-dashed border-white/10 rounded-sm">
              還沒有內容元件。想啟用「重疊自動扣抵」，先新增元件（如 LOGO），再到方案卡勾選。
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// 類別卡
// ─────────────────────────────────────────────
function CategoryCard({ row, onChange, onRemove }: { row: CatRow; onChange: (p: Partial<CatRow>) => void; onRemove: () => void }) {
  const [pending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState("")
  const dirty = (p: Partial<CatRow>) => { onChange(p); setSaved(false) }

  function save() {
    setError("")
    startTransition(async () => {
      const res = await saveCategory(
        { title: row.title, titleEn: row.titleEn, description: row.description, icon: row.icon, sort: row.sort },
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
    if (row.id && !confirm("確定刪除這個類別？底下的方案也會一併移除。")) return
    startTransition(async () => {
      if (row.id) {
        const res = await deleteCategory(row.id)
        if (res.error) { setError(res.error); return }
      }
      onRemove()
    })
  }

  return (
    <div className="rounded-lg border border-temo-gold/20 bg-temo-gold/[0.03] p-4 space-y-3">
      <p className={labelCls}>類別設定</p>
      <div className="grid sm:grid-cols-2 gap-3">
        <label className="space-y-1">
          <span className={labelCls}>類別名稱（中）</span>
          <input className={inputCls} value={row.title} onChange={(e) => dirty({ title: e.target.value })} placeholder="例：純享單品" />
        </label>
        <label className="space-y-1">
          <span className={labelCls}>英文標題</span>
          <input className={inputCls} value={row.titleEn} onChange={(e) => dirty({ titleEn: e.target.value })} placeholder="PURE DESIGN" />
        </label>
      </div>
      <label className="space-y-1 block">
        <span className={labelCls}>類別說明</span>
        <input className={inputCls} value={row.description} onChange={(e) => dirty({ description: e.target.value })} placeholder="單一品項設計，依需求挑選" />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="space-y-1">
          <span className={labelCls}>手機圖示（單字）</span>
          <input className={inputCls} value={row.icon} onChange={(e) => dirty({ icon: e.target.value })} placeholder="S" maxLength={2} />
        </label>
        <label className="space-y-1">
          <span className={labelCls}>排序</span>
          <input type="number" className={inputCls} value={row.sort} onChange={(e) => dirty({ sort: Number(e.target.value) })} />
        </label>
      </div>
      {error && <p className="text-xs text-red-400/90">{error}</p>}
      <div className="flex items-center gap-3">
        <SaveButton pending={pending} saved={saved} onClick={save} label="儲存類別" />
        <button onClick={del} disabled={pending} className="ml-auto inline-flex items-center gap-1.5 px-3 py-2 text-red-400/70 hover:text-red-400 text-xs transition-colors disabled:opacity-60">
          <Trash2 className="w-3.5 h-3.5" /> 刪除類別
        </button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// 方案卡
// ─────────────────────────────────────────────
function PackageCard({
  row,
  components,
  onChange,
  onRemove,
}: {
  row: PkgRow
  components: (CompRow & { id: string })[]
  onChange: (p: Partial<PkgRow>) => void
  onRemove: () => void
}) {
  const [pending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState("")
  const dirty = (p: Partial<PkgRow>) => { onChange(p); setSaved(false) }

  function toggleComponent(id: string) {
    const next = row.componentIds.includes(id)
      ? row.componentIds.filter((c) => c !== id)
      : [...row.componentIds, id]
    dirty({ componentIds: next })
  }

  function save() {
    setError("")
    startTransition(async () => {
      const res = await savePackage(
        {
          categoryId: row.categoryId,
          name: row.name,
          nameEn: row.nameEn,
          basePrice: row.basePrice,
          originalPrice: row.originalPrice,
          priceNote: row.priceNote,
          features: row.features.split("\n"),
          recommended: row.recommended,
          showAddons: row.showAddons,
          componentIds: row.componentIds,
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
    if (row.id && !confirm("確定刪除這個方案？")) return
    startTransition(async () => {
      if (row.id) {
        const res = await deletePackage(row.id)
        if (res.error) { setError(res.error); return }
      }
      onRemove()
    })
  }

  return (
    <div className={cn("rounded-lg border bg-white/[0.02] p-4 space-y-3", row.recommended ? "border-temo-gold/40" : "border-white/10")}>
      <div className="grid sm:grid-cols-2 gap-3">
        <label className="space-y-1">
          <span className={labelCls}>方案名稱（中）</span>
          <input className={inputCls} value={row.name} onChange={(e) => dirty({ name: e.target.value })} placeholder="LOGO 商標設計" />
        </label>
        <label className="space-y-1">
          <span className={labelCls}>英文名</span>
          <input className={inputCls} value={row.nameEn} onChange={(e) => dirty({ nameEn: e.target.value })} placeholder="LOGO" />
        </label>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <label className="space-y-1">
          <span className={labelCls}>起價 NT$</span>
          <input type="number" className={inputCls} value={row.basePrice} onChange={(e) => dirty({ basePrice: Number(e.target.value) })} />
        </label>
        <label className="space-y-1">
          <span className={labelCls}>原價（可空）</span>
          <input
            type="number"
            className={inputCls}
            value={row.originalPrice ?? ""}
            onChange={(e) => dirty({ originalPrice: e.target.value === "" ? null : Number(e.target.value) })}
            placeholder="—"
          />
        </label>
        <label className="space-y-1 col-span-2">
          <span className={labelCls}>排序</span>
          <input type="number" className={inputCls} value={row.sort} onChange={(e) => dirty({ sort: Number(e.target.value) })} />
        </label>
      </div>

      <label className="space-y-1 block">
        <span className={labelCls}>價格備註（可空，例：範圍價 / 現省 NT$…）</span>
        <input className={inputCls} value={row.priceNote} onChange={(e) => dirty({ priceNote: e.target.value })} placeholder="NT$6,800 ~ 9,800" />
      </label>

      <label className="space-y-1 block">
        <span className={labelCls}>特色清單（一行一項）</span>
        <textarea
          className={inputCls + " min-h-28 resize-y font-mono text-xs leading-relaxed"}
          value={row.features}
          onChange={(e) => dirty({ features: e.target.value })}
          placeholder={"協助基本商標名稱檢索\n共出 3 款 LOGO 設計\n三擇一進入細修"}
        />
      </label>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        <label className="inline-flex items-center gap-2 text-xs text-temo-warm-gray cursor-pointer">
          <input type="checkbox" className="accent-temo-gold w-4 h-4" checked={row.recommended} onChange={(e) => dirty({ recommended: e.target.checked })} />
          <Star className="w-3.5 h-3.5 text-temo-gold" /> 標記為推薦
        </label>
        <label className="inline-flex items-center gap-2 text-xs text-temo-warm-gray cursor-pointer">
          <input type="checkbox" className="accent-temo-gold w-4 h-4" checked={row.showAddons} onChange={(e) => dirty({ showAddons: e.target.checked })} />
          顯示共用加購池
        </label>
      </div>

      {/* 內含內容元件（用於重疊自動扣抵）*/}
      <div className="border-t border-white/8 pt-3">
        <p className={labelCls + " mb-2"}>內含內容元件（重疊時自動扣抵）</p>
        {components.length === 0 ? (
          <p className="text-[11px] text-temo-warm-gray/50">
            尚未建立任何內容元件。到頁面最下方「內容元件」區新增（如 LOGO、名片），再回這裡勾選。
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {components.map((c) => {
              const checked = row.componentIds.includes(c.id)
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => toggleComponent(c.id)}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs transition-all",
                    checked
                      ? "border-temo-gold/50 bg-temo-gold/10 text-temo-gold"
                      : "border-white/12 text-temo-warm-gray hover:border-white/30 hover:text-white"
                  )}
                >
                  {checked && <Check className="w-3 h-3" />}
                  {c.name || "（未命名元件）"}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {error && <p className="text-xs text-red-400/90">{error}</p>}
      <div className="flex items-center gap-3">
        <SaveButton pending={pending} saved={saved} onClick={save} label="儲存" />
        <button onClick={del} disabled={pending} className="ml-auto inline-flex items-center gap-1.5 px-3 py-2 text-red-400/70 hover:text-red-400 text-xs transition-colors disabled:opacity-60">
          <Trash2 className="w-3.5 h-3.5" /> 刪除
        </button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// 加購卡
// ─────────────────────────────────────────────
function AddonCard({ row, onChange, onRemove }: { row: AddonRow; onChange: (p: Partial<AddonRow>) => void; onRemove: () => void }) {
  const [pending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState("")
  const dirty = (p: Partial<AddonRow>) => { onChange(p); setSaved(false) }

  function save() {
    setError("")
    startTransition(async () => {
      const res = await saveAddon({ label: row.label, price: row.price, sort: row.sort }, row.id)
      if (res.error) setError(res.error)
      else {
        if (res.id && !row.id) onChange({ id: res.id })
        setSaved(true)
      }
    })
  }
  function del() {
    if (row.id && !confirm("確定刪除這個加購項？")) return
    startTransition(async () => {
      if (row.id) {
        const res = await deleteAddon(row.id)
        if (res.error) { setError(res.error); return }
      }
      onRemove()
    })
  }

  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.02] p-3">
      <div className="flex flex-wrap items-end gap-3">
        <label className="space-y-1 flex-1 min-w-[180px]">
          <span className={labelCls}>加購項名稱</span>
          <input className={inputCls} value={row.label} onChange={(e) => dirty({ label: e.target.value })} placeholder="文宣海報 / A3 菜單 (1 款)" />
        </label>
        <label className="space-y-1 w-28">
          <span className={labelCls}>加價 NT$</span>
          <input type="number" className={inputCls} value={row.price} onChange={(e) => dirty({ price: Number(e.target.value) })} />
        </label>
        <label className="space-y-1 w-20">
          <span className={labelCls}>排序</span>
          <input type="number" className={inputCls} value={row.sort} onChange={(e) => dirty({ sort: Number(e.target.value) })} />
        </label>
      </div>
      {error && <p className="text-xs text-red-400/90 mt-2">{error}</p>}
      <div className="flex items-center gap-3 mt-3">
        <SaveButton pending={pending} saved={saved} onClick={save} label="儲存" />
        <button onClick={del} disabled={pending} className="ml-auto inline-flex items-center gap-1.5 px-3 py-2 text-red-400/70 hover:text-red-400 text-xs transition-colors disabled:opacity-60">
          <Trash2 className="w-3.5 h-3.5" /> 刪除
        </button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// 內容元件卡
// ─────────────────────────────────────────────
function ComponentCard({ row, onChange, onRemove }: { row: CompRow; onChange: (p: Partial<CompRow>) => void; onRemove: () => void }) {
  const [pending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState("")
  const dirty = (p: Partial<CompRow>) => { onChange(p); setSaved(false) }

  function save() {
    setError("")
    startTransition(async () => {
      const res = await saveComponent({ name: row.name, deductValue: row.deductValue, sort: row.sort }, row.id)
      if (res.error) setError(res.error)
      else {
        if (res.id && !row.id) onChange({ id: res.id })
        setSaved(true)
      }
    })
  }
  function del() {
    if (row.id && !confirm("確定刪除這個內容元件？已勾選它的方案會失去這個重疊扣抵標記。")) return
    startTransition(async () => {
      if (row.id) {
        const res = await deleteComponent(row.id)
        if (res.error) { setError(res.error); return }
      }
      onRemove()
    })
  }

  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.02] p-3">
      <div className="flex flex-wrap items-end gap-3">
        <label className="space-y-1 flex-1 min-w-[180px]">
          <span className={labelCls}>元件名稱</span>
          <input className={inputCls} value={row.name} onChange={(e) => dirty({ name: e.target.value })} placeholder="LOGO 商標" />
        </label>
        <label className="space-y-1 w-32">
          <span className={labelCls}>抵扣值 NT$</span>
          <input type="number" className={inputCls} value={row.deductValue} onChange={(e) => dirty({ deductValue: Number(e.target.value) })} />
        </label>
        <label className="space-y-1 w-20">
          <span className={labelCls}>排序</span>
          <input type="number" className={inputCls} value={row.sort} onChange={(e) => dirty({ sort: Number(e.target.value) })} />
        </label>
      </div>
      {!row.id && <p className="text-[11px] text-temo-gold/70 mt-2">↑ 先按「儲存」，這個元件才會出現在方案卡的可勾選清單裡。</p>}
      {error && <p className="text-xs text-red-400/90 mt-2">{error}</p>}
      <div className="flex items-center gap-3 mt-3">
        <SaveButton pending={pending} saved={saved} onClick={save} label="儲存" />
        <button onClick={del} disabled={pending} className="ml-auto inline-flex items-center gap-1.5 px-3 py-2 text-red-400/70 hover:text-red-400 text-xs transition-colors disabled:opacity-60">
          <Trash2 className="w-3.5 h-3.5" /> 刪除
        </button>
      </div>
    </div>
  )
}

function SaveButton({ pending, saved, onClick, label }: { pending: boolean; saved: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      disabled={pending}
      className="inline-flex items-center gap-1.5 px-4 py-2 bg-temo-gold/90 text-temo-black text-xs font-bold tracking-wider rounded-sm hover:brightness-110 disabled:opacity-60 transition-all"
    >
      {pending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : saved ? <Check className="w-3.5 h-3.5" /> : null}
      {saved ? "已儲存" : label}
    </button>
  )
}
