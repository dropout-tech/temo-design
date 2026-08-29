import assert from "node:assert/strict"
import { createHash } from "node:crypto"
import { readFileSync } from "node:fs"
import vm from "node:vm"

const source = readFileSync(
  new URL("../integrations/google-apps-script/contact-mailer.gs", import.meta.url),
  "utf8"
)

const properties = new Map<string, string>([
  ["WEBHOOK_SECRET", "s".repeat(40)],
  ["CONTACT_TO_EMAIL", "temo.design0531@gmail.com"],
])
const sentMessages: Array<Record<string, string>> = []

const context = vm.createContext({
  console: { error() {} },
  ContentService: {
    MimeType: { JSON: "application/json" },
    createTextOutput(content: string) {
      return {
        content,
        setMimeType() {
          return this
        },
      }
    },
  },
  LockService: {
    getScriptLock() {
      return { waitLock() {}, releaseLock() {} }
    },
  },
  MailApp: {
    getRemainingDailyQuota() {
      return 100
    },
    sendEmail(message: Record<string, string>) {
      sentMessages.push(message)
    },
  },
  PropertiesService: {
    getScriptProperties() {
      return {
        getProperty(key: string) {
          return properties.get(key) ?? null
        },
        setProperty(key: string, value: string) {
          properties.set(key, value)
        },
        deleteProperty(key: string) {
          properties.delete(key)
        },
        getProperties() {
          return Object.fromEntries(properties)
        },
      }
    },
  },
  Utilities: {
    DigestAlgorithm: { SHA_256: "SHA_256" },
    computeDigest(_algorithm: string, value: string) {
      return Array.from(createHash("sha256").update(value).digest())
    },
  },
})

new vm.Script(source, { filename: "contact-mailer.gs" }).runInContext(context)

type AppsScriptOutput = { content: string }
type AppsScriptContext = {
  doPost(event: { postData: { contents: string } }): AppsScriptOutput
}

const doPost = (context as unknown as AppsScriptContext).doPost
const validPayload = {
  secret: "s".repeat(40),
  requestId: "4ab94fe8-6b77-455d-afc6-6820041b9ed1",
  replyTo: "client@example.com",
  subject: "TEMO 官網表單",
  text: "Plain body",
  html: "<p>HTML body</p>",
  to: "attacker@example.com",
}

function invoke(payload: Record<string, unknown>) {
  const result = doPost({ postData: { contents: JSON.stringify(payload) } })
  return JSON.parse(result.content) as {
    ok: boolean
    error?: string
    providerId?: string
    deduplicated?: boolean
  }
}

const unauthorized = invoke({ ...validPayload, secret: "wrong" })
assert.equal(unauthorized.ok, false)
assert.equal(sentMessages.length, 0)

const first = invoke(validPayload)
assert.equal(first.ok, true)
assert.equal(first.deduplicated, false)
assert.equal(sentMessages.length, 1)
assert.equal(sentMessages[0]?.to, "temo.design0531@gmail.com")
assert.equal(sentMessages[0]?.replyTo, "client@example.com")
assert.equal(sentMessages[0]?.subject, "TEMO 官網表單")

const duplicate = invoke(validPayload)
assert.equal(duplicate.ok, true)
assert.equal(duplicate.deduplicated, true)
assert.equal(sentMessages.length, 1)

const invalidReplyTo = invoke({
  ...validPayload,
  requestId: "7fbe31bb-1372-413d-b64d-33d0fd39f02e",
  replyTo: "not-an-email",
})
assert.equal(invalidReplyTo.ok, false)
assert.equal(sentMessages.length, 1)

console.log("google-apps-script-contact-mailer: 13 checks passed")
