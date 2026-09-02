import assert from "node:assert/strict"
import test from "node:test"
import { sanitizeRichText } from "../lib/sanitize-rich-text"

test("rich text removes executable content and arbitrary typography styles", () => {
  const clean = sanitizeRichText(`
    <p class="ql-align-center" style="font-size: 99px">
      <span
        class="ql-size-large unwanted"
        style="color: #abcdef; line-height: 4; letter-spacing: 1em; font-weight: 900"
      >Safe</span>
      <script>alert("unsafe")</script>
      <a href="javascript:alert(1)">unsafe link</a>
    </p>
  `)

  assert.match(clean, /class="ql-align-center"/)
  assert.match(clean, /class="ql-size-large"/)
  assert.match(clean, /color:\s*#abcdef/)
  assert.doesNotMatch(clean, /unwanted|script|alert|javascript:/i)
  assert.doesNotMatch(clean, /font-size|line-height|letter-spacing|font-weight/i)
})

test("rich text keeps safe links and applies external-link protections", () => {
  const clean = sanitizeRichText('<a href="https://temo.design/work">作品</a>')

  assert.match(clean, /href="https:\/\/temo\.design\/work"/)
  assert.match(clean, /target="_blank"/)
  assert.match(clean, /rel="noopener noreferrer"/)
})
