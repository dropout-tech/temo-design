import { Metadata } from 'next'

export const siteConfig = {
  name: 'TEMO DESIGN',
  description: '以人為本的品牌設計工作室。我們相信設計不只是造型，更是一種療癒與解方。服務超過 200+ 品牌。',
  url: 'https://www.temo.design',
  email: 'temo.design0531@gmail.com',
  phone: '0913-322-070',
  address: '台北市大安區敦化南路一段 123 號 8 樓',
  socialLinks: {
    instagram: 'https://www.instagram.com/_temo_design/',
    facebook: 'https://www.facebook.com/temodesignss',
    behance: 'https://www.behance.net/temodesign0531',
  },
}

export const defaultMetadata: Metadata = {
  title: {
    default: 'TEMO DESIGN | 提摩設計',
    template: '%s | TEMO DESIGN',
  },
  description: siteConfig.description,
  keywords: [
    '品牌設計',
    '包裝設計',
    '提摩設計',
    'TEMO DESIGN',
    '品牌識別',
    '視覺設計',
    '台灣設計',
    '產品設計',
    '工藝設計',
  ],
  authors: [{ name: 'TEMO DESIGN' }],
  creator: 'TEMO DESIGN',
  openGraph: {
    type: 'website',
    locale: 'zh_TW',
    url: siteConfig.url,
    title: 'TEMO DESIGN | 提摩設計',
    description: siteConfig.description,
    siteName: 'TEMO DESIGN',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TEMO DESIGN | 提摩設計',
    description: siteConfig.description,
  },
  robots: {
    index: true,
    follow: true,
    'max-image-preview': 'large',
    'max-snippet': -1,
    'max-video-preview': -1,
  },
  verification: {
    google: '',
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#1a1a1a',
}
