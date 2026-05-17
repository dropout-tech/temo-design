"use client"

import { useEffect, useState } from "react"

interface LoadingScreenProps {
  onComplete: () => void
}

export function LoadingScreen({ onComplete }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0)
  const [isExiting, setIsExiting] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)

    const startTime = Date.now()
    const MIN_DISPLAY_MS = 2000 // at least show reveal + first full shimmer
    let pageLoaded = document.readyState === "complete"

    const handleLoad = () => {
      pageLoaded = true
    }
    if (!pageLoaded) window.addEventListener("load", handleLoad)

    const timer = setInterval(() => {
      setProgress((prev) => {
        const elapsed = Date.now() - startTime
        const minTimeElapsed = elapsed >= MIN_DISPLAY_MS
        const canComplete = pageLoaded && minTimeElapsed

        if (prev >= 100) {
          clearInterval(timer)
          setTimeout(() => {
            setIsExiting(true)
            setTimeout(onComplete, 700)
          }, 250)
          return 100
        }

        // Hold at 95% until page is actually loaded and min time has passed
        if (!canComplete) {
          return prev < 95 ? prev + 1 : 95
        }

        // Both conditions met — race to 100
        return Math.min(prev + 5, 100)
      })
    }, 30)

    return () => {
      clearInterval(timer)
      window.removeEventListener("load", handleLoad)
    }
  }, [onComplete])

  return (
    <div
      className="fixed inset-0 z-[200] bg-temo-black flex flex-col items-center justify-center"
      style={{
        transition: "opacity 0.7s ease",
        opacity: isExiting ? 0 : 1,
        pointerEvents: isExiting ? "none" : "auto",
      }}
    >
      {/* Noise overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          opacity: 0.03,
        }}
      />

      {/* Logo with gold shimmer — PNG mask + gold gradient; reveals from left then loops shimmer */}
      <div
        style={{
          transition: "opacity 0.6s ease",
          opacity: mounted ? 1 : 0,
        }}
        className="logo-shimmer-wrap"
        aria-label="TEMO DESIGN"
        role="img"
      >
        <div className={`logo-shimmer-fill ${mounted ? "is-mounted" : ""}`} />
      </div>

      {/* Progress bar */}
      <div
        className="mt-12 w-56 md:w-72"
        style={{
          transition: "opacity 0.6s ease 0.5s",
          opacity: mounted ? 1 : 0,
        }}
      >
        <div className="h-px bg-temo-warm-gray/25 relative overflow-hidden">
          <div
            className="absolute left-0 top-0 h-full bg-temo-gold"
            style={{ width: `${progress}%`, transition: "width 0.1s linear" }}
          />
        </div>
        <div className="mt-3 flex justify-between items-center">
          <span className="text-xs text-temo-warm-gray tracking-[0.3em]">LOADING</span>
          <span className="text-xs text-temo-gold font-mono tabular-nums">{progress}%</span>
        </div>
      </div>

      <style>{`
        .logo-shimmer-wrap {
          width: min(72vw, 600px);
          position: relative;
        }
        .logo-shimmer-fill {
          width: 100%;
          aspect-ratio: 2872 / 2471;
          -webkit-mask-image: url('/temo-logo-horizontal.png');
                  mask-image: url('/temo-logo-horizontal.png');
          -webkit-mask-repeat: no-repeat;
                  mask-repeat: no-repeat;
          -webkit-mask-position: center;
                  mask-position: center;
          -webkit-mask-size: contain;
                  mask-size: contain;
          background:
            /* moving highlight band */
            linear-gradient(
              100deg,
              transparent 0%,
              transparent 35%,
              rgba(255, 240, 200, 0.0) 40%,
              rgba(255, 240, 200, 0.95) 50%,
              rgba(255, 240, 200, 0.0) 60%,
              transparent 65%,
              transparent 100%
            ),
            /* base gold gradient with subtle depth */
            linear-gradient(
              90deg,
              #b08a4f 0%,
              #cda96d 25%,
              #e2c389 50%,
              #cda96d 75%,
              #b08a4f 100%
            );
          background-size: 220% 100%, 100% 100%;
          background-position: -120% 0, 0 0;
          background-repeat: no-repeat;
          /* hidden until is-mounted kicks in */
          clip-path: inset(0 100% 0 0);
          -webkit-clip-path: inset(0 100% 0 0);
        }
        .logo-shimmer-fill.is-mounted {
          animation:
            logoReveal 1.4s cubic-bezier(0.77, 0, 0.18, 1) 0.15s forwards,
            goldShimmer 2.8s cubic-bezier(0.65, 0, 0.18, 1) 0.15s infinite;
        }
        @keyframes logoReveal {
          0% {
            clip-path: inset(0 100% 0 0);
            -webkit-clip-path: inset(0 100% 0 0);
          }
          100% {
            clip-path: inset(0 0 0 0);
            -webkit-clip-path: inset(0 0 0 0);
          }
        }
        /* First cycle's sweep happens during reveal (0 → 50% over 1.4s of 2.8s cycle),
           then idles at right edge, then loops — so the first light "uncovers" the logo,
           and subsequent passes feel like ongoing shimmer. */
        @keyframes goldShimmer {
          0% {
            background-position: -120% 0, 0 0;
          }
          50% {
            background-position: 120% 0, 0 0;
          }
          100% {
            background-position: 120% 0, 0 0;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .logo-shimmer-fill,
          .logo-shimmer-fill.is-mounted {
            animation: none;
            clip-path: inset(0 0 0 0);
            -webkit-clip-path: inset(0 0 0 0);
            background:
              linear-gradient(90deg, #b08a4f 0%, #cda96d 50%, #b08a4f 100%);
          }
        }
      `}</style>
    </div>
  )
}
