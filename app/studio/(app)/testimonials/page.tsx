import { TestimonialManager } from "@/components/studio/testimonial-manager"
import { getTestimonials } from "@/lib/content-supabase"

export const dynamic = "force-dynamic"
export const metadata = { title: "客戶見證 — TEMO Studio" }

export default async function StudioTestimonialsPage() {
  const items = await getTestimonials()
  return (
    <TestimonialManager
      initial={items.map((t) => ({
        key: t.id,
        id: t.id,
        text: t.text,
        author: t.author,
        company: t.company ?? "",
        rating: t.rating,
        sort: t.sort,
      }))}
    />
  )
}
