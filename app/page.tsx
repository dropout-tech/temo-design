"use client"

import { useState, useEffect } from "react"
import { Navbar } from "@/components/navbar"
import { LoadingScreen } from "@/components/sections/loading-screen"
import { HeroSection } from "@/components/sections/hero-section"
import { CursorSpotlight } from "@/components/cursor-spotlight"

export default function HomePage() {
  const [showLoading, setShowLoading] = useState(true)

  const shouldReplayLoading = () => {
    const params = new URLSearchParams(window.location.search)
    return params.get("preview") === "loading-metal" || params.get("loadingReplay") === "1"
  }

  useEffect(() => {
    if (shouldReplayLoading()) return

    // Check if user has already seen the loading screen
    const hasSeenLoading = sessionStorage.getItem("temo-loading-seen")
    if (hasSeenLoading) {
      const frame = requestAnimationFrame(() => setShowLoading(false))
      return () => cancelAnimationFrame(frame)
    }
  }, [])

  const handleLoadingComplete = () => {
    if (!shouldReplayLoading()) {
      sessionStorage.setItem("temo-loading-seen", "true")
    }
    setShowLoading(false)
  }

  return (
    <>
      {showLoading && <LoadingScreen onComplete={handleLoadingComplete} />}
      <CursorSpotlight />
      
      <Navbar />

      <main className="overflow-hidden">
        <HeroSection />
      </main>
    </>
  )
}
