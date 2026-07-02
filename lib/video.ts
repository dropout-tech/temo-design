// ─────────────────────────────────────────────────────────────────────────────
// 影片連結解析：把使用者貼的 YouTube / Vimeo 分享連結，轉成可嵌入的 iframe 網址。
// 作品集只存「連結」，影片本體放在 YouTube / Vimeo，不佔自家儲存空間。
// 支援的連結格式：
//   YouTube：youtube.com/watch?v=、youtu.be/、youtube.com/embed/、/shorts/、/live/
//   Vimeo：  vimeo.com/12345678、vimeo.com/video/12345678、player.vimeo.com/video/12345678
// ─────────────────────────────────────────────────────────────────────────────

export type ParsedVideo = {
  provider: "youtube" | "vimeo"
  id: string
  /** 一般嵌入網址（不自動播放） */
  embedUrl: string
  /** 自動播放版本（使用者按下播放鍵後才用） */
  embedUrlAutoplay: string
  /** 預覽縮圖；Vimeo 需另外打 API 才拿得到，這裡回 null，由呼叫端用封面圖代替 */
  thumbnail: string | null
}

export function parseVideo(url?: string | null): ParsedVideo | null {
  if (!url) return null
  const u = url.trim()
  if (!u) return null

  // ── YouTube ──
  const yt = u.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{11})/
  )
  if (yt) {
    const id = yt[1]
    return {
      provider: "youtube",
      id,
      embedUrl: `https://www.youtube.com/embed/${id}?rel=0`,
      embedUrlAutoplay: `https://www.youtube.com/embed/${id}?rel=0&autoplay=1`,
      thumbnail: `https://img.youtube.com/vi/${id}/hqdefault.jpg`,
    }
  }

  // ── Vimeo ──
  const vm = u.match(/vimeo\.com\/(?:video\/)?(\d+)/)
  if (vm) {
    const id = vm[1]
    return {
      provider: "vimeo",
      id,
      embedUrl: `https://player.vimeo.com/video/${id}`,
      embedUrlAutoplay: `https://player.vimeo.com/video/${id}?autoplay=1`,
      thumbnail: null,
    }
  }

  return null
}

/** 這個連結是不是我們支援的影片連結 */
export function isVideoUrl(url?: string | null): boolean {
  return parseVideo(url) !== null
}
