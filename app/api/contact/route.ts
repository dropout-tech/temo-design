import { createHash } from "node:crypto"
import { NextResponse, type NextRequest } from "next/server"
import { buildContactEmail, CONTACT_TO_EMAIL, contactSubmissionSchema } from "@/lib/contact-submission"
import { createAdminClient } from "@/lib/supabase/admin"

export const runtime = "nodejs"

const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000
const RATE_LIMIT_MAX = 5

type StoredSubmission = {
  id: string
  request_id: string
  name: string | null
  email: string | null
  company: string | null
  phone: string | null
  subject: string | null
  message: string | null
  email_status: string
}

function json(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  })
}

function getClientIp(request: NextRequest) {
  const forwarded =
    request.headers.get("x-vercel-forwarded-for") ??
    request.headers.get("x-forwarded-for") ??
    request.headers.get("x-real-ip")
  return forwarded?.split(",")[0]?.trim() || ""
}

function hashClientIp(request: NextRequest) {
  const ip = getClientIp(request)
  const salt = process.env.CONTACT_FORM_RATE_LIMIT_SALT || process.env.RESEND_API_KEY
  if (!ip || !salt) return null
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex")
}

function trimProviderError(value: unknown) {
  if (typeof value === "string") return value.slice(0, 1000)
  if (value && typeof value === "object" && "message" in value) {
    return String(value.message).slice(0, 1000)
  }
  return "Email provider rejected the request"
}

function storedInput(row: StoredSubmission, website = "") {
  return contactSubmissionSchema.parse({
    requestId: row.request_id,
    name: row.name ?? "",
    email: row.email ?? "",
    company: row.company ?? "",
    phone: row.phone ?? "",
    subject: row.subject ?? "",
    message: row.message ?? "",
    website,
  })
}

