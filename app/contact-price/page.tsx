import type { Metadata } from "next"
import ContactPage from "@/app/contact/page"

export const metadata: Metadata = {
  title: "方案報價",
  description: "查看提摩設計服務方案，透過即時報價試算了解設計費用。",
}

export const revalidate = 60

export default ContactPage
