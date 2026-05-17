"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"

export function NotFoundClient() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 60)
    return () => clearTimeout(t)
  }, [])

  return (
    <>
      <Navbar />
      <main className="pt-20 min-h-screen flex items-center bg-temo-black">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full">
          <div
            className="text-center"
            style={{
              transition: "opacity 0.8s ease, transform 0.8s ease",
              opacity: visible ? 1 : 0,
              transform: visible ? "translateY(0)" : "translateY(28px)",
            }}
          >
            <p className="text-xs tracking-[0.4em] text-temo-warm-gray mb-6 uppercase">
              Page Not Found
            </p>
            <h1 className="text-8xl md:text-[180px] font-bold text-temo-gold/20 leading-none mb-4 select-none">
              404
            </h1>
            <h2 className="text-2xl md:text-4xl font-bold text-temo-white mb-4 -mt-4">
              頁面未找到
            </h2>
            <p className="text-temo-warm-gray text-base mb-10 max-w-sm mx-auto leading-relaxed">
              抱歉，您要查找的頁面不存在。讓我們幫您返回正確的軌道。
            </p>

            <div
              className="flex flex-col sm:flex-row gap-4 justify-center"
              style={{
                transition: "opacity 0.8s ease 0.35s",
                opacity: visible ? 1 : 0,
              }}
            >
              <Link
                href="/"
                className="inline-block px-8 py-3 bg-temo-gold text-temo-black font-medium tracking-wider hover:brightness-110 transition-all"
              >
                返回首頁
              </Link>
              <Link
                href="/contact"
                className="inline-block px-8 py-3 border border-temo-warm-gray/40 text-temo-warm-gray font-medium tracking-wider hover:border-temo-gold hover:text-temo-gold transition-all"
              >
                聯絡我們
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
