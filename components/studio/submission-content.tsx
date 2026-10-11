import { submissionPlainText } from "@/lib/brief-snapshot"
import { parseSubmissionContent } from "@/lib/submission-content"

const billingFields = [
  { id: "address", question: "公司地址", label: "公司地址" },
  { id: "taxId", question: "公司統編", label: "統編／填寫的識別資料" },
  { id: "invoice", question: "是否需要開立發票？", label: "開立發票" },
]

export function SubmissionContent({ message }: { message: string | null }) {
  const sections = message ? parseSubmissionContent(message) : null

  if (!sections?.length) {
    return (
      <div className="rounded-md border border-white/10 bg-black/20 px-5 py-6 sm:px-6">
        <p className="max-w-prose whitespace-pre-wrap text-base leading-8 text-temo-white [overflow-wrap:anywhere]">
          {message || "未填寫"}
        </p>
      </div>
    )
  }

  const billingRows = sections.flatMap((section) => section.rows)
  const contentSections = sections.map((section) => ({
    ...section,
    rows: section.rows.filter((row) => !billingFields.some((field) => (row.id ? field.id === row.id : field.question === row.question))),
  })).filter((section) => section.rows.length > 0)

  return (
    <div className="space-y-8">
      <section>
        <h3 className="mb-3 text-base font-semibold text-temo-white">公司與開票資料</h3>
        <dl className="grid overflow-hidden rounded-lg border border-temo-gold/20 bg-temo-gold/[0.04] sm:grid-cols-2">
          {billingFields.map((field, index) => {
            const row = billingRows.find((row) => (row.id ? row.id === field.id : row.question === field.question))
            const answer = row?.answer.trim()
            return (
              <div key={field.question} className={`min-w-0 p-5 ${index === 0 ? "border-b border-temo-gold/15 sm:col-span-2" : index === 1 ? "border-b border-temo-gold/15 sm:border-b-0 sm:border-r" : ""}`}>
                <dt className="mb-2 text-sm text-temo-warm-gray">{field.label}</dt>
                <dd className={`whitespace-pre-wrap text-base leading-7 [overflow-wrap:anywhere] ${answer ? "text-temo-white" : "text-temo-warm-gray"}`}>
                  {answer || (row ? "未填寫" : "紀錄未包含此欄位")}
                </dd>
              </div>
            )
          })}
        </dl>
        {billingFields.some((field) => !billingRows.some((row) => (row.id ? row.id === field.id : row.question === field.question))) && (
          <p className="mt-3 text-sm leading-6 text-temo-warm-gray">部分資料未包含在這筆送出紀錄中；舊版問卷曾漏傳這些欄位，如需使用請向填表人確認。</p>
        )}
      </section>
      {contentSections.map((section, index) => (
        <section key={index}>
          <h3 className="mb-3 text-base font-semibold leading-7 text-temo-gold [overflow-wrap:anywhere]">
            {section.title}
          </h3>
          <dl className="overflow-hidden rounded-md border border-white/10 bg-black/20">
            {section.rows.map((row, rowIndex) => (
              <div key={rowIndex} className="grid border-b border-white/10 last:border-b-0 md:grid-cols-[minmax(0,2fr)_minmax(0,5fr)]">
                {row.question ? (
                  <dt className="bg-white/[0.035] px-5 pb-3 pt-5 text-sm font-medium leading-7 text-temo-warm-gray [overflow-wrap:anywhere] md:border-r md:border-white/10 md:py-5">
                    {row.question}
                  </dt>
                ) : <dt className="sr-only">補充內容</dt>}
                <dd className={`min-w-0 px-5 pb-5 pt-3 text-base leading-8 text-temo-white md:py-5 ${row.question ? "" : "md:col-span-2"}`}>
                  <p className="max-w-prose whitespace-pre-wrap [overflow-wrap:anywhere]">{row.answer.trim() || "未填寫"}</p>
                </dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
      <details className="border-t border-white/10 pt-4">
        <summary className="w-fit cursor-pointer rounded-sm py-2 text-sm text-temo-warm-gray hover:text-temo-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-temo-gold">
          查看原始填寫內容
        </summary>
        <p className="mt-3 max-w-prose whitespace-pre-wrap text-sm leading-7 text-temo-warm-gray [overflow-wrap:anywhere]">{submissionPlainText(message ?? "")}</p>
      </details>
    </div>
  )
}
