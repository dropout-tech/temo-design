"use client"

import { useMemo, useRef, useState, useTransition } from "react"
import Link from "next/link"
import {
  ArrowUpRight,
  Calculator,
  Check,
  ClipboardList,
  GripVertical,
  Layers3,
  Loader2,
  PackagePlus,
  Plus,
  Puzzle,
  Star,
  Trash2,
} from "lucide-react"
import {
  saveCategory,
  deleteCategory,
  reorderQuoteCategories,
  savePackage,
  deletePackage,
  reorderQuotePackages,
  saveAddon,
  deleteAddon,
  reorderQuoteAddons,
  saveComponent,
  deleteComponent,
  reorderQuoteComponents,
} from "@/app/studio/(app)/quote/actions"
import type { QuoteCategory, QuoteAddon, QuoteComponent } from "@/lib/content-supabase"
import { SortableList, type DragHandleProps } from "@/components/studio/sortable-list"
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

type QuoteWorkspace = "plans" | "addons" | "components"

const WORKSPACES: {
  id: QuoteWorkspace
  label: string
  helper: string
  icon: typeof Calculator
}[] = [
  { id: "plans", label: "服務方案", helper: "類別、方案、價格", icon: Calculator },
  { id: "addons", label: "共用加購", helper: "方案可選加價項", icon: PackagePlus },
  { id: "components", label: "重疊扣抵", helper: "避免重複計價", icon: Puzzle },
]

const currency = new Intl.NumberFormat("zh-TW", {
  style: "currency",
  currency: "TWD",
  maximumFractionDigits: 0,
})

