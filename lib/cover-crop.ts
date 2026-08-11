import type { CSSProperties } from "react"

export const COVER_ZOOM_MIN = 1
export const COVER_ZOOM_MAX = 3
export const COVER_POSITION_MIN = 0
export const COVER_POSITION_MAX = 100

export type CoverCrop = {
  zoom: number
  positionX: number
  positionY: number
}

export const DEFAULT_COVER_CROP: CoverCrop = {
  zoom: 1,
  positionX: 50,
  positionY: 50,
}

function toFiniteNumber(value: unknown, fallback: number) {
  const number = typeof value === "number" ? value : Number(value)
  return Number.isFinite(number) ? number : fallback
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

export function normalizeCoverCrop(input?: Partial<CoverCrop> | null): CoverCrop {
  return {
    zoom: clamp(
      toFiniteNumber(input?.zoom, DEFAULT_COVER_CROP.zoom),
      COVER_ZOOM_MIN,
      COVER_ZOOM_MAX
    ),
    positionX: clamp(
      toFiniteNumber(input?.positionX, DEFAULT_COVER_CROP.positionX),
      COVER_POSITION_MIN,
      COVER_POSITION_MAX
    ),
    positionY: clamp(
      toFiniteNumber(input?.positionY, DEFAULT_COVER_CROP.positionY),
      COVER_POSITION_MIN,
      COVER_POSITION_MAX
    ),
  }
}

/**
 * 封面預覽與前台卡片共用同一組樣式，確保後台看到的構圖就是上線結果。
 * object-position 處理原始 cover 裁切；translate 補上縮放後可拖曳的範圍。
 */
export function getCoverCropStyle(input?: Partial<CoverCrop> | null): CSSProperties {
  const crop = normalizeCoverCrop(input)
  const extraScale = crop.zoom - 1
  const translateX = (50 - crop.positionX) * extraScale
  const translateY = (50 - crop.positionY) * extraScale

  return {
    objectPosition: `${crop.positionX}% ${crop.positionY}%`,
    transform: `translate(${translateX}%, ${translateY}%) scale(${crop.zoom})`,
    transformOrigin: "center",
  }
}
