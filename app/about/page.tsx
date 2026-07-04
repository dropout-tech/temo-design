import type { Metadata } from "next"
import { AboutPageClient } from "@/components/pages/about-page-client"
import { getClientLogos, getAwardLogos, getPressLinks, getTeamGrouped } from "@/lib/content-supabase"

export const metadata: Metadata = {
  title: "關於我們 | TEMO DESIGN",
  description: "認識提摩設計工作室。以人為本的品牌設計理念，服務超過 200+ 品牌，幫助企業在競爭激烈的市場中建立穩固品牌基礎。",
}

export default async function AboutPage() {
  const [logos, awards, press, team] = await Promise.all([
    getClientLogos(),
    getAwardLogos(),
    getPressLinks(),
    getTeamGrouped(),
  ])
  return (
    <AboutPageClient
      clientLogos={logos.map((l) => ({ name: l.name, image_url: l.image_url }))}
      awardLogos={awards.map((a) => ({ name: a.name, image_url: a.image_url }))}
      pressLinks={press.map((p) => ({
        title: p.title,
        source: p.source,
        url: p.url,
        image_url: p.image_url,
      }))}
      team={team}
    />
  )
}
