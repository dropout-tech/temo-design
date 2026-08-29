"use client"

import { useMemo, useState, useTransition } from "react"
import Link from "next/link"
import {
  Building2,
  Check,
  ExternalLink,
  Loader2,
  Pencil,
  Plus,
  Search,
  X,
} from "lucide-react"
import {
  saveClientData,
  type ClientInput,
  type SavedClient,
} from "@/app/studio/(app)/clients/client-data-actions"

export type ClientDataRow = SavedClient & {
  work_count: number
}

const EMPTY_CLIENT: ClientInput = {
  name: "",
  brief: "",
  address: "",
  phone: "",
  website: "",
}

const inputCls =
  "w-full rounded-sm border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-temo-white outline-none transition-colors placeholder:text-temo-warm-gray/25 focus:border-temo-gold/60 focus:bg-white/[0.05]"
const labelCls =
  "mb-2 block text-[11px] uppercase tracking-[0.18em] text-temo-warm-gray/70"

function toInput(client: ClientDataRow): ClientInput {
  return {
    name: client.name,
    brief: client.brief,
    address: client.address,
    phone: client.phone,
    website: client.website,
  }
}

export function ClientDataManager({
  initial,
  initialClientId,
}: {
  initial: ClientDataRow[]
  initialClientId?: string
}) {
  const initialFocusedClient = initial.find((client) => client.id === initialClientId)
  const [clients, setClients] = useState(initial)
  const [query, setQuery] = useState("")
  const [editingId, setEditingId] = useState<string | "new" | null>(
    initialFocusedClient?.id ?? null
  )
  const [draft, setDraft] = useState<ClientInput>(
    initialFocusedClient ? toInput(initialFocusedClient) : EMPTY_CLIENT
  )
  const [error, setError] = useState("")
  const [saved, setSaved] = useState(false)
  const [pending, startTransition] = useTransition()

  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase()
    if (!normalized) return clients
    return clients.filter((client) =>
      [client.name, client.brief, client.address, client.phone, client.website]
        .join(" ")
        .toLocaleLowerCase()
        .includes(normalized)
    )
  }, [clients, query])

  function update<K extends keyof ClientInput>(key: K, value: ClientInput[K]) {
    setDraft((current) => ({ ...current, [key]: value }))
    setSaved(false)
  }

  function editClient(client: ClientDataRow) {
    setEditingId(client.id)
    setDraft(toInput(client))
    setError("")
    setSaved(false)
  }

  function addClient() {
    setEditingId("new")
    setDraft(EMPTY_CLIENT)
    setError("")
    setSaved(false)
  }

  function closeEditor() {
    setEditingId(null)
    setDraft(EMPTY_CLIENT)
    setError("")
    setSaved(false)
  }

  function submit(event: React.FormEvent) {
    event.preventDefault()
    setError("")
    startTransition(async () => {
      const existing = editingId === "new" ? undefined : editingId ?? undefined
      const result = await saveClientData(draft, existing)
      if (result.error || !result.client) {
        setError(result.error ?? "客戶資料儲存失敗，請稍後再試")
        return
      }

      const savedClient = result.client
      setClients((current) => {
        const previous = current.find((client) => client.id === savedClient.id)
        const next: ClientDataRow = {
          ...savedClient,
          work_count: previous?.work_count ?? 0,
        }
        const exists = current.some((client) => client.id === savedClient.id)
        const updated = exists
          ? current.map((client) => (client.id === savedClient.id ? next : client))
          : [...current, next]
        return updated.sort((a, b) => a.name.localeCompare(b.name, "zh-Hant"))
      })
      setEditingId(savedClient.id)
      setDraft({
        name: savedClient.name,
        brief: savedClient.brief,
        address: savedClient.address,
        phone: savedClient.phone,
        website: savedClient.website,
      })
      setSaved(true)
    })
  }

  return (
    <div className="max-w-6xl px-6 py-10 md:px-10 md:py-14">
      <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-temo-white md:text-4xl">客戶資料</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-temo-warm-gray/60">
            這裡是客戶的唯一主檔。新增或編輯後會同步用於關聯作品，並自動出現在「關於我們 → CLIENT 合作客戶」。
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Link
            href="/studio/client-logos"
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-sm border border-white/12 px-4 py-2.5 text-xs text-temo-warm-gray/75 transition-colors hover:border-temo-gold/40 hover:text-temo-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-temo-gold/50"
          >
            <ExternalLink className="h-4 w-4" />
            管理客戶 Logo
          </Link>
          <button
            type="button"
            onClick={addClient}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-sm bg-temo-gold px-5 py-2.5 text-xs font-bold tracking-[0.12em] text-temo-black transition-[filter] hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-temo-gold/60 focus-visible:ring-offset-2 focus-visible:ring-offset-temo-black"
          >
            <Plus className="h-4 w-4" />
            新增客戶
          </button>
        </div>
      </div>

      {editingId && (
        <form
          onSubmit={submit}
          className="mb-8 rounded-lg border border-temo-gold/25 bg-temo-gold/[0.035] p-5 md:p-6"
          aria-labelledby="client-editor-title"
        >
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <h2 id="client-editor-title" className="text-lg font-semibold text-temo-white">
                {editingId === "new" ? "新增客戶" : `編輯 ${draft.name || "客戶資料"}`}
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-temo-warm-gray/50">
                客戶名稱、簡介與官網會用於公開介紹；電話與地址只沿用於目前的關聯作品資訊。儲存後才會更新，留空欄位不顯示。
              </p>
            </div>
            <button
              type="button"
              onClick={closeEditor}
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-sm text-temo-warm-gray/55 transition-colors hover:bg-white/[0.05] hover:text-temo-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-temo-gold/50"
              aria-label="關閉客戶編輯區"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <label>
              <span className={labelCls}>客戶名稱 *</span>
              <input
                className={inputCls}
                value={draft.name}
                onChange={(event) => update("name", event.target.value)}
                maxLength={100}
                autoComplete="organization"
                placeholder="例如：四喜雞煲"
                required
              />
            </label>
            <label>
              <span className={labelCls}>電話</span>
              <input
                className={inputCls}
                type="tel"
                value={draft.phone}
                onChange={(event) => update("phone", event.target.value)}
                maxLength={50}
                placeholder="例如：02-1234-5678"
              />
            </label>
            <label className="md:col-span-2">
              <span className={labelCls}>客戶簡介</span>
              <textarea
                className={`${inputCls} min-h-24 resize-y leading-relaxed`}
                value={draft.brief}
                onChange={(event) => update("brief", event.target.value)}
                maxLength={500}
                placeholder="會用於作品與客戶相關的前台資訊"
              />
            </label>
            <label>
              <span className={labelCls}>地址</span>
              <input
                className={inputCls}
                value={draft.address}
                onChange={(event) => update("address", event.target.value)}
                maxLength={300}
                placeholder="例如：台北市信義區…"
              />
            </label>
            <label>
              <span className={labelCls}>官方網站</span>
              <input
                className={inputCls}
                inputMode="url"
                value={draft.website}
                onChange={(event) => update("website", event.target.value)}
                maxLength={500}
                autoCapitalize="none"
                spellCheck={false}
                placeholder="example.com"
              />
            </label>
          </div>

          {error && (
            <p className="mt-4 break-words text-sm text-red-300" role="alert">
              {error}
            </p>
          )}

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={pending}
              className="inline-flex min-h-11 items-center gap-2 rounded-sm bg-temo-gold px-5 py-2.5 text-xs font-bold tracking-[0.1em] text-temo-black transition-[filter] hover:brightness-110 disabled:cursor-wait disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-temo-gold/60 focus-visible:ring-offset-2 focus-visible:ring-offset-temo-black"
            >
              {pending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : saved ? (
                <Check className="h-4 w-4" />
              ) : null}
              {pending ? "儲存中…" : saved ? "已儲存" : "儲存客戶資料"}
            </button>
            <button
              type="button"
              onClick={closeEditor}
              disabled={pending}
              className="inline-flex min-h-11 items-center px-4 py-2.5 text-xs text-temo-warm-gray/65 transition-colors hover:text-temo-white disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-temo-gold/50"
            >
              取消
            </button>
          </div>
        </form>
      )}

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="relative block w-full sm:max-w-sm">
          <span className="sr-only">搜尋客戶資料</span>
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-temo-warm-gray/40" />
          <input
            className={`${inputCls} min-h-11 pl-10`}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="搜尋名稱、電話、地址或網站"
          />
        </label>
        <p className="text-xs text-temo-warm-gray/45">
          {query.trim() ? `找到 ${filtered.length} 位` : `共 ${clients.length} 位客戶`}
        </p>
      </div>

      <div className="overflow-hidden rounded-lg border border-white/10 bg-white/[0.02]">
        {filtered.map((client) => {
          const contact = [client.phone, client.address, client.website].filter(Boolean)
          return (
            <div
              key={client.id}
              className="flex flex-col gap-4 border-b border-white/[0.06] px-5 py-5 last:border-b-0 md:grid md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_auto] md:items-center md:gap-6"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 shrink-0 text-temo-gold/75" />
                  <h2 className="truncate text-sm font-semibold text-temo-white">{client.name}</h2>
                </div>
                <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-temo-warm-gray/45">
                  {client.brief || "尚未填寫客戶簡介"}
                </p>
              </div>
              <div className="min-w-0 text-xs leading-relaxed text-temo-warm-gray/55">
                {contact.length > 0 ? (
                  contact.map((item) => (
                    <p key={item} className="truncate" title={item}>
                      {item}
                    </p>
                  ))
                ) : (
                  <p className="text-temo-warm-gray/35">尚未填寫聯絡資料</p>
                )}
                <p className="mt-1 text-temo-warm-gray/35">關聯 {client.work_count} 件作品</p>
              </div>
              <button
                type="button"
                onClick={() => editClient(client)}
                className="inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-sm border border-white/10 px-4 py-2 text-xs text-temo-warm-gray/70 transition-colors hover:border-temo-gold/40 hover:text-temo-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-temo-gold/50 md:self-center"
              >
                <Pencil className="h-3.5 w-3.5" />
                編輯
              </button>
            </div>
          )
        })}

        {filtered.length === 0 && (
          <div className="px-5 py-14 text-center">
            <Building2 className="mx-auto h-6 w-6 text-temo-warm-gray/25" />
            <p className="mt-3 text-sm text-temo-warm-gray/50">
              {clients.length === 0 ? "還沒有客戶資料。" : "沒有符合搜尋條件的客戶。"}
            </p>
            {clients.length === 0 && (
              <button
                type="button"
                onClick={addClient}
                className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-sm border border-temo-gold/35 px-4 py-2 text-xs text-temo-gold transition-colors hover:bg-temo-gold/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-temo-gold/50"
              >
                <Plus className="h-4 w-4" />
                新增第一位客戶
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
