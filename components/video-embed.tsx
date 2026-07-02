"use client"

import { useState } from "react"
import { Play } from "lucide-react"
import { parseVideo } from "@/lib/video"
import { proxyImage } from "@/lib/portfolio-data"

interface VideoEmbedProps {
  /** 使用者貼的 YouTube / Vimeo 連結 */
  url: string
  /** 播放前顯示的封面圖（通常用作品封面）；沒給就用 YouTube 縮圖 */
  poster?: string
  title?: string
  className?: string
}

/**
 * 影片播放器（facade 模式）：
 * 一開始只顯示封面圖 + 播放鍵，使用者「按下播放」才真正載入 YouTube/Vimeo iframe。
 * 好處：頁面載入快、不會一進來就被第三方 iframe 拖慢，也比較保護隱私。
 */
export function VideoEmbed({ url, poster, title, className }: VideoEmbedProps) {
  const [playing, setPlaying] = useState(false)
  const video = parseVideo(url)

  // 連結認不得就不渲染（呼叫端會 fallback 到封面圖）
  if (!video) return null

  const posterSrc = poster ? proxyImage(poster) : video.thumbnail

  return (
    <div
      className={
        "relative w-full aspect-video overflow-hidden bg-temo-black " + (className ?? "")
      }
    >
      {playing ? (
        <iframe
          src={video.embedUrlAutoplay}
          title={title ?? "作品影片"}
          className="absolute inset-0 h-full w-full"
          allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
          allowFullScreen
        />
      ) : (
        <button
          type="button"
          onClick={() => setPlaying(true)}
          aria-label={`播放影片：${title ?? ""}`}
          className="group absolute inset-0 h-full w-full cursor-pointer"
        >
          {/* 用一般 img 顯示封面：不經過 next/image，避免第三方縮圖網域白名單問題 */}
          {posterSrc && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={posterSrc}
              alt={title ?? "影片封面"}
              className="absolute inset-0 h-full w-full object-cover"
              referrerPolicy="no-referrer"
            />
          )}
          <span className="absolute inset-0 bg-temo-black/30 transition-colors group-hover:bg-temo-black/15" />
          <span className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-temo-gold/95 text-temo-black shadow-lg transition-transform duration-300 group-hover:scale-110 md:h-20 md:w-20">
            <Play className="h-6 w-6 translate-x-0.5 fill-current md:h-8 md:w-8" />
          </span>
        </button>
      )}
    </div>
  )
}