const formatMoney = (value: number) => currency.format(value)

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
  const [activeWorkspace, setActiveWorkspace] = useState<QuoteWorkspace>("plans")
  const activeCat = cats.find((c) => c.key === activeKey) ?? cats[0]
  const [orderPending, startOrder] = useTransition()
  const [orderError, setOrderError] = useState("")

  // ── 類別 ──
  function addCategory() {
    const maxSort = cats.reduce((m, c) => Math.max(m, c.sort), -1)
    const k = newKey()
    setCats((p) => [...p, { key: k, title: "", titleEn: "", description: "", icon: "", sort: maxSort + 1 }])
    setActiveKey(k)
    setActiveWorkspace("plans")
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
    setActiveWorkspace("plans")
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
    setActiveWorkspace("addons")
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
    setActiveWorkspace("components")
  }
  function updateComponent(key: string, patch: Partial<CompRow>) {
    setCompRows((p) => p.map((c) => (c.key === key ? { ...c, ...patch } : c)))
  }
  function removeComponent(key: string) {
    setCompRows((p) => p.filter((c) => c.key !== key))
  }
  // 只有「已儲存（有 id）」的元件才能掛到方案上
  const savedComponents = compRows.filter((c): c is CompRow & { id: string } => !!c.id)

  const activePkgs = activeCat?.id ? pkgs.filter((p) => p.categoryId === activeCat.id) : []
  const quoteStats = useMemo(() => {
    const prices = pkgs.map((p) => p.basePrice).filter((price) => Number.isFinite(price) && price > 0)
    const minPrice = prices.length > 0 ? Math.min(...prices) : 0
    const maxPrice = prices.length > 0 ? Math.max(...prices) : 0
    return {
      categoryCount: cats.length,
      packageCount: pkgs.length,
      addonCount: addonRows.length,
      componentCount: compRows.length,
      addonEnabledCount: pkgs.filter((p) => p.showAddons).length,
      componentLinkedCount: pkgs.filter((p) => p.componentIds.length > 0).length,
      unsavedCount:
        cats.filter((c) => !c.id).length +
        pkgs.filter((p) => !p.id).length +
        addonRows.filter((a) => !a.id).length +
        compRows.filter((c) => !c.id).length,
      priceRange: prices.length > 0 ? `${formatMoney(minPrice)} - ${formatMoney(maxPrice)}` : "尚未設定",
    }
  }, [addonRows, cats, compRows, pkgs])

  // ── 拖拉排序 ──
  function reorderCatsLive(next: CatRow[]) {
    setCats(next)
  }
  function reorderCatsCommit(next: CatRow[]) {
    const ids = next.filter((c) => c.id).map((c) => c.id!)
    // 同步每個類別的 sort 為這次落庫序列中的 index，避免之後單類別 save 把舊 sort 蓋回去（CR-01）
    const synced = next.map((c) => (c.id ? { ...c, sort: ids.indexOf(c.id) } : c))
    setCats(synced)
    setOrderError("")
    startOrder(async () => {
      const res = await reorderQuoteCategories(ids)
      if (res?.error) setOrderError(res.error)
    })
  }

  function reorderPkgsLive(categoryId: string, nextGroup: PkgRow[]) {
    setPkgs((prev) => [...prev.filter((p) => p.categoryId !== categoryId), ...nextGroup])
  }
  function reorderPkgsCommit(categoryId: string, nextGroup: PkgRow[]) {
    const ids = nextGroup.filter((p) => p.id).map((p) => p.id!)
    // 同步該類別內每個方案的 sort 為這次落庫序列中的 index，避免之後單方案 save 把舊 sort 蓋回去（CR-01）
    const syncedGroup = nextGroup.map((p) => (p.id ? { ...p, sort: ids.indexOf(p.id) } : p))
    reorderPkgsLive(categoryId, syncedGroup)
    setOrderError("")
    startOrder(async () => {
      const res = await reorderQuotePackages(ids)
      if (res?.error) setOrderError(res.error)
    })
  }

  function reorderAddonsLive(next: AddonRow[]) {
    setAddonRows(next)
  }
  function reorderAddonsCommit(next: AddonRow[]) {
    const ids = next.filter((a) => a.id).map((a) => a.id!)
    // 同步每個加購項的 sort 為這次落庫序列中的 index，避免之後單項 save 把舊 sort 蓋回去（CR-01）
    const synced = next.map((a) => (a.id ? { ...a, sort: ids.indexOf(a.id) } : a))
    setAddonRows(synced)
    setOrderError("")
    startOrder(async () => {
      const res = await reorderQuoteAddons(ids)
      if (res?.error) setOrderError(res.error)
    })
  }

  function reorderCompsLive(next: CompRow[]) {
    setCompRows(next)
  }
  function reorderCompsCommit(next: CompRow[]) {
    const ids = next.filter((c) => c.id).map((c) => c.id!)
    // 同步每個內容元件的 sort 為這次落庫序列中的 index，避免之後單元件 save 把舊 sort 蓋回去（CR-01）
    const synced = next.map((c) => (c.id ? { ...c, sort: ids.indexOf(c.id) } : c))
    setCompRows(synced)
    setOrderError("")
    startOrder(async () => {
      const res = await reorderQuoteComponents(ids)
      if (res?.error) setOrderError(res.error)
    })
  }

  return (
    <div className="px-6 md:px-10 py-10 md:py-14 max-w-7xl space-y-8">
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-5">
        <div>
          <p className="text-[10px] tracking-[0.5em] text-temo-gold uppercase mb-2">Estimate</p>
          <h1 className="text-3xl md:text-4xl font-bold text-temo-white">報價試算管理</h1>
          <p className="text-temo-warm-gray/65 text-sm mt-2 max-w-2xl">
            先管理服務類別與方案，再設定共用加購和重疊扣抵。每張卡片儲存後會同步到前台即時報價試算。
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/quote"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 px-4 py-3 border border-white/12 text-temo-warm-gray/75 hover:text-temo-gold hover:border-temo-gold/40 text-xs font-bold tracking-[0.12em] uppercase rounded-sm transition-colors"
          >
            <ArrowUpRight className="w-4 h-4" />
            前台試算
          </Link>
          <Link
            href="/studio/brief"
            className="inline-flex items-center gap-2 px-4 py-3 border border-white/12 text-temo-warm-gray/75 hover:text-temo-gold hover:border-temo-gold/40 text-xs font-bold tracking-[0.12em] uppercase rounded-sm transition-colors"
          >
            <ClipboardList className="w-4 h-4" />
            問卷管理
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <QuoteSummaryCard
          icon={Layers3}
          label="服務類別"
          value={quoteStats.categoryCount}
          helper={`${quoteStats.packageCount} 個方案`}
        />
        <QuoteSummaryCard
          icon={Calculator}
          label="價格範圍"
          value={quoteStats.priceRange}
          helper="以方案起價計算"
        />
        <QuoteSummaryCard
          icon={PackagePlus}
          label="共用加購"
          value={quoteStats.addonCount}
          helper={`${quoteStats.addonEnabledCount} 個方案會顯示`}
        />
        <QuoteSummaryCard
          icon={Puzzle}
          label="扣抵元件"
          value={quoteStats.componentCount}
          helper={`${quoteStats.componentLinkedCount} 個方案已設定`}
        />
      </div>

      <div className="sticky top-0 z-20 -mx-6 md:-mx-10 px-6 md:px-10 py-3 bg-temo-black/95 backdrop-blur border-y border-white/[0.06] overflow-x-auto">
        <div className="flex min-w-max items-center gap-2">
          {WORKSPACES.map((workspace) => {
            const active = activeWorkspace === workspace.id
            return (
              <button
                key={workspace.id}
                type="button"
                onClick={() => setActiveWorkspace(workspace.id)}
                className={cn(
                  "min-w-40 rounded-md border px-3 py-2 text-left transition-colors",
                  active
                    ? "border-temo-gold/55 bg-temo-gold/10 text-temo-gold"
                    : "border-white/10 bg-white/[0.02] text-temo-warm-gray/70 hover:text-temo-white hover:border-white/25"
                )}
              >
                <span className="flex items-center gap-2 text-sm font-medium">
                  <workspace.icon className="w-4 h-4" />
                  {workspace.label}
                </span>
                <span className="block mt-0.5 text-[11px] opacity-55">{workspace.helper}</span>
              </button>
            )
          })}
          {quoteStats.unsavedCount > 0 && (
            <span className="ml-2 rounded-full border border-temo-gold/25 bg-temo-gold/8 px-3 py-1.5 text-xs text-temo-gold">
              {quoteStats.unsavedCount} 筆尚未儲存
            </span>
          )}
          {orderPending && (
            <span className="inline-flex items-center gap-1.5 text-[11px] text-temo-warm-gray/50">
              <Loader2 className="w-3 h-3 animate-spin" /> 儲存順序…
            </span>
          )}
          {orderError && (
            <span className="inline-flex items-center gap-1.5 text-[11px] text-red-400/90">
              排序儲存失敗：{orderError}
            </span>
          )}
        </div>
      </div>

      {activeWorkspace === "plans" && (
        <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)] items-start">
          <aside className="xl:sticky xl:top-28 space-y-4">
            <div>
              <div className="flex items-center justify-between gap-3 mb-3">
                <div>
                  <h2 className="text-sm font-bold text-temo-white tracking-wide">服務類別</h2>
                  <p className="text-xs text-temo-warm-gray/45 mt-1">前台試算的第一層選擇。</p>
                </div>
                <button
                  type="button"
                  onClick={addCategory}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-temo-gold text-temo-black text-xs font-bold tracking-[0.12em] uppercase rounded-sm hover:brightness-110 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  新增
                </button>
              </div>

              <SortableList
                items={cats}
                getKey={(c) => c.key}
                onReorder={reorderCatsLive}
                onCommit={reorderCatsCommit}
                className="space-y-2"
                renderItem={(c, handle) => (
                  <CategoryNavItem
                    row={c}
                    active={c.key === activeKey}
                    packageCount={c.id ? pkgs.filter((p) => p.categoryId === c.id).length : 0}
                    handle={handle}
                    onSelect={() => setActiveKey(c.key)}
                  />
                )}
              />

              {cats.length === 0 && (
                <div className="rounded-lg border border-dashed border-white/12 py-10 text-center">
                  <p className="text-sm text-temo-warm-gray/55">還沒有任何類別。</p>
                  <button
                    type="button"
                    onClick={addCategory}
                    className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 bg-temo-gold text-temo-black text-xs font-bold tracking-[0.12em] uppercase rounded-sm hover:brightness-110 transition"
                  >
                    <Plus className="w-4 h-4" />
                    新增第一個類別
                  </button>
                </div>
              )}
            </div>
          </aside>

          <main className="min-w-0 space-y-6">
            {activeCat ? (
              <>
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
                  <div>
                    <p className="text-xs text-temo-gold/80 mb-2">目前編輯類別</p>
                    <h2 className="text-2xl font-bold text-temo-white">{activeCat.title || "未命名類別"}</h2>
                    <p className="text-sm text-temo-warm-gray/50 mt-1">
                      {activePkgs.length} 個方案，{activePkgs.filter((p) => p.recommended).length} 個推薦，{activePkgs.filter((p) => p.showAddons).length} 個顯示加購
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={addPackage}
                    disabled={!activeCat.id}
                    title={activeCat.id ? "" : "請先儲存此類別，才能新增方案"}
                    className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-temo-gold text-temo-black text-xs font-bold tracking-[0.15em] uppercase rounded-sm hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    新增方案
                  </button>
                </div>

                <CategoryCard row={activeCat} onChange={(p) => updateCat(activeCat.key, p)} onRemove={() => removeCat(activeCat.key)} />

                {!activeCat.id && (
                  <div className="rounded-md border border-temo-gold/25 bg-temo-gold/[0.05] px-4 py-3 text-sm text-temo-gold/85">
                    這個類別還沒儲存。先按「儲存類別」，才能新增方案並出現在前台。
                  </div>
                )}

                <section className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-sm font-bold text-temo-white tracking-wide">
                      方案清單
                      <span className="text-temo-warm-gray/50 font-normal ml-2">拖拉即可改前台順序</span>
                    </h3>
                  </div>
                  <SortableList
                    items={activePkgs}
                    getKey={(r) => r.key}
                    onReorder={(next) => {
                      const cid = activeCat.id
                      if (cid) reorderPkgsLive(cid, next)
                    }}
                    onCommit={(next) => {
                      const cid = activeCat.id
                      if (cid) reorderPkgsCommit(cid, next)
                    }}
                    className="space-y-4"
                    renderItem={(r, handle) => (
                      <PackageCard
                        row={r}
                        handle={handle}
                        components={savedComponents}
                        onChange={(p) => updatePkg(r.key, p)}
                        onRemove={() => removePkg(r.key)}
                      />
                    )}
                  />
                  {activeCat.id && activePkgs.length === 0 && (
                    <div className="rounded-lg border border-dashed border-white/12 py-10 text-center">
                      <p className="text-temo-warm-gray/55 text-sm">這個類別還沒有方案。</p>
                      <button
                        type="button"
                        onClick={addPackage}
                        className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 bg-temo-gold text-temo-black text-xs font-bold tracking-[0.12em] uppercase rounded-sm hover:brightness-110 transition"
                      >
                        <Plus className="w-4 h-4" />
                        新增第一個方案
                      </button>
                    </div>
                  )}
                </section>
              </>
            ) : (
              <div className="rounded-lg border border-dashed border-white/12 py-14 text-center">
                <p className="text-temo-warm-gray/55 text-sm">先新增一個服務類別，再建立方案價格。</p>
              </div>
            )}
          </main>
        </div>
      )}

      {activeWorkspace === "addons" && (
        <section className="space-y-5">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-temo-white">共用加購池</h2>
              <p className="text-sm text-temo-warm-gray/55 mt-2 max-w-2xl">
                加購項不會自動出現在所有方案，只有方案卡片勾選「顯示共用加購池」時，前台才會讓客戶加選。
              </p>
            </div>
            <button
              type="button"
              onClick={addAddon}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-temo-gold text-temo-black text-xs font-bold tracking-[0.15em] uppercase rounded-sm hover:brightness-110 transition-all"
            >
              <Plus className="w-4 h-4" />
              新增加購項
            </button>
          </div>
          <div className="rounded-md border border-white/10 bg-white/[0.02] px-4 py-3 text-xs text-temo-warm-gray/60">
            目前有 {addonRows.length} 個加購項，{quoteStats.addonEnabledCount} 個方案會在前台顯示這個池。
          </div>
          <SortableList
            items={addonRows}
            getKey={(a) => a.key}
            onReorder={reorderAddonsLive}
            onCommit={reorderAddonsCommit}
            className="space-y-3"
            renderItem={(a, handle) => (
              <AddonCard row={a} handle={handle} onChange={(p) => updateAddon(a.key, p)} onRemove={() => removeAddon(a.key)} />
            )}
          />
          {addonRows.length === 0 && (
            <div className="rounded-lg border border-dashed border-white/12 py-10 text-center">
              <p className="text-temo-warm-gray/55 text-sm">還沒有加購項。</p>
              <button
                type="button"
                onClick={addAddon}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 bg-temo-gold text-temo-black text-xs font-bold tracking-[0.12em] uppercase rounded-sm hover:brightness-110 transition"
              >
                <Plus className="w-4 h-4" />
                新增第一個加購項
              </button>
            </div>
          )}
        </section>
      )}

      {activeWorkspace === "components" && (
        <section className="space-y-5">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-temo-white">重疊扣抵元件</h2>
              <p className="text-sm text-temo-warm-gray/55 mt-2 max-w-2xl">
                元件代表方案內含的內容，例如 LOGO、名片、包裝。兩個方案含同一元件時，前台會扣掉重複的抵扣值。
              </p>
            </div>
            <button
              type="button"
              onClick={addComponent}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-temo-gold text-temo-black text-xs font-bold tracking-[0.15em] uppercase rounded-sm hover:brightness-110 transition-all"
            >
              <Plus className="w-4 h-4" />
              新增元件
            </button>
          </div>
          <div className="grid gap-3 lg:grid-cols-3">
            <div className="rounded-md border border-white/10 bg-white/[0.02] px-4 py-3">
              <p className="text-xs text-temo-warm-gray/45">元件數</p>
              <p className="text-xl font-bold text-temo-white mt-1">{compRows.length}</p>
            </div>
            <div className="rounded-md border border-white/10 bg-white/[0.02] px-4 py-3">
              <p className="text-xs text-temo-warm-gray/45">已掛元件的方案</p>
              <p className="text-xl font-bold text-temo-white mt-1">{quoteStats.componentLinkedCount}</p>
            </div>
            <div className="rounded-md border border-temo-gold/25 bg-temo-gold/[0.04] px-4 py-3">
              <p className="text-xs text-temo-gold/80">建議</p>
              <p className="text-xs text-temo-warm-gray/65 mt-1">抵扣值保守填，避免多扣造成少收款。</p>
            </div>
          </div>
          <SortableList
            items={compRows}
            getKey={(c) => c.key}
            onReorder={reorderCompsLive}
            onCommit={reorderCompsCommit}
            className="space-y-3"
            renderItem={(c, handle) => (
              <ComponentCard row={c} handle={handle} onChange={(p) => updateComponent(c.key, p)} onRemove={() => removeComponent(c.key)} />
            )}
          />
          {compRows.length === 0 && (
            <div className="rounded-lg border border-dashed border-white/12 py-10 text-center">
              <p className="text-temo-warm-gray/55 text-sm">還沒有內容元件。先新增 LOGO、名片等元件，再回方案卡勾選。</p>
              <button
                type="button"
                onClick={addComponent}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 bg-temo-gold text-temo-black text-xs font-bold tracking-[0.12em] uppercase rounded-sm hover:brightness-110 transition"
              >
                <Plus className="w-4 h-4" />
                新增第一個元件
              </button>
            </div>
          )}
        </section>
      )}
    </div>
  )
}

