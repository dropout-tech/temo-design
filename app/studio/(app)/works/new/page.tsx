import { WorkForm } from "@/components/studio/work-form"
import { getWorkOptions } from "@/lib/studio/works"

export const dynamic = "force-dynamic"
export const metadata = { title: "新增作品 — TEMO Studio" }

export default async function NewWorkPage() {
  const options = await getWorkOptions()
  return <WorkForm options={options} />
}
