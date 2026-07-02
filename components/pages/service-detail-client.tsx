"use client"

import { useEffect, useState } from "react"
import { useInView } from "@/hooks/use-in-view"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"

interface ServiceDetail {
  title: string
  titleEn: string
  description: string
  content: string
  portfolio: number
}

interface ServiceDetailClientProps {
  service: ServiceDetail
}

export function ServiceDetailClient({ service }: ServiceDetailClientProps) {
  const [visible, setVisible] = useState(false)
  const { ref: contentRef, isInView } = useInView<HTMLDivElement>({ once: true, amount: 0.1 })

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80)
    return () => clearTimeout(t)
  }, [])

  return (
    <>
      <Navbar />
      <main className="pt-20">
        {/* Hero */}
        <section className="relative min-h-[60vh] flex items-center overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-temo-black via-temo-dark to-temo-black" />
          <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full">
            <div
              style={{
                transition: "opacity 0.9s ease, transform 0.9s ease",
                opacity: visible ? 1 : 0,
                transform: visible ? "translateY(0)" : "translateY(28px)",
              }}
            >
              <p className="text-xs tracking-[0.4em] text-temo-gold mb-6 uppercase">Services</p>
              <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold text-temo-white mb-4 leading-tight">
                {service.title}
              </h1>
              <p className="text-temo-warm-gray text-xs tracking-[0.2em] mb-6">{service.titleEn}</p>
              <p className="text-lg md:text-xl text-temo-warm-gray max-w-2xl leading-relaxed">{service.description}</p>
            </div>
          </div>
        </section>

        {/* Content */}
        <section className="py-24 md:py-32 bg-temo-black">
          <div ref={contentRef} className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <div
              style={{
                transition: "opacity 0.8s ease, transform 0.8s ease",
                opacity: isInView ? 1 : 0,
                transform: isInView ? "translateY(0)" : "translateY(28px)",
              }}
            >
              {service.content.split("\n\n").map((paragraph, i) => (
                <p key={i} className="text-temo-warm-gray leading-relaxed mb-6 text-lg">
                  {paragraph}
                </p>
              ))}
            </div>

            {/* Stats */}
            <div
              className="mt-16 pt-16 border-t border-temo-warm-gray/20"
              style={{
                transition: "opacity 0.8s ease 0.2s, transform 0.8s ease 0.2s",
                opacity: isInView ? 1 : 0,
                transform: isInView ? "translateY(0)" : "translateY(24px)",
              }}
            >
              <div className="grid md:grid-cols-2 gap-12">
                <div>
                  <p className="text-temo-warm-gray/60 text-sm tracking-wider mb-2">此類別案例</p>
                  <p className="text-5xl font-bold text-temo-gold">{service.portfolio}+</p>
                </div>
                <div className="flex flex-col justify-end">
                  <p className="text-temo-warm-gray">準備好開始您的設計之旅了嗎？</p>
                  <a
                    href="/contact"
                    className="inline-block mt-4 bg-temo-gold text-temo-black px-6 py-3 font-medium hover:brightness-110 transition-all w-fit"
                  >
                    立即諮詢
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
