import { notFound } from "next/navigation"
import { WorkForm } from "@/components/studio/work-form"
import { getWorkOptions, getWorkForEdit } from "@/lib/studio/works"

export const dynamic = "force-dynamic"
export const metadata = { title: "編輯作品 — TEMO Studio" }

export default async function EditWorkPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ tab?: string | string[] }>
}) {
  const { id } = await params
  const { tab } = await searchParams
  const [options, initial] = await Promise.all([getWorkOptions(), getWorkForEdit(id)])
  if (!initial) notFound()
  return (
    <WorkForm
      options={options}
      workId={id}
      initial={initial}
      initialTab={typeof tab === "string" ? tab : undefined}
    />
  )
}
