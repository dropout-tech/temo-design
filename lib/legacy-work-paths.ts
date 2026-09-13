/** 客戶確認的 28 組 A 方案：舊路徑 -> 既有作品 slug。
 * 精確對照，不依名稱推測；茶覺沒有已確認舊網址，不加入此表。
 */
export const LEGACY_WORK_PATHS: Readonly<Record<string, string>> = {
  "2025-international-linguistic-olympiad": "ilo-2025",
  "60-1": "golden-bell-60",
  "the-four-noble": "four-noble",
  "mrwhiskey": "mr-whisky",
  "169d50c119e1d8": "ai-badminton",
  "smile-castle": "smile-castle",
  "169fde0dfa34ef": "huohuo-bbq",
  "ch-sleep": "ch-sleep",
  "king-title-scp": "king-title",
  "eternite-1": "eternite",
  "ruikee-chicken-rice": "ruikee-chicken-rice",
  "16958e14ebfd6f": "ruikee-claypotrice",
  "1694e97a575ef5": "ruikee-redegg",
  "101": "101-graphic-design",
  "project-yulon-2025-vip-green-gift": "yulon-2025-vip-green-gift",
  "x-2": "kinpo-rice-shochu-gift-box",
  "aifuli": "aifuli-sanitary-pad",
  "victoria-hot-pot": "victoria-hot-pot",
  "vi": "wang-shaner-chicken-rice",
  "tu-tu-su-guan-brand-design": "tu-su-guan",
  "eternite": "eternite-graphic",
  "16815bffe1fcbf": "lamb-chyou",
  "aifuli-1": "aifuli-underwear",
  "4min": "4min",
  "167659710ae0db": "ruikee-hainanese",
  "banner": "amc-banner",
  "16815d38cd3c9c": "zeyutang",
  "ruikee-hainanese": "ruikee-hainanese-rebirth",
}

const publicPathBySlug = new Map(
  Object.entries(LEGACY_WORK_PATHS).map(([path, slug]) => [slug, `/${path}`])
)
export function getLegacyWorkSlug(path: string): string | undefined {
  return Object.hasOwn(LEGACY_WORK_PATHS, path) ? LEGACY_WORK_PATHS[path] : undefined
}
/** 對外沿用舊門牌；資料庫 slug 不變，清單外作品維持既有路徑。 */
export function getWorkPublicPath(slug: string): string {
  return publicPathBySlug.get(slug) ?? `/portfolio/${encodeURIComponent(slug)}`
}
export const SITE_ORIGIN = "https://temo.design"
