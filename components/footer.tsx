"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { Mail, Phone, MapPin } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { SocialIcon, SOCIAL_PLATFORMS } from "@/components/social-icons"

type QuickLink = { href: string; label: string }
type SocialLink = { platform: string; href: string; label: string }

// 預設值＝目前站台既有連結；掛載後從 nav_links 覆蓋（後台可改）。
const DEFAULT_QUICK_LINKS: QuickLink[] = [
  { href: "/", label: "首頁" },
  { href: "/about", label: "關於我們" },
  { href: "/explore", label: "作品探索" },
  { href: "/faq", label: "常見問題" },
  { href: "/contact", label: "聯絡我們" },
]

// 預設值＝目前站台既有聯絡資訊；掛載後再從 site_settings 覆蓋（後台可改）。
const DEFAULTS = {
  email: "temo.design0531@gmail.com",
  phone: "0913-322-070",
  address: "台中市西區台灣大道二段229號13樓之2",
  instagram: "https://www.instagram.com/_temo_design/",
  facebook: "https://www.facebook.com/temodesignss",
}

function platformLabel(key: string) {
  return SOCIAL_PLATFORMS.find((p) => p.key === key)?.label ?? key
}

// social_links 表讀不到時（尚未套用 migration 0013）的 fallback，沿用原本站台 IG/FB。
const DEFAULT_SOCIAL_LINKS: SocialLink[] = [
  { platform: "instagram", href: DEFAULTS.instagram, label: platformLabel("instagram") },
  { platform: "facebook", href: DEFAULTS.facebook, label: platformLabel("facebook") },
]

export function Footer() {
  const [c, setC] = useState(DEFAULTS)
  const [quickLinks, setQuickLinks] = useState<QuickLink[]>(DEFAULT_QUICK_LINKS)
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>(DEFAULT_SOCIAL_LINKS)

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from("site_settings")
      .select("email, phone, address")
      .eq("id", 1)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) return
        setC((prev) => ({
          ...prev,
          email: data.email || prev.email,
          phone: data.phone || prev.phone,
          address: data.address || prev.address,
        }))
      })
    // 頁尾快速連結（後台可改）；讀不到就沿用預設。
    supabase
      .from("nav_links")
      .select("href, label, sort")
      .eq("location", "footer")
      .order("sort")
      .then(({ data }) => {
        if (data && data.length) setQuickLinks(data.map((r) => ({ href: r.href, label: r.label })))
      })
    // 社群連結（後台可改，任意多組）；表尚未建立或讀取失敗就沿用預設 IG/FB。
    supabase
      .from("social_links")
      .select("platform, href, visible, sort")
      .order("sort")
      .then(({ data, error }) => {
        if (error || !data) return
        const visible = data.filter((r) => r.visible && r.href)
        if (visible.length) {
          setSocialLinks(
            visible.map((r) => ({ platform: r.platform, href: r.href as string, label: platformLabel(r.platform) }))
          )
        } else if (data.length) {
          // 表已建立但目前沒有任何顯示中的連結 → 尊重後台設定，清空而非硬塞預設值
          setSocialLinks([])
        }
      })
  }, [])

  return (
    <footer className="bg-temo-black border-t border-temo-gold/20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* Brand Column */}
          <div className="flex flex-col gap-6">
            <img
              src="/temo-logo-wordmark.png"
              alt="TEMO DESIGN"
              className="h-14 w-auto self-start"
            />
            <p className="text-temo-warm-gray text-sm leading-relaxed max-w-xs">
              以人為本的品牌設計工作室。
              <br />
              我們相信設計不只是造型，更是一種療癒與解方。
            </p>
            {/* Social Links */}
            <div className="flex gap-2 -ml-3">
              {socialLinks.map((social) => (
                <a
                  key={social.platform}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-11 w-11 items-center justify-center text-temo-warm-gray hover:text-temo-gold transition-colors"
                  aria-label={social.label}
                >
                  <SocialIcon platform={social.platform} className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links Column */}
          <div>
            <h3 className="text-temo-white font-medium text-sm tracking-wider mb-6">
              快速連結
            </h3>
            <nav className="flex flex-col gap-1">
              {quickLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="py-1.5 text-temo-warm-gray hover:text-temo-gold transition-colors text-sm"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Contact Column */}
          <div>
            <h3 className="text-temo-white font-medium text-sm tracking-wider mb-6">
              聯絡資訊
            </h3>
            <div className="flex flex-col gap-1.5">
              <a
                href={`mailto:${c.email}`}
                className="flex items-center gap-3 py-2 text-temo-warm-gray hover:text-temo-gold transition-colors text-sm"
              >
                <Mail className="h-4 w-4" />
                {c.email}
              </a>
              <a
                href={`tel:${c.phone.replace(/[^0-9+]/g, "")}`}
                className="flex items-center gap-3 py-2 text-temo-warm-gray hover:text-temo-gold transition-colors text-sm"
              >
                <Phone className="h-4 w-4" />
                {c.phone}
              </a>
              <div className="flex items-start gap-3 text-temo-warm-gray text-sm">
                <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                <span>{c.address}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-temo-warm-gray/20">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-temo-cool-gray text-xs tracking-wider">
              © 2026 TEMO DESIGN. All Rights Reserved.
            </p>
            <div className="flex gap-6">
              <Link
                href="/privacy"
                className="text-temo-cool-gray hover:text-temo-gold transition-colors text-xs"
              >
                隱私權政策
              </Link>
              <Link
                href="/terms"
                className="text-temo-cool-gray hover:text-temo-gold transition-colors text-xs"
              >
                服務條款
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Brand Mark */}
      <div className="py-8 text-center">
        <span className="text-temo-warm-gray/30 text-sm tracking-[0.5em] font-bold">
          TEMO DESIGN
        </span>
      </div>
    </footer>
  )
}
