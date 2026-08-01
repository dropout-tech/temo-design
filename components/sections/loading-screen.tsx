"use client"

import { useEffect, useState } from "react"

interface LoadingScreenProps {
  onComplete: () => void
}

export function LoadingScreen({ onComplete }: LoadingScreenProps) {
  // progress value is no longer shown, but still drives the completion timing below
  const [, setProgress] = useState(0)
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
      className="fixed inset-0 z-[10000] bg-temo-black flex flex-col items-center justify-center"
      style={{
        background:
          "radial-gradient(circle at 50% 45%, #151717 0%, #080909 30%, #020202 68%)",
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
          opacity: 0.045,
        }}
      />

      {/* Logo artwork is unchanged; the stacked masks create a darker chrome reflection. */}
      <div
        style={{
          transition: "opacity 0.6s ease",
          opacity: mounted ? 1 : 0,
        }}
        className="logo-shimmer-wrap"
        aria-label="TEMO DESIGN"
        role="img"
      >
        <div className={`logo-metal-stack ${mounted ? "is-mounted" : ""}`}>
          <div className="logo-metal-layer logo-metal-edge-shadow" />
          <div className="logo-metal-layer logo-metal-body" />
          <div className="logo-metal-layer logo-metal-edge-highlight" />
          <div className="logo-metal-layer logo-metal-sweep" />
          <div className="logo-metal-layer logo-metal-glint" />
        </div>
        <div className="logo-corner-spark" />
      </div>

      <style>{`
        .logo-shimmer-wrap {
          width: min(76vw, 660px);
          position: relative;
          filter: drop-shadow(0 0 14px rgba(255, 255, 255, 0.06));
        }
        .logo-metal-stack {
          width: 100%;
          aspect-ratio: 2872 / 2471;
          position: relative;
          opacity: 0;
          transform: scale(0.985);
          transform-origin: center;
        }
        .logo-metal-layer {
          position: absolute;
          inset: 0;
          -webkit-mask-image: url('/temo-logo-horizontal.png');
                  mask-image: url('/temo-logo-horizontal.png');
          -webkit-mask-repeat: no-repeat;
                  mask-repeat: no-repeat;
          -webkit-mask-position: center;
                  mask-position: center;
          -webkit-mask-size: contain;
                  mask-size: contain;
          will-change: transform, opacity, background-position, filter;
        }
        .logo-metal-edge-shadow {
          background:
            linear-gradient(135deg, rgba(0, 0, 0, 0.95), rgba(24, 25, 25, 0.65) 42%, rgba(0, 0, 0, 0.95) 100%);
          opacity: 0.5;
        }
        .logo-metal-body {
          background:
            radial-gradient(circle at 26% 16%, rgba(255, 255, 255, 0.42) 0%, rgba(255, 255, 255, 0.08) 13%, transparent 26%),
            radial-gradient(circle at 78% 72%, rgba(0, 0, 0, 0.72) 0%, transparent 34%),
            linear-gradient(
              112deg,
              #030404 0%,
              #191b1c 10%,
              #6f7476 18%,
              #eef0ef 28%,
              #8d9293 36%,
              #222526 45%,
              #050606 52%,
              #f4f3ef 61%,
              #a6abad 68%,
              #303436 78%,
              #d2d4d3 88%,
              #101112 100%
            );
          background-size: 120% 120%, 100% 100%, 190% 190%;
          background-position: 46% 40%, center, 0% 50%;
          filter:
            saturate(0.88)
            contrast(1.34)
            brightness(0.92)
            drop-shadow(-1px -1px 0 rgba(255, 255, 255, 0.18));
        }
        .logo-metal-edge-highlight {
          background:
            linear-gradient(132deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.28) 12%, transparent 24%),
            linear-gradient(312deg, transparent 0%, rgba(255, 255, 255, 0.68) 54%, transparent 67%);
          opacity: 0.44;
          transform: translate(-1px, -1px);
          filter: blur(0.18px);
          mix-blend-mode: screen;
        }
        .logo-metal-sweep {
          background:
            linear-gradient(
              104deg,
              transparent 0%,
              transparent 35%,
              rgba(255, 255, 255, 0.0) 42%,
              rgba(255, 255, 255, 0.66) 48%,
              rgba(226, 236, 240, 0.7) 51%,
              rgba(255, 255, 255, 0.0) 58%,
              transparent 100%
            );
          background-size: 240% 100%;
          background-position: -140% 0;
          opacity: 0;
          filter: blur(0.2px);
          mix-blend-mode: screen;
        }
        .logo-metal-glint {
          background:
            radial-gradient(ellipse at 20% 48%, rgba(255, 255, 255, 0.72) 0%, rgba(255, 255, 255, 0.36) 5%, transparent 19%),
            linear-gradient(108deg, transparent 42%, rgba(255, 255, 255, 0.46) 49%, transparent 56%);
          background-size: 32% 100%, 180% 100%;
          background-repeat: no-repeat;
          background-position: -34% 0, -90% 0;
          opacity: 0;
          mix-blend-mode: screen;
          filter: blur(0.12px);
        }
        .logo-corner-spark {
          content: "";
          position: absolute;
          left: 23.5%;
          top: 49.5%;
          width: 34px;
          height: 34px;
          pointer-events: none;
          transform: translate(-50%, -50%) rotate(-18deg) scale(0.72);
          opacity: 0;
          background:
            radial-gradient(circle, rgba(255, 255, 255, 0.72) 0 4%, rgba(235, 244, 248, 0.42) 7%, rgba(255, 255, 255, 0) 18%),
            linear-gradient(90deg, transparent 0 42%, rgba(255, 255, 255, 0.46) 49%, rgba(255, 255, 255, 0.46) 51%, transparent 58% 100%),
            linear-gradient(0deg, transparent 0 43%, rgba(255, 255, 255, 0.34) 49%, rgba(255, 255, 255, 0.34) 51%, transparent 57% 100%);
          filter:
            blur(0.1px)
            drop-shadow(0 0 6px rgba(255, 255, 255, 0.26))
            drop-shadow(0 0 12px rgba(194, 218, 226, 0.1));
          mix-blend-mode: screen;
        }
        .logo-metal-stack.is-mounted {
          animation: logoMetalReveal 1.25s cubic-bezier(0.7, 0, 0.18, 1) 0.12s forwards;
        }
        .logo-metal-stack.is-mounted .logo-metal-body {
          animation: logoMetalDrift 7.6s cubic-bezier(0.45, 0, 0.25, 1) 0.2s infinite alternate;
        }
        .logo-metal-stack.is-mounted .logo-metal-sweep {
          animation: logoMetalSweep 8.2s cubic-bezier(0.68, 0, 0.22, 1) 0.5s infinite;
        }
        .logo-metal-stack.is-mounted .logo-metal-glint {
          animation: logoMetalGlint 8.2s cubic-bezier(0.65, 0, 0.3, 1) 0.7s infinite;
        }
        .logo-metal-stack.is-mounted + .logo-corner-spark {
          animation: logoCornerSpark 8.2s cubic-bezier(0.58, 0, 0.26, 1) 1s infinite;
        }
        @keyframes logoMetalReveal {
          0% {
            opacity: 0;
            transform: scale(0.985);
            filter: brightness(0.18) contrast(1.25);
          }
          38% {
            opacity: 0.52;
            transform: scale(0.995);
            filter: brightness(0.34) contrast(1.35);
          }
          100% {
            opacity: 1;
            transform: scale(1);
            filter: brightness(1) contrast(1);
          }
        }
        @keyframes logoMetalDrift {
          0% {
            background-position: 46% 40%, center, 0% 50%;
            filter:
              saturate(0.88)
              contrast(1.34)
              brightness(0.88)
              drop-shadow(-1px -1px 0 rgba(255, 255, 255, 0.16));
          }
          100% {
            background-position: 48% 38%, center, 100% 50%;
            filter:
              saturate(0.86)
              contrast(1.38)
              brightness(0.96)
              drop-shadow(-1px -1px 0 rgba(255, 255, 255, 0.2));
          }
        }
        @keyframes logoMetalSweep {
          0% {
            opacity: 0;
            background-position: -140% 0;
          }
          12% {
            opacity: 0.12;
          }
          45% {
            opacity: 0.58;
          }
          58% {
            opacity: 0.1;
          }
          72%,
          100% {
            opacity: 0;
            background-position: 150% 0;
          }
        }
        @keyframes logoMetalGlint {
          0%,
          28% {
            opacity: 0;
            background-position: -34% 0, -90% 0;
          }
          39% {
            opacity: 0.48;
          }
          52% {
            opacity: 0.08;
            background-position: 102% 0, 120% 0;
          }
          65%,
          100% {
            opacity: 0;
            background-position: 116% 0, 130% 0;
          }
        }
        @keyframes logoCornerSpark {
          0%,
          16% {
            opacity: 0;
            transform: translate(-50%, -50%) rotate(-18deg) scale(0.62);
          }
          22% {
            opacity: 0.42;
            transform: translate(-50%, -50%) rotate(-18deg) scale(0.86);
          }
          28% {
            opacity: 0.08;
            transform: translate(-50%, -50%) rotate(-18deg) scale(0.96);
          }
          36%,
          100% {
            opacity: 0;
            transform: translate(-50%, -50%) rotate(-18deg) scale(0.9);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .logo-metal-stack,
          .logo-metal-stack.is-mounted,
          .logo-metal-stack.is-mounted .logo-metal-body,
          .logo-metal-stack.is-mounted .logo-metal-sweep,
          .logo-metal-stack.is-mounted .logo-metal-glint,
          .logo-metal-stack.is-mounted + .logo-corner-spark {
            animation: none;
          }
          .logo-metal-stack {
            opacity: 1;
            transform: none;
            filter: none;
          }
          .logo-metal-sweep,
          .logo-metal-glint,
          .logo-corner-spark {
            display: none;
          }
        }
      `}</style>
    </div>
  )
}
