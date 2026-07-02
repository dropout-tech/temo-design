"use client"

import { useEffect, useState } from "react"
import { useInView } from "@/hooks/use-in-view"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { ChevronDown } from "lucide-react"

const faqs = [
  {
    category: "服務相關",
    questions: [
      { q: "提摩設計提供哪些服務？", a: "我們提供品牌設計、包裝設計、產品設計、工藝設計等完整的設計解決方案。從品牌策略到執行，我們都能提供專業的服務。" },
      { q: "設計項目通常需要多長時間完成？", a: "項目周期根據複雜度而定。一般品牌設計項目需要 3-6 個月，具體時間會在初期諮詢時確認。" },
      { q: "能否提供設計修改和迭代？", a: "當然可以。我們相信溝通和協作是成功設計的關鍵，會進行多輪修改直到您滿意為止。" },
    ],
  },
  {
    category: "合作流程",
    questions: [
      { q: "合作的第一步是什麼？", a: "第一步是初期諮詢。我們會了解您的品牌、市場和目標，然後提供初步的設計建議和報價。" },
      { q: "如何支付設計費用？", a: "我們通常採用分期付款的方式：30% 訂金、40% 中期、30% 尾款。具體條款可根據項目協商。" },
      { q: "設計完成後還會提供支持嗎？", a: "設計完成後，我們會提供 3 個月的修改支持和建議，確保您能順利應用設計。" },
    ],
  },
  {
    category: "價格和預算",
    questions: [
      { q: "設計費用如何計算？", a: "費用基於項目複雜度、工作範圍和時間投入。我們會為每個項目提供詳細的報價。" },
      { q: "有最低預算要求嗎？", a: "沒有絕對的最低預算，但完整的品牌設計項目通常起價為 NT$100,000 以上。" },
      { q: "預算不足的情況下有什麼解決方案嗎？", a: "我們可以根據您的預算制定分階段的設計計畫，優先實施最重要的部分。" },
    ],
  },
  {
    category: "設計相關",
    questions: [
      { q: "如何保護我的創意和設計檔案？", a: "所有客戶資訊和設計檔案都會被嚴格保密。我們簽署保密協議，確保您的智慧財產權受到保護。" },
      { q: "設計完成後能得到什麼檔案？", a: "您會獲得所有設計檔案的源文件（AI、PSD 等）、高解析度輸出檔、以及完整的品牌應用指南。" },
      { q: "能否保留設計的著作權？", a: "設計完成後，著作權會轉移給您。我們僅保留在作品集中展示案例的權利。" },
    ],
  },
]

export function FAQPageClient() {
  const [visible, setVisible] = useState(false)
  const [activeCatIdx, setActiveCatIdx] = useState(0)
  const [activeQ, setActiveQ] = useState<number | null>(null)
  const { ref: faqRef, isInView } = useInView<HTMLDivElement>({ once: true, amount: 0.1 })

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80)
    return () => clearTimeout(t)
  }, [])

  return (
    <>
      <Navbar />
      <main className="pt-20">
        {/* Hero */}
        <section className="relative min-h-[50vh] flex items-center overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-temo-black via-temo-dark to-temo-black" />
          <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full">
            <div
              style={{
                transition: "opacity 0.9s ease, transform 0.9s ease",
                opacity: visible ? 1 : 0,
                transform: visible ? "translateY(0)" : "translateY(28px)",
              }}
            >
              <p className="text-xs tracking-[0.4em] text-temo-gold mb-6 uppercase">FAQ</p>
              <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold text-temo-white mb-6">常見問題</h1>
              <p className="text-lg md:text-xl text-temo-warm-gray">尋找答案？瀏覽我們最常見的問題。</p>
            </div>
          </div>
        </section>

        {/* FAQ Body */}
        <section className="py-16 md:py-32 bg-temo-black">
          <div ref={faqRef} className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            {/* Category tabs */}
            <div
              style={{
                transition: "opacity 0.8s ease",
                opacity: isInView ? 1 : 0,
              }}
              className="flex flex-wrap gap-3 mb-12 justify-center"
            >
              {faqs.map((cat, i) => (
                <button
                  key={i}
                  onClick={() => { setActiveCatIdx(i); setActiveQ(null) }}
                  className={`px-6 py-2.5 min-h-11 rounded-full transition-all text-sm ${
                    activeCatIdx === i
                      ? "bg-temo-gold text-temo-black font-medium"
                      : "border border-temo-warm-gray/50 text-temo-warm-gray hover:border-temo-gold hover:text-temo-gold"
                  }`}
                >
                  {cat.category}
                </button>
              ))}
            </div>

            {/* Accordion */}
            <div className="space-y-4">
              {faqs[activeCatIdx].questions.map((faq, i) => (
                <div
                  key={i}
                  className="border border-temo-warm-gray/20 hover:border-temo-gold/50 transition-all duration-300"
                  style={{
                    transition: `opacity 0.6s ease ${i * 0.06}s, transform 0.6s ease ${i * 0.06}s, border-color 0.3s`,
                    opacity: isInView ? 1 : 0,
                    transform: isInView ? "translateY(0)" : "translateY(12px)",
                  }}
                >
                  <button
                    onClick={() => setActiveQ(activeQ === i ? null : i)}
                    className="w-full flex items-center justify-between p-6 hover:bg-temo-gold/5 transition-colors text-left"
                  >
                    <span className="font-medium text-temo-white pr-6">{faq.q}</span>
                    <ChevronDown
                      className="w-5 h-5 text-temo-gold shrink-0"
                      style={{
                        transition: "transform 0.3s ease",
                        transform: activeQ === i ? "rotate(180deg)" : "rotate(0deg)",
                      }}
                    />
                  </button>

                  <div
                    className="overflow-hidden"
                    style={{
                      maxHeight: activeQ === i ? "900px" : 0,
                      opacity: activeQ === i ? 1 : 0,
                      transition: "max-height 0.35s ease, opacity 0.25s ease",
                    }}
                  >
                    <div className="px-6 pb-6 border-t border-temo-warm-gray/20">
                      <p className="text-temo-warm-gray leading-relaxed pt-4 text-sm">{faq.a}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div
              className="mt-16 pt-16 border-t border-temo-warm-gray/20 text-center"
              style={{
                transition: "opacity 0.8s ease 0.4s",
                opacity: isInView ? 1 : 0,
              }}
            >
              <p className="text-temo-warm-gray mb-6">還有其他問題？我們很樂意幫助！</p>
              <a
                href="/contact"
                className="inline-block bg-temo-gold text-temo-black px-8 py-3 font-medium hover:brightness-110 transition-all"
              >
                聯絡我們
              </a>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