function QuoteSummaryCard({
  icon: Icon,
  label,
  value,
  helper,
}: {
  icon: typeof Calculator
  label: string
  value: number | string
  helper: string
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.025] p-4">
      <div className="flex items-center justify-between gap-3 mb-4">
        <Icon className="w-4 h-4 text-temo-gold" />
        <span className="text-[10px] text-temo-warm-gray/35">前台同步</span>
      </div>
      <p className="text-2xl font-bold text-temo-white">{value}</p>
      <p className="text-sm text-temo-warm-gray/60 mt-1">{label}</p>
      <p className="text-[11px] text-temo-warm-gray/35 mt-2">{helper}</p>
    </div>
  )
}

function CategoryNavItem({
  row,
  active,
  packageCount,
  handle,
  onSelect,
}: {
  row: CatRow
  active: boolean
  packageCount: number
  handle: DragHandleProps
  onSelect: () => void
}) {
  return (
    <div
      className={cn(
        "rounded-lg border transition-colors",
        active
          ? "border-temo-gold/45 bg-temo-gold/[0.06]"
          : "border-white/10 bg-white/[0.02] hover:border-white/25"
      )}
    >
      <div className="flex items-center gap-2 p-2">
        <button
          type="button"
          aria-label="拖拉排序類別"
          className={cn(
            "text-temo-warm-gray/35 hover:text-temo-warm-gray active:cursor-grabbing shrink-0",
            active && "text-temo-gold/70 hover:text-temo-gold"
          )}
          {...handle}
        >
          <GripVertical className="w-4 h-4" />
        </button>
        <button type="button" onClick={onSelect} className="min-w-0 flex-1 text-left">
          <span className={cn("block truncate text-sm font-medium", active ? "text-temo-gold" : "text-temo-white")}>
            {row.title || "未命名類別"}
          </span>
          <span className="mt-1 block text-[11px] text-temo-warm-gray/45">
            {packageCount} 個方案
            {!row.id && <span className="ml-2 text-temo-gold/75">尚未儲存</span>}
          </span>
        </button>
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
      <label className="space-y-1 block w-40">
        <span className={labelCls}>手機圖示（單字）</span>
        <input className={inputCls} value={row.icon} onChange={(e) => dirty({ icon: e.target.value })} placeholder="S" maxLength={2} />
      </label>
      {error && <p className="text-xs text-red-400/90">{error}</p>}
      <div className="flex items-center gap-3">
        <SaveButton pending={pending} saved={saved} onClick={save} label="儲存類別" />
        <button type="button" onClick={del} disabled={pending} className="ml-auto inline-flex items-center gap-1.5 px-3 py-2 text-red-400/70 hover:text-red-400 text-xs transition-colors disabled:opacity-60">
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
  handle,
  components,
  onChange,
  onRemove,
}: {
  row: PkgRow
  handle: DragHandleProps
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

  const featureCount = row.features.split("\n").map((f) => f.trim()).filter(Boolean).length
  const priceLabel = row.priceNote.trim() || formatMoney(row.basePrice)

  return (
    <div className={cn("rounded-lg border bg-white/[0.02] p-4 space-y-3", row.recommended ? "border-temo-gold/40" : "border-white/10")}>
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <button
            type="button"
            aria-label="拖拉排序方案"
            className="mt-1 text-temo-warm-gray/40 hover:text-temo-warm-gray active:cursor-grabbing shrink-0"
            {...handle}
          >
            <GripVertical className="w-4 h-4" />
          </button>
          <div className="min-w-0">
            <p className="text-base font-bold text-temo-white truncate">{row.name || "未命名方案"}</p>
            <p className="text-xs text-temo-warm-gray/45 mt-1 truncate">
              {row.nameEn || "未填英文名"} · {featureCount} 項特色 · {row.componentIds.length} 個扣抵元件
            </p>
          </div>
        </div>
        <div className="md:text-right shrink-0">
          <p className="text-sm font-semibold text-temo-gold">{priceLabel}</p>
          <div className="mt-2 flex flex-wrap md:justify-end gap-1.5">
            {row.recommended && (
              <span className="rounded-full bg-temo-gold/12 px-2 py-1 text-[10px] text-temo-gold">推薦</span>
            )}
            {row.showAddons && (
              <span className="rounded-full bg-white/[0.06] px-2 py-1 text-[10px] text-temo-warm-gray/70">顯示加購</span>
            )}
            {!row.id && (
              <span className="rounded-full bg-white/[0.06] px-2 py-1 text-[10px] text-temo-gold/80">尚未儲存</span>
            )}
          </div>
        </div>
      </div>

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

      <div className="grid grid-cols-2 gap-3">
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
            尚未建立任何內容元件。到「重疊扣抵」工作區新增（如 LOGO、名片），再回這裡勾選。
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
        <button type="button" onClick={del} disabled={pending} className="ml-auto inline-flex items-center gap-1.5 px-3 py-2 text-red-400/70 hover:text-red-400 text-xs transition-colors disabled:opacity-60">
          <Trash2 className="w-3.5 h-3.5" /> 刪除
        </button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// 加購卡
// ─────────────────────────────────────────────
function AddonCard({
  row,
  handle,
  onChange,
  onRemove,
}: {
  row: AddonRow
  handle: DragHandleProps
  onChange: (p: Partial<AddonRow>) => void
  onRemove: () => void
}) {
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
        <button
          type="button"
          aria-label="拖拉排序加購項"
          className="text-temo-warm-gray/40 hover:text-temo-warm-gray active:cursor-grabbing self-center"
          {...handle}
        >
          <GripVertical className="w-4 h-4" />
        </button>
        <label className="space-y-1 flex-1 min-w-[180px]">
          <span className={labelCls}>加購項名稱</span>
          <input className={inputCls} value={row.label} onChange={(e) => dirty({ label: e.target.value })} placeholder="文宣海報 / A3 菜單 (1 款)" />
        </label>
        <label className="space-y-1 w-28">
          <span className={labelCls}>加價 NT$</span>
          <input type="number" className={inputCls} value={row.price} onChange={(e) => dirty({ price: Number(e.target.value) })} />
        </label>
      </div>
      {error && <p className="text-xs text-red-400/90 mt-2">{error}</p>}
      <div className="flex items-center gap-3 mt-3">
        <SaveButton pending={pending} saved={saved} onClick={save} label="儲存" />
        <button type="button" onClick={del} disabled={pending} className="ml-auto inline-flex items-center gap-1.5 px-3 py-2 text-red-400/70 hover:text-red-400 text-xs transition-colors disabled:opacity-60">
          <Trash2 className="w-3.5 h-3.5" /> 刪除
        </button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// 內容元件卡
// ─────────────────────────────────────────────
function ComponentCard({
  row,
  handle,
  onChange,
  onRemove,
}: {
  row: CompRow
  handle: DragHandleProps
  onChange: (p: Partial<CompRow>) => void
  onRemove: () => void
}) {
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
        <button
          type="button"
          aria-label="拖拉排序元件"
          className="text-temo-warm-gray/40 hover:text-temo-warm-gray active:cursor-grabbing self-center"
          {...handle}
        >
          <GripVertical className="w-4 h-4" />
        </button>
        <label className="space-y-1 flex-1 min-w-[180px]">
          <span className={labelCls}>元件名稱</span>
          <input className={inputCls} value={row.name} onChange={(e) => dirty({ name: e.target.value })} placeholder="LOGO 商標" />
        </label>
        <label className="space-y-1 w-32">
          <span className={labelCls}>抵扣值 NT$</span>
          <input type="number" className={inputCls} value={row.deductValue} onChange={(e) => dirty({ deductValue: Number(e.target.value) })} />
        </label>
      </div>
      {!row.id && <p className="text-[11px] text-temo-gold/70 mt-2">↑ 先按「儲存」，這個元件才會出現在方案卡的可勾選清單裡。</p>}
      {error && <p className="text-xs text-red-400/90 mt-2">{error}</p>}
      <div className="flex items-center gap-3 mt-3">
        <SaveButton pending={pending} saved={saved} onClick={save} label="儲存" />
        <button type="button" onClick={del} disabled={pending} className="ml-auto inline-flex items-center gap-1.5 px-3 py-2 text-red-400/70 hover:text-red-400 text-xs transition-colors disabled:opacity-60">
          <Trash2 className="w-3.5 h-3.5" /> 刪除
        </button>
      </div>
    </div>
  )
}

function SaveButton({ pending, saved, onClick, label }: { pending: boolean; saved: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      className="inline-flex items-center gap-1.5 px-4 py-2 bg-temo-gold/90 text-temo-black text-xs font-bold tracking-wider rounded-sm hover:brightness-110 disabled:opacity-60 transition-all"
    >
      {pending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : saved ? <Check className="w-3.5 h-3.5" /> : null}
      {saved ? "已儲存" : label}
    </button>
  )
}
