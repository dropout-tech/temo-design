import { ClientLogoManager } from "@/components/studio/client-logo-manager"
import { getClientLogos } from "@/lib/content-supabase"

export const dynamic = "force-dynamic"
export const metadata = { title: "客戶 Logo 牆 — TEMO Studio" }

export default async function StudioClientLogosPage() {
  const items = await getClientLogos()
  return (
    <ClientLogoManager
      initial={items.map((client) => ({
        key: client.id,
        id: client.id,
        name: client.name,
        image_url: client.image_url,
        sort: client.sort,
      }))}
    />
  )
}
