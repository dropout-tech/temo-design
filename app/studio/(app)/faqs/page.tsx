import { FaqManager } from "@/components/studio/faq-manager"
import { getFaqs } from "@/lib/content-supabase"

export const dynamic = "force-dynamic"
export const metadata = { title: "常見問答 — TEMO Studio" }

export default async function StudioFaqsPage() {
  const faqs = await getFaqs()
  return (
    <FaqManager
      initial={faqs.map((f) => ({
        key: f.id,
        id: f.id,
        question: f.question,
        answer: f.answer,
        category: f.category ?? "",
        sort: f.sort,
      }))}
    />
  )
}
