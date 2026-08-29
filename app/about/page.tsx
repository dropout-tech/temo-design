import type { Metadata } from "next"
import { AboutPageClient } from "@/components/pages/about-page-client"
import {
  getAboutClients,
  getAwardLogos,
  getClientLogos,
  getPressLinks,
  getTeamGrouped,
  getCategoryGroups,
} from "@/lib/content-supabase"
import { getAllWorks } from "@/lib/portfolio-supabase"
import { getWorkCategoryGroupValues } from "@/lib/work-category-groups"
import { findWorksLandingSlug } from "@/lib/portfolio-navigation"

export const metadata: Metadata = {
  title: "關於我們 | TEMO DESIGN",
  description: "認識提摩設計工作室。以人為本的品牌設計理念，服務超過 200+ 品牌，幫助企業在競爭激烈的市場中建立穩固品牌基礎。",
}

export default async function AboutPage() {
  const [logos, awards, press, team, clients, works, categoryGroups] = await Promise.all([
    getClientLogos(),
    getAwardLogos(),
    getPressLinks(),
    getTeamGrouped(),
    getAboutClients(),
    getAllWorks(),
    getCategoryGroups(),
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
      clients={clients.map((client) => {
        const clientWork = works.find((work) => work.clientSlug === client.slug)
        return {
          ...client,
          worksLandingSlug: clientWork
            ? findWorksLandingSlug(getWorkCategoryGroupValues(clientWork), categoryGroups)
            : undefined,
        }
      })}
    />
  )
}
