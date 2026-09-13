import assert from "node:assert/strict"
import { LEGACY_WORK_PATHS, getLegacyWorkSlug, getWorkPublicPath } from "../lib/legacy-work-paths"
import approved from "./fixtures/approved-legacy-works.json"

const rows = Object.entries(LEGACY_WORK_PATHS)
assert.equal(rows.length, 28)
assert.deepEqual(Object.fromEntries(rows), Object.fromEntries(approved.map(r => [r.oldPath.slice(1), r.slug])))
assert.equal(new Set(rows.map(([,slug])=>slug)).size, 28)
for (const [path, slug] of rows) {
  assert.match(path, /^[a-z0-9-]+$/)
  assert.equal(getLegacyWorkSlug(path), slug)
  assert.equal(getWorkPublicPath(slug), `/${path}`)
}
assert.equal(getLegacyWorkSlug("eternite"), "eternite-graphic")
assert.equal(getLegacyWorkSlug("eternite-1"), "eternite")
assert.equal(getLegacyWorkSlug("ruikee-hainanese"), "ruikee-hainanese-rebirth")
assert.equal(getLegacyWorkSlug("167659710ae0db"), "ruikee-hainanese")
assert.equal(getLegacyWorkSlug("x-2"), "kinpo-rice-shochu-gift-box")
assert.equal(getLegacyWorkSlug("project-yulon-2025-vip-green-gift"), "yulon-2025-vip-green-gift")
for (const unknown of ["oriental-beauty", "unknown", "constructor", "__proto__", "about", "studio", "sitemap.xml"]) {
  assert.equal(getLegacyWorkSlug(unknown), undefined)
}
assert.equal(getWorkPublicPath("oriental-beauty"), "/portfolio/oriental-beauty")
assert.equal(getWorkPublicPath("another-work"), "/portfolio/another-work")
assert.equal(getWorkPublicPath("a/b"), "/portfolio/a%2Fb")
console.log("28 exact A-scheme mappings, confusing names, unknown paths and CHAJ exclusion passed")
