"use client"
// v2 – no framer-motion
import { useState, useMemo } from "react"
import { useInView } from "@/hooks/use-in-view"
import { Check, ChevronDown, ChevronUp, Info, ArrowRight, X } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

// ─────────────────────────────────────────────
// Types & Data
// ─────────────────────────────────────────────

type Addon = { id: string; label: string; price: number }

type Package = {
  id: string
  name: string
  nameEn: string
  basePrice: number
  features: string[]
  recommended?: boolean
  addons?: Addon[]
}

type ServiceCategory = {
  id: string
  title: string
  titleEn: string
  description: string
  icon: string
  packages: Package[]
}

const categories: ServiceCategory[] = [
  {
    id: "brand",
    title: "品牌設計",
    titleEn: "BRAND & GRAPHIC",
    description: "品牌識別、名片、包裝、文宣、店面設計",
    icon: "B",
    packages: [
      {
        id: "brand-basic",
        name: "基礎品牌",
        nameEn: "BASIC",
        basePrice: 30000,
        features: ["LOGO 設計", "品牌色系規範", "基礎名片設計", "電子使用規範"],
      },
      {
        id: "brand-standard",
        name: "標準品牌",
        nameEn: "STANDARD",
        basePrice: 60000,
        recommended: true,
        features: ["LOGO 設計", "完整品牌手冊", "名片 + 信封設計", "社群模板 ×5", "品牌識別規範"],
        addons: [
          { id: "brand-social", label: "社群模板加購 (×5 組)", price: 8000 },
          { id: "brand-menu", label: "菜單 / 型錄設計", price: 12000 },
          { id: "brand-signage", label: "店面招牌設計", price: 15000 },
        ],
      },
      {
        id: "brand-premium",
        name: "頂級品牌",
        nameEn: "PREMIUM",
        basePrice: 120000,
        features: ["完整品牌識別系統", "品牌故事撰寫", "包裝設計 ×3 款", "店面 VI 應用", "品牌手冊 (實體印刷)"],
        addons: [
          { id: "brand-photo", label: "品牌攝影 (半天)", price: 20000 },
          { id: "brand-film", label: "品牌影片 (60 秒)", price: 35000 },
        ],
      },
    ],
  },
  {
    id: "product",
    title: "產品設計",
    titleEn: "PRODUCT DESIGN",
    description: "產品外觀、包裝結構、工業設計",
    icon: "P",
    packages: [
      {
        id: "product-basic",
        name: "單品包裝",
        nameEn: "SINGLE",
        basePrice: 25000,
        features: ["單品包裝設計", "刀模圖提供", "2 版修改次數", "印前確認"],
      },
      {
        id: "product-standard",
        name: "系列包裝",
        nameEn: "SERIES",
        basePrice: 55000,
        recommended: true,
        features: ["系列包裝 ×3 款", "刀模圖提供", "材質選擇建議", "無限修改次數"],
        addons: [
          { id: "product-mock", label: "3D 包裝樣品模擬", price: 8000 },
          { id: "product-photo", label: "產品攝影 (半天)", price: 18000 },
        ],
      },
      {
        id: "product-premium",
        name: "全線產品",
        nameEn: "FULL LINE",
        basePrice: 100000,
        features: ["全系列包裝設計", "品牌故事延伸", "材質打樣協助", "廠商溝通協助"],
        addons: [
          { id: "product-3d", label: "3D 產品建模", price: 25000 },
          { id: "product-video", label: "產品介紹影片", price: 30000 },
        ],
      },
    ],
  },
  {
    id: "crafts",
    title: "工藝設計",
    titleEn: "CRAFTS DESIGN",
    description: "KAIA 工藝品牌、限定商品、藝術裝置",
    icon: "C",
    packages: [
      {
        id: "crafts-collab",
        name: "聯名合作",
        nameEn: "COLLAB",
        basePrice: 40000,
        features: ["設計概念提案", "單件工藝設計", "材質溝通協助", "製作監修"],
      },
      {
        id: "crafts-collection",
        name: "限定系列",
        nameEn: "COLLECTION",
        basePrice: 80000,
        recommended: true,
        features: ["系列設計 ×3 件", "品牌故事創作", "攝影協助", "發布策略建議"],
        addons: [
          { id: "crafts-story", label: "品牌故事影片", price: 28000 },
          { id: "crafts-popup", label: "快閃展覽規劃", price: 45000 },
        ],
      },
      {
        id: "crafts-art",
        name: "藝術裝置",
        nameEn: "ART INSTALLATION",
        basePrice: 150000,
        features: ["概念規劃", "空間設計圖", "材料採購協助", "現場監工"],
        addons: [
          { id: "crafts-doc", label: "紀錄片製作", price: 50000 },
        ],
      },
    ],
  },
]

