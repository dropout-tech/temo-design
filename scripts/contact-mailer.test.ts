import assert from "node:assert/strict"
import {
  ContactMailerConfigurationError,
  ContactMailerDeliveryError,
  sendContactNotification,
} from "../lib/contact-mailer"

const originalFetch = globalThis.fetch
const originalUrl = process.env.GOOGLE_APPS_SCRIPT_WEB_APP_URL
const originalSecret = process.env.CONTACT_MAIL_WEBHOOK_SECRET

const input = {
  requestId: "4ab94fe8-6b77-455d-afc6-6820041b9ed1",
  replyTo: "client@example.com",
  subject: "TEMO 官網表單",
  text: "Plain text",
  html: "<p>HTML body</p>",
}

async function main() {
  try {
    delete process.env.GOOGLE_APPS_SCRIPT_WEB_APP_URL
    delete process.env.CONTACT_MAIL_WEBHOOK_SECRET
    await assert.rejects(
      () => sendContactNotification(input),
      ContactMailerConfigurationError
    )

    process.env.GOOGLE_APPS_SCRIPT_WEB_APP_URL = "https://example.com/macros/s/test/exec"
    process.env.CONTACT_MAIL_WEBHOOK_SECRET = "x".repeat(40)
    await assert.rejects(
      () => sendContactNotification(input),
      ContactMailerConfigurationError
    )

    process.env.GOOGLE_APPS_SCRIPT_WEB_APP_URL =
      "https://script.google.com/macros/s/test-deployment/exec"

    let capturedBody: Record<string, unknown> = {}
    globalThis.fetch = (async (_url: string | URL | Request, init?: RequestInit) => {
      capturedBody = JSON.parse(String(init?.body)) as Record<string, unknown>
      return new Response(
        JSON.stringify({ ok: true, providerId: `apps-script:${input.requestId}` }),
        { status: 200 }
      )
    }) as typeof fetch

    const result = await sendContactNotification(input)
    assert.equal(result.providerId, `apps-script:${input.requestId}`)
    assert.equal(capturedBody.requestId, input.requestId)
    assert.equal(capturedBody.replyTo, input.replyTo)
    assert.equal(capturedBody.secret, "x".repeat(40))
    assert.equal("to" in capturedBody, false)

    globalThis.fetch = (async () =>
      new Response(JSON.stringify({ ok: false, error: "Daily quota exhausted" }), {
        status: 200,
      })) as typeof fetch
    await assert.rejects(
      () => sendContactNotification(input),
      ContactMailerDeliveryError
    )
  } finally {
    globalThis.fetch = originalFetch
    if (originalUrl === undefined) delete process.env.GOOGLE_APPS_SCRIPT_WEB_APP_URL
    else process.env.GOOGLE_APPS_SCRIPT_WEB_APP_URL = originalUrl
    if (originalSecret === undefined) delete process.env.CONTACT_MAIL_WEBHOOK_SECRET
    else process.env.CONTACT_MAIL_WEBHOOK_SECRET = originalSecret
  }

  console.log("contact-mailer: 8 checks passed")
}

void main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
