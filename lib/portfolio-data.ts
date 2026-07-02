// ─────────────────────────────────────────────────────────────────────────────
// Portfolio demo data — UI 階段用，未來搬到 Payload CMS 時資料形狀直接對應：
//   CATEGORY_GROUPS / INDUSTRIES → Portfolio collection 的 select
//   DESIGNERS → Designers collection
//   CLIENTS   → Clients collection
//   WORKS     → Portfolio collection 的 docs（categoryGroup / industries /
//              clientSlug / designerSlugs 將改為 Payload relationship）
// ─────────────────────────────────────────────────────────────────────────────

// ─── 執行項目（單選） ──────────────────────────────────────────────────────────
// 註：欄位／型別沿用舊名 categoryGroup / CategoryGroupValue，避免全站大改名；
//     其值與標籤已換成「執行項目」這個維度（原本的「粗分類」）。
export const CATEGORY_GROUPS = [
  { value: "brand-planning", label: "品牌規劃設計" },
  { value: "logo-trademark", label: "Logo & 商標設計" },
  { value: "packaging", label: "包裝設計" },
  { value: "business-card", label: "名片設計" },
  { value: "menu", label: "菜單設計" },
  { value: "poster", label: "文宣 & 海報設計" },
  { value: "storefront", label: "店面設計" },
  { value: "web-visual", label: "網站視覺設計" },
  { value: "graphic", label: "圖文設計" },
  { value: "exhibition", label: "展覽設計" },
  { value: "merchandise", label: "應用周邊" },
] as const

export type CategoryGroupValue = (typeof CATEGORY_GROUPS)[number]["value"]

// ─── 行業分類（複選，獨立維度） ────────────────────────────────────────────────
// 與「執行項目」互不從屬：不論選了哪個執行項目，行業分類都固定顯示、可同時複選。
export const INDUSTRIES = [
  { value: "food-beverage", label: "餐飲" },
  { value: "beauty", label: "美業" },
  { value: "raw-material", label: "原料 & 盤商" },
  { value: "pet", label: "寵物" },
  { value: "engineering", label: "工程" },
  { value: "tech", label: "科技" },
  { value: "medical", label: "醫療" },
] as const

export type IndustryValue = (typeof INDUSTRIES)[number]["value"]

// ─── 設計師 ───────────────────────────────────────────────────────────────────
export type Designer = {
  slug: string
  name: string
  nameZh?: string
  role: string
  photo: string
  instagram?: string
  bio: string[]
  expertise: CategoryGroupValue[]
}

export const DESIGNERS: Designer[] = [
  {
    slug: "elise",
    name: "ELISE",
    nameZh: "王子豪 / 子麵",
    role: "Founder 負責人 / Creative Director 創意總監",
    photo: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&h=800&fit=crop&crop=face",
    instagram: "https://instagram.com/",
    bio: [
      "在物以類聚擔任船長。",
      "職業舞者與理工背景出身，將理性邏輯與次文化底蘊融合至作品之中，以大量手寫字及影像合成作品，迅速在流行文化與表演藝術領域打響知名度。",
      "擅長將設計結合市場思維，找出客戶品牌定位及獨特價值，並以「商業與藝術價值並進」為設計核心。",
    ],
    expertise: ["brand-planning", "packaging"],
  },
  {
    slug: "yvonne",
    name: "YVONNE",
    role: "Creative Director 創意總監",
    photo: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600&h=800&fit=crop&crop=face",
    instagram: "https://instagram.com/",
    bio: [
      "擅長品牌敘事與視覺策略，將品牌故事轉化為可被感受的視覺體驗。",
      "長期合作對象橫跨飲品、保養、餐飲等領域。",
    ],
    expertise: ["brand-planning", "web-visual"],
  },
  {
    slug: "kevin",
    name: "KEVIN",
    role: "Art Director 藝術總監",
    photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=800&fit=crop&crop=face",
    instagram: "https://instagram.com/",
    bio: [
      "專注於空間與工藝的對話，相信設計的氣質來自材質與光線的細節。",
      "近年作品多見於品牌展售空間與限量工藝品開發。",
    ],
    expertise: ["exhibition", "storefront"],
  },
  {
    slug: "shirley",
    name: "SHIRLEY",
    role: "Design Lead 設計總監",
    photo: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=600&h=800&fit=crop&crop=face",
    instagram: "https://instagram.com/",
    bio: [
      "包裝結構與印刷工藝出身，把每一道工序視為設計的延伸。",
      "擅長以細節與材質提升品牌的儀式感。",
    ],
    expertise: ["packaging", "brand-planning"],
  },
  {
    slug: "sim",
    name: "SIM",
    role: "Senior Designer 資深設計師",
    photo: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=600&h=800&fit=crop&crop=face",
    instagram: "https://instagram.com/",
    bio: [
      "數位介面與動態設計的整合者，擅長把品牌精神帶進使用者每一次互動。",
    ],
    expertise: ["web-visual", "poster"],
  },
]

