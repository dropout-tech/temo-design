"use client"

import Link from "next/link"
import { Instagram, Facebook, Mail, Phone, MapPin } from "lucide-react"

const quickLinks = [
  { href: "/", label: "首頁" },
  { href: "/about", label: "關於我們" },
  { href: "/portfolio", label: "作品集" },
  { href: "/faq", label: "常見問題" },
  { href: "/contact", label: "聯絡我們" },
]

const socialLinks = [
  { href: "https://www.instagram.com/_temo_design/", icon: Instagram, label: "Instagram" },
  { href: "https://www.facebook.com/temodesign", icon: Facebook, label: "Facebook" },
]

export function Footer() {
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
            <div className="flex gap-4">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-temo-warm-gray hover:text-temo-gold transition-colors"
                  aria-label={social.label}
                >
                  <social.icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links Column */}
          <div>
            <h3 className="text-temo-white font-medium text-sm tracking-wider mb-6">
              快速連結
            </h3>
            <nav className="flex flex-col gap-3">
              {quickLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-temo-warm-gray hover:text-temo-gold transition-colors text-sm"
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
            <div className="flex flex-col gap-4">
              <a
                href="mailto:info@temo.design"
                className="flex items-center gap-3 text-temo-warm-gray hover:text-temo-gold transition-colors text-sm"
              >
                <Mail className="h-4 w-4" />
                info@temo.design
              </a>
              <a
                href="tel:+886-2-1234-5678"
                className="flex items-center gap-3 text-temo-warm-gray hover:text-temo-gold transition-colors text-sm"
              >
                <Phone className="h-4 w-4" />
                +886-2-1234-5678
              </a>
              <div className="flex items-start gap-3 text-temo-warm-gray text-sm">
                <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                <span>台北市大安區敦化南路一段 123 號 8 樓</span>
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
