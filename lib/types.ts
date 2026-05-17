export interface PortfolioItem {
  id: string
  title: string
  titleZh: string
  category: string
  year: number
  description: string
  image?: string
  slug: string
}

export interface ServiceCategory {
  id: string
  title: string
  titleEn: string
  slug: string
  description: string
  details: string
  portfolioCount: number
}

export interface TeamMember {
  id: string
  name: string
  role: string
  specialty: string
  image?: string
}

export interface FAQ {
  id: string
  question: string
  answer: string
  category: string
}

export interface Stat {
  value: number
  label: string
  suffix: string
  description: string
}

export interface Testimonial {
  id: string
  text: string
  author: string
  company: string
  rating: number
}

export interface SiteConfig {
  name: string
  description: string
  url: string
  email: string
  phone: string
  address: string
  socialLinks: {
    instagram?: string
    facebook?: string
    behance?: string
  }
}
