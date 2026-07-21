"use client"

import { useState, useTransition } from "react"
import { Loader2, Plus, Trash2, Check, GripVertical } from "lucide-react"
import { saveNavLink, deleteNavLink, reorderNavLinks } from "@/app/studio/(app)/navigation/actions"
import { SortableList, type DragHandleProps } from "@/components/studio/sortable-list"

const inputCls =
  "w-full px-3 py-2.5 bg-white/[0.03] border border-white/10 text-temo-white text-sm placeholder:text-white/20 focus:border-temo-gold/60 focus:outline-none transition-all rounded-sm"
const labelCls = "text-[11px] tracking-wider text-temo-warm-gray/60 uppercase"

type NavLinkRow = {
  id: string | null
  location: string
  href: string
  label: string
  label_en: string | null
  sort: number
}

type ClientRow = NavLinkRow & { key: string }

function randomKey() {
  return Math.random().toString(36).slice(2, 10)
}

const SECTIONS: {
  location: string
  title: string
  desc: string
  labelEnHint: string
}[] = [
  {
    location: "header",
    title: "頂部導覽（header）",
    desc: "桌機右上角，英文大字＋中文小字",
    labelEnHint: "必填",
  },
  {
    location: "menu",
    title: "漢堡選單（menu）",
    desc: "點右上選單鈕跳出的全螢幕選單",
    labelEnHint: "必填",
  },
  {
    location: "footer",
    title: "頁尾快速連結（footer）",
    desc: "頁面最底部，只顯示中文",
    labelEnHint: "可留空",
  },
]

