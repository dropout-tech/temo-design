import assert from "node:assert/strict"
import {
  getVisibleDesignerSocialLinks,
  getVisibleDesignerSocialUrl,
} from "../lib/designer-social-links"

assert.equal(
  getVisibleDesignerSocialUrl(" https://threads.net/@temo ", true),
  "https://threads.net/@temo",
  "visible http(s) URLs should be trimmed and returned"
)
assert.equal(
  getVisibleDesignerSocialUrl("https://instagram.com/temo", false),
  undefined,
  "disabled links must not enter the public payload"
)
assert.equal(
  getVisibleDesignerSocialUrl("https://facebook.com/temo", null),
  undefined,
  "missing visibility state should fail closed"
)
assert.equal(
  getVisibleDesignerSocialUrl("javascript:alert(1)", true),
  undefined,
  "unsafe protocols must be rejected"
)
assert.equal(
  getVisibleDesignerSocialUrl("not a URL", true),
  undefined,
  "invalid URLs must be rejected"
)

assert.deepEqual(
  getVisibleDesignerSocialLinks({
    instagram: "https://instagram.com/temo",
    facebook: "https://facebook.com/temo",
    line_url: "https://lin.ee/temo",
    threads_url: "https://threads.net/@temo",
    website: "https://temo.example",
    show_instagram: true,
    show_facebook: false,
    show_line: true,
    show_threads: false,
    show_website: true,
  }),
  {
    instagram: "https://instagram.com/temo",
    facebook: undefined,
    lineUrl: "https://lin.ee/temo",
    threadsUrl: undefined,
    website: "https://temo.example",
  },
  "each database field should map to its matching public visibility flag"
)

console.log("designer social link visibility tests: 6/6 passed")
