import assert from "node:assert/strict"
import type { Work } from "../lib/portfolio-data"
import { isPortfolioDesignerAt, workHasPortfolioDesigner } from "../lib/portfolio-designers"

const work = {
  designerSlugs: ["kevin", "DREAM ONE", "PHOEBE"],
  designerCategories: [
    "DESIGNER 設計團隊",
    "BUSINESS & TECHNOLOGY 企業科技顧問",
    "PHOTOGRAPHER 攝影團隊",
  ],
} as Work

assert.equal(isPortfolioDesignerAt(work, 0), true)
assert.equal(isPortfolioDesignerAt(work, 1), false)
assert.equal(workHasPortfolioDesigner(work, "kevin"), true)
assert.equal(workHasPortfolioDesigner(work, "DREAM ONE"), false)
assert.equal(workHasPortfolioDesigner(work, "PHOEBE"), false)

const demoWork = { designerSlugs: ["elise"] } as Work
assert.equal(
  workHasPortfolioDesigner(demoWork, "elise"),
  true,
  "local fallback works without category metadata should preserve their designer links"
)

console.log("portfolio designer relation tests: PASS")
