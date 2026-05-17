"use client"

import { useInView } from "@/hooks/use-in-view"
import { Star } from "lucide-react"

const testimonials = [
  {
    rating: 5,
    text: "提摩設計不僅提供設計服務，更是我們品牌成長的策略夥伴。他們的專業團隊深入理解我們的需求，並提供超出預期的創意解決方案。",
    author: "王先生",
    company: "茶葉品牌 CEO",
  },
  {
    rating: 5,
    text: "從品牌定位到包裝設計，提摩的整合思維讓我們的產品在市場上更具競爭力。工作效率高，溝通順暢，強烈推薦！",
    author: "李女士",
    company: "餐飲集團 營運總監",
  },
  {
    rating: 5,
    text: "提摩設計真的如其名，成為了我們品牌的堅實後盾。在面臨市場挑戰時，他們提供的洞察和策略幫助我們找到了新的成長機會。",
    author: "陳先生",
    company: "寵物品牌 創辦人",
  },
]

export function TestimonialsSection() {
  const { ref, isInView } = useInView<HTMLElement>({ once: true, amount: 0.15 })

  return (
    <section ref={ref} className="relative py-24 md:py-32 bg-temo-dark">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div
          style={{
            transition: "opacity 0.8s ease, transform 0.8s ease",
            opacity: isInView ? 1 : 0,
            transform: isInView ? "translateY(0)" : "translateY(24px)",
          }}
          className="text-center mb-14"
        >
          <p className="text-xs tracking-[0.4em] text-temo-gold mb-4 uppercase">Testimonials</p>
          <h2 className="text-3xl md:text-5xl font-bold text-temo-white mb-3">客戶見證</h2>
          <p className="text-temo-warm-gray text-sm">聆聽我們的客戶怎麼說</p>
        </div>

        {/* Cards */}
        <div className="grid md:grid-cols-3 gap-6 md:gap-8">
          {testimonials.map((t, i) => (
            <div
              key={i}
              className="group p-8 border border-temo-warm-gray/15 hover:border-temo-gold/50 bg-temo-black/50 hover:bg-temo-gold/5 transition-all duration-400"
              style={{
                transition: `opacity 0.75s ease ${i * 0.1}s, transform 0.75s ease ${i * 0.1}s, border-color 0.3s, background 0.3s`,
                opacity: isInView ? 1 : 0,
                transform: isInView ? "translateY(0)" : "translateY(28px)",
              }}
            >
              {/* Stars */}
              <div className="flex gap-1 mb-5">
                {Array.from({ length: t.rating }).map((_, si) => (
                  <Star key={si} className="w-4 h-4 fill-temo-gold text-temo-gold" />
                ))}
              </div>

              {/* Quote */}
              <p className="text-temo-warm-gray leading-relaxed mb-6 text-sm">
                &ldquo;{t.text}&rdquo;
              </p>

              {/* Author */}
              <div className="border-t border-temo-warm-gray/15 pt-5 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-temo-gold/20 flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-temo-gold">{t.author.charAt(0)}</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-temo-white">{t.author}</p>
                  <p className="text-xs text-temo-warm-gray">{t.company}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