export async function POST(request: NextRequest) {
  const contentLength = Number(request.headers.get("content-length") ?? 0)
  if (Number.isFinite(contentLength) && contentLength > 25_000) {
    return json({ error: "表單內容過長，請精簡後再試一次。" }, 413)
  }

  let rawBody: unknown
  try {
    rawBody = await request.json()
  } catch {
    return json({ error: "表單格式不正確，請重新整理後再試一次。" }, 400)
  }

  const parsed = contactSubmissionSchema.safeParse(rawBody)
  if (!parsed.success) {
    return json({ error: "請確認必填欄位、Email 與內容長度是否正確。" }, 400)
  }

  // Silently accept honeypot submissions so automated bots do not adapt.
  if (parsed.data.website) {
    return json({ ok: true })
  }

  let supabase: ReturnType<typeof createAdminClient>
  try {
    supabase = createAdminClient()
  } catch (error) {
    console.error("Contact form Supabase configuration error", error)
    return json({ error: "表單服務暫時無法使用，請直接來信與我們聯絡。" }, 503)
  }

  const selectFields =
    "id, request_id, name, email, company, phone, subject, message, email_status"
  const existingResult = await supabase
    .from("contact_submissions")
    .select(selectFields)
    .eq("request_id", parsed.data.requestId)
    .maybeSingle()

  if (existingResult.error) {
    console.error("Contact form lookup failed", existingResult.error)
    return json({ error: "表單暫時無法送出，請稍後再試。" }, 503)
  }

  let row = existingResult.data as StoredSubmission | null
  if (row?.email_status === "sent") {
    return json({ ok: true })
  }

  const requestIpHash = hashClientIp(request)

  if (!row && requestIpHash) {
    const since = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString()
    const rateResult = await supabase
      .from("contact_submissions")
      .select("id", { count: "exact", head: true })
      .eq("request_ip_hash", requestIpHash)
      .gte("created_at", since)

    if (rateResult.error) {
      console.error("Contact form rate-limit lookup failed", rateResult.error)
      return json({ error: "表單暫時無法送出，請稍後再試。" }, 503)
    }
    if ((rateResult.count ?? 0) >= RATE_LIMIT_MAX) {
      return json({ error: "短時間內送出次數過多，請稍後再試。" }, 429)
    }
  }

  if (!row) {
    const insertResult = await supabase
      .from("contact_submissions")
      .insert({
        request_id: parsed.data.requestId,
        name: parsed.data.name,
        email: parsed.data.email,
        company: parsed.data.company || null,
        phone: parsed.data.phone || null,
        subject: parsed.data.subject,
        message: parsed.data.message,
        email_status: "pending",
        request_ip_hash: requestIpHash,
      })
      .select(selectFields)
      .single()

    if (insertResult.error) {
      // A concurrent retry may have inserted the same request first.
      if (insertResult.error.code === "23505") {
        const retryLookup = await supabase
          .from("contact_submissions")
          .select(selectFields)
          .eq("request_id", parsed.data.requestId)
          .single()
        if (retryLookup.error) {
          console.error("Contact form retry lookup failed", retryLookup.error)
          return json({ error: "表單暫時無法送出，請稍後再試。" }, 503)
        }
        row = retryLookup.data as StoredSubmission
      } else {
        console.error("Contact form insert failed", insertResult.error)
        return json({ error: "表單暫時無法送出，請稍後再試。" }, 503)
      }
    } else {
      row = insertResult.data as StoredSubmission
    }
  }

  if (!row) {
    return json({ error: "表單暫時無法送出，請稍後再試。" }, 503)
  }

  const resendApiKey = process.env.RESEND_API_KEY
  const from = process.env.CONTACT_FROM_EMAIL || "TEMO DESIGN <onboarding@resend.dev>"
  const to = process.env.CONTACT_TO_EMAIL || CONTACT_TO_EMAIL

  if (!resendApiKey) {
    await supabase
      .from("contact_submissions")
      .update({ email_status: "failed", email_error: "Missing RESEND_API_KEY" })
      .eq("id", row.id)
    console.error("Contact form email configuration error: missing RESEND_API_KEY")
    return json(
      { error: "內容已保存，但通知信暫時寄送失敗。請稍後再按一次送出。" },
      503
    )
  }

  let emailInput
  try {
    emailInput = storedInput(row)
  } catch (error) {
    console.error("Stored contact submission is invalid", error)
    await supabase
      .from("contact_submissions")
      .update({ email_status: "failed", email_error: "Stored submission validation failed" })
      .eq("id", row.id)
    return json({ error: "內容已保存，但通知信暫時寄送失敗。" }, 503)
  }

  const email = buildContactEmail(emailInput)
  let providerResponse: Response
  try {
    providerResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": `contact-${row.request_id}`,
      },
      body: JSON.stringify({
        from,
        to: [to],
        reply_to: emailInput.email,
        subject: email.subject,
        text: email.text,
        html: email.html,
      }),
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Email request failed"
    console.error("Contact form email request failed", error)
    await supabase
      .from("contact_submissions")
      .update({ email_status: "failed", email_error: message.slice(0, 1000) })
      .eq("id", row.id)
    return json(
      { error: "內容已保存，但通知信暫時寄送失敗。請稍後再按一次送出。" },
      502
    )
  }

  const providerBody = await providerResponse.json().catch(() => null)
  if (!providerResponse.ok) {
    const providerError = trimProviderError(providerBody)
    console.error("Contact form email provider rejected request", {
      status: providerResponse.status,
      error: providerError,
    })
    await supabase
      .from("contact_submissions")
      .update({ email_status: "failed", email_error: providerError })
      .eq("id", row.id)
    return json(
      { error: "內容已保存，但通知信暫時寄送失敗。請稍後再按一次送出。" },
      502
    )
  }

  const providerId =
    providerBody && typeof providerBody === "object" && "id" in providerBody
      ? String(providerBody.id).slice(0, 255)
      : null
  const updateResult = await supabase
    .from("contact_submissions")
    .update({
      email_status: "sent",
      email_sent_at: new Date().toISOString(),
      email_provider_id: providerId,
      email_error: null,
    })
    .eq("id", row.id)

  if (updateResult.error) {
    console.error("Contact form delivery status update failed", updateResult.error)
    return json(
      { error: "通知信已寄出，但系統尚未完成確認；請再按一次送出。" },
      502
    )
  }

  return json({ ok: true })
}
