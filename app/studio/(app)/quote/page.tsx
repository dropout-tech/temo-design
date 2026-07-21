import { QuoteManager } from "@/components/studio/quote-manager"
import { getQuotePricing } from "@/lib/content-supabase"

export const dynamic = "force-dynamic"
export const metadata = { title: "報價試算 — TEMO Studio" }

export default async function StudioQuotePage() {
  const { categories, addons, components } = await getQuotePricing()
  return <QuoteManager categories={categories} addons={addons} components={components} />
}
