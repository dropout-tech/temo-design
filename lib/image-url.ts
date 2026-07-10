// 把 Supabase Storage 的公開圖片網址，改成走 CDN 的「即時縮圖」端點（render/image）。
// 用途：牆上的 logo 顯示才 ~150px 高，原圖卻可能上千 px；讓 CDN 直接吐小圖，
// 大幅降低瀏覽器要解碼／合成的點陣圖大小（跑馬燈才不會卡）。
// 非 Supabase 的網址（例如本地 /awards/xxx.png）原樣返回。
// 註：Supabase 影像轉換需 Pro 方案（本專案已啟用）。
export function optimizeLogoUrl(url: string, maxW = 600, maxH = 320): string {
  if (!url) return url
  const marker = "/storage/v1/object/public/"
  const i = url.indexOf(marker)
  if (i === -1) return url
  const base = url.slice(0, i)
  const rest = url.slice(i + marker.length) // bucket/路徑...
  return `${base}/storage/v1/render/image/public/${rest}?width=${maxW}&height=${maxH}&resize=contain&quality=78`
}
