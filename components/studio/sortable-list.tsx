"use client"

// 輕量拖拉排序（原生 HTML5 drag，不依賴外部套件）。
// 只有「把手」可拖：renderItem 收到 handle props 掛在把手元素上；
// 拖曳時 onReorder 即時更新視覺順序，放開時 onCommit 落庫。
import { useRef, useState, type ReactNode, type DragEvent } from "react"

export type DragHandleProps = {
  draggable: true
  onDragStart: (e: DragEvent) => void
  onDragEnd: (e: DragEvent) => void
  style: { cursor: string }
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

  return (
    <div className={className}>
      {items.map((item) => {
        const key = getKey(item)
        const dragging = activeKey === key
        const handle: DragHandleProps = {
          draggable: true,
          style: { cursor: "grab" },
          onDragStart: (e) => {
            dragKey.current = key
            setActiveKey(key)
            e.dataTransfer.effectAllowed = "move"
            e.dataTransfer.setData("text/plain", key)
          },
          onDragEnd: () => {
            const moved = dragKey.current !== null
            dragKey.current = null
            setActiveKey(null)
            if (moved) onCommit(orderRef.current)
          },
        }
        return (
          <div
            key={key}
            onDragOver={(e) => {
              if (dragKey.current) e.preventDefault()
            }}
            onDragEnter={() => moveTo(key)}
            className={dragging ? "opacity-40" : undefined}
          >
            {renderItem(item, handle, dragging)}
          </div>
        )
      })}
    </div>
  )
}
