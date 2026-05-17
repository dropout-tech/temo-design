"use client"

import { cn } from "@/lib/utils"

interface LogoProps {
  variant?: "horizontal" | "vertical" | "icon"
  color?: "light" | "dark"
  className?: string
  showText?: boolean
}

export function Logo({ 
  variant = "horizontal", 
  color = "light", 
  className,
  showText = true 
}: LogoProps) {
  const fillColor = color === "light" ? "#ffffff" : "#2c2825"
  
  if (variant === "icon" || !showText) {
    return (
      <svg 
        viewBox="0 0 100 140" 
        className={cn("h-10 w-auto", className)}
        fill={fillColor}
      >
        {/* TEMO Logo Icon - Simplified representation of the brand mark */}
        <path d="M50 0 L80 20 L80 50 L50 70 L20 50 L20 20 Z" fill="none" stroke={fillColor} strokeWidth="3"/>
        <ellipse cx="35" cy="35" rx="8" ry="12" />
        <ellipse cx="65" cy="35" rx="8" ry="12" />
        <path d="M35 60 L35 100 L30 110 L40 110 L35 100" fill="none" stroke={fillColor} strokeWidth="3"/>
        <path d="M65 60 L65 100 L60 110 L70 110 L65 100" fill="none" stroke={fillColor} strokeWidth="3"/>
        <path d="M35 75 L65 75" stroke={fillColor} strokeWidth="3"/>
        <circle cx="35" cy="120" r="8" />
        <circle cx="65" cy="120" r="8" />
      </svg>
    )
  }

  if (variant === "vertical") {
    return (
      <div className={cn("flex flex-col items-center gap-2", className)}>
        <svg 
          viewBox="0 0 100 140" 
          className="h-16 w-auto"
          fill={fillColor}
        >
          <path d="M50 0 L80 20 L80 50 L50 70 L20 50 L20 20 Z" fill="none" stroke={fillColor} strokeWidth="3"/>
          <ellipse cx="35" cy="35" rx="8" ry="12" />
          <ellipse cx="65" cy="35" rx="8" ry="12" />
          <path d="M35 60 L35 100 L30 110 L40 110 L35 100" fill="none" stroke={fillColor} strokeWidth="3"/>
          <path d="M65 60 L65 100 L60 110 L70 110 L65 100" fill="none" stroke={fillColor} strokeWidth="3"/>
          <path d="M35 75 L65 75" stroke={fillColor} strokeWidth="3"/>
          <circle cx="35" cy="120" r="8" />
          <circle cx="65" cy="120" r="8" />
        </svg>
        <span 
          className="text-sm font-bold tracking-[0.3em]"
          style={{ color: fillColor }}
        >
          TEMO DESIGN
        </span>
      </div>
    )
  }

  // Horizontal variant
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <svg 
        viewBox="0 0 100 140" 
        className="h-8 w-auto"
        fill={fillColor}
      >
        <path d="M50 0 L80 20 L80 50 L50 70 L20 50 L20 20 Z" fill="none" stroke={fillColor} strokeWidth="3"/>
        <ellipse cx="35" cy="35" rx="8" ry="12" />
        <ellipse cx="65" cy="35" rx="8" ry="12" />
        <path d="M35 60 L35 100 L30 110 L40 110 L35 100" fill="none" stroke={fillColor} strokeWidth="3"/>
        <path d="M65 60 L65 100 L60 110 L70 110 L65 100" fill="none" stroke={fillColor} strokeWidth="3"/>
        <path d="M35 75 L65 75" stroke={fillColor} strokeWidth="3"/>
        <circle cx="35" cy="120" r="8" />
        <circle cx="65" cy="120" r="8" />
      </svg>
      <span 
        className="text-base font-bold tracking-[0.2em]"
        style={{ color: fillColor }}
      >
        TEMO DESIGN
      </span>
    </div>
  )
}

// Use the actual logo image from the brand assets
export function LogoImage({ 
  className,
  color = "light"
}: { 
  className?: string
  color?: "light" | "dark" 
}) {
  const logoSrc = "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo-18-GwVEoFGOieDzs3vzcMFigK5HoGrmX3.png"
  
  return (
    <img 
      src={logoSrc}
      alt="TEMO DESIGN"
      className={cn(
        "h-10 w-auto object-contain",
        color === "dark" && "invert",
        className
      )}
    />
  )
}
