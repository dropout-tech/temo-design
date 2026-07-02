"use client"

import { useMemo, useState } from "react"
import { ArrowLeft, ArrowRight, Check, Send, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  type BriefQuestion,
  type BriefSection,
  getApplicableSections,
} from "@/lib/quote-brief-questions"

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

type Answer = string | string[]
type Answers = Record<string, Answer>
type CategoryId = "brand" | "product" | "crafts"

const CATEGORY_OPTIONS: { id: CategoryId; title: string; titleEn: string; desc: string }[] = [
  { id: "brand", title: "品牌設計", titleEn: "BRAND", desc: "LOGO、名片、文宣、菜單、招牌等識別應用" },
  { id: "product", title: "產品包裝", titleEn: "PACKAGE", desc: "包裝設計、刀模結構、產品周邊" },
  { id: "crafts", title: "工藝專案", titleEn: "CRAFTS", desc: "限定商品、藝術裝置、聯名工藝" },
]

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function isAnswered(q: BriefQuestion, value: Answer | undefined) {
  if (q.type === "checkbox") return Array.isArray(value) && value.length > 0
  return typeof value === "string" && value.trim().length > 0
}

function buildBriefText(
  selectedCategories: CategoryId[],
  sections: BriefSection[],
  answers: Answers
) {
  const lines: string[] = []
  lines.push("【設計需求 Brief】")
  lines.push(
    `服務範疇：${selectedCategories
      .map((id) => CATEGORY_OPTIONS.find((c) => c.id === id)?.title)
      .filter(Boolean)
      .join("、")}`
  )
  lines.push("")
  for (const s of sections) {
    if (s.id === "basic") continue // basic info maps to top-level form fields
    const filled = s.questions.filter((q) => isAnswered(q, answers[q.id]))
    if (filled.length === 0) continue
    lines.push(`— ${s.title} ${s.titleEn} —`)
    for (const q of filled) {
      const v = answers[q.id]
      const text = Array.isArray(v) ? v.join("、") : v
      lines.push(`${q.label}：${text}`)
    }
    lines.push("")
  }
  return lines.join("\n")
}

// ─────────────────────────────────────────────
// Field renderer
// ─────────────────────────────────────────────

