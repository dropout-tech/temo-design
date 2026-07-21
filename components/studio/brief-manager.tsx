"use client"

import { useState, useTransition } from "react"
import { Loader2, Plus, Trash2, Check, GripVertical } from "lucide-react"
import {
  saveSection,
  deleteSection,
  saveQuestion,
  deleteQuestion,
  reorderBriefSections,
  reorderBriefQuestions,
} from "@/app/studio/(app)/brief/actions"
import { SortableList, type DragHandleProps } from "@/components/studio/sortable-list"

const inputCls =
  "w-full px-3 py-2.5 bg-white/[0.03] border border-white/10 text-temo-white text-sm placeholder:text-white/20 focus:border-temo-gold/60 focus:outline-none transition-all rounded-sm"
const labelCls = "text-[11px] tracking-wider text-temo-warm-gray/60 uppercase"

export type BriefQuestionRow = {
  id: string
  section_id: string
  qid: string
  label: string
  hint: string | null
  type: string
  required: boolean | null
  options: string[] | null
  placeholder: string | null
  allow_other: boolean | null
  sort: number
}

export type BriefSectionRow = {
  id: string
  title: string
  title_en: string | null
  description: string | null
  applies_to: string[] | null
  sort: number
  brief_questions: BriefQuestionRow[]
}

const APPLIES_OPTIONS = [
  { value: "brand", label: "品牌" },
  { value: "product", label: "產品 · 包裝" },
  { value: "crafts", label: "工藝" },
]

const QUESTION_TYPES = [
  { value: "text", label: "單行文字" },
  { value: "email", label: "Email" },
  { value: "tel", label: "電話" },
  { value: "paragraph", label: "多行段落" },
  { value: "radio", label: "單選" },
  { value: "checkbox", label: "複選" },
]

function randomSuffix() {
  return Math.random().toString(36).slice(2, 8)
}

type SectionState = {
  id: string
  title: string
  titleEn: string
  description: string
  appliesTo: string[]
  sort: number
  savedToDb: boolean
}

type QuestionState = {
  key: string
  id?: string
  sectionId: string
  qid: string
  label: string
  hint: string
  type: string
  required: boolean
  optionsText: string // 一行一個選項，方便 textarea 編輯
  placeholder: string
  allowOther: boolean
  sort: number
}

