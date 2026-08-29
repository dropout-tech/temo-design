"use client"

import { useMemo, useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowUpRight,
  Check,
  FolderKanban,
  Loader2,
  Pencil,
  Search,
  UsersRound,
  X,
} from "lucide-react"
import { renameCollaborator } from "@/app/studio/(app)/collaborators/actions"
import type { CollaboratorDirectoryEntry } from "@/lib/collaborator-names"

const inputCls =
  "w-full rounded-sm border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm text-temo-white placeholder:text-white/20 transition-all focus:border-temo-gold/60 focus:outline-none"

const KIND_LABELS = {
  "guest-designer": "臨時設計師",
  collaborator: "合作夥伴",
} as const

export function CollaboratorManager({
  initial,
  loadError,
}: {
  initial: CollaboratorDirectoryEntry[]
  loadError?: string
}) {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [draft, setDraft] = useState("")
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")
  const [pending, startTransition] = useTransition()

  const filtered = useMemo(() => {
    const keyword = query.trim().toLocaleLowerCase()
    if (!keyword) return initial
    return initial.filter(
      (entry) =>
        entry.name.toLocaleLowerCase().includes(keyword) ||
        KIND_LABELS[entry.kind].includes(keyword) ||
        entry.usages.some((usage) =>
          usage.title.toLocaleLowerCase().includes(keyword)
        )
    )
  }, [initial, query])

  const totalUsages = initial.reduce((sum, entry) => sum + entry.usages.length, 0)
  const guestDesignerCount = initial.filter((entry) => entry.kind === "guest-designer").length
  const collaboratorCount = initial.filter((entry) => entry.kind === "collaborator").length

  function beginRename(entry: CollaboratorDirectoryEntry) {
    setEditingKey(entry.key)
    setDraft(entry.name)
    setError("")
    setNotice("")
  }

  function cancelRename() {
    setEditingKey(null)
    setDraft("")
    setError("")
  }

  function saveRename(entry: CollaboratorDirectoryEntry) {
    setError("")
    setNotice("")
    startTransition(async () => {
      const result = await renameCollaborator(entry.kind, entry.name, draft)
      if (result.error) {
        setError(result.error)
        return
      }
      setEditingKey(null)
      setDraft("")
      setNotice(`已同步更新 ${result.updatedWorks ?? 0} 件作品`)
      router.refresh()
    })
  }

  return (
    <div className="max-w-5xl px-6 py-10 md:px-10 md:py-14">
      <div className="mb-8">
        <p className="mb-2 text-[10px] uppercase tracking-[0.5em] text-temo-gold">
          Collaborators
        </p>
        <h1 className="text-3xl font-bold text-temo-white md:text-4xl">合作夥伴</h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-temo-warm-gray/60">
          這裡從所有作品自動彙整臨時設計師與其他合作夥伴，不會另外建立人物檔案。兩種類型分開保存，可查看曾參與的作品，或一次改名並同步到同類型的全部作品。
        </p>
      </div>

      <div className="mb-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-white/10 bg-white/[0.025] p-4">
          <p className="text-[10px] uppercase tracking-[0.25em] text-temo-warm-gray/45">全部名稱</p>
          <p className="mt-2 text-2xl font-semibold text-temo-white">{initial.length}</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/[0.025] p-4">
          <p className="text-[10px] uppercase tracking-[0.25em] text-temo-warm-gray/45">臨時設計師</p>
          <p className="mt-2 text-2xl font-semibold text-temo-white">{guestDesignerCount}</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/[0.025] p-4">
          <p className="text-[10px] uppercase tracking-[0.25em] text-temo-warm-gray/45">合作夥伴</p>
          <p className="mt-2 text-2xl font-semibold text-temo-white">{collaboratorCount}</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/[0.025] p-4">
          <p className="text-[10px] uppercase tracking-[0.25em] text-temo-warm-gray/45">作品使用次數</p>
          <p className="mt-2 text-2xl font-semibold text-temo-white">{totalUsages}</p>
        </div>
      </div>

      <div className="mb-6 rounded-lg border border-temo-gold/20 bg-temo-gold/[0.04] p-4 text-xs leading-relaxed text-temo-warm-gray/70">
        改成同類型已存在的名稱時，系統會自動合併同一件作品裡的重複名稱。新增臨時設計師或合作夥伴仍請在作品編輯頁操作。
      </div>

      <div className="relative mb-6">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-temo-warm-gray/35" />
        <input
          className={`${inputCls} pl-10`}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="搜尋名稱、類型或作品名稱"
          aria-label="搜尋合作夥伴"
        />
      </div>

      {(loadError || error || notice) && (
        <div
          className={`mb-5 rounded-md border px-4 py-3 text-sm ${
            loadError || error
              ? "border-red-400/25 bg-red-400/[0.06] text-red-300"
              : "border-temo-gold/25 bg-temo-gold/[0.06] text-temo-gold"
          }`}
          role="status"
        >
          {loadError || error || notice}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-white/15 px-6 py-16 text-center">
          <UsersRound className="mx-auto h-8 w-8 text-temo-warm-gray/25" />
          <p className="mt-4 text-sm text-temo-warm-gray/55">
            {initial.length === 0
              ? "目前還沒有作品使用臨時設計師或合作夥伴名稱。"
              : "找不到符合搜尋條件的名稱。"}
          </p>
          {initial.length === 0 && (
            <Link
              href="/studio/works"
              className="mt-5 inline-flex items-center gap-2 text-xs text-temo-gold hover:brightness-125"
            >
              前往作品管理
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((entry) => {
            const editing = editingKey === entry.key
            const kindLabel = KIND_LABELS[entry.kind]
            return (
              <section
                key={entry.key}
                className="rounded-lg border border-white/10 bg-white/[0.02] p-4 md:p-5"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0 flex-1">
                    {editing ? (
                      <div className="flex max-w-lg items-stretch gap-2">
                        <input
                          autoFocus
                          className={inputCls}
                          value={draft}
                          onChange={(event) => setDraft(event.target.value)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" && !event.nativeEvent.isComposing) {
                              event.preventDefault()
                              saveRename(entry)
                            }
                            if (event.key === "Escape") cancelRename()
                          }}
                          maxLength={100}
                          aria-label={`重新命名 ${entry.name}`}
                        />
                        <button
                          type="button"
                          onClick={() => saveRename(entry)}
                          disabled={pending || !draft.trim()}
                          className="inline-flex min-w-11 items-center justify-center rounded-sm bg-temo-gold px-3 text-temo-black transition-all hover:brightness-110 disabled:opacity-40"
                          aria-label="儲存名稱"
                        >
                          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                        </button>
                        <button
                          type="button"
                          onClick={cancelRename}
                          disabled={pending}
                          className="inline-flex min-w-11 items-center justify-center rounded-sm border border-white/10 text-temo-warm-gray/55 hover:text-temo-white disabled:opacity-40"
                          aria-label="取消重新命名"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-wrap items-center gap-2.5">
                        <h2 className="truncate text-lg font-medium text-temo-white">{entry.name}</h2>
                        <span
                          className={`rounded-full border px-2 py-0.5 text-[10px] ${
                            entry.kind === "guest-designer"
                              ? "border-sky-300/25 text-sky-200/80"
                              : "border-temo-gold/25 text-temo-gold/80"
                          }`}
                        >
                          {kindLabel}
                        </span>
                        <button
                          type="button"
                          onClick={() => beginRename(entry)}
                          className="rounded-sm p-1.5 text-temo-warm-gray/45 transition-colors hover:bg-white/[0.04] hover:text-temo-gold"
                          aria-label={`重新命名${kindLabel} ${entry.name}`}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                    <p className="mt-1 text-xs text-temo-warm-gray/45">
                      使用於 {entry.usages.length} 件作品
                    </p>
                    {entry.variants.length > 1 && (
                      <p className="mt-2 text-[11px] text-temo-warm-gray/40">
                        已合併顯示形式：{entry.variants.join("、")}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-4 divide-y divide-white/[0.06] border-t border-white/[0.06]">
                  {entry.usages.map((usage) => (
                    <div
                      key={usage.workId}
                      className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex min-w-0 items-center gap-2.5">
                        <FolderKanban className="h-4 w-4 shrink-0 text-temo-gold/70" />
                        <span className="truncate text-sm text-temo-warm-gray/80">{usage.title}</span>
                        <span
                          className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] ${
                            usage.published
                              ? "border-temo-gold/25 text-temo-gold/80"
                              : "border-white/10 text-temo-warm-gray/40"
                          }`}
                        >
                          {usage.published ? "上架" : "草稿"}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 pl-6 sm:pl-0">
                        <Link
                          href={`/studio/works/${usage.workId}`}
                          className="text-xs text-temo-warm-gray/55 transition-colors hover:text-temo-gold"
                        >
                          編輯作品
                        </Link>
                        {usage.published && (
                          <a
                            href={`/portfolio/${usage.slug}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-temo-warm-gray/55 transition-colors hover:text-temo-gold"
                          >
                            查看前台
                            <ArrowUpRight className="h-3.5 w-3.5" />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )
          })}
        </div>
      )}
    </div>
  )
}
