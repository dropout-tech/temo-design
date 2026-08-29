import Link from "next/link"
import { ChevronLeft, ChevronRight, Inbox, Mail, Phone } from "lucide-react"
import { CONTACT_SUBJECT_LABELS, type ContactSubject } from "@/lib/contact-submission"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"
export const metadata = { title: "表單收件匣 — TEMO Studio" }

const PAGE_SIZE = 30

type SubmissionRow = {
  id: string
  name: string | null
  email: string | null
  company: string | null
  phone: string | null
  subject: string | null
  message: string | null
  created_at: string
  email_status: "pending" | "sent" | "failed" | "unknown"
  email_sent_at: string | null
  email_error: string | null
}

function parsePage(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value
  const page = Number.parseInt(raw ?? "1", 10)
  return Number.isFinite(page) && page > 0 ? page : 1
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("zh-TW", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(value))
}

function subjectLabel(value: string | null) {
  if (value && value in CONTACT_SUBJECT_LABELS) {
    return CONTACT_SUBJECT_LABELS[value as ContactSubject]
  }
  return value || "未分類"
}

const DELIVERY_LABELS = {
  pending: { label: "等待寄信", className: "border-amber-300/25 bg-amber-300/10 text-amber-200" },
  sent: { label: "通知信已寄出", className: "border-emerald-300/25 bg-emerald-300/10 text-emerald-200" },
  failed: { label: "通知信失敗", className: "border-red-300/25 bg-red-300/10 text-red-200" },
  unknown: { label: "舊資料", className: "border-white/15 bg-white/[0.04] text-temo-warm-gray/70" },
} as const

