import assert from "node:assert/strict"
import { getPortfolioDesignerEnglishLabel } from "../lib/portfolio-designer-label"

assert.equal(
  getPortfolioDesignerEnglishLabel({
    slug: "elise",
    workEnglishName: "ELISE",
    directoryEnglishName: "ELISE WU",
    fallbackName: "伊莉絲",
  }),
  "ELISE"
)

assert.equal(
  getPortfolioDesignerEnglishLabel({
    slug: "kevin",
    directoryEnglishName: "KEVIN",
    fallbackName: "郭孝淵",
  }),
  "KEVIN"
)

assert.equal(
  getPortfolioDesignerEnglishLabel({ slug: "sofia", fallbackName: "黃丞儀" }),
  "SOFIA HUANG"
)

assert.equal(
  getPortfolioDesignerEnglishLabel({ slug: "new-member", fallbackName: "新成員" }),
  "new-member"
)

assert.equal(getPortfolioDesignerEnglishLabel({ slug: "slug-only" }), "slug-only")

console.log("portfolio designer label tests: PASS")
