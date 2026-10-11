import { parseSubmissionContent } from "@/lib/submission-content"

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

  return (
    <div className="space-y-8">
      {sections.map((section, index) => (
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
        <p className="mt-3 max-w-prose whitespace-pre-wrap text-sm leading-7 text-temo-warm-gray [overflow-wrap:anywhere]">{message}</p>
      </details>
    </div>
  )
}