function formatPrice(price: number) {
  return `NT$\u00a0${price.toLocaleString("zh-TW")}`
}

// ─────────────────────────────────────────────
// PackageCard
// ─────────────────────────────────────────────

function PackageCard({
  pkg,
  selected,
  onSelect,
  selectedAddons,
  onToggleAddon,
}: {
  pkg: Package
  selected: boolean
  onSelect: () => void
  selectedAddons: string[]
  onToggleAddon: (id: string, price: number) => void
}) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div
      className={cn(
        "relative flex flex-col border transition-all duration-300 cursor-pointer rounded-sm",
        selected
          ? "border-temo-gold bg-temo-gold/5 shadow-[0_0_24px_rgba(205,169,109,0.12)]"
          : "border-white/10 bg-[#1e1c19] hover:border-white/25"
      )}
      onClick={onSelect}
    >
      {pkg.recommended && (
        <div className="absolute -top-px left-5 px-3 py-0.5 bg-temo-gold text-temo-black text-[10px] font-bold tracking-[0.2em] uppercase rounded-b-sm">
          推薦
        </div>
      )}

      <div className="p-5 pt-7 flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[10px] tracking-[0.25em] text-temo-warm-gray/60 mb-0.5">{pkg.nameEn}</p>
            <h3 className="text-base font-bold text-white">{pkg.name}</h3>
          </div>
          <div
            className={cn(
              "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all",
              selected ? "border-temo-gold bg-temo-gold" : "border-white/20"
            )}
          >
            {selected && <Check className="w-3 h-3 text-temo-black" strokeWidth={3} />}
          </div>
        </div>

        {/* Price */}
        <div>
          <span className="text-xl font-bold text-temo-gold">{formatPrice(pkg.basePrice)}</span>
          <span className="text-xs text-temo-warm-gray ml-1">起</span>
        </div>

        {/* Features */}
        <ul className="space-y-1.5">
          {pkg.features.map((f) => (
            <li key={f} className="flex items-start gap-2 text-xs text-temo-warm-gray leading-relaxed">
              <span className="w-1 h-1 rounded-full bg-temo-gold shrink-0 mt-1.5" />
              {f}
            </li>
          ))}
        </ul>

        {/* Addons */}
        {pkg.addons && pkg.addons.length > 0 && (
          <div className="border-t border-white/8 pt-3">
            <button
              className="flex items-center gap-1.5 text-[11px] text-temo-warm-gray/70 hover:text-temo-gold transition-colors w-full"
              onClick={(e) => { e.stopPropagation(); setExpanded((v) => !v) }}
            >
              <Info className="w-3 h-3" />
              加購選項
              {expanded ? <ChevronUp className="w-3 h-3 ml-auto" /> : <ChevronDown className="w-3 h-3 ml-auto" />}
            </button>

            <div
              style={{
                maxHeight: expanded ? "400px" : "0",
                opacity: expanded ? 1 : 0,
                transition: "max-height 0.3s ease, opacity 0.2s ease",
                overflow: "hidden",
              }}
            >
              <div className="pt-2.5 space-y-1.5">
                {pkg.addons.map((addon) => {
                  const checked = selectedAddons.includes(addon.id)
                  return (
                    <label
                      key={addon.id}
                      className={cn(
                        "flex items-center justify-between gap-2 px-3 py-2 border text-[11px] cursor-pointer transition-all rounded-sm",
                        checked
                          ? "border-temo-gold/40 bg-temo-gold/5 text-white"
                          : "border-white/8 text-temo-warm-gray hover:border-white/20"
                      )}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          className="accent-temo-gold w-3 h-3 shrink-0"
                          checked={checked}
                          onChange={() => onToggleAddon(addon.id, addon.price)}
                        />
                        <span>{addon.label}</span>
                      </div>
                      <span className="text-temo-gold shrink-0">+{formatPrice(addon.price)}</span>
                    </label>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────

export function QuoteCalculator() {
  const { ref: sectionRef, isInView } = useInView<HTMLElement>({ once: true, amount: 0.08 })
  const [activeCategoryId, setActiveCategoryId] = useState(categories[0].id)
  const [selections, setSelections] = useState<Record<string, { packageId: string; addons: Record<string, number> }>>({})

  const activeCategory = categories.find((c) => c.id === activeCategoryId)!

  function selectPackage(pkg: Package) {
    setSelections((prev) => ({
      ...prev,
      [activeCategoryId]: {
        packageId: pkg.id,
        addons: prev[activeCategoryId]?.packageId === pkg.id ? prev[activeCategoryId].addons : {},
      },
    }))
  }

  function toggleAddon(addonId: string, price: number) {
    setSelections((prev) => {
      const current = prev[activeCategoryId]
      if (!current) return prev
      const addonsCopy = { ...current.addons }
      if (addonsCopy[addonId]) { delete addonsCopy[addonId] }
      else { addonsCopy[addonId] = price }
      return { ...prev, [activeCategoryId]: { ...current, addons: addonsCopy } }
    })
  }

  const summary = useMemo(() => {
    const lines: { category: ServiceCategory; pkg: Package; addonList: { label: string; price: number }[]; subtotal: number }[] = []
    for (const cat of categories) {
      const sel = selections[cat.id]
      if (!sel) continue
      const pkg = cat.packages.find((p) => p.id === sel.packageId)
      if (!pkg) continue
      const addonList = Object.entries(sel.addons).map(([id, price]) => ({
        label: pkg.addons?.find((a) => a.id === id)?.label ?? id,
        price,
      }))
      lines.push({ category: cat, pkg, addonList, subtotal: pkg.basePrice + addonList.reduce((s, a) => s + a.price, 0) })
    }
    return { lines, total: lines.reduce((s, l) => s + l.subtotal, 0) }
  }, [selections])

  const headerFade = {
    transition: "opacity 0.8s ease, transform 0.8s ease",
    opacity: isInView ? 1 : 0,
    transform: isInView ? "translateY(0)" : "translateY(28px)",
  }

  return (
    <section ref={sectionRef} className="relative py-24 md:py-32 bg-[#161412]">
      {/* Subtle grid texture */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{ backgroundImage: "linear-gradient(#b0aca1 1px, transparent 1px), linear-gradient(90deg, #b0aca1 1px, transparent 1px)", backgroundSize: "60px 60px" }}
      />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div style={headerFade} className="mb-14">
          <p className="text-[10px] tracking-[0.5em] text-temo-gold mb-3 uppercase">Estimate</p>
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 text-balance leading-tight">
            即時報價試算
          </h2>
          <p className="text-temo-warm-gray text-sm leading-relaxed max-w-lg">
            選擇您需要的服務套餐，系統即時計算參考報價。最終報價依實際專案調整。
          </p>
        </div>

        <div className="grid lg:grid-cols-[1fr_340px] gap-8 items-start">
          {/* ── LEFT: Selector ── */}
          <div>
            {/* Category Tabs */}
            <div className="flex border-b border-white/10 mb-6 overflow-x-auto">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategoryId(cat.id)}
                  className={cn(
                    "relative px-5 py-3 text-xs font-medium tracking-[0.2em] uppercase whitespace-nowrap transition-all duration-200 border-b-2 -mb-px",
                    activeCategoryId === cat.id
                      ? "border-temo-gold text-temo-gold"
                      : "border-transparent text-temo-warm-gray hover:text-white"
                  )}
                >
                  <span className="hidden sm:inline">{cat.title}</span>
                  <span className="sm:hidden">{cat.icon}</span>
                </button>
              ))}
            </div>

            {/* Description */}
            <p className="text-xs text-temo-warm-gray/60 mb-5 tracking-wide">
              {activeCategory.titleEn} — {activeCategory.description}
            </p>

            {/* Package Cards */}
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {activeCategory.packages.map((pkg) => {
                const sel = selections[activeCategoryId]
                return (
                  <PackageCard
                    key={pkg.id}
                    pkg={pkg}
                    selected={sel?.packageId === pkg.id}
                    onSelect={() => selectPackage(pkg)}
                    selectedAddons={sel?.packageId === pkg.id ? Object.keys(sel.addons) : []}
                    onToggleAddon={toggleAddon}
                  />
                )
              })}
            </div>
          </div>

          {/* ── RIGHT: Summary ── */}
          <div className="lg:sticky lg:top-24 space-y-3">
            <div className="border border-white/10 bg-[#1a1815] rounded-sm overflow-hidden">
              {/* Summary header */}
              <div className="px-5 py-4 border-b border-white/8 flex items-center justify-between">
                <span className="text-[10px] tracking-[0.3em] text-temo-warm-gray uppercase">報價明細</span>
                {summary.lines.length > 0 && (
                  <button
                    onClick={() => setSelections({})}
                    className="flex items-center gap-1 text-[10px] text-temo-warm-gray/50 hover:text-temo-warm-gray transition-colors"
                  >
                    <X className="w-3 h-3" /> 清除
                  </button>
                )}
              </div>

              <div className="px-5 py-4">
                {summary.lines.length === 0 ? (
                  <div className="py-10 text-center">
                    <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center mx-auto mb-3">
                      <Info className="w-4 h-4 text-temo-warm-gray/40" />
                    </div>
                    <p className="text-xs text-temo-warm-gray/40">請從左側選擇服務項目</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {summary.lines.map((line) => (
                      <div key={line.pkg.id} className="pb-3 border-b border-white/8 last:border-0 last:pb-0">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-[10px] text-temo-warm-gray/50">{line.category.title}</p>
                            <p className="text-xs font-medium text-white">{line.pkg.name}</p>
                          </div>
                          <span className="text-xs text-temo-warm-gray">{formatPrice(line.pkg.basePrice)}</span>
                        </div>
                        {line.addonList.map((a) => (
                          <div key={a.label} className="flex justify-between text-[10px] text-temo-warm-gray/50 mt-1 pl-2">
                            <span>+ {a.label}</span>
                            <span>+{formatPrice(a.price)}</span>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                )}

                {/* Total */}
                <div className="mt-4 pt-4 border-t border-white/10">
                  <div className="flex items-baseline justify-between mb-1">
                    <span className="text-[10px] tracking-[0.25em] text-temo-warm-gray/60 uppercase">參考總價</span>
                    <span className="text-2xl font-bold text-temo-gold">
                      {summary.total === 0 ? "—" : formatPrice(summary.total)}
                    </span>
                  </div>
                  <p className="text-[10px] text-temo-warm-gray/40 leading-relaxed">
                    * 實際報價依專案複雜度調整
                  </p>
                </div>

                {/* CTA */}
                <Link
                  href={`/contact?service=${encodeURIComponent(summary.lines.map((l) => l.pkg.name).join(", "))}&budget=${summary.total}`}
                  className={cn(
                    "mt-5 flex items-center justify-center gap-2 w-full py-3 text-xs font-bold tracking-[0.2em] uppercase transition-all rounded-sm",
                    summary.total > 0
                      ? "bg-temo-gold text-temo-black hover:brightness-110"
                      : "bg-white/5 text-white/20 cursor-not-allowed pointer-events-none"
                  )}
                >
                  立即詢價
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Multi-service note */}
            <p className="flex items-start gap-2 text-[10px] text-temo-warm-gray/40 leading-relaxed px-1">
              <Info className="w-3 h-3 shrink-0 mt-0.5" />
              可同時選擇多個服務類別，系統將合計計算。
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
