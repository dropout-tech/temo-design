import { permanentRedirect } from "next/navigation"

/**
 * 作品清單已整合進四個服務頁；舊網址保留永久導向，避免既有書籤失效。
 */
export default function PortfolioPage() {
  permanentRedirect("/explore")
}
