// ─────────────────────────────────────────────────────────────────────────────
// /services/[xxx] 四個分類落地頁的設定資料
// 對應 /explore TodayStage 的 01 / 02 / 03 / 04
// 文字直接照設計稿，未來搬到 Payload CMS 時可改成從 CMS 讀
// ─────────────────────────────────────────────────────────────────────────────

import type { CategoryGroupValue } from "./portfolio-data"

export type CategoryLandingCta = {
  label: string
  href: string
}

export type CategoryLanding = {
  slug: string
  num: "01" | "02" | "03" | "04"
  // hero 內容
  titleEn: string[]          // 每個元素一行（含 "&"）
  taglineZh: string          // 用 \n 換行
  taglineEn: string          // 用 \n 換行
  cta?: CategoryLandingCta   // 右下按鈕，可選
  // 下方作品 grid 的預設「執行項目」篩選；"all" = 不預設、顯示全部
  // 註：全站改為「執行項目 + 行業分類」扁平維度後，公共藝術／產品／工藝
  //     暫時對不到單一執行項目，故先設 "all"，之後各分類的清單確定再細分。
  portfolioGroup: "all" | CategoryGroupValue
  // 是否隱藏作品 grid 上方的整組篩選列（執行項目 / 行業分類 / 客戶‧設計師‧年份）。
  // 公共藝術 / 產品設計 / 工藝設計這幾個分類本身就是特定類別，不需再讓使用者篩選。
  hideFilters?: boolean
}

export const CATEGORY_LANDINGS: CategoryLanding[] = [
  {
    slug: "brand-graphic",
    num: "01",
    titleEn: ["BRAND", "&", "GRAPHIC"],
    taglineZh: "品牌是訴說理念的媒介，\n而包裝則是讓您的品牌成為最亮眼那顆星的利器！",
    taglineEn: "A BRAND SPEAKS\nPACKAGING MAKES IT UNFORGETTABLE.",
    cta: { label: "價格試算表單", href: "/contact" },
    portfolioGroup: "all",
  },
  {
    slug: "public-art",
    num: "02",
    titleEn: ["PUBLIC", "ART", "DESIGN"],
    taglineZh: "藝術是情感抽象的表現形式，\n裝置藝術則是為冷豔的社會添加一絲美麗！",
    taglineEn: "Art gives form to unseen emotions\ninstallation art softens a distant world\nwith a trace of beauty.",
    cta: { label: "價格試算表單", href: "/contact" },
    portfolioGroup: "all",
    hideFilters: true,
  },
  {
    slug: "product-design",
    num: "03",
    titleEn: ["PRODUCT", "DESIGN"],
    taglineZh: "我認為設計師並不是一位單純替人發明創造產品的maker，而是另一種形式的醫生，透過觀察生活中的細節來對症下藥，替使用者解決他們的問題！",
    taglineEn: "Not just a maker, but a doctor of design\nhealing problems through observation\nand creation..",
    cta: { label: "價格試算表單", href: "/contact" },
    portfolioGroup: "all",
    hideFilters: true,
  },
  {
    slug: "crafts-design",
    num: "04",
    titleEn: ["CRAFTS", "DESIGN"],
    taglineZh: "人為美而生，提摩為追求工藝之美而設計...\n提摩透過大地之母 - GAIA的靈感與餽贈，進而產下了KAIA 凱婭工藝。專為愛與美人士打造現成工藝產品。",
    taglineEn: "Born for beauty. Crafted by TEMO.\nInspired by GAIA, created as KAIA.\nFor those who live for love and aesthetics.",
    cta: { label: "價格試算表單", href: "/contact" },
    portfolioGroup: "all",
    hideFilters: true,
  },
]

export const CATEGORY_LANDING_MAP: Record<string, CategoryLanding> =
  Object.fromEntries(CATEGORY_LANDINGS.map((c) => [c.slug, c]))