export function NavigationManager({ links }: { links: NavLinkRow[] }) {
  const [rows, setRows] = useState<ClientRow[]>(
    links.map((l) => ({ ...l, key: l.id ?? randomKey() }))
  )
  const [orderPending, startOrder] = useTransition()

  function addRow(location: string) {
    const maxSort = rows
      .filter((r) => r.location === location)
      .reduce((m, r) => Math.max(m, r.sort), -1)
    setRows((p) => [
      ...p,
      { key: randomKey(), id: null, location, href: "", label: "", label_en: "", sort: maxSort + 1 },
    ])
  }
  function updateRow(key: string, patch: Partial<ClientRow>) {
    setRows((p) => p.map((r) => (r.key === key ? { ...r, ...patch } : r)))
  }
  function removeRow(key: string) {
    setRows((p) => p.filter((r) => r.key !== key))
  }
  function setId(key: string, id: string) {
    setRows((p) => p.map((r) => (r.key === key ? { ...r, id } : r)))
  }

  // 依 SECTIONS 順序 + 某一組（header/menu/footer）的新成員順序，重建整份 rows（含未變的組）
  function rebuildRows(location: string, nextGroup: ClientRow[]): ClientRow[] {
    const next: ClientRow[] = []
    for (const s of SECTIONS) {
      next.push(...(s.location === location ? nextGroup : rows.filter((r) => r.location === s.location)))
    }
    return next
  }

  function reorderSectionLive(location: string, nextGroup: ClientRow[]) {
    setRows(rebuildRows(location, nextGroup))
  }

  function reorderSectionCommit(location: string, nextGroup: ClientRow[]) {
    const next = rebuildRows(location, nextGroup)
    setRows(next)
    const ids = next.filter((r) => r.location === location && r.id).map((r) => r.id!)
    startOrder(async () => {
      await reorderNavLinks(ids)
    })
  }

  return (
    <div className="px-6 md:px-10 py-10 md:py-14 max-w-4xl">
      <div className="mb-8">
        <p className="text-[10px] tracking-[0.5em] text-temo-gold uppercase mb-2">Navigation</p>
        <h1 className="text-3xl md:text-4xl font-bold text-temo-white">選單 / 頁尾連結</h1>
        <p className="text-temo-warm-gray/60 text-sm mt-1">
          改這裡會同步到全站頂部導覽、漢堡選單與頁尾。每組可用<span className="text-temo-warm-gray/80"> ⠿ 把手拖拉排序</span>。
        </p>
        {orderPending && (
          <span className="inline-flex items-center gap-1.5 text-[11px] text-temo-warm-gray/50 mt-2">
            <Loader2 className="w-3 h-3 animate-spin" /> 儲存順序…
          </span>
        )}
      </div>

      {SECTIONS.map((section, idx) => {
        const sectionRows = rows.filter((r) => r.location === section.location)
        return (
          <div
            key={section.location}
            className={idx === 0 ? "" : "mt-14 pt-8 border-t border-white/10"}
          >
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-sm font-bold text-temo-white tracking-wide">
                {section.title}
                <span className="text-temo-warm-gray/50 font-normal ml-2">
                  共 {sectionRows.length} 項
                </span>
              </h2>
              <button
                onClick={() => addRow(section.location)}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-temo-gold text-temo-black text-xs font-bold tracking-[0.15em] uppercase rounded-sm hover:brightness-110 transition-all"
              >
                <Plus className="w-4 h-4" /> 新增
              </button>
            </div>
            <p className="text-temo-warm-gray/50 text-xs mb-3">{section.desc}</p>
            <SortableList
              items={sectionRows}
              getKey={(r) => r.key}
              onReorder={(next) => reorderSectionLive(section.location, next)}
              onCommit={(next) => reorderSectionCommit(section.location, next)}
              className="space-y-3"
              renderItem={(row, handle) => (
                <NavLinkCard
                  row={row}
                  handle={handle}
                  labelEnHint={section.labelEnHint}
                  onChange={(p) => updateRow(row.key, p)}
                  onRemove={() => removeRow(row.key)}
                  onSaved={(id) => setId(row.key, id)}
                />
              )}
            />
            <div className="space-y-3">
              {sectionRows.length === 0 && (
                <p className="text-temo-warm-gray/50 text-sm py-6 text-center border border-dashed border-white/10 rounded-sm">
                  還沒有任何連結，點「新增」開始。
                </p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─────────────────────────────────────────────
// 單列連結卡（header / menu / footer 共用）
// ─────────────────────────────────────────────
function NavLinkCard({
  row,
  handle,
  labelEnHint,
  onChange,
  onRemove,
  onSaved,
}: {
  row: ClientRow
  handle: DragHandleProps
  labelEnHint: string
  onChange: (p: Partial<ClientRow>) => void
  onRemove: () => void
  onSaved: (id: string) => void
}) {
  const [pending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState("")
  const dirty = (p: Partial<ClientRow>) => {
    onChange(p)
    setSaved(false)
  }

  function handleSave() {
    setError("")
    startTransition(async () => {
      const res = await saveNavLink(
        {
          location: row.location,
          href: row.href,
          label: row.label,
          label_en: row.label_en ?? "",
          sort: row.sort,
        },
        row.id ?? undefined
      )
      if (res.error) {
        setError(res.error)
        return
      }
      if (res.id && !row.id) onSaved(res.id)
      setSaved(true)
    })
  }

  function handleDelete() {
    if (!confirm("確定刪除這個連結？")) return
    if (!row.id) {
      onRemove()
      return
    }
    startTransition(async () => {
      const res = await deleteNavLink(row.id as string)
      if (res.error) {
        setError(res.error)
        return
      }
      onRemove()
    })
  }

  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.02] p-3">
      <div className="flex flex-wrap items-end gap-3">
        <button
          type="button"
          aria-label="拖拉排序"
          className="text-temo-warm-gray/40 hover:text-temo-warm-gray active:cursor-grabbing shrink-0 pb-2.5"
          {...handle}
        >
          <GripVertical className="w-4 h-4" />
        </button>
        <label className="space-y-1 flex-1 min-w-[140px]">
          <span className={labelCls}>中文名稱</span>
          <input
            className={inputCls}
            value={row.label}
            onChange={(e) => dirty({ label: e.target.value })}
            placeholder="例：關於我們"
          />
        </label>
        <label className="space-y-1 flex-1 min-w-[140px]">
          <span className={labelCls}>
            英文名稱 <span className="normal-case text-temo-warm-gray/40">（{labelEnHint}）</span>
          </span>
          <input
            className={inputCls}
            value={row.label_en ?? ""}
            onChange={(e) => dirty({ label_en: e.target.value })}
            placeholder="例：About"
          />
        </label>
        <label className="space-y-1 flex-1 min-w-[140px]">
          <span className={labelCls}>連結路徑</span>
          <input
            className={inputCls}
            value={row.href}
            onChange={(e) => dirty({ href: e.target.value })}
            placeholder="例：/about"
          />
        </label>
      </div>
      {error && <p className="text-xs text-red-400/90 mt-2">{error}</p>}
      <div className="flex items-center gap-3 mt-3">
        <SaveButton pending={pending} saved={saved} onClick={handleSave} label="儲存" />
        <button
          onClick={handleDelete}
          disabled={pending}
          className="ml-auto inline-flex items-center gap-1.5 px-3 py-2 text-red-400/70 hover:text-red-400 text-xs transition-colors disabled:opacity-60"
        >
          <Trash2 className="w-3.5 h-3.5" /> 刪除
        </button>
      </div>
    </div>
  )
}

function SaveButton({
  pending,
  saved,
  onClick,
  label,
}: {
  pending: boolean
  saved: boolean
  onClick: () => void
  label: string
}) {
  return (
    <button
      onClick={onClick}
      disabled={pending}
      className="inline-flex items-center gap-1.5 px-4 py-2 bg-temo-gold/90 text-temo-black text-xs font-bold tracking-wider rounded-sm hover:brightness-110 disabled:opacity-60 transition-all"
    >
      {pending ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : saved ? (
        <Check className="w-3.5 h-3.5" />
      ) : null}
      {saved ? "已儲存" : label}
    </button>
  )
}
