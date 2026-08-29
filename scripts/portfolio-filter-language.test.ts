import assert from "node:assert/strict"
import {
  formatPortfolioOptionCount,
  formatPortfolioResultCount,
  formatPortfolioSelectedCount,
  getPortfolioDesignerFallback,
  isPortfolioFilterLanguage,
  localizePortfolioFacet,
  localizePortfolioPair,
  normalizePortfolioFilterLanguage,
  portfolioFilterCopy,
} from "../lib/portfolio-filter-language"

assert.equal(localizePortfolioPair("設計師", "Designers", "bilingual"), "設計師 / Designers")
assert.equal(localizePortfolioPair("設計師", "Designers", "zh"), "設計師")
assert.equal(localizePortfolioPair("設計師", "Designers", "en"), "Designers")
assert.equal(localizePortfolioPair("TEMO DESIGN", "TEMO DESIGN", "bilingual"), "TEMO DESIGN")

assert.equal(
  localizePortfolioFacet("category", "brand-planning", "品牌整體策略及識別", "en"),
  "Brand Strategy & Identity"
)
assert.equal(
  localizePortfolioFacet("industry", "ind-daq69s", "酒業", "bilingual"),
  "酒業 / Wine & Spirits"
)
assert.equal(
  localizePortfolioFacet("industry", "future-industry", "未來新增行業", "en"),
  "未來新增行業"
)

assert.deepEqual(getPortfolioDesignerFallback("elise"), { zh: "伊莉絲", en: "ELISE WU" })
assert.equal(
  portfolioFilterCopy("allDesigners", "bilingual"),
  "全部團隊成員 / All Team Members"
)
assert.equal(formatPortfolioOptionCount("All", 18, "en"), "All (18)")
assert.equal(formatPortfolioOptionCount("全部", 18, "zh"), "全部（18）")
assert.equal(formatPortfolioResultCount(1, "en"), "1 Project")
assert.equal(formatPortfolioResultCount(18, "bilingual"), "18 件作品 / Projects")
assert.equal(formatPortfolioSelectedCount(2, "zh"), "已選 2 項")
assert.equal(isPortfolioFilterLanguage("bilingual"), true)
assert.equal(isPortfolioFilterLanguage("zh"), true)
assert.equal(isPortfolioFilterLanguage("en"), true)
assert.equal(isPortfolioFilterLanguage("ja"), false)
assert.equal(normalizePortfolioFilterLanguage("zh"), "zh")
assert.equal(normalizePortfolioFilterLanguage(null), "en")
assert.equal(normalizePortfolioFilterLanguage("invalid"), "en")

console.log("portfolio filter language tests: PASS")
