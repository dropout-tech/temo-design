const COMBINING_MARKS = /[\u0300-\u036f]/g
const NON_SLUG_CHARACTERS = /[^a-z0-9]+/g
const EDGE_HYPHENS = /^-+|-+$/g

/**
 * 將後台輸入轉成穩定的作品網址代碼。
 * 例如 AsoBé -> asobe、New Project -> new-project。
 */
export function normalizeWorkSlug(value: string): string {
  return value
    .normalize("NFKD")
    .replace(COMBINING_MARKS, "")
    .toLowerCase()
    .trim()
    .replace(NON_SLUG_CHARACTERS, "-")
    .replace(EDGE_HYPHENS, "")
}

/**
 * Next.js 的動態路由在部分情境會交付百分比編碼後的參數。
 * 解碼並統一 Unicode 形式，讓既有含重音字元的 slug 仍可正常查詢。
 */
export function decodeWorkSlugParam(value: string): string {
  try {
    return decodeURIComponent(value).normalize("NFC")
  } catch {
    return value.normalize("NFC")
  }
}
