import assert from "node:assert/strict"
import { parseSubmissionContent } from "../lib/submission-content"

const answer = "1.庫存管理：缺藥預警\n\n2.Line 自動化推送：節省人工時間"
const message = `【設計需求 Brief】\n服務範疇：品牌設計\n\n— 品牌訴求 BRAND VISION —\n品牌的主要服務或商品內容：${answer}\n希望這個品牌在市場上的角色與定位：創新、方便\n\n— 自訂區塊 CUSTOM —\n自訂題目：保留整段內容\nhttps://example.com/path?a=1\n<script>example</script>`

assert.equal(parseSubmissionContent("一般留言：希望協助設計\n預算：待討論"), null)
assert.equal(parseSubmissionContent(""), null)
const sections = parseSubmissionContent(message)!
assert.equal(sections.length, 3)
assert.equal(sections[1].rows.length, 2)
assert.equal(sections[1].rows[0].answer, answer)
assert.equal(sections[2].rows[0].question, null)
assert.equal(sections[2].rows[0].answer, "自訂題目：保留整段內容\nhttps://example.com/path?a=1\n<script>example</script>")
assert.deepEqual(parseSubmissionContent(message.replaceAll("\n", "\r\n")), sections)
console.log("Submission content: multiline answers, colon boundaries, custom sections and plain messages passed.")
