"use client"

import { useState, useEffect } from "react"
import { Navbar } from "@/components/navbar"
import { LoadingScreen } from "@/components/sections/loading-screen"
import { HeroSection } from "@/components/sections/hero-section"
import { CursorSpotlight } from "@/components/cursor-spotlight"

export default function HomePage() {
  const [showLoading, setShowLoading] = useState(true)

  useEffect(() => {
    // Check if user has already seen the loading screen
    const hasSeenLoading = sessionStorage.getItem("temo-loading-seen")
    if (hasSeenLoading) {
      setShowLoading(false)
    }
  }, [])

  const handleLoadingComplete = () => {
    sessionStorage.setItem("temo-loading-seen", "true")
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