function Field({
  q,
  value,
  onChange,
  invalid,
}: {
  q: BriefQuestion
  value: Answer | undefined
  onChange: (v: Answer) => void
  invalid: boolean
}) {
  const baseInput =
    "w-full px-4 py-3 bg-white/3 border text-temo-white text-base md:text-sm placeholder:text-white/20 focus:outline-none transition-all rounded-sm"
  const inputCls = cn(
    baseInput,
    invalid
      ? "border-red-400/60 focus:border-red-400"
      : "border-white/10 focus:border-temo-gold/60 focus:bg-white/5"
  )

  return (
    <div>
      <label className="block mb-2">
        <span className="text-sm text-white">
          {q.label}
          {q.required && <span className="text-temo-gold ml-1">*</span>}
        </span>
        {q.hint && (
          <span className="block mt-1 text-[11px] text-temo-warm-gray/60 leading-relaxed">
            {q.hint}
          </span>
        )}
      </label>

      {q.type === "paragraph" ? (
        <textarea
          rows={4}
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={q.placeholder}
          className={cn(inputCls, "resize-none leading-relaxed")}
        />
      ) : q.type === "radio" ? (
        <div className="grid gap-2">
          {q.options?.map((opt) => {
            const checked = value === opt
            return (
              <label
                key={opt}
                className={cn(
                  "flex items-center gap-3 px-3.5 py-3 md:py-2.5 border text-xs cursor-pointer transition-all rounded-sm",
                  checked
                    ? "border-temo-gold/50 bg-temo-gold/5 text-white"
                    : "border-white/10 text-temo-warm-gray hover:border-white/25 hover:text-white"
                )}
              >
                <span
                  className={cn(
                    "w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all",
                    checked ? "border-temo-gold" : "border-white/25"
                  )}
                >
                  {checked && <span className="w-2 h-2 rounded-full bg-temo-gold" />}
                </span>
                <input
                  type="radio"
                  className="sr-only"
                  checked={checked}
                  onChange={() => onChange(opt)}
                />
                <span className="leading-snug">{opt}</span>
              </label>
            )
          })}
        </div>
      ) : q.type === "checkbox" ? (
        <div className="grid sm:grid-cols-2 gap-2">
          {q.options?.map((opt) => {
            const arr = Array.isArray(value) ? value : []
            const checked = arr.includes(opt)
            return (
              <label
                key={opt}
                className={cn(
                  "flex items-start gap-2.5 px-3 py-3 md:py-2 border text-xs cursor-pointer transition-all rounded-sm",
                  checked
                    ? "border-temo-gold/50 bg-temo-gold/5 text-white"
                    : "border-white/10 text-temo-warm-gray hover:border-white/25 hover:text-white"
                )}
              >
                <span
                  className={cn(
                    "mt-[2px] w-3.5 h-3.5 border flex items-center justify-center shrink-0 rounded-[2px] transition-all",
                    checked ? "border-temo-gold bg-temo-gold" : "border-white/25"
                  )}
                >
                  {checked && (
                    <Check className="w-2.5 h-2.5 text-temo-black" strokeWidth={3} />
                  )}
                </span>
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={checked}
                  onChange={() => {
                    if (checked) onChange(arr.filter((v) => v !== opt))
                    else onChange([...arr, opt])
                  }}
                />
                <span className="leading-snug">{opt}</span>
              </label>
            )
          })}
          {q.allowOther && (
            <input
              type="text"
              placeholder="其他（自行填寫）"
              value={(() => {
                const arr = Array.isArray(value) ? value : []
                return arr.find((v) => v.startsWith("其他："))?.replace("其他：", "") ?? ""
              })()}
              onChange={(e) => {
                const arr = Array.isArray(value) ? value : []
                const stripped = arr.filter((v) => !v.startsWith("其他："))
                if (e.target.value.trim()) {
                  onChange([...stripped, `其他：${e.target.value}`])
                } else {
                  onChange(stripped)
                }
              }}
              className={cn(inputCls, "sm:col-span-2 text-base md:text-xs py-2.5 md:py-2 px-3")}
            />
          )}
        </div>
      ) : (
        <input
          type={q.type === "email" ? "email" : q.type === "tel" ? "tel" : "text"}
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={q.placeholder}
          className={inputCls}
        />
      )}
    </div>
  )
}

// ─────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────

