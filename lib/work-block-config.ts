export const DIVIDER_DEFAULTS = {
  color: "#4b4b49",
  width: 100,
  thickness: 1,
} as const

export const BUTTON_DEFAULTS = {
  text: "了解更多",
  width: 220,
  height: 52,
  textColor: "#171717",
  backgroundColor: "#c7a96b",
  fontSize: 16,
  fontWeight: 600,
} as const

export const IMAGE_HEIGHT_DEFAULTS = {
  desktopPercent: 100,
} as const

export const TEXT_BLOCK_DEFAULTS = {
  fontSize: 18,
  lineHeight: 1.625,
  letterSpacing: 0,
  fontWeight: 400,
} as const

export const WORK_BLOCK_LIMITS = {
  imageHeightPercent: { min: 50, max: 200 },
  textFontSize: { min: 12, max: 72 },
  textLineHeight: { min: 1, max: 2.4 },
  textLetterSpacing: { min: -0.05, max: 0.3 },
  dividerWidth: { min: 10, max: 100 },
  dividerThickness: { min: 1, max: 8 },
  buttonWidth: { min: 120, max: 720 },
  buttonHeight: { min: 40, max: 120 },
  buttonFontSize: { min: 12, max: 40 },
} as const

export const BUTTON_FONT_WEIGHTS = [300, 400, 500, 600, 700, 800, 900] as const
export type ButtonFontWeight = (typeof BUTTON_FONT_WEIGHTS)[number]

export const TEXT_BLOCK_FONT_WEIGHTS = [300, 400, 500, 700, 900] as const
export type TextBlockFontWeight = (typeof TEXT_BLOCK_FONT_WEIGHTS)[number]

export const WORK_IMAGE_SLOTS = [1, 2, 3, 4] as const
export type WorkImageSlot = (typeof WORK_IMAGE_SLOTS)[number]
export type WorkImageCount = WorkImageSlot

export function clampInteger(
  value: unknown,
  min: number,
  max: number,
  fallback: number
): number {
  const numeric = typeof value === "number" ? value : Number(value)
  if (!Number.isFinite(numeric)) return fallback
  return Math.min(max, Math.max(min, Math.round(numeric)))
}

export function clampDecimal(
  value: unknown,
  min: number,
  max: number,
  fallback: number,
  precision = 2
): number {
  const numeric = typeof value === "number" ? value : Number(value)
  if (!Number.isFinite(numeric)) return fallback
  const clamped = Math.min(max, Math.max(min, numeric))
  const factor = 10 ** precision
  return Math.round(clamped * factor) / factor
}

export function normalizeOptionalImageHeightPercent(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null

  return clampInteger(
    value,
    WORK_BLOCK_LIMITS.imageHeightPercent.min,
    WORK_BLOCK_LIMITS.imageHeightPercent.max,
    IMAGE_HEIGHT_DEFAULTS.desktopPercent
  )
}

export function normalizeOptionalTextFontSize(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null
  return clampInteger(
    value,
    WORK_BLOCK_LIMITS.textFontSize.min,
    WORK_BLOCK_LIMITS.textFontSize.max,
    TEXT_BLOCK_DEFAULTS.fontSize
  )
}

export function normalizeOptionalTextLineHeight(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null
  return clampDecimal(
    value,
    WORK_BLOCK_LIMITS.textLineHeight.min,
    WORK_BLOCK_LIMITS.textLineHeight.max,
    TEXT_BLOCK_DEFAULTS.lineHeight,
    3
  )
}

export function normalizeOptionalTextLetterSpacing(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null
  return clampDecimal(
    value,
    WORK_BLOCK_LIMITS.textLetterSpacing.min,
    WORK_BLOCK_LIMITS.textLetterSpacing.max,
    TEXT_BLOCK_DEFAULTS.letterSpacing,
    3
  )
}

export function normalizeOptionalTextFontWeight(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null
  const numeric = Number(value)
  return TEXT_BLOCK_FONT_WEIGHTS.includes(numeric as TextBlockFontWeight)
    ? numeric
    : TEXT_BLOCK_DEFAULTS.fontWeight
}

export function normalizeWorkImageCount(value: unknown): WorkImageCount {
  return clampInteger(value, 1, 4, 1) as WorkImageCount
}

export function getWorkImageCount(value: {
  src?: unknown
  src2?: unknown
  src3?: unknown
  src4?: unknown
}): WorkImageCount {
  const hasValue = (candidate: unknown) =>
    typeof candidate === "string" && candidate.trim().length > 0
  if (hasValue(value.src4)) return 4
  if (hasValue(value.src3)) return 3
  if (hasValue(value.src2)) return 2
  return 1
}

export function hasCompleteWorkImageSlots(
  value: { src?: unknown; src2?: unknown; src3?: unknown; src4?: unknown },
  count: unknown
): boolean {
  const normalizedCount = normalizeWorkImageCount(count)
  const sources = [value.src, value.src2, value.src3, value.src4]
  return sources.slice(0, normalizedCount).every(
    (source) => typeof source === "string" && source.trim().length > 0
  )
}

export function normalizeHexColor(value: unknown, fallback: string): string {
  if (typeof value !== "string") return fallback
  const normalized = value.trim().toLowerCase()
  if (/^#[0-9a-f]{6}$/.test(normalized)) return normalized
  const short = normalized.match(/^#([0-9a-f])([0-9a-f])([0-9a-f])$/)
  if (short) return `#${short[1]}${short[1]}${short[2]}${short[2]}${short[3]}${short[3]}`
  return fallback
}

export function isHexColor(value: unknown): value is string {
  return typeof value === "string" && /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(value.trim())
}

/**
 * 允許站內相對路徑、頁面錨點，以及一般網頁／Email／電話連結。
 * 明確排除 protocol-relative URL 與 javascript/data 等可執行協定。
 */
export function getSafeWorkBlockHref(value: unknown): string | null {
  if (typeof value !== "string") return null
  const href = value.trim()
  if (!href) return null

  if ((href.startsWith("/") && !href.startsWith("//")) || href.startsWith("#") || href.startsWith("?")) {
    return href
  }

  try {
    const url = new URL(href)
    return ["http:", "https:", "mailto:", "tel:"].includes(url.protocol) ? href : null
  } catch {
    return null
  }
}

export function isButtonFontWeight(value: unknown): value is ButtonFontWeight {
  return BUTTON_FONT_WEIGHTS.includes(Number(value) as ButtonFontWeight)
}

export function isTextBlockFontWeight(value: unknown): value is TextBlockFontWeight {
  return TEXT_BLOCK_FONT_WEIGHTS.includes(Number(value) as TextBlockFontWeight)
}
