// 判斷一個媒體 URL 是不是「直接上傳的影片檔」（相對於 YouTube/Vimeo 連結）。
// 用副檔名判斷：後台上傳到 Supabase storage 的路徑一定帶原始副檔名。
const VIDEO_EXT = /\.(mp4|webm|mov|m4v)$/i

export function isUploadedVideoUrl(url?: string | null): boolean {
  if (!url) return false
  // 去掉 query string / hash 再看副檔名（Supabase 公開 URL 可能帶查詢參數）
  const clean = url.split(/[?#]/)[0]
  return VIDEO_EXT.test(clean)
}