export function QuoteBriefForm() {
  const [step, setStep] = useState(0) // step 0 = category picker, then sections, then review
  const [selectedCategories, setSelectedCategories] = useState<CategoryId[]>([])
  const [answers, setAnswers] = useState<Answers>({})
  const [showErrors, setShowErrors] = useState(false)

  const sections = useMemo(
    () => (selectedCategories.length > 0 ? getApplicableSections(selectedCategories) : []),
    [selectedCategories]
  )

  // steps: 0 = picker, 1..sections.length = sections, sections.length+1 = review
  const totalSteps = sections.length + 2
  const isPicker = step === 0
  const isReview = step === totalSteps - 1
  const currentSectionIndex = step - 1
  const currentSection = !isPicker && !isReview ? sections[currentSectionIndex] : null

  function setAnswer(qid: string, value: Answer) {
    setAnswers((prev) => ({ ...prev, [qid]: value }))
  }

  function toggleCategory(id: CategoryId) {
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    )
  }

  function validateCurrent() {
    if (isPicker) return selectedCategories.length > 0
    if (isReview) return true
    return currentSection!.questions.every((q) =>
      !q.required ? true : isAnswered(q, answers[q.id])
    )
  }

  function handleNext() {
    if (!validateCurrent()) {
      setShowErrors(true)
      return
    }
    setShowErrors(false)
    setStep((s) => Math.min(s + 1, totalSteps - 1))
    requestAnimationFrame(() => {
      document
        .getElementById("brief-form-top")
        ?.scrollIntoView({ behavior: "smooth", block: "start" })
    })
  }

  function handlePrev() {
    setShowErrors(false)
    setStep((s) => Math.max(0, s - 1))
  }

  function handleSubmit() {
    const briefText = buildBriefText(selectedCategories, sections, answers)
    const params = new URLSearchParams()
    params.set("name", (answers.name as string) || "")
    params.set("email", (answers.email as string) || "")
    params.set("company", (answers.company as string) || "")
    params.set("phone", (answers.phone as string) || "")
    params.set(
      "subject",
      selectedCategories[0] === "product"
        ? "product"
        : selectedCategories[0] === "crafts"
        ? "crafts"
        : "brand"
    )
    params.set("message", briefText)
    window.location.href = `/contact?${params.toString()}`
  }

  const progress = (step / (totalSteps - 1)) * 100

  // Header text for current step
  const stepTitle = isPicker
    ? "服務範疇"
    : isReview
    ? "確認您的需求"
    : currentSection!.title
  const stepTitleEn = isPicker
    ? "SERVICE SCOPE"
    : isReview
    ? "REVIEW"
    : currentSection!.titleEn
  const stepDesc = isPicker
    ? "請選擇您此次想諮詢的設計範疇 (可複選)"
    : isReview
    ? "請最後確認您填寫的內容，送出後將自動帶到聯絡表單。"
    : currentSection!.description

  return (
    <div className="relative">
      <div id="brief-form-top" className="scroll-mt-32" />

      {/* Header */}
      <div className="mb-8">
        <p className="text-[10px] tracking-[0.4em] text-temo-gold mb-2 uppercase">
          Design Brief · 設計需求問卷
        </p>
        <div className="flex items-baseline gap-3 flex-wrap">
          <h2 className="text-3xl md:text-4xl font-bold text-white">{stepTitle}</h2>
          <span className="text-sm tracking-[0.2em] text-temo-warm-gray/40">{stepTitleEn}</span>
        </div>
        {stepDesc && (
          <p className="text-sm text-temo-warm-gray/70 mt-2 leading-relaxed max-w-2xl">
            {stepDesc}
          </p>
        )}

        {/* Progress */}
        <div className="mt-6 flex items-center gap-3 max-w-3xl">
          <div className="flex-1 h-[2px] bg-white/8 rounded-full overflow-hidden">
            <div
              className="h-full bg-temo-gold transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-[10px] tracking-[0.2em] text-temo-warm-gray/60 tabular-nums whitespace-nowrap">
            {step + 1} / {totalSteps}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-3xl space-y-5 mb-10">
        {isPicker ? (
          <div className="grid sm:grid-cols-3 gap-3">
            {CATEGORY_OPTIONS.map((c) => {
              const checked = selectedCategories.includes(c.id)
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => toggleCategory(c.id)}
                  className={cn(
                    "relative text-left p-5 border transition-all rounded-sm flex flex-col gap-2",
                    checked
                      ? "border-temo-gold bg-temo-gold/5 shadow-[0_0_24px_rgba(205,169,109,0.12)]"
                      : "border-white/10 bg-white/[0.02] hover:border-white/25"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-[10px] tracking-[0.25em] text-temo-warm-gray/60 mb-0.5">
                        {c.titleEn}
                      </p>
                      <p className="text-base font-bold text-white">{c.title}</p>
                    </div>
                    <span
                      className={cn(
                        "mt-1 w-4 h-4 border flex items-center justify-center shrink-0 rounded-[2px] transition-all",
                        checked ? "border-temo-gold bg-temo-gold" : "border-white/25"
                      )}
                    >
                      {checked && (
                        <Check className="w-2.5 h-2.5 text-temo-black" strokeWidth={3} />
                      )}
                    </span>
                  </div>
                  <p className="text-xs text-temo-warm-gray leading-relaxed">{c.desc}</p>
                </button>
              )
            })}
          </div>
        ) : isReview ? (
          <ReviewPanel
            selectedCategories={selectedCategories}
            sections={sections}
            answers={answers}
          />
        ) : (
          currentSection!.questions.map((q) => {
            const invalid = Boolean(
              showErrors && q.required && !isAnswered(q, answers[q.id])
            )
            return (
              <div key={q.id}>
                <Field
                  q={q}
                  value={answers[q.id]}
                  onChange={(v) => setAnswer(q.id, v)}
                  invalid={invalid}
                />
                {invalid && (
                  <p className="mt-1.5 flex items-center gap-1.5 text-[11px] text-red-400/90">
                    <AlertCircle className="w-3 h-3" /> 此題為必填
                  </p>
                )}
              </div>
            )
          })
        )}

        {showErrors && isPicker && selectedCategories.length === 0 && (
          <p className="flex items-center gap-1.5 text-[11px] text-red-400/90">
            <AlertCircle className="w-3 h-3" /> 至少需要選擇一項
          </p>
        )}
      </div>

      {/* Footer actions */}
      <div className="flex items-center justify-between gap-3 max-w-3xl border-t border-white/8 pt-5">
        <button
          type="button"
          onClick={handlePrev}
          disabled={isPicker}
          className={cn(
            "flex items-center gap-1.5 px-4 py-3 text-xs transition-colors",
            isPicker
              ? "text-white/20 cursor-not-allowed"
              : "text-temo-warm-gray hover:text-white"
          )}
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          上一步
        </button>

        {!isReview ? (
          <button
            type="button"
            onClick={handleNext}
            className="flex items-center gap-2 px-6 sm:px-8 py-3.5 bg-temo-gold text-temo-black text-xs font-bold tracking-[0.2em] uppercase hover:brightness-110 active:scale-[0.98] transition-all rounded-sm"
          >
            下一步
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            className="flex items-center gap-2 px-6 sm:px-8 py-3.5 bg-temo-gold text-temo-black text-xs font-bold tracking-[0.2em] uppercase hover:brightness-110 active:scale-[0.98] transition-all rounded-sm"
          >
            送出需求單
            <Send className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// Review panel
// ─────────────────────────────────────────────

function ReviewPanel({
  selectedCategories,
  sections,
  answers,
}: {
  selectedCategories: CategoryId[]
  sections: BriefSection[]
  answers: Answers
}) {
  return (
    <div className="space-y-7">
      <div className="border border-temo-gold/30 bg-temo-gold/5 p-4 rounded-sm">
        <p className="text-[10px] tracking-[0.3em] text-temo-gold uppercase mb-2">
          服務範疇
        </p>
        <p className="text-sm text-white">
          {selectedCategories
            .map((id) => CATEGORY_OPTIONS.find((c) => c.id === id)?.title)
            .filter(Boolean)
            .join("、")}
        </p>
      </div>

      <div className="space-y-5">
        {sections.map((s) => {
          const filled = s.questions.filter((q) => isAnswered(q, answers[q.id]))
          if (filled.length === 0) return null
          return (
            <div key={s.id}>
              <p className="text-[10px] tracking-[0.3em] text-temo-gold uppercase mb-2.5">
                {s.title} · {s.titleEn}
              </p>
              <dl className="space-y-2.5">
                {filled.map((q) => {
                  const v = answers[q.id]
                  const display = Array.isArray(v) ? v.join("、") : v
                  return (
                    <div key={q.id} className="border-l-2 border-white/10 pl-3">
                      <dt className="text-[11px] text-temo-warm-gray/70 mb-0.5">
                        {q.label}
                      </dt>
                      <dd className="text-xs text-white leading-relaxed whitespace-pre-line">
                        {display}
                      </dd>
                    </div>
                  )
                })}
              </dl>
            </div>
          )
        })}
      </div>

      <p className="text-[11px] text-temo-warm-gray/50 leading-relaxed">
        送出後，您填寫的內容會自動帶到「傳送訊息」頁籤的訊息欄位，您可以再次確認後正式發送。
      </p>
    </div>
  )
}
