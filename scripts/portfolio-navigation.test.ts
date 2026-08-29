import assert from "node:assert/strict"
import {
  buildWorksLandingHref,
  findWorksLandingSlug,
} from "../lib/portfolio-navigation"

const categoryGroups = [
  { value: "logo-trademark", landingSlug: "brand-graphic" },
  { value: "product-design", landingSlug: "product-design" },
  { value: "unassigned", landingSlug: null },
]

assert.equal(
  findWorksLandingSlug(["logo-trademark", "product-design"], categoryGroups),
  "brand-graphic"
)
assert.equal(findWorksLandingSlug(["unassigned"], categoryGroups), undefined)
assert.equal(findWorksLandingSlug(["crafts-design"], []), "crafts-design")
assert.equal(buildWorksLandingHref(undefined, { client: "temo" }), "/explore")
assert.equal(
  buildWorksLandingHref("brand-graphic", { client: "AsoBé & Co." }),
  "/services/brand-graphic?client=AsoB%C3%A9+%26+Co.#works"
)
assert.equal(
  buildWorksLandingHref("product-design", { group: "product-design", query: "工藝" }),
  "/services/product-design?group=product-design&q=%E5%B7%A5%E8%97%9D#works"
)

console.log("portfolio navigation tests: PASS")
