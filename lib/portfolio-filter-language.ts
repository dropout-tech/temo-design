export type PortfolioFilterLanguage = "bilingual" | "zh" | "en"

export const PORTFOLIO_FILTER_LANGUAGE_STORAGE_KEY = "temo-portfolio-filter-language"
const PORTFOLIO_FILTER_LANGUAGE_EVENT = "temo:portfolio-filter-language"
let portfolioFilterLanguageMemory: PortfolioFilterLanguage = "en"

export const PORTFOLIO_FILTER_LANGUAGE_OPTIONS: ReadonlyArray<{
  value: PortfolioFilterLanguage
  label: string
  ariaLabel: string
}> = [
  { value: "bilingual", label: "中英", ariaLabel: "中英雙語" },
  { value: "zh", label: "中文", ariaLabel: "中文" },
  { value: "en", label: "EN", ariaLabel: "English" },
]

const FILTER_COPY = {
  displayLanguage: { zh: "顯示", en: "Display" },
  services: { zh: "執行項目", en: "Services" },
  industries: { zh: "行業分類 · 複選", en: "Industries · Multi" },
  clients: { zh: "客戶", en: "Clients" },
  designers: { zh: "設計師", en: "Designers" },
  year: { zh: "年份", en: "Year" },
  all: { zh: "全部", en: "All" },
  allIndustries: { zh: "全部行業", en: "All Industries" },
  allClients: { zh: "全部客戶", en: "All Clients" },
  allDesigners: { zh: "全部設計師", en: "All Designers" },
  allYears: { zh: "全部年份", en: "All Years" },
  clearAll: { zh: "清除全部", en: "Clear All" },
  clickToRemove: { zh: "點選移除", en: "Click to remove" },
} as const

export type PortfolioFilterCopyKey = keyof typeof FILTER_COPY

const CATEGORY_LABELS_EN: Record<string, string> = {
  "brand-planning": "Brand Strategy & Identity",
  "logo-trademark": "Logo & Trademark Design",
  packaging: "Packaging Design",
  "business-card": "Business Card Design",
  menu: "Menu Design",
  poster: "Print & Poster Design",
  storefront: "Storefront Design",
  "web-visual": "Web Visual Design",
  graphic: "Graphic Design",
  exhibition: "Exhibition Design",
  merchandise: "Brand Merchandise",
  "public-art": "Public Art",
  "product-design": "Product Design",
  "crafts-design": "Craft Design",
}

const INDUSTRY_LABELS_EN: Record<string, string> = {
  "ind-daq69s": "Wine & Spirits",
  beauty: "Beauty",
  "food-beverage": "Food & Beverage",
  pet: "Pet",
  "ind-9ba9ax": "Sports",
  tech: "Technology",
  medical: "Medical & Healthcare",
  "ind-alof52": "Government & Public Sector",
  "raw-material": "Raw Materials & Distribution",
  "ind-dj6lf0": "Agriculture, Forestry, Fishery & Livestock",
  "ind-s6a8ly": "Nutrition & Wellness",
  "ind-edaox8": "Entertainment & Arts",
  engineering: "Engineering & Manufacturing",
}

const DESIGNER_LABEL_FALLBACKS: Record<string, { zh: string; en: string }> = {
  elise: { zh: "伊莉絲", en: "ELISE WU" },
  simik: { zh: "林育詩", en: "SIMIK LIN" },
  kevin: { zh: "郭孝淵", en: "KEVIN KUO" },
  shirley: { zh: "雪莉", en: "SHIRLEY LIU" },
  sofia: { zh: "黃丞儀", en: "SOFIA HUANG" },
}

export function isPortfolioFilterLanguage(value: string | null): value is PortfolioFilterLanguage {
  return value === "bilingual" || value === "zh" || value === "en"
}

export function subscribePortfolioFilterLanguage(onChange: () => void) {
  function handleStorage(event: StorageEvent) {
    if (event.key === PORTFOLIO_FILTER_LANGUAGE_STORAGE_KEY) onChange()
  }

  window.addEventListener("storage", handleStorage)
  window.addEventListener(PORTFOLIO_FILTER_LANGUAGE_EVENT, onChange)
  return () => {
    window.removeEventListener("storage", handleStorage)
    window.removeEventListener(PORTFOLIO_FILTER_LANGUAGE_EVENT, onChange)
  }
}

export function getPortfolioFilterLanguageSnapshot(): PortfolioFilterLanguage {
  try {
    const savedLanguage = window.localStorage.getItem(PORTFOLIO_FILTER_LANGUAGE_STORAGE_KEY)
    if (isPortfolioFilterLanguage(savedLanguage)) return savedLanguage
  } catch {
    // 瀏覽器禁用 storage 時改用當前分頁的記憶值。
  }
  return portfolioFilterLanguageMemory
}

export function getPortfolioFilterLanguageServerSnapshot(): PortfolioFilterLanguage {
  return "en"
}

export function setPortfolioFilterLanguage(nextLanguage: PortfolioFilterLanguage) {
  portfolioFilterLanguageMemory = nextLanguage
  try {
    window.localStorage.setItem(PORTFOLIO_FILTER_LANGUAGE_STORAGE_KEY, nextLanguage)
  } catch {
    // 瀏覽器禁用 storage 時，仍可在當前分頁切換。
  }
  window.dispatchEvent(new Event(PORTFOLIO_FILTER_LANGUAGE_EVENT))
}

export function localizePortfolioPair(
  zh: string,
  en: string,
  language: PortfolioFilterLanguage
): string {
  if (language === "zh") return zh
  if (language === "en") return en
  if (zh.trim().toLocaleLowerCase() === en.trim().toLocaleLowerCase()) return zh
  return `${zh} / ${en}`
}

export function portfolioFilterCopy(
  key: PortfolioFilterCopyKey,
  language: PortfolioFilterLanguage
): string {
  const copy = FILTER_COPY[key]
  return localizePortfolioPair(copy.zh, copy.en, language)
}

export function localizePortfolioFacet(
  kind: "category" | "industry",
  value: string,
  zhLabel: string,
  language: PortfolioFilterLanguage
): string {
  const englishLabel = kind === "category" ? CATEGORY_LABELS_EN[value] : INDUSTRY_LABELS_EN[value]
  // 後台可動態新增分類；沒有已確認英譯時保留原名，避免自動猜測專有用語。
  if (!englishLabel) return zhLabel
  return localizePortfolioPair(zhLabel, englishLabel, language)
}

export function getPortfolioDesignerFallback(slug: string): { zh: string; en: string } | undefined {
  return DESIGNER_LABEL_FALLBACKS[slug]
}

export function formatPortfolioOptionCount(
  label: string,
  count: number,
  language: PortfolioFilterLanguage
): string {
  return language === "zh" ? `${label}（${count}）` : `${label} (${count})`
}

export function formatPortfolioResultCount(
  count: number,
  language: PortfolioFilterLanguage
): string {
  const englishLabel = count === 1 ? "Project" : "Projects"
  if (language === "zh") return `${count} 件作品`
  if (language === "en") return `${count} ${englishLabel}`
  return `${count} 件作品 / ${englishLabel}`
}

export function formatPortfolioSelectedCount(
  count: number,
  language: PortfolioFilterLanguage
): string {
  if (language === "zh") return `已選 ${count} 項`
  if (language === "en") return `${count} Selected`
  return `已選 ${count} 項 / ${count} Selected`
}