export default async function StudioSubmissionsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string | string[] }>
}) {
  const page = parsePage((await searchParams).page)
  const from = (page - 1) * PAGE_SIZE
  const supabase = await createClient()
  const { data, error, count } = await supabase
    .from("contact_submissions")
    .select(
      "id, name, email, company, phone, subject, message, created_at, email_status, email_sent_at, email_error",
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .range(from, from + PAGE_SIZE - 1)

  const submissions = (data ?? []) as SubmissionRow[]
  const total = count ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <div className="px-5 py-10 md:px-10 md:py-14 max-w-6xl">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] tracking-[0.5em] text-temo-gold uppercase mb-3">Inbox</p>
          <h1 className="text-3xl md:text-4xl font-bold text-temo-white mb-2">表單收件匣</h1>
          <p className="text-sm text-temo-warm-gray/65">
            官網聯絡表單的完整內容，共 {total} 筆，最新資料排在最前面。
          </p>
        </div>
        <div className="inline-flex items-center gap-2 text-xs text-temo-warm-gray/55">
          <Inbox className="h-4 w-4 text-temo-gold" />
          每頁 {PAGE_SIZE} 筆
        </div>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-400/25 bg-red-400/[0.06] p-5 text-sm text-red-200">
          無法讀取表單內容，請確認資料庫 migration 已套用後再重新整理。
        </div>
      ) : submissions.length === 0 ? (
        <div className="rounded-lg border border-dashed border-white/15 bg-white/[0.02] px-5 py-20 text-center">
          <Inbox className="mx-auto mb-4 h-8 w-8 text-temo-warm-gray/25" />
          <p className="text-temo-white">目前還沒有表單資料</p>
          <p className="mt-2 text-sm text-temo-warm-gray/45">訪客送出聯絡表單後，內容會出現在這裡。</p>
        </div>
      ) : (
        <div className="space-y-4">
          {submissions.map((submission) => {
            const delivery = DELIVERY_LABELS[submission.email_status] ?? DELIVERY_LABELS.unknown
            return (
              <details
                key={submission.id}
                className="group rounded-lg border border-white/10 bg-white/[0.025] open:border-temo-gold/25"
              >
                <summary className="cursor-pointer list-none px-4 py-4 sm:px-5 [&::-webkit-details-marker]:hidden">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span className="font-semibold text-temo-white">{submission.name || "未填姓名"}</span>
                        <span className="rounded-full border border-temo-gold/25 bg-temo-gold/[0.07] px-2.5 py-1 text-[10px] text-temo-gold">
                          {subjectLabel(submission.subject)}
                        </span>
                        <span className={`rounded-full border px-2.5 py-1 text-[10px] ${delivery.className}`}>
                          {delivery.label}
                        </span>
                      </div>
                      <p className="mt-1.5 truncate text-xs text-temo-warm-gray/55">
                        {[submission.company, submission.email].filter(Boolean).join(" · ") || "未填聯絡資訊"}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center justify-between gap-4 text-xs text-temo-warm-gray/45 sm:justify-end">
                      <time dateTime={submission.created_at}>{formatDate(submission.created_at)}</time>
                      <span className="text-temo-gold transition-transform group-open:rotate-90">→</span>
                    </div>
                  </div>
                </summary>

                <div className="border-t border-white/[0.07] px-4 py-5 sm:px-5">
                  <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                      <p className="mb-1 text-[10px] tracking-[0.18em] text-temo-warm-gray/40 uppercase">姓名</p>
                      <p className="break-words text-sm text-temo-white">{submission.name || "未填寫"}</p>
                    </div>
                    <div>
                      <p className="mb-1 text-[10px] tracking-[0.18em] text-temo-warm-gray/40 uppercase">公司</p>
                      <p className="break-words text-sm text-temo-white">{submission.company || "未填寫"}</p>
                    </div>
                    <div>
                      <p className="mb-1 text-[10px] tracking-[0.18em] text-temo-warm-gray/40 uppercase">Email</p>
                      {submission.email ? (
                        <a
                          href={`mailto:${submission.email}`}
                          className="inline-flex max-w-full items-center gap-1.5 break-all text-sm text-temo-gold hover:brightness-125"
                        >
                          <Mail className="h-3.5 w-3.5 shrink-0" />
                          {submission.email}
                        </a>
                      ) : (
                        <p className="text-sm text-temo-warm-gray/55">未填寫</p>
                      )}
                    </div>
                    <div>
                      <p className="mb-1 text-[10px] tracking-[0.18em] text-temo-warm-gray/40 uppercase">電話</p>
                      {submission.phone ? (
                        <a
                          href={`tel:${submission.phone}`}
                          className="inline-flex items-center gap-1.5 text-sm text-temo-gold hover:brightness-125"
                        >
                          <Phone className="h-3.5 w-3.5" />
                          {submission.phone}
                        </a>
                      ) : (
                        <p className="text-sm text-temo-warm-gray/55">未填寫</p>
                      )}
                    </div>
                  </div>

                  <div className="mt-6">
                    <p className="mb-2 text-[10px] tracking-[0.18em] text-temo-warm-gray/40 uppercase">訊息內容</p>
                    <div className="whitespace-pre-wrap break-words rounded-md border border-white/[0.07] bg-black/20 p-4 text-sm leading-7 text-temo-warm-gray/85">
                      {submission.message || "未填寫"}
                    </div>
                  </div>

                  {submission.email_status === "failed" && submission.email_error && (
                    <p className="mt-4 break-words rounded-md border border-red-400/15 bg-red-400/[0.04] px-3 py-2 text-xs text-red-200/75">
                      寄信錯誤：{submission.email_error}
                    </p>
                  )}
                  {submission.email_sent_at && (
                    <p className="mt-4 text-xs text-temo-warm-gray/40">
                      通知信寄出時間：{formatDate(submission.email_sent_at)}
                    </p>
                  )}
                </div>
              </details>
            )
          })}
        </div>
      )}

      {totalPages > 1 && (
        <nav className="mt-8 flex items-center justify-between border-t border-white/10 pt-5" aria-label="表單分頁">
          {page > 1 ? (
            <Link
              href={`/studio/submissions?page=${page - 1}`}
              className="inline-flex items-center gap-2 text-sm text-temo-warm-gray/70 hover:text-temo-gold"
            >
              <ChevronLeft className="h-4 w-4" /> 上一頁
            </Link>
          ) : (
            <span />
          )}
          <span className="text-xs text-temo-warm-gray/45">
            第 {Math.min(page, totalPages)} / {totalPages} 頁
          </span>
          {page < totalPages ? (
            <Link
              href={`/studio/submissions?page=${page + 1}`}
              className="inline-flex items-center gap-2 text-sm text-temo-warm-gray/70 hover:text-temo-gold"
            >
              下一頁 <ChevronRight className="h-4 w-4" />
            </Link>
          ) : (
            <span />
          )}
        </nav>
      )}
    </div>
  )
}
