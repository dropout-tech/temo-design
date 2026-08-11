import { ClientDataManager, type ClientDataRow } from "@/components/studio/client-data-manager"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"
export const metadata = { title: "客戶資料 — TEMO Studio" }

type ClientDbRow = {
  id: string
  slug: string
  name: string
  brief: string | null
  address: string | null
  phone: string | null
  website: string | null
}

type WorkClientRow = { client_id: string | null }

export default async function StudioClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ client?: string | string[] }>
}) {
  const supabase = await createClient()
  const [{ data: clientRows }, { data: workRows }, params] = await Promise.all([
    supabase
      .from("clients")
      .select("id, slug, name, brief, address, phone, website")
      .order("name"),
    supabase.from("works").select("client_id"),
    searchParams,
  ])

  const counts = new Map<string, number>()
  for (const work of (workRows ?? []) as unknown as WorkClientRow[]) {
    if (!work.client_id) continue
    counts.set(work.client_id, (counts.get(work.client_id) ?? 0) + 1)
  }

  const clients: ClientDataRow[] = ((clientRows ?? []) as unknown as ClientDbRow[]).map(
    (client) => ({
      id: client.id,
      slug: client.slug,
      name: client.name,
      brief: client.brief ?? "",
      address: client.address ?? "",
      phone: client.phone ?? "",
      website: client.website ?? "",
      work_count: counts.get(client.id) ?? 0,
    })
  )
  const requestedClient = Array.isArray(params.client) ? params.client[0] : params.client

  return <ClientDataManager initial={clients} initialClientId={requestedClient} />
}
