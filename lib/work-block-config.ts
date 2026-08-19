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

export const WORK_BLOCK_LIMITS = {
  dividerWidth: { min: 10, max: 100 },
  dividerThickness: { min: 1, max: 8 },
  buttonWidth: { min: 120, max: 720 },
  buttonHeight: { min: 40, max: 120 },
  buttonFontSize: { min: 12, max: 40 },
} as const

export const BUTTON_FONT_WEIGHTS = [300, 400, 500, 600, 700, 800, 900] as const
export type ButtonFontWeight = (typeof BUTTON_FONT_WEIGHTS)[number]

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
