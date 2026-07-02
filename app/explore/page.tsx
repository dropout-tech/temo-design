import type { Metadata } from "next"
import { ExploreClient } from "@/components/pages/explore-client"

export const metadata: Metadata = {
  title: "作品探索 | TEMO DESIGN",
  description: "提摩設計提供品牌設計、產品設計與工藝設計，探索屬於你的設計解方。",
}

export default function ExplorePage() {
  return <ExploreClient />
}