export function BriefManager({ sections }: { sections: BriefSectionRow[] }) {
  const [secs, setSecs] = useState<SectionState[]>(
    sections
      .slice()
      .sort((a, b) => a.sort - b.sort)
      .map((s) => ({
        id: s.id,
        title: s.title,
        titleEn: s.title_en ?? "",
        description: s.description ?? "",
        appliesTo: s.applies_to ?? [],
        sort: s.sort,
        savedToDb: true,
      }))
  )
  const [qs, setQs] = useState<QuestionState[]>(
    sections.flatMap((s) =>
      (s.brief_questions ?? [])
        .slice()
        .sort((a, b) => a.sort - b.sort)
        .map((q) => ({
          key: q.id,
          id: q.id,
          sectionId: s.id,
          qid: q.qid,
          label: q.label,
          hint: q.hint ?? "",
          type: q.type,
          required: !!q.required,
          optionsText: (q.options ?? []).join("\n"),
          placeholder: q.placeholder ?? "",
          allowOther: !!q.allow_other,
          sort: q.sort,
        }))
    )
  )

  const [orderPending, startOrder] = useTransition()

  function addSection() {
    const maxSort = secs.reduce((m, s) => Math.max(m, s.sort), -1)
    setSecs((p) => [
      ...p,
      {
        id: `sec-${randomSuffix()}`,
        title: "",
        titleEn: "",
        description: "",
        appliesTo: [],
        sort: maxSort + 1,
        savedToDb: false,
      },
    ])
  }
  function updateSection(id: string, patch: Partial<SectionState>) {
    setSecs((p) => p.map((s) => (s.id === id ? { ...s, ...patch } : s)))
  }
  function removeSection(id: string) {
    setSecs((p) => p.filter((s) => s.id !== id))
    setQs((p) => p.filter((q) => q.sectionId !== id))
  }

  function addQuestion(sectionId: string) {
    const inSec = qs.filter((q) => q.sectionId === sectionId)
    const maxSort = inSec.reduce((m, q) => Math.max(m, q.sort), -1)
    setQs((p) => [
      ...p,
      {
        key: `new-${randomSuffix()}`,
        sectionId,
        qid: `q-${randomSuffix()}`,
        label: "",
        hint: "",
        type: "text",
        required: false,
        optionsText: "",
        placeholder: "",
        allowOther: false,
        sort: maxSort + 1,
      },
    ])
  }
  function updateQuestion(key: string, patch: Partial<QuestionState>) {
    setQs((p) => p.map((q) => (q.key === key ? { ...q, ...patch } : q)))
  }
  function removeQuestion(key: string) {
    setQs((p) => p.filter((q) => q.key !== key))
  }

  // 區塊排序：陣列順序即顯示順序
  function reorderSectionsLive(next: SectionState[]) {
    setSecs(next)
  }
  function reorderSectionsCommit(next: SectionState[]) {
    setSecs(next)
    const ids = next.filter((s) => s.savedToDb).map((s) => s.id)
    startOrder(async () => {
      await reorderBriefSections(ids)
    })
  }

  // 題目排序：只調整同一區塊內的子集合，其他區塊的題目不受影響
  function reorderQuestionsLive(sectionId: string, nextGroup: QuestionState[]) {
    setQs((prev) => [...prev.filter((q) => q.sectionId !== sectionId), ...nextGroup])
  }
  function reorderQuestionsCommit(sectionId: string, nextGroup: QuestionState[]) {
    reorderQuestionsLive(sectionId, nextGroup)
    const ids = nextGroup.filter((q) => q.id).map((q) => q.id!)
    startOrder(async () => {
      await reorderBriefQuestions(ids)
    })
  }

  return (
    <div className="px-6 md:px-10 py-10 md:py-14 max-w-4xl">
      <div className="mb-8">
        <p className="text-[10px] tracking-[0.5em] text-temo-gold uppercase mb-2">Brief</p>
        <h1 className="text-3xl md:text-4xl font-bold text-temo-white">報價問卷</h1>
        <p className="text-temo-warm-gray/60 text-sm mt-1">
          這裡改的區塊與題目會顯示在「聯絡我們 → 設計需求單」。
        </p>
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold text-temo-white tracking-wide">
          問卷區塊
          <span className="text-temo-warm-gray/50 font-normal ml-2">共 {secs.length} 個</span>
        </h2>
        <div className="flex items-center gap-3">
          {orderPending && (
            <span className="inline-flex items-center gap-1.5 text-[11px] text-temo-warm-gray/50">
              <Loader2 className="w-3 h-3 animate-spin" /> 儲存順序…
            </span>
          )}
          <button
            onClick={addSection}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-temo-gold text-temo-black text-xs font-bold tracking-[0.15em] uppercase rounded-sm hover:brightness-110 transition-all"
          >
            <Plus className="w-4 h-4" /> 新增區塊
          </button>
        </div>
      </div>

      <SortableList
        items={secs}
        getKey={(s) => s.id}
        onReorder={reorderSectionsLive}
        onCommit={reorderSectionsCommit}
        className="space-y-8"
        renderItem={(s, handle) => (
          <SectionCard
            row={s}
            handle={handle}
            questions={qs.filter((q) => q.sectionId === s.id)}
            onChange={(p) => updateSection(s.id, p)}
            onRemove={() => removeSection(s.id)}
            onMarkSaved={() => updateSection(s.id, { savedToDb: true })}
            onAddQuestion={() => addQuestion(s.id)}
            onUpdateQuestion={updateQuestion}
            onRemoveQuestion={removeQuestion}
            onReorderQuestions={(next) => reorderQuestionsLive(s.id, next)}
            onCommitQuestions={(next) => reorderQuestionsCommit(s.id, next)}
          />
        )}
      />
      {secs.length === 0 && (
        <p className="text-temo-warm-gray/50 text-sm py-8 text-center border border-dashed border-white/10 rounded-sm">
          還沒有任何區塊，點「新增區塊」開始。
        </p>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────
// 區塊卡
// ─────────────────────────────────────────────
function SectionCard({
  row,
  handle,
  questions,
  onChange,
  onRemove,
  onMarkSaved,
  onAddQuestion,
  onUpdateQuestion,
  onRemoveQuestion,
  onReorderQuestions,
  onCommitQuestions,
}: {
  row: SectionState
  handle: DragHandleProps
  questions: QuestionState[]
  onChange: (p: Partial<SectionState>) => void
  onRemove: () => void
  onMarkSaved: () => void
  onAddQuestion: () => void
  onUpdateQuestion: (key: string, p: Partial<QuestionState>) => void
  onRemoveQuestion: (key: string) => void
  onReorderQuestions: (next: QuestionState[]) => void
  onCommitQuestions: (next: QuestionState[]) => void
}) {
  const [pending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState("")
  const dirty = (p: Partial<SectionState>) => {
    onChange(p)
    setSaved(false)
  }

  function save() {
    setError("")
    startTransition(async () => {
      const res = await saveSection({
        id: row.id,
        title: row.title,
        title_en: row.titleEn,
        description: row.description,
        applies_to: row.appliesTo.length > 0 ? row.appliesTo : null,
        sort: row.sort,
      })
      if (res.error) setError(res.error)
      else {
        onMarkSaved()
        setSaved(true)
      }
    })
  }
  function del() {
    if (row.savedToDb && !confirm("確定刪除這個區塊？底下的題目也會一併移除。")) return
    startTransition(async () => {
      if (row.savedToDb) {
        const res = await deleteSection(row.id)
        if (res.error) {
          setError(res.error)
          return
        }
      }
      onRemove()
    })
  }

  const allApplies = row.appliesTo.length === 0

  return (
    <div className="rounded-lg border border-temo-gold/20 bg-temo-gold/[0.03] p-4 space-y-3">
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label="拖拉排序區塊"
          className="text-temo-warm-gray/40 hover:text-temo-warm-gray active:cursor-grabbing shrink-0"
          {...handle}
        >
          <GripVertical className="w-4 h-4" />
        </button>
        <p className={labelCls}>區塊設定</p>
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <label className="space-y-1">
          <span className={labelCls}>區塊標題（中）</span>
          <input className={inputCls} value={row.title} onChange={(e) => dirty({ title: e.target.value })} placeholder="例：基本資料" />
        </label>
        <label className="space-y-1">
          <span className={labelCls}>英文標題</span>
          <input className={inputCls} value={row.titleEn} onChange={(e) => dirty({ titleEn: e.target.value })} placeholder="BASIC INFO" />
        </label>
      </div>
      <label className="space-y-1 block">
        <span className={labelCls}>區塊說明</span>
        <textarea
          className={inputCls + " min-h-16 resize-y"}
          value={row.description}
          onChange={(e) => dirty({ description: e.target.value })}
          placeholder="這個區塊會顯示在題目上方的說明文字"
        />
      </label>

      <div className="space-y-1">
        <span className={labelCls}>適用類別</span>
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          <label className="inline-flex items-center gap-2 text-xs text-temo-warm-gray cursor-pointer">
            <input
              type="checkbox"
              className="accent-temo-gold w-4 h-4"
              checked={allApplies}
              onChange={(e) => {
                if (e.target.checked) dirty({ appliesTo: [] })
              }}
            />
            一律顯示
          </label>
          {APPLIES_OPTIONS.map((o) => (
            <label key={o.value} className="inline-flex items-center gap-2 text-xs text-temo-warm-gray cursor-pointer">
              <input
                type="checkbox"
                className="accent-temo-gold w-4 h-4"
                checked={row.appliesTo.includes(o.value)}
                onChange={(e) => {
                  if (e.target.checked) dirty({ appliesTo: [...row.appliesTo, o.value] })
                  else dirty({ appliesTo: row.appliesTo.filter((v) => v !== o.value) })
                }}
              />
              {o.label}
            </label>
          ))}
        </div>
      </div>

      {error && <p className="text-xs text-red-400/90">{error}</p>}
      <div className="flex items-center gap-3">
        <SaveButton pending={pending} saved={saved} onClick={save} label="儲存區塊" />
        <button
          onClick={del}
          disabled={pending}
          className="ml-auto inline-flex items-center gap-1.5 px-3 py-2 text-red-400/70 hover:text-red-400 text-xs transition-colors disabled:opacity-60"
        >
          <Trash2 className="w-3.5 h-3.5" /> 刪除區塊
        </button>
      </div>

      {/* 題目 */}
      <div className="pt-3 mt-1 border-t border-white/10">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-temo-white tracking-wide">
            題目
            <span className="text-temo-warm-gray/50 font-normal ml-2">共 {questions.length} 題</span>
          </h3>
          <button
            onClick={onAddQuestion}
            disabled={!row.savedToDb}
            title={row.savedToDb ? "" : "請先儲存此區塊，才能新增題目"}
            className="inline-flex items-center gap-2 px-3 py-2 bg-white/[0.06] text-temo-white text-xs font-bold tracking-[0.1em] uppercase rounded-sm hover:bg-white/[0.1] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <Plus className="w-3.5 h-3.5" /> 新增題目
          </button>
        </div>
        {!row.savedToDb && (
          <p className="text-[11px] text-temo-gold/70 mb-3">↑ 這個區塊還沒儲存，先按上方「儲存區塊」，才能加題目。</p>
        )}
        <SortableList
          items={questions}
          getKey={(q) => q.key}
          onReorder={onReorderQuestions}
          onCommit={onCommitQuestions}
          className="space-y-3"
          renderItem={(q, qHandle) => (
            <QuestionCard row={q} handle={qHandle} onChange={(p) => onUpdateQuestion(q.key, p)} onRemove={() => onRemoveQuestion(q.key)} />
          )}
        />
        {questions.length === 0 && (
          <p className="text-temo-warm-gray/50 text-xs py-4 text-center border border-dashed border-white/10 rounded-sm">
            這個區塊還沒有題目。
          </p>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// 題目卡
// ─────────────────────────────────────────────
function QuestionCard({
  row,
  handle,
  onChange,
  onRemove,
}: {
  row: QuestionState
  handle: DragHandleProps
  onChange: (p: Partial<QuestionState>) => void
  onRemove: () => void
}) {
  const [pending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState("")
  const dirty = (p: Partial<QuestionState>) => {
    onChange(p)
    setSaved(false)
  }

  function save() {
    setError("")
    startTransition(async () => {
      const res = await saveQuestion(
        {
          section_id: row.sectionId,
          qid: row.qid,
          label: row.label,
          hint: row.hint,
          type: row.type,
          required: row.required,
          options: row.optionsText
            .split("\n")
            .map((s) => s.trim())
            .filter(Boolean),
          placeholder: row.placeholder,
          allow_other: row.allowOther,
          sort: row.sort,
        },
        row.id
      )
      if (res.error) setError(res.error)
      else {
        if (res.id && !row.id) onChange({ id: res.id })
        setSaved(true)
      }
    })
  }
  function del() {
    if (row.id && !confirm("確定刪除這個題目？")) return
    startTransition(async () => {
      if (row.id) {
        const res = await deleteQuestion(row.id)
        if (res.error) {
          setError(res.error)
          return
        }
      }
      onRemove()
    })
  }

  const showOptions = row.type === "radio" || row.type === "checkbox"

  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.02] p-3 space-y-3">
      <button
        type="button"
        aria-label="拖拉排序題目"
        className="text-temo-warm-gray/40 hover:text-temo-warm-gray active:cursor-grabbing"
        {...handle}
      >
        <GripVertical className="w-4 h-4" />
      </button>
      <div className="grid sm:grid-cols-2 gap-3">
        <label className="space-y-1">
          <span className={labelCls}>題目文字</span>
          <input className={inputCls} value={row.label} onChange={(e) => dirty({ label: e.target.value })} placeholder="例：您的 Email" />
        </label>
        <label className="space-y-1">
          <span className={labelCls}>欄位代碼（qid）</span>
          <input className={inputCls} value={row.qid} onChange={(e) => dirty({ qid: e.target.value })} placeholder="email" />
        </label>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <label className="space-y-1 col-span-2 sm:col-span-1">
          <span className={labelCls}>題型</span>
          <select className={inputCls} value={row.type} onChange={(e) => dirty({ type: e.target.value })}>
            {QUESTION_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </label>
        <label className="inline-flex items-center gap-2 text-xs text-temo-warm-gray cursor-pointer self-end pb-2.5">
          <input type="checkbox" className="accent-temo-gold w-4 h-4" checked={row.required} onChange={(e) => dirty({ required: e.target.checked })} />
          必填
        </label>
        <label className="inline-flex items-center gap-2 text-xs text-temo-warm-gray cursor-pointer self-end pb-2.5">
          <input type="checkbox" className="accent-temo-gold w-4 h-4" checked={row.allowOther} onChange={(e) => dirty({ allowOther: e.target.checked })} />
          允許「其他」
        </label>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <label className="space-y-1">
          <span className={labelCls}>提示文字（可空）</span>
          <input className={inputCls} value={row.hint} onChange={(e) => dirty({ hint: e.target.value })} placeholder="會顯示在題目下方的小字說明" />
        </label>
        <label className="space-y-1">
          <span className={labelCls}>佔位文字（可空）</span>
          <input className={inputCls} value={row.placeholder} onChange={(e) => dirty({ placeholder: e.target.value })} placeholder="輸入框內的淡色提示" />
        </label>
      </div>

      {showOptions && (
        <label className="space-y-1 block">
          <span className={labelCls}>選項（一行一個）</span>
          <textarea
            className={inputCls + " min-h-20 resize-y font-mono text-xs leading-relaxed"}
            value={row.optionsText}
            onChange={(e) => dirty({ optionsText: e.target.value })}
            placeholder={"選項一\n選項二\n選項三"}
          />
        </label>
      )}

      {error && <p className="text-xs text-red-400/90">{error}</p>}
      <div className="flex items-center gap-3">
        <SaveButton pending={pending} saved={saved} onClick={save} label="儲存" />
        <button
          onClick={del}
          disabled={pending}
          className="ml-auto inline-flex items-center gap-1.5 px-3 py-2 text-red-400/70 hover:text-red-400 text-xs transition-colors disabled:opacity-60"
        >
          <Trash2 className="w-3.5 h-3.5" /> 刪除
        </button>
      </div>
    </div>
  )
}

function SaveButton({ pending, saved, onClick, label }: { pending: boolean; saved: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      disabled={pending}
      className="inline-flex items-center gap-1.5 px-4 py-2 bg-temo-gold/90 text-temo-black text-xs font-bold tracking-wider rounded-sm hover:brightness-110 disabled:opacity-60 transition-all"
    >
      {pending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : saved ? <Check className="w-3.5 h-3.5" /> : null}
      {saved ? "已儲存" : label}
    </button>
  )
}