export const DESIGNER_MAP: Record<string, Designer> = Object.fromEntries(
  DESIGNERS.map((d) => [d.slug, d])
)

// ─── 客戶 ─────────────────────────────────────────────────────────────────────
export type Client = {
  slug: string
  name: string
  brief?: string
}

export const CLIENTS: Client[] = [
  { slug: "ilo-taiwan", name: "國際語言奧林匹克", brief: "International Linguistics Olympiad 2025 台灣主辦" },
  { slug: "four-noble", name: "四喜雞煲", brief: "THE FOUR NOBLE 麻辣雞公煲品牌" },
  { slug: "smile-castle", name: "微笑城堡窗簾", brief: "SMILE CASTLE 全台連鎖窗簾品牌" },
  { slug: "ch-sleep", name: "嘉新名床", brief: "CH SLEEP 客製化枕頭與床墊專門店" },
  { slug: "mr-whiskey", name: "MR.WHISKEY", brief: "威士忌先生｜選品酒款" },
  { slug: "sun-yat-sen", name: "國父紀念館", brief: "第 60 屆金鐘獎 ╳ 台灣女孩日" },
  { slug: "huohuo-bbq", name: "火火燒肉販賣所", brief: "日式燒肉品牌" },
  { slug: "truse-x", name: "TRUSE X", brief: "高端運動護膚保養品牌" },
  { slug: "temo", name: "TEMO DESIGN", brief: "提摩設計" },
]

export const CLIENT_MAP: Record<string, Client> = Object.fromEntries(
  CLIENTS.map((c) => [c.slug, c])
)

// ─── 作品 ─────────────────────────────────────────────────────────────────────
export type Work = {
  id: number
  slug: string
  title: string
  subtitle: string
  categoryGroup: CategoryGroupValue      // 執行項目（單選）
  industries: IndustryValue[]            // 行業分類（複選）
  year: string
  clientSlug: string
  designerSlugs: string[]
  cover: string
  /** 作品影片連結（YouTube / Vimeo，選填）。有值時：列表卡片顯示 ▶ 標記、詳情頁嵌入播放器。 */
  videoUrl?: string
  size: "large" | "medium" | "small"
  description: string
  // ─── 案例詳細頁專用（皆為選填，CMS 上線後由 Payload 提供同名欄位覆寫） ─────
  /** 服務範疇 / 設計項目（例如「品牌策略」「包裝結構」） */
  services?: string[]
  /** 交付項目（例如「Logo、CIS 規範、包裝主視覺」） */
  deliverables?: string[]
  /** 案例敘事：挑戰 */
  challenge?: string
  /** 案例敘事：做法 / 設計策略 */
  approach?: string
  /** 案例敘事：成果 / 影響 */
  result?: string
  /** 圖片畫廊（已含 cover 時不要重複放） */
  gallery?: { src: string; alt?: string; caption?: string }[]
  /** 客戶引言 / 設計師 quote */
  quote?: { text: string; author?: string }
  /** 獎項紀錄 */
  awards?: string[]
}

