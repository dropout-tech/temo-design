"use client"

import { useEffect, useRef, useState } from "react"

export function CursorSpotlight() {
  const [pos, setPos] = useState({ x: -999, y: -999 })
  const [visible, setVisible] = useState(false)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      rafRef.current = requestAnimationFrame(() => {
        setPos({ x: e.clientX, y: e.clientY })
        setVisible(true)
      })
    }
    const onLeave = () => setVisible(false)
    window.addEventListener("mousemove", onMove)
    window.addEventListener("mouseleave", onLeave)
    return () => {
      window.removeEventListener("mousemove", onMove)
      window.removeEventListener("mouseleave", onLeave)
      cancelAnimationFrame(rafRef.current)
    }
  }, [])

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[9999] hidden md:block"
      aria-hidden
    >
      <div
        style={{
          position: "absolute",
          left: pos.x,
          top: pos.y,
          width: 480,
          height: 480,
          transform: "translate(-50%, -50%)",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(205,169,109,0.055) 0%, rgba(205,169,109,0.018) 40%, transparent 70%)",
          transition: "opacity 0.4s ease",
          opacity: visible ? 1 : 0,
          pointerEvents: "none",
        }}
      />
    </div>
  )
}
