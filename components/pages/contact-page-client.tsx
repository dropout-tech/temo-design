"use client"

import { useEffect, useState } from "react"
import { useInView } from "@/hooks/use-in-view"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { QuoteCalculator } from "@/components/quote/quote-calculator"
import { QuoteBriefForm } from "@/components/quote/quote-brief-form"
import { Mail, Phone, MapPin, MessageSquare, Calculator, FileText } from "lucide-react"
import { cn } from "@/lib/utils"

type Tab = "contact" | "quote" | "brief"

export function ContactPageClient({
  contact,
}: {
  contact?: { email: string; phone: string; address: string }
} = {}) {
  const info = contact ?? {
    email: "temo.design0531@gmail.com",
    phone: "0913-322-070",
    address: "台中市西區台灣大道二段229號13樓之2",
  }
  const [visible, setVisible] = useState(false)
  const [activeTab, setActiveTab] = useState<Tab>("contact")
  const { ref: contentRef, isInView } = useInView<HTMLDivElement>({ once: true, amount: 0.1 })

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    phone: "",
    subject: "",
    message: "",
  })
  const [submitted, setSubmitted] = useState(false)
  const [prefilled, setPrefilled] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80)
    return () => clearTimeout(t)
  }, [])

  // Prefill form from URL params (sent from QuoteBriefModal)
  useEffect(() => {
    if (typeof window === "undefined") return
    const params = new URLSearchParams(window.location.search)
    const fields = ["name", "email", "company", "phone", "subject", "message"] as const
    const next: Partial<Record<(typeof fields)[number], string>> = {}
    let hasAny = false
    for (const f of fields) {
      const v = params.get(f)
      if (v) {
        next[f] = v
        hasAny = true
      }
    }
    if (hasAny) {
      setFormData((prev) => ({ ...prev, ...next }))
      setActiveTab("contact")
      setPrefilled(true)
      requestAnimationFrame(() => {
        document
          .getElementById("contact-form-anchor")
          ?.scrollIntoView({ behavior: "smooth", block: "start" })
      })
    }
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    setTimeout(() => {
      setFormData({ name: "", email: "", company: "", phone: "", subject: "", message: "" })
      setSubmitted(false)
    }, 3000)
  }

  return (
    <>
      <Navbar />
      <main className="pt-20">

        {/* ── Hero ── */}
        <section className="relative py-24 md:py-32 overflow-hidden bg-temo-black">
          {/* Decorative line */}
          <div className="absolute left-0 top-0 h-full w-px bg-gradient-to-b from-transparent via-temo-gold/30 to-transparent ml-[10%] hidden lg:block" />
          <div className="relative z-10 mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
            <div
              style={{
                transition: "opacity 0.9s ease, transform 0.9s ease",
                opacity: visible ? 1 : 0,
                transform: visible ? "translateY(0)" : "translateY(28px)",
              }}
            >
              <p className="text-[11px] tracking-[0.5em] text-temo-gold mb-5 uppercase">Contact / 聯繫提摩</p>
              <h1 className="text-5xl md:text-7xl font-bold text-temo-white leading-none mb-6 text-balance">
                讓我們一起<br />
                <span className="text-temo-gold">打造品牌奇蹟</span>
              </h1>
              <p className="text-base text-temo-warm-gray max-w-lg leading-relaxed">
                無論您是品牌新創還是尋求轉型，提摩設計都是您最堅實的後盾。
                歡迎填寫下方表單，或直接透過報價試算了解服務費用。
              </p>
            </div>
          </div>
        </section>

        {/* ── Tab Switcher ── */}
        <div className="bg-temo-black border-y border-white/5 sticky top-[68px] z-40">
          <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
            <div className="flex overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <button
                onClick={() => setActiveTab("contact")}
                className={cn(
                  "flex shrink-0 items-center gap-2.5 px-4 sm:px-6 py-4 text-xs tracking-[0.12em] sm:tracking-[0.25em] font-medium border-b-2 whitespace-nowrap transition-all duration-300",
                  activeTab === "contact"
                    ? "border-temo-gold text-temo-gold"
                    : "border-transparent text-temo-warm-gray hover:text-white"
                )}
              >
                <MessageSquare className="w-4 h-4" />
                傳送訊息
              </button>
              <button
                onClick={() => setActiveTab("quote")}
                className={cn(
                  "flex shrink-0 items-center gap-2.5 px-4 sm:px-6 py-4 text-xs tracking-[0.12em] sm:tracking-[0.25em] font-medium border-b-2 whitespace-nowrap transition-all duration-300",
                  activeTab === "quote"
                    ? "border-temo-gold text-temo-gold"
                    : "border-transparent text-temo-warm-gray hover:text-white"
                )}
              >
                <Calculator className="w-4 h-4" />
                即時報價試算
              </button>
              <button
                onClick={() => setActiveTab("brief")}
                className={cn(
                  "flex shrink-0 items-center gap-2.5 px-4 sm:px-6 py-4 text-xs tracking-[0.12em] sm:tracking-[0.25em] font-medium border-b-2 whitespace-nowrap transition-all duration-300",
                  activeTab === "brief"
                    ? "border-temo-gold text-temo-gold"
                    : "border-transparent text-temo-warm-gray hover:text-white"
                )}
              >
                <FileText className="w-4 h-4" />
                設計需求單
              </button>
            </div>
          </div>
        </div>

        {/* ── Contact Form Tab ── */}
        <div
          style={{
            display: activeTab === "contact" ? "block" : "none",
          }}
        >
          <section className="py-20 md:py-28 bg-temo-black">
            <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
              <div ref={contentRef} className="grid lg:grid-cols-3 gap-10 lg:gap-16">

                {/* Info column */}
                <div
                  className="space-y-10"
                  style={{
                    transition: "opacity 0.8s ease, transform 0.8s ease",
                    opacity: isInView ? 1 : 0,
                    transform: isInView ? "translateX(0)" : "translateX(-24px)",
                  }}
                >
                  <div>
                    <p className="text-[10px] tracking-[0.4em] text-temo-gold mb-6 uppercase">聯絡資訊</p>
                    <div className="space-y-8">
                      {[
                        {
                          icon: Mail,
                          label: "電子郵件",
                          value: info.email,
                          href: `mailto:${info.email}`,
                        },
                        {
                          icon: Phone,
                          label: "電話",
                          value: info.phone,
                          href: `tel:${info.phone}`,
                        },
                        {
                          icon: MapPin,
                          label: "地址",
                          value: info.address,
                          href: undefined,
                        },
                      ].map(({ icon: Icon, label, value, href }) => (
                        <div key={label} className="flex items-start gap-4">
                          <div className="mt-0.5 w-8 h-8 rounded-full bg-temo-gold/10 flex items-center justify-center shrink-0">
                            <Icon className="w-4 h-4 text-temo-gold" />
                          </div>
                          <div>
                            <p className="text-xs text-temo-warm-gray mb-1">{label}</p>
                            {href ? (
                              <a href={href} className="text-sm text-temo-white hover:text-temo-gold transition-colors">
                                {value}
                              </a>
                            ) : (
                              <p className="text-sm text-temo-white leading-relaxed">{value}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-white/8 pt-8">
                    <p className="text-[10px] tracking-[0.4em] text-temo-gold mb-4 uppercase">營業時間</p>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between text-temo-white">
                        <span>週一 — 週五</span>
                        <span className="text-temo-gold">09:00 – 18:00</span>
                      </div>
                      <div className="flex justify-between text-temo-warm-gray">
                        <span>週末 / 國定假日</span>
                        <span>休息</span>
                      </div>
                    </div>
                  </div>

                  {/* LINE QR code */}
                  <div className="border-t border-white/8 pt-8">
                    <p className="text-[10px] tracking-[0.4em] text-temo-gold mb-4 uppercase">LINE 官方帳號</p>
                    <div className="flex items-start gap-5">
                      <div className="relative w-32 h-32 shrink-0 rounded-md border border-white/10 bg-white/3 overflow-hidden flex items-center justify-center">
                        {/* TODO: 將下方 <img> 的 src 換成實際 LINE QR code 圖片路徑（建議放在 /public/line-qr.png） */}
                        {/* <img src="/line-qr.png" alt="LINE QR code" className="w-full h-full object-contain p-2" /> */}
                        <span className="text-[10px] tracking-[0.2em] text-temo-warm-gray/60 text-center px-2">
                          QR CODE
                          <br />
                          預留位置
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-temo-white leading-relaxed mb-2">
                          掃描加入好友
                        </p>
                        <p className="text-xs text-temo-warm-gray leading-relaxed">
                          直接透過 LINE 與我們聯繫，討論您的品牌與設計需求。
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Switch to quote hint */}
                  <button
                    onClick={() => setActiveTab("quote")}
                    className="group flex items-center gap-3 text-xs text-temo-warm-gray hover:text-temo-gold transition-colors"
                  >
                    <Calculator className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    <span>不確定費用？先試算報價</span>
                    <span className="ml-auto text-temo-gold opacity-60 md:opacity-0 md:group-hover:opacity-100 transition-opacity">→</span>
                  </button>
                </div>

                {/* Form column */}
                <div
                  className="lg:col-span-2"
                  style={{
                    transition: "opacity 0.8s ease 0.2s, transform 0.8s ease 0.2s",
                    opacity: isInView ? 1 : 0,
                    transform: isInView ? "translateX(0)" : "translateX(24px)",
                  }}
                >
                  <div id="contact-form-anchor" className="scroll-mt-32" />
                  {prefilled && !submitted && (
                    <div className="mb-6 flex items-start gap-3 border border-temo-gold/30 bg-temo-gold/5 px-4 py-3 rounded-sm">
                      <div className="mt-0.5 w-5 h-5 rounded-full bg-temo-gold/15 flex items-center justify-center shrink-0">
                        <svg className="w-3 h-3 text-temo-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                      </div>
                      <p className="text-xs text-temo-warm-gray leading-relaxed">
                        已自動帶入您剛剛填寫的設計需求 brief — 請最後確認資訊無誤後送出。
                      </p>
                    </div>
                  )}
                  {!submitted ? (
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="grid md:grid-cols-2 gap-5">
                        {[
                          { label: "姓名", name: "name", type: "text", placeholder: "您的姓名", required: true },
                          { label: "電子郵件", name: "email", type: "email", placeholder: "your@email.com", required: true },
                          { label: "公司名稱", name: "company", type: "text", placeholder: "您的公司名稱", required: false },
                          { label: "聯絡電話", name: "phone", type: "tel", placeholder: "+886-9XX-XXX-XXX", required: false },
                        ].map(({ label, name, type, placeholder, required }) => (
                          <div key={name}>
                            <label className="block text-xs tracking-wide text-temo-warm-gray mb-2">
                              {label} {required && <span className="text-temo-gold">*</span>}
                            </label>
                            <input
                              type={type}
                              name={name}
                              value={formData[name as keyof typeof formData]}
                              onChange={handleChange}
                              required={required}
                              placeholder={placeholder}
                              className="w-full px-4 py-3 bg-white/3 border border-white/10 text-temo-white text-base md:text-sm placeholder:text-white/20 focus:border-temo-gold/60 focus:bg-white/5 focus:outline-none transition-all rounded-sm"
                            />
                          </div>
                        ))}
                      </div>

                      <div>
                        <label className="block text-xs tracking-wide text-temo-warm-gray mb-2">
                          服務項目 <span className="text-temo-gold">*</span>
                        </label>
                        <div className="relative">
                        <select
                          name="subject"
                          value={formData.subject}
                          onChange={handleChange}
                          required
                          className="w-full px-4 py-3 pr-10 bg-white/3 border border-white/10 text-temo-white text-base md:text-sm focus:border-temo-gold/60 focus:outline-none transition-all rounded-sm appearance-none"
                        >
                          <option value="" className="bg-temo-dark">選擇您感興趣的服務類型</option>
                          <option value="brand" className="bg-temo-dark">品牌識別設計</option>
                          <option value="graphic" className="bg-temo-dark">平面 / 包裝設計</option>
                          <option value="product" className="bg-temo-dark">產品設計</option>
                          <option value="crafts" className="bg-temo-dark">工藝設計</option>
                          <option value="other" className="bg-temo-dark">其他諮詢</option>
                        </select>
                        <svg
                          aria-hidden="true"
                          className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40"
                          fill="none" stroke="currentColor" viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
                        </svg>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs tracking-wide text-temo-warm-gray mb-2">
                          訊息內容 <span className="text-temo-gold">*</span>
                        </label>
                        <textarea
                          name="message"
                          value={formData.message}
                          onChange={handleChange}
                          required
                          rows={6}
                          placeholder="請詳細描述您的品牌背景、設計需求、時程規劃等..."
                          className="w-full px-4 py-3 bg-white/3 border border-white/10 text-temo-white text-base md:text-sm placeholder:text-white/20 focus:border-temo-gold/60 focus:bg-white/5 focus:outline-none transition-all rounded-sm resize-none"
                        />
                      </div>

                      <div className="flex flex-col sm:flex-row gap-4 items-center">
                        <button
                          type="submit"
                          className="w-full sm:w-auto px-10 py-3.5 bg-temo-gold text-temo-black text-xs font-bold tracking-[0.25em] hover:brightness-110 active:scale-[0.98] transition-all rounded-full"
                        >
                          送出訊息
                        </button>
                        <p className="text-xs text-temo-warm-gray/50">我們會在 1 個工作天內回覆</p>
                      </div>
                    </form>
                  ) : (
                    <div className="text-center py-20">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-temo-gold/10 border border-temo-gold/20 mb-6">
                        <svg className="w-8 h-8 text-temo-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <h3 className="text-2xl font-bold text-temo-white mb-3">感謝您的訊息！</h3>
                      <p className="text-temo-warm-gray text-sm max-w-sm mx-auto">
                        我們已收到您的需求，團隊會盡快與您聯繫，共同規劃最適合的設計方案。
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* ── Quote Calculator Tab ── */}
        <div
          style={{
            display: activeTab === "quote" ? "block" : "none",
          }}
        >
          <QuoteCalculator />
        </div>

        {/* ── Brief Tab ── */}
        <div style={{ display: activeTab === "brief" ? "block" : "none" }}>
          <section className="relative py-20 md:py-28 bg-[#161412]">
            <div
              className="absolute inset-0 pointer-events-none opacity-[0.03]"
              style={{
                backgroundImage:
                  "linear-gradient(#b0aca1 1px, transparent 1px), linear-gradient(90deg, #b0aca1 1px, transparent 1px)",
                backgroundSize: "60px 60px",
              }}
            />
            <div className="relative z-10 mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
              <QuoteBriefForm />
            </div>
          </section>
        </div>

      </main>
      <Footer />
    </>
  )
}