// ─── 真實案例資料 ────────────────────────────────────────────────────────────
// 以下案例素材取自 https://temo.design/work，用於 demo 階段預覽。
// CMS 上線後將由 Payload 動態提供，這份檔案會保留為 fallback。
export const WORKS: Work[] = [
  {
    id: 1,
    slug: "ilo-2025",
    title: "2025 國際語言奧林匹克",
    subtitle: "International Linguistics Olympiad｜競賽識別",
    categoryGroup: "logo-trademark",
    industries: ["tech"],
    year: "2024",
    clientSlug: "ilo-taiwan",
    designerSlugs: ["elise", "yvonne"],
    cover:
      "/images/portfolio/ilo-2025.jpg",
    size: "large",
    description:
      "為 2025 年由台灣主辦的國際語言奧林匹克語言學科學競賽（International Linguistics Olympiad）打造國際性視覺標誌。",
    // size 用途見 PortfolioGrid：large=aspect 4/5、medium=1/1、small=4/3
    services: ["品牌策略", "Logo 設計", "活動視覺", "CIS 規範"],
    deliverables: ["主標誌", "輔助圖形", "色彩規範", "競賽周邊應用"],
    challenge:
      "這是台灣首次主辦此項國際性語言學賽事，識別需要同時承載「語言學」這個高度知識性的學科，以及「台灣作為主辦國」的文化能見度——既要被全球參賽者一眼讀懂，又不能落入民族符號的俗套。",
    approach:
      "Logo 採用圖地反轉手法，把中文「語」字嵌入字母負空間，讓中西方文化在同一個符號裡共生。色彩選用台灣國旗的紅與藍，下方的 TAIWAN 字標將「AI」以紅色獨立，呼應台灣作為科技與語言交會節點的當代位置。",
    result:
      "識別自正式發佈後被海內外語言學社群廣泛轉載，於 2025 WONDER GLOBAL DESIGN AWARDS 拿下商標類銀獎與活動視覺類優勝，建立此項賽事在台灣的視覺資產基礎。",
    awards: [
      "2025 WONDER GLOBAL DESIGN AWARDS — 商標類 銀獎",
      "2025 WONDER GLOBAL DESIGN AWARDS — 活動視覺類 優勝",
    ],
  },
  {
    id: 2,
    slug: "four-noble",
    title: "四喜雞煲 THE FOUR NOBLE",
    subtitle: "Brand Identity & Menu Design",
    categoryGroup: "menu",
    industries: ["food-beverage"],
    year: "2025",
    clientSlug: "four-noble",
    designerSlugs: ["shirley", "kevin"],
    cover:
      "/images/portfolio/four-noble.jpg",
    size: "small",
    description:
      "為新型態麻辣雞公煲品牌「四喜雞煲」打造完整的視覺識別與菜單系統，傳遞「一試難忘」的猛火快炒美味。",
    services: ["品牌主視覺", "菜單設計", "戶外燈箱", "開業海報"],
    deliverables: ["直式 / 橫式卷軸菜單", "樓層介紹燈箱", "主視覺 KV", "開業宣傳物"],
    challenge:
      "中式麻辣鍋市場已被「紅黑高飽和」視覺套牢，要讓四喜雞煲在第一眼就跳出來，又不能丟掉這個品類消費者熟悉的辛香慾望。",
    approach:
      "視覺以「四喜」為敘事核心，把產地直送的雞肉、秘製香料、猛火工藝、入味雞煲拆成四個圖騰，串成具有東方紋樣節奏的主視覺。菜單則以卷軸結構呈現，把點餐動線變成一段儀式。",
    result:
      "開業期間燈箱與菜單同步上線，視覺被獨立餐飲媒體與美食 KOL 自發轉發，建立品牌在開幕首月的高識別度。",
  },
  {
    id: 3,
    slug: "smile-castle",
    title: "微笑城堡窗簾 品牌重塑",
    subtitle: "SMILE CASTLE｜Brand Redesign",
    categoryGroup: "brand-planning",
    industries: ["engineering"],
    year: "2025",
    clientSlug: "smile-castle",
    designerSlugs: ["yvonne", "sim"],
    cover:
      "/images/portfolio/smile-castle.jpg",
    size: "medium",
    description:
      "把全台連鎖窗簾品牌「微笑城堡」從童趣印象，重塑為兼具溫度與信任感的現代家居品牌。",
    services: ["品牌策略", "商標重設計", "字標", "圖形系統", "色彩策略"],
    deliverables: ["新版主標誌", "輔助圖形", "色彩規範", "招牌應用準則"],
    challenge:
      "舊識別停留在「童話城堡」的卡通感，無法支撐品牌往中高端家居場域擴張的定位需求；同時又必須讓既有忠誠客戶仍認得出這是同一個品牌。",
    approach:
      "保留「城堡」與「微笑」這兩個原品牌的核心記憶點，重新提煉成更幾何化的曲線語彙；字標導入精緻襯線結構，整體色彩從繽紛轉為低彩度、高質感的家居色盤。",
    result:
      "品牌得以同時與既有經銷通路、與設計師選材通路對話，視覺資產可延伸至型錄、社群、實體門市的完整應用。",
  },
  {
    id: 4,
    slug: "ch-sleep",
    title: "CH SLEEP 嘉新名床",
    subtitle: "Brand Identity & Packaging",
    categoryGroup: "packaging",
    industries: ["medical"],
    year: "2025",
    clientSlug: "ch-sleep",
    designerSlugs: ["elise", "shirley"],
    cover:
      "/images/portfolio/ch-sleep.jpg",
    size: "medium",
    description:
      "嘉新名床從「在地老床墊行」蛻變為主打 20 年保固、客製化枕頭的當代睡眠專門品牌 CH SLEEP。",
    services: ["品牌命名", "Logo 設計", "色彩系統", "包裝設計", "品牌規範手冊"],
    deliverables: ["CH SLEEP 主標誌", "床品包裝", "C+Z / 雲朵 / 月相圖騰", "品牌指南"],
    challenge:
      "客戶 CAROL 想把家族老床墊店升級為值得信任的當代品牌，但又不希望失去老客戶心中那份「安穩、可靠」的記憶。",
    approach:
      "標誌將「C」做為保護的屋頂、「H」做為床的側面、中心元素呼應品牌主打的功能性客製枕頭。色彩採深海藍、煙灰紫、暖金黃，平衡了奢華與親近；包裝以 C+Z 圖騰、雲朵與月相鋪陳出「SLEEP WELL, LIVE WELL」的品牌主張。",
    result:
      "新品牌系統讓 CH SLEEP 得以同時對應實體門市與電商通路，並建立可延伸至寢具配件的視覺資產。",
    quote: {
      text: "他們完全理解我們想把老品牌帶去哪裡，整個過程是真正的信任合作。",
      author: "CAROL｜CH SLEEP 品牌主理人",
    },
  },
  {
    id: 5,
    slug: "mr-whiskey",
    title: "MR.WHISKEY 威士忌先生 酒袋設計",
    subtitle: "Packaging｜Whiskey Pouch",
    categoryGroup: "packaging",
    industries: ["food-beverage"],
    year: "2025",
    clientSlug: "mr-whiskey",
    designerSlugs: ["shirley"],
    cover:
      "/images/portfolio/mr-whiskey.jpg",
    size: "small",
    description:
      "為威士忌選品品牌 MR.WHISKEY 設計兼具收藏感與實用性的酒款外袋。",
    services: ["包裝結構", "主視覺", "燙印工藝", "材質選用"],
    deliverables: ["精裝酒袋", "袋身印刷物", "提把與封口結構"],
    challenge:
      "威士忌品類的禮盒包裝普遍走向極繁裝飾，但 MR.WHISKEY 客群偏向懂酒的選品消費者，需要一個低聲量、高質感的盛裝方案。",
    approach:
      "結構上拆除多餘的紙盒層級，改以單層卡紙袋搭配燙印標識；圖形回到酒款最核心的字標，材質讓觸感成為記憶點。",
    result:
      "袋身可重複作為收藏載體，也成為實體店面的識別物之一，延伸品牌「先生」這個語境的優雅感。",
  },
  {
    id: 6,
    slug: "golden-bell-60",
    title: "國父紀念館 金鐘 60",
    subtitle: "Public Art｜台灣女孩日",
    categoryGroup: "exhibition",
    industries: [],
    year: "2025",
    clientSlug: "sun-yat-sen",
    designerSlugs: ["kevin", "elise"],
    cover:
      "/images/portfolio/golden-bell-60.jpg",
    size: "medium",
    description:
      "為國父紀念館慶祝金鐘 60 屆與台灣女孩日策劃的公共藝術視覺，把「光、發聲、被看見」轉化為可被走入的場域。",
    services: ["公共藝術視覺", "活動主視覺", "現場裝置規劃"],
    deliverables: ["KV 主視覺", "館內導視", "戶外裝置概念"],
    challenge:
      "金鐘 60 與台灣女孩日兩個議題並置於同一檔期，需要一個能同時承接「影視產業里程碑」與「女性發聲」的視覺語言。",
    approach:
      "把金鐘獎的「鐘」結構抽象化為光波，呼應女孩日「被聽見」的核心議題；現場裝置採可穿越的開放結構，讓觀眾的身體成為作品的一部分。",
    result:
      "活動期間吸引大量自發拍照與社群分享，把場館訪客拉進議題本身的敘事中，創造跨齡參與。",
  },
  {
    id: 7,
    slug: "huohuo-bbq",
    title: "火火燒肉販賣所 菜單設計",
    subtitle: "Menu System｜Yakiniku Brand",
    categoryGroup: "menu",
    industries: ["food-beverage"],
    year: "2025",
    clientSlug: "huohuo-bbq",
    designerSlugs: ["sim", "shirley"],
    cover:
      "/images/portfolio/huohuo-bbq.jpg",
    size: "small",
    description:
      "為日式燒肉品牌「火火燒肉販賣所」設計能取代服務生介紹的菜單系統，讓點餐本身成為消費體驗。",
    services: ["菜單系統", "資訊架構", "插畫繪製", "印刷工藝"],
    deliverables: ["主菜單", "套餐 DM", "桌牌"],
    challenge:
      "燒肉店尖峰時段服務人力吃緊，必須讓菜單在沒有服務生說明的情況下，仍能讓客人快速理解部位、油花、推薦吃法。",
    approach:
      "把每個部位拆成「位置圖 + 風味標籤 + 建議烤法」三段結構，搭配手繪部位插畫；視覺以炭火紅黑為主色，把翻菜單這件事變成預熱食慾的過程。",
    result:
      "菜單上線後，店內首次點餐平均時間縮短，員工得以把心力放回桌邊服務與翻肉建議。",
  },
  {
    id: 8,
    slug: "truse-x",
    title: "TRUSE X 高端運動護膚",
    subtitle: "Premium Sports Skincare Brand",
    categoryGroup: "brand-planning",
    industries: ["beauty"],
    year: "2024",
    clientSlug: "truse-x",
    designerSlugs: ["yvonne", "elise"],
    cover:
      "/images/portfolio/truse-x.jpg",
    size: "medium",
    description:
      "為新興高端運動護膚保養品牌 TRUSE X 打造科學感與性能感並存的視覺系統。",
    services: ["品牌策略", "Logo", "包裝主視覺", "Tone of Voice"],
    deliverables: ["主標誌", "字標規範", "包裝視覺", "社群應用"],
    challenge:
      "運動護膚介於「保養」與「機能」之間，視覺要同時讓重訓族群感受到專業，又能說服日常保養客群相信效果。",
    approach:
      "以實驗室數據與運動軌跡為靈感，把字標壓縮為精密器具感的幾何結構；色系維持黑白為主、單一螢光色作為機能訊號，所有訊息層級都拆得乾淨可讀。",
    result:
      "品牌從上市第一支系列即建立「高機能性護膚」的記憶定位，延伸至後續產品線時整體視覺仍保有一致性。",
  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────
export function getCategoryLabel(value: CategoryGroupValue): string {
  return CATEGORY_GROUPS.find((c) => c.value === value)?.label ?? value
}

export function getIndustryLabel(value: string): string {
  return INDUSTRIES.find((i) => i.value === value)?.label ?? value
}

export function getWorksByDesigner(slug: string): Work[] {
  return WORKS.filter((w) => w.designerSlugs.includes(slug))
}

export function getWorksByClient(slug: string): Work[] {
  return WORKS.filter((w) => w.clientSlug === slug)
}

// 把可能被 hotlink 擋下來的外站圖（例如 cdn.myportfolio.com）
// 透過 wsrv.nl 圖片代理轉發；其他來源（本地 /images、Payload 上傳）原樣回傳。
// CMS 上線後客戶上傳的圖會放在自家儲存，不需要走代理。
export function proxyImage(src: string): string {
  if (!src) return src
  if (/^https?:\/\/(cdn\.myportfolio\.com|images\.unsplash\.com)/.test(src)) {
    const stripped = src.replace(/^https?:\/\//, "")
    return `https://wsrv.nl/?url=${encodeURIComponent(stripped)}&w=1600&output=webp&q=82`
  }
  return src
}

export function getAllYears(): string[] {
  return Array.from(new Set(WORKS.map((w) => w.year))).sort((a, b) => b.localeCompare(a))
}

export function getWorkBySlug(slug: string): Work | undefined {
  return WORKS.find((w) => w.slug === slug)
}

export function getRelatedWorks(slug: string, limit = 3): Work[] {
  const current = getWorkBySlug(slug)
  if (!current) return WORKS.slice(0, limit)
  const sameCategory = WORKS.filter(
    (w) => w.slug !== slug && w.categoryGroup === current.categoryGroup
  )
  const fillers = WORKS.filter((w) => w.slug !== slug && w.categoryGroup !== current.categoryGroup)
  return [...sameCategory, ...fillers].slice(0, limit)
}
