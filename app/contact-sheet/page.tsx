import type { Metadata } from "next"
import ContactPage from "@/app/contact/page"

export const metadata: Metadata = {
  title: "問卷表單",
  description: "填寫設計需求問卷，讓提摩設計了解您的品牌與專案需求。",
}

export const revalidate = 60

export default ContactPage
