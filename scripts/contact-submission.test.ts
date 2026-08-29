import assert from "node:assert/strict"
import { buildContactEmail, contactSubmissionSchema, escapeHtml } from "../lib/contact-submission"

const valid = contactSubmissionSchema.parse({
  requestId: "4ab94fe8-6b77-455d-afc6-6820041b9ed1",
  name: " 王小明 ",
  email: "client@example.com",
  company: "範例公司",
  phone: "0912-345-678",
  subject: "brand",
  message: "第一行\n第二行",
  website: "",
})

assert.equal(valid.name, "王小明")
assert.equal(escapeHtml(`<script>alert("x")</script>`), "&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;")

const email = buildContactEmail(valid)
assert.match(email.subject, /品牌識別設計/)
assert.match(email.text, /第一行\n第二行/)
assert.match(email.html, /white-space:pre-wrap/)
assert.doesNotMatch(email.html, /<script>/)

assert.equal(
  contactSubmissionSchema.safeParse({ ...valid, requestId: "not-a-uuid" }).success,
  false
)
assert.equal(
  contactSubmissionSchema.safeParse({ ...valid, message: "x".repeat(10_001) }).success,
  false
)

console.log("contact-submission: 7 checks passed")
