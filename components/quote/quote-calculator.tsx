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
  priceNote?: string
  originalPrice?: number
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

// Shared addons available with any bundle (from 提摩官方加價購表)
const bundleAddons: Addon[] = [
  { id: "addon-poster", label: "文宣海報 / A3 菜單 (1 款)", price: 5500 },
  { id: "addon-signage", label: "招牌設計 (1 款)", price: 5000 },
  { id: "addon-package-basic", label: "超值包裝設計 (1 款)", price: 6800 },
  { id: "addon-package-premium", label: "高質感包裝設計 (1 款)", price: 11000 },
  { id: "addon-card-digital", label: "名片數位印刷 (250 張/人)", price: 1200 },
  { id: "addon-card-complex", label: "名片複雜加工數位印刷", price: 3500 },
  { id: "addon-card-letterpress", label: "凸版名片印刷 (200 張/人)", price: 13500 },
]

// Pricing sourced from https://temo.design/price (2026-05 snapshot).
// 範圍價以下限做為計算基準；範圍以 priceNote 標示。
// ⚠️ 這只是「後台讀取失敗時的 fallback 預設值」。正式價目已搬進 Supabase，
//    由 /studio/quote 後台管理；同步的種子資料見 supabase/migrations/0008_quote_pricing.sql。
const DEFAULT_CATEGORIES: ServiceCategory[] = [
  {
    id: "single",
    title: "純享單品",
    titleEn: "PURE DESIGN",
    description: "單一品項設計，依需求挑選",
    icon: "S",
    packages: [
      {
        id: "single-logo",
        name: "LOGO 商標設計",
        nameEn: "LOGO",
        basePrice: 50000,
        features: [
          "協助基本商標名稱檢索",
          "共出 3 款 LOGO 設計 (標準色、標準字、圖形)",
          "三擇一進入細修",
          "一次大幅度修改 (可整個打掉重來，但只再出 2 款)",
          "兩次細修，超過每次加收 1,600 元",
          "完稿後會提供視覺手冊比例規範",
        ],
        recommended: true,
      },
      {
        id: "single-card",
        name: "名片設計 + 數位印刷",
        nameEn: "BUSINESS CARD",
        basePrice: 6800,
        priceNote: "方案一 / 不含印刷 NT$4,800 起",
        features: [
          "協助印刷 (約 200–250 張)",
          "簡單加工：上光、四邊倒圓角",
          "共出 3 款名片設計，三擇一",
          "兩次細修，超過每次加收 350 元",
          "若需多人員，每人加收 400 元",
        ],
      },
      {
        id: "single-graphic",
        name: "文宣 / 菜單設計",
        nameEn: "GRAPHIC",
        basePrice: 6800,
        priceNote: "NT$6,800 ~ 9,800",
        features: [
          "不含印刷",
          "共出 2 款文宣設計，二擇一",
          "一次大幅度修改、一次細修",
          "超過每次加收 800 元",
          "可協助印刷，印刷報價另議",
        ],
      },
      {
        id: "single-visual",
        name: "主視覺設計",
        nameEn: "KEY VISUAL",
        basePrice: 18980,
        priceNote: "NT$18,980 ~ 35,000",
        features: [
          "共出 2 款主視覺，二擇一",
          "一次大幅度修改、一次細修",
          "超過每次加收 1,600 元",
          "適用形象 KV、活動主視覺",
        ],
      },
      {
        id: "single-package",
        name: "超值包裝設計",
        nameEn: "PACKAGE",
        basePrice: 8800,
        priceNote: "NT$8,800 ~ 15,980 (高質感另計)",
        features: [
          "廠商須提供包裝刀模檔",
          "共出 2 款包裝設計，二擇一",
          "一次大幅度修改、一次細修",
          "若需重新設計刀模，須加收結構開發費",
        ],
      },
      {
        id: "single-signage",
        name: "招牌設計",
        nameEn: "SHOP SIGN",
        basePrice: 12800,
        priceNote: "燈箱招牌 NT$5,500 起",
        features: [
          "不含招牌工程",
          "共出 2 款設計，二擇一",
          "可協助模擬 3D",
          "可協助台灣全區招牌工程，工程報價另議",
        ],
      },
      {
        id: "single-consult",
        name: "顧問諮詢",
        nameEn: "CONSULTANT",
        basePrice: 6000,
        features: [
          "每次諮詢服務 1 HR",
          "可協助品牌方向、問題、品牌定位",
          "及創意市場規劃方向探討",
          "委辦顧問會議紀錄為 PDF 一份",
        ],
      },
    ],
  },
  {
    id: "bundle",
    title: "品牌包套",
    titleEn: "BRAND BUNDLE",
    description: "適合創業初期、電商或中小企業的整套品牌方案",
    icon: "B",
    packages: [
      {
        id: "bundle-startup",
        name: "初生之犢創業品牌方案",
        nameEn: "STARTUP",
        basePrice: 57000,
        originalPrice: 72800,
        priceNote: "現省 NT$15,800",
        features: [
          "LOGO、名片、社群背景、初期顧問諮詢",
          "共出 3 款 LOGO 設計、3 款名片設計",
          "共出 2 款社群背景設計 (FB / LINE / 官網 BANNER)",
          "包含初期諮詢 3 次",
          "適合剛創業、電商初創品牌",
        ],
        addons: bundleAddons,
      },
      {
        id: "bundle-mid",
        name: "虎哩旺旺來品牌方案",
        nameEn: "GROWING",
        basePrice: 66800,
        originalPrice: 93200,
        priceNote: "現省 NT$26,400",
        recommended: true,
        features: [
          "LOGO、名片、菜單、DM、廣告圖、社群背景",
          "初期品牌顧問專業陪跑",
          "1 年內品牌專屬諮詢 3 次 (每次 1 HR)",
          "共出 3 款 LOGO、3 款名片、2 款社群背景、2 款 DM 菜單、2 款廣告圖",
          "完稿後提供視覺手冊與規範",
        ],
        addons: bundleAddons,
      },
      {
        id: "bundle-vi",
        name: "尊爵企業品牌 VI 系統",
        nameEn: "ENTERPRISE VI",
        basePrice: 129980,
        originalPrice: 172200,
        priceNote: "現省 NT$42,220",
        features: [
          "完整 VI 品牌識別系統",
          "協助品牌名稱、Slogan、Hashtag 規劃",
          "LOGO ×3 / 名片 ×3 / 工牌 ×3 / 工藝制服 ×2",
          "社群背景 ×2 / DM / 圖騰 / 輔助圖形 ×4",
          "1 年內專屬顧問諮詢 7 次 (每次 1 HR)",
          "完稿後提供完整視覺品牌手冊",
        ],
        addons: bundleAddons,
      },
    ],
  },
  {
    id: "social",
    title: "社群圖文",
    titleEn: "SOCIAL CONTENT",
    description: "穩定產出社群貼文素材，月 / 季 / 年訂閱制",
    icon: "C",
    packages: [
      {
        id: "social-basic-month",
        name: "基礎社群圖文・月付",
        nameEn: "BASIC · MONTHLY",
        basePrice: 6800,
        features: [
          "共出 4 篇單圖文，每篇 2 款二擇一",
          "創意文案撰寫，每篇 1 則",
          "每款圖設計與文案各一次大幅修改",
          "兩次細修，超過每次加收 500 元",
          "加一張內文加收 600 元",
        ],
      },
      {
        id: "social-basic-quarter",
        name: "基礎社群圖文・季付",
        nameEn: "BASIC · QUARTERLY",
        basePrice: 20000,
        originalPrice: 20400,
        priceNote: "三個月一次付清",
        recommended: true,
        features: [
          "共出 14 篇單圖文，每篇 2 款二擇一",
          "每月固定產出 4–5 篇",
          "創意文案撰寫，每篇 1 則",
          "適合穩定經營社群的品牌",
        ],
      },
      {
        id: "social-basic-year",
        name: "基礎社群圖文・年付",
        nameEn: "BASIC · YEARLY",
        basePrice: 68000,
        originalPrice: 81600,
        priceNote: "現省 NT$13,600",
        features: [
          "共出 52 篇單圖文，每篇 2 款二擇一",
          "全年穩定品牌發聲",
          "適合品牌長線經營",
        ],
      },
      {
        id: "social-multi-month",
        name: "多圖社群圖文・月付",
        nameEn: "MULTI · MONTHLY",
        basePrice: 8800,
        features: [
          "共出 4 篇圖文，每篇 1–5 張",
          "創意文案撰寫，每篇 1 則",
          "適合敘事型品牌內容",
        ],
      },
      {
        id: "social-multi-quarter",
        name: "多圖社群圖文・季付",
        nameEn: "MULTI · QUARTERLY",
        basePrice: 24000,
        originalPrice: 30800,
        priceNote: "現省 NT$6,800",
        features: [
          "共出 14 篇多圖圖文，每篇 1–5 張",
          "每月固定產出多圖貼文",
        ],
      },
      {
        id: "social-multi-year",
        name: "多圖社群圖文・年付",
        nameEn: "MULTI · YEARLY",
        basePrice: 88000,
        originalPrice: 114400,
        priceNote: "現省 NT$26,400",
        recommended: true,
        features: [
          "共出 52 篇多圖圖文",
          "全年穩定深度品牌敘事",
          "適合品牌故事感經營",
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
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-xl font-bold text-temo-gold">{formatPrice(pkg.basePrice)}</span>
            {pkg.originalPrice && (
              <span className="text-xs text-temo-warm-gray/40 line-through">
                {formatPrice(pkg.originalPrice)}
              </span>
            )}
            <span className="text-xs text-temo-warm-gray">起</span>
          </div>
          {pkg.priceNote && (
            <p className="mt-1 text-[10px] text-temo-warm-gray/60 leading-relaxed">
              {pkg.priceNote}
            </p>
          )}
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
                        "flex items-center justify-between gap-2 px-3 py-2.5 md:py-2 border text-[11px] cursor-pointer transition-all rounded-sm",
                        checked
                          ? "border-temo-gold/40 bg-temo-gold/5 text-white"
                          : "border-white/8 text-temo-warm-gray hover:border-white/20"
                      )}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          className="accent-temo-gold w-4 h-4 shrink-0"
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

export function QuoteCalculator({
  categories = DEFAULT_CATEGORIES,
}: {
  categories?: ServiceCategory[]
}) {
  const { ref: sectionRef, isInView } = useInView<HTMLElement>({ once: true, amount: 0.08 })
  const safeCategories = categories.length > 0 ? categories : DEFAULT_CATEGORIES
  const [activeCategoryId, setActiveCategoryId] = useState(safeCategories[0].id)
  const [selections, setSelections] = useState<Record<string, { packageId: string; addons: Record<string, number> }>>({})

  const activeCategory = safeCategories.find((c) => c.id === activeCategoryId) ?? safeCategories[0]

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
    for (const cat of safeCategories) {
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
  }, [selections, safeCategories])

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
            依提摩設計官方價目表，挑選您需要的服務即可估算參考總價。實際報價會依專案複雜度、印刷量、加工項目等微調。
          </p>
        </div>

        <div className="grid lg:grid-cols-[1fr_340px] gap-8 items-start">
          {/* ── LEFT: Selector ── */}
          <div>
            {/* Category Tabs */}
            <div className="flex border-b border-white/10 mb-6 overflow-x-auto">
              {safeCategories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategoryId(cat.id)}
                  className={cn(
                    "relative px-4 sm:px-5 py-3.5 sm:py-3 text-xs font-medium tracking-[0.1em] sm:tracking-[0.2em] uppercase whitespace-nowrap transition-all duration-200 border-b-2 -mb-px",
                    activeCategoryId === cat.id
                      ? "border-temo-gold text-temo-gold"
                      : "border-transparent text-temo-warm-gray hover:text-white"
                  )}
                >
                  <span className="hidden sm:inline">{cat.title}</span>
                  <span className="sm:hidden">{cat.icon} {cat.title}</span>
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

      {/* 手機版固定底欄：即時總價 + 詢價 CTA（桌機由右側 sticky 面板負責） */}
      {summary.total > 0 && (
        <div className="lg:hidden fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[#141210]/95 backdrop-blur-md px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[10px] tracking-[0.25em] text-temo-warm-gray/60 uppercase">參考總價</p>
              <p className="text-xl font-bold text-temo-gold leading-tight">{formatPrice(summary.total)}</p>
            </div>
            <Link
              href={`/contact?service=${encodeURIComponent(summary.lines.map((l) => l.pkg.name).join(", "))}&budget=${summary.total}`}
              className="flex items-center justify-center gap-2 px-7 py-3.5 bg-temo-gold text-temo-black text-xs font-bold tracking-[0.2em] uppercase rounded-sm active:scale-[0.98] transition-all"
            >
              立即詢價
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}

    </section>
  )
}
