"use client"

// 拖拉排序元件（把手式）。
// 滑鼠路徑：維持原生 HTML5 drag（dragstart 記來源、onDragEnter 即時交換、dragend 落庫）。
// 觸控/觸控筆路徑：HTML5 Drag and Drop 在多數行動瀏覽器對觸控不生效，改用 Pointer Events
// 自製實作——pointerdown 用 setPointerCapture 鎖定手指、pointermove 用
// document.elementFromPoint 找出目前壓在哪一列（elementFromPoint 天然支援格狀多欄 grid，
// 沒有「只算 Y 軸」的假設）、pointerup/cancel 落庫。把手加 touch-action: none 避免拖曳時
// 觸發頁面捲動。對外 API（items/getKey/onReorder/onCommit/renderItem/className、
// DragHandleProps 拿到就 spread 到把手的用法）維持不變。
import { useRef, useState, type ReactNode, type DragEvent, type PointerEvent } from "react"

export type DragHandleProps = {
  draggable: true
  onDragStart: (e: DragEvent) => void
  onDragEnd: (e: DragEvent) => void
  onPointerDown: (e: PointerEvent) => void
  onPointerMove: (e: PointerEvent) => void
  onPointerUp: (e: PointerEvent) => void
  onPointerCancel: (e: PointerEvent) => void
  style: { cursor: string; touchAction: string }
}

export function SortableList<T>({
  items,
  getKey,
  onReorder,
  onCommit,
  renderItem,
  className,
}: {
  items: T[]
  getKey: (item: T) => string
  /** 拖曳過程即時更新順序（父層 setState） */
  onReorder: (next: T[]) => void
  /** 放開後落庫（收到最終順序） */
  onCommit: (next: T[]) => void
  renderItem: (item: T, handle: DragHandleProps, dragging: boolean) => ReactNode
  className?: string
}) {
  const dragKey = useRef<string | null>(null)
  const [activeKey, setActiveKey] = useState<string | null>(null)
  const orderRef = useRef(items)
  orderRef.current = items
  // 觸控拖曳中鎖定的 pointerId：忽略非本次拖曳的其他手指（單指才拖）。
  const pointerIdRef = useRef<number | null>(null)

  function moveTo(targetKey: string) {
    const from = dragKey.current
    if (!from || from === targetKey) return
    const cur = orderRef.current
    const fromIdx = cur.findIndex((i) => getKey(i) === from)
    const toIdx = cur.findIndex((i) => getKey(i) === targetKey)
    if (fromIdx < 0 || toIdx < 0) return
    const next = cur.slice()
    const [moved] = next.splice(fromIdx, 1)
    next.splice(toIdx, 0, moved)
    onReorder(next)
  }

  function finishDrag() {
    const moved = dragKey.current !== null
    dragKey.current = null
    pointerIdRef.current = null
    setActiveKey(null)
    if (moved) onCommit(orderRef.current)
  }

  // 觸控路徑輔助：用當前指標座標找出目前壓在哪一列（沿 DOM 往上找最近的
  // data-sortable-key 標記，垂直清單與 grid 皆適用）。
  function targetKeyAtPoint(x: number, y: number): string | null {
    const el = document.elementFromPoint(x, y)
    const wrapper = el?.closest<HTMLElement>("[data-sortable-key]")
    return wrapper?.dataset.sortableKey ?? null
  }

  return (
    <div className={className}>
      {items.map((item) => {
        const key = getKey(item)
        const dragging = activeKey === key
        const handle: DragHandleProps = {
          draggable: true,
          style: { cursor: "grab", touchAction: "none" },
          // --- 滑鼠路徑（原生 HTML5 drag） ---
          onDragStart: (e) => {
            dragKey.current = key
            setActiveKey(key)
            e.dataTransfer.effectAllowed = "move"
            e.dataTransfer.setData("text/plain", key)
          },
          onDragEnd: () => {
            finishDrag()
          },
          // --- 觸控路徑（Pointer Events） ---
          onPointerDown: (e) => {
            // 滑鼠交給上面的原生 drag 處理；非主鍵/非單指的觸控事件忽略。
            if (e.pointerType === "mouse" || !e.isPrimary) return
            e.preventDefault()
            e.currentTarget.setPointerCapture(e.pointerId)
            pointerIdRef.current = e.pointerId
            dragKey.current = key
            setActiveKey(key)
          },
          onPointerMove: (e) => {
            if (e.pointerType === "mouse") return
            if (pointerIdRef.current !== e.pointerId || dragKey.current !== key) return
            const targetKey = targetKeyAtPoint(e.clientX, e.clientY)
            if (targetKey) moveTo(targetKey)
          },
          onPointerUp: (e) => {
            if (e.pointerType === "mouse") return
            if (pointerIdRef.current !== e.pointerId) return
            finishDrag()
          },
          onPointerCancel: (e) => {
            if (e.pointerType === "mouse") return
            if (pointerIdRef.current !== e.pointerId) return
            finishDrag()
          },
        }
        return (
          <div
            key={key}
            data-sortable-key={key}
            onDragOver={(e) => {
              if (dragKey.current) e.preventDefault()
            }}
            onDragEnter={() => moveTo(key)}
            className={
              dragging ? "opacity-40 transition-opacity duration-150" : "transition-opacity duration-150"
            }
          >
            {renderItem(item, handle, dragging)}
          </div>
        )
      })}
    </div>
  )
}
