/**
 * 一次性種子資料：把目前寫死在程式碼裡的 portfolio / FAQ / services / testimonials / site-settings
 * 倒進 Payload。執行：pnpm seed
 */
import { getPayload } from 'payload'
import config from '../payload.config'

const PORTFOLIO_SEED = [
  {
    slug: 'tea-brand',
    title: '山野茶 品牌識別',
    subtitle: 'Brand Identity System',
    category: '品牌設計',
    year: '2024',
    client: '山野茶業',
    tags: ['Logo', 'VI系統', '包裝'],
    coverUrl: '/images/portfolio/tea-brand.jpg',
    size: 'large',
    description: '為台灣高山茶品牌建立完整識別系統，以山嵐霧氣為靈感，打造沉靜而充滿生命力的視覺語言。',
    content:
      '這是一個完整的品牌重塑項目，我們深入研究了茶文化的歷史和美學，創造了既現代又具有傳統韻味的視覺語言。\n\n設計過程包括：\n- 市場研究和消費者洞察\n- 品牌定位和策略制定\n- Logo 和視覺元素設計\n- 完整的識別指南編制\n- 應用場景設計',
    order: 1,
  },
  {
    slug: 'dining-packaging',
    title: '懷石 高端餐飲包裝',
    subtitle: 'Packaging Design',
    category: '包裝設計',
    year: '2024',
    client: '懷石料理',
    tags: ['包裝', '燙金', '餐飲'],
    coverUrl: '/images/portfolio/dining-packaging.jpg',
    size: 'medium',
    description: '以深黑與燙金的極致對比，呈現懷石料理的儀式感與精緻工藝。',
    content:
      '包裝設計不僅是保護產品的容器，更是品牌與消費者對話的媒介。\n\n本項目重點：\n- 材質選擇和工藝應用\n- 視覺層次的構建\n- 品牌元素的恰當運用\n- 消費者體驗的優化',
    order: 2,
  },
  {
    slug: 'skincare-brand',
    title: '初光 保養品牌策略',
    subtitle: 'Brand Strategy & Identity',
    category: '品牌設計',
    year: '2023',
    client: '初光保養',
    tags: ['品牌策略', 'VI', '美妝'],
    coverUrl: '/images/portfolio/skincare-brand.jpg',
    size: 'medium',
    description: '從品牌故事出發，為新興保養品牌建立清晰的市場定位與溫柔有力的視覺語言。',
    content:
      '面向年輕消費者的保養品牌案例，強調天然和科技的結合。\n\n項目內容：\n- 品牌定位研究\n- 視覺語言開發\n- 包裝系統設計\n- 行銷物料製作',
    order: 3,
  },
  {
    slug: 'pet-products',
    title: '毛孩研究室 產品系列',
    subtitle: 'Product Design',
    category: '產品設計',
    year: '2023',
    client: '毛孩研究室',
    tags: ['產品設計', '包裝', '寵物'],
    coverUrl: '/images/portfolio/pet-products.jpg',
    size: 'small',
    description: '以科學感與溫暖並存的設計語言，打造讓飼主信任、毛孩喜愛的產品系列。',
    content:
      '從市場分析到最終生產協助，完整的產品設計服務。\n\n設計亮點：\n- 創新的功能設計\n- 消費者友好的用戶界面\n- 可持續的材料選擇\n- 品牌一致性的視覺表達',
    order: 4,
  },
  {
    slug: 'craft-exhibition',
    title: 'KAIA 工藝展示空間',
    subtitle: 'Exhibition & Space Design',
    category: '工藝設計',
    year: '2024',
    client: 'KAIA Crafts',
    tags: ['空間設計', '展覽', '工藝'],
    coverUrl: '/images/portfolio/craft-exhibition.jpg',
    size: 'large',
    description: '為 KAIA 工藝品牌設計沉浸式展售空間，讓每件作品都在最恰當的光線與脈絡中被看見。',
    content:
      '將傳統工藝與當代空間設計相結合的專案。\n\n設計策略：\n- 空間流線規劃\n- 照明和氛圍設計\n- 互動體驗的融入\n- 工藝故事的呈現',
    order: 5,
  },
  {
    slug: 'beverage-rebrand',
    title: '湧泉 飲料品牌重塑',
    subtitle: 'Brand Redesign',
    category: '品牌設計',
    year: '2022',
    client: '湧泉飲品',
    tags: ['品牌重塑', '包裝', '飲料'],
    coverUrl: '/images/portfolio/beverage-rebrand.jpg',
    size: 'small',
    description: '為成立十年的老牌飲料注入新生命，在保留品牌資產的前提下，完成現代化轉型。',
    content:
      '經典品牌的現代化轉變案例，保留品牌精髓同時注入新活力。\n\n重塑重點：\n- 品牌故事的重新詮釋\n- 視覺形象的現代化\n- 市場定位的調整\n- 消費者接受度的驗證',
    order: 6,
  },
  {
    slug: 'logo-system',
    title: '提摩 標誌設計規範',
    subtitle: 'Logo & Design System',
    category: '品牌設計',
    year: '2024',
    client: 'TEMO DESIGN',
    tags: ['Logo', '設計規範', '識別'],
    coverUrl: '/images/portfolio/logo-system.jpg',
    size: 'medium',
    description: '自身品牌的完整標誌設計與規範手冊，從符號邏輯到應用場景，系統性地定義 TEMO 的視覺語言。',
    content: '自身品牌的完整標誌設計與規範手冊，從符號邏輯到應用場景。',
    order: 7,
  },
]

async function run() {
  const payload = await getPayload({ config })

  payload.logger.info('🌱 開始種子資料 seed...')

  // Portfolio
  for (const item of PORTFOLIO_SEED) {
    const existing = await payload.find({
      collection: 'portfolio',
      where: { slug: { equals: item.slug } },
      limit: 1,
    })
    if (existing.docs.length > 0) {
      payload.logger.info(`  - 已存在，跳過：${item.slug}`)
      continue
    }
    await payload.create({
      collection: 'portfolio',
      data: {
        ...item,
        published: true,
        tags: item.tags.map((t) => ({ tag: t })),
      } as any,
    })
    payload.logger.info(`  ✓ 新增：${item.slug}`)
  }

  // Site settings (global)
  await payload.updateGlobal({
    slug: 'site-settings',
    data: {
      name: 'TEMO DESIGN',
      description: '以人為本的品牌設計工作室。我們相信設計不只是造型，更是一種療癒與解方。服務超過 200+ 品牌。',
      email: 'info@temo.design',
      phone: '+886-2-1234-5678',
      address: '台北市大安區敦化南路一段 123 號 8 樓',
      socialLinks: {
        instagram: 'https://www.instagram.com/_temo_design/',
        facebook: 'https://www.facebook.com/temodesign',
        behance: 'https://www.behance.net/temodesign',
      },
    },
  })
  payload.logger.info('  ✓ 網站設定 site-settings 已寫入')

  payload.logger.info('🎉 種子資料完成。')
  process.exit(0)
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})
