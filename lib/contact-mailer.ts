const REQUEST_TIMEOUT_MS = 12_000

export class ContactMailerConfigurationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "ContactMailerConfigurationError"
  }
}

export class ContactMailerDeliveryError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "ContactMailerDeliveryError"
  }
}

export type ContactNotification = {
  requestId: string
  replyTo: string
  subject: string
  text: string
  html: string
}

type AppsScriptResponse = {
  ok?: boolean
  providerId?: string
  error?: string
}

function getAppsScriptConfig() {
  const rawUrl = process.env.GOOGLE_APPS_SCRIPT_WEB_APP_URL?.trim()
  const secret = process.env.CONTACT_MAIL_WEBHOOK_SECRET?.trim()

  if (!rawUrl || !secret) {
    throw new ContactMailerConfigurationError(
      "Missing GOOGLE_APPS_SCRIPT_WEB_APP_URL or CONTACT_MAIL_WEBHOOK_SECRET"
    )
  }

  let url: URL
  try {
    url = new URL(rawUrl)
  } catch {
    throw new ContactMailerConfigurationError("Invalid Google Apps Script Web App URL")
  }

  const isAppsScriptDeployment =
    url.protocol === "https:" &&
    url.hostname === "script.google.com" &&
    /^\/macros\/s\/[^/]+\/exec$/.test(url.pathname)

  if (!isAppsScriptDeployment) {
    throw new ContactMailerConfigurationError(
      "Google Apps Script URL must be an HTTPS /macros/s/.../exec deployment"
    )
  }

  if (secret.length < 32) {
    throw new ContactMailerConfigurationError(
      "CONTACT_MAIL_WEBHOOK_SECRET must contain at least 32 characters"
    )
  }

  return { url: url.toString(), secret }
}

function parseProviderResponse(value: unknown): AppsScriptResponse | null {
  if (!value || typeof value !== "object") return null
  return value as AppsScriptResponse
}

export async function sendContactNotification(input: ContactNotification) {
  const { url, secret } = getAppsScriptConfig()

  let response: Response
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        secret,
        requestId: input.requestId,
        replyTo: input.replyTo,
        subject: input.subject,
        text: input.text,
        html: input.html,
      }),
      cache: "no-store",
      redirect: "follow",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Apps Script request failed"
    throw new ContactMailerDeliveryError(message)
  }

  const rawBody = await response.text()
  let parsed: AppsScriptResponse | null = null
  try {
    parsed = parseProviderResponse(JSON.parse(rawBody))
  } catch {
    parsed = null
  }

  if (!response.ok || !parsed?.ok) {
    const message = parsed?.error || `Apps Script returned HTTP ${response.status}`
    throw new ContactMailerDeliveryError(message.slice(0, 1000))
  }

  return {
    providerId: parsed.providerId?.slice(0, 255) || `apps-script:${input.requestId}`,
  }
}
