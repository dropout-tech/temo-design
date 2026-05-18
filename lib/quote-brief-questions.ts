// Quote brief questionnaire data.
// Consolidated from 4 Google Forms (品牌設計 / 包裝設計 / 廣告文宣 / 名片設計)
// — see Playwright scrape on 2026-05-18.

export type BriefQuestionType =
  | "text"
  | "email"
  | "tel"
  | "paragraph"
  | "radio"
  | "checkbox"

export type BriefQuestion = {
  id: string
  label: string
  hint?: string
  type: BriefQuestionType
  required?: boolean
  options?: string[]
  placeholder?: string
  allowOther?: boolean
}

export type BriefSection = {
  id: string
  title: string
  titleEn: string
  description?: string
  // category id(s) this section applies to. undefined = always show.
  appliesTo?: ("brand" | "product" | "crafts")[]
  questions: BriefQuestion[]
}

export const briefSections: BriefSection[] = [
  // ─────────────────────────────────────────────
  // 1. 基本資料
  // ─────────────────────────────────────────────
  {
    id: "basic",
    title: "基本資料",
    titleEn: "BASIC INFO",
    description: "這些資料用於後續合約擬定，請務必填寫真實資訊。",
    questions: [
      { id: "company", label: "企業名稱", hint: "若暫無請寫「無」", type: "text", required: true, placeholder: "例：提摩設計" },
      { id: "name", label: "專案負責人姓名", type: "text", required: true, placeholder: "請填寫真實姓名" },
      { id: "phone", label: "聯絡電話", type: "tel", required: true, placeholder: "+886-9XX-XXX-XXX" },
      { id: "email", label: "電子郵件", type: "email", required: true, placeholder: "your@email.com" },
      { id: "address", label: "公司地址", hint: "請填寫真實地址", type: "text", required: true, placeholder: "台北市⋯" },
      { id: "taxId", label: "公司統編", hint: "若無，可填寫負責人身分證", type: "text", required: true, placeholder: "8 位統編" },
      {
        id: "invoice",
        label: "是否需要開立發票？",
        hint: "若需要開立發票，將由合作夥伴公司開立",
        type: "radio",
        required: true,
        options: ["是（報價 +5% 稅金）", "否"],
      },
    ],
  },

  // ─────────────────────────────────────────────
  // 2. 品牌訴求
  // ─────────────────────────────────────────────
  {
    id: "vision",
    title: "品牌訴求",
    titleEn: "BRAND VISION",
    description: "讓我們更聚焦您對品牌的想像，有助於後續定位與視覺發展。",
    questions: [
      {
        id: "origin",
        label: "想成立品牌的起源或初衷是什麼？",
        hint: "為什麼選擇以品牌發展，而不只是單純販售？歡迎詳答",
        type: "paragraph",
        required: true,
        placeholder: "說說品牌的故事⋯",
      },
      { id: "services", label: "品牌的主要服務或商品內容", type: "paragraph", required: true },
      {
        id: "audience",
        label: "未來主要面向的消費者（TA）",
        hint: "可複選；若有特殊族群可在最後一格補充",
        type: "checkbox",
        required: true,
        options: [
          "嬰幼兒族群 (0-7 歲)",
          "年輕族群、學生 (20-35 歲)",
          "小資家庭 (35-45 歲)",
          "中老年 (50 以上)",
          "單身上班族",
        ],
        allowOther: true,
      },
      { id: "uniqueness", label: "與市場上其他同行相比，您的品牌有什麼樣的獨特性？", type: "paragraph", required: true },
      {
        id: "positioning",
        label: "希望這個品牌在市場上的角色與定位",
        hint: "例如：創新、環保、舒適、設計感",
        type: "text",
        required: true,
      },
      {
        id: "personality",
        label: "假設您的品牌是一個人，您會怎麼向他人介紹它？",
        type: "paragraph",
        required: true,
      },
      {
        id: "competitors",
        label: "請提供 3 個您認為的對標品牌或競爭品牌",
        type: "paragraph",
        required: true,
      },
    ],
  },

  // ─────────────────────────────────────────────
  // 3. 視覺風格
  // ─────────────────────────────────────────────
  {
    id: "style",
    title: "視覺風格",
    titleEn: "VISUAL STYLE",
    description: "讓我們更了解您要的視覺方向，若有範例圖片之後可再提供給設計師。",
    questions: [
      {
        id: "styleDirection",
        label: "整體視覺風格偏好",
        hint: "可複選",
        type: "checkbox",
        required: true,
        options: [
          "簡約自然（日系留白感）",
          "可愛插畫風（親和力強、童趣）",
          "復古設計風（溫暖、時代手繪感）",
          "時尚潮感（搶眼有態度）",
          "專業質感（色調乾淨、簡約、高級感、大地色）",
          "溫馨低調（溫暖平易近人）",
          "未來機能性科技感",
          "賽博龐克 cyberpunk",
          "港式風格",
          "台灣在地",
          "法式浪漫",
          "東南亞風格（泰式、越南、馬來⋯）",
        ],
        allowOther: true,
      },
      {
        id: "colorDirection",
        label: "色彩方向偏好",
        hint: "可複選",
        type: "checkbox",
        required: true,
        options: [
          "柔和溫暖色系（奶油色、豆沙色、橄欖綠）",
          "清新自然色系（米色、淺木色、綠系⋯）",
          "高對比撞色（紅藍、黑黃⋯等視覺強烈組合）",
          "黑白灰極簡風格",
          "暖色可愛系（粉紅、鵝黃、天空藍⋯）",
          "時尚高級感（大地色系、莫蘭迪色系）",
        ],
        allowOther: true,
      },
      {
        id: "inspirations",
        label: "平時喜歡或關注的品牌／空間／設計案例？",
        hint: "說說吸引您的地方，可附連結",
        type: "paragraph",
        required: false,
      },
      {
        id: "applications",
        label: "未來品牌應用的重點項目",
        hint: "可複選",
        type: "checkbox",
        required: false,
        options: [
          "包裝設計",
          "官方網站／社群視覺",
          "門市空間設計",
          "展場／市集活動延伸",
          "品牌週邊（明信片、提袋、貼紙等）",
        ],
        allowOther: true,
      },
    ],
  },

  // ─────────────────────────────────────────────
  // 4. 願景與體驗
  // ─────────────────────────────────────────────
  {
    id: "outlook",
    title: "願景與體驗",
    titleEn: "EXPERIENCE & OUTLOOK",
    description: "辛苦了！這部分讓我們了解您對品牌未來的期待。",
    questions: [
      {
        id: "customerExperience",
        label: "希望顧客在門市或服務中能體驗到什麼？",
        type: "paragraph",
        required: false,
      },
      {
        id: "fiveYearGoal",
        label: "對於品牌 5 年內的發展目標與期待？",
        type: "paragraph",
        required: false,
      },
      {
        id: "fiveKeywords",
        label: "請用 5 個詞語形容這個品牌給顧客的感受或印象",
        hint: "例：溫暖、安心、有趣、天然、療癒、舒適、高級⋯",
        type: "text",
        required: false,
      },
      {
        id: "association",
        label: "希望未來客戶一看到您的品牌就聯想到什麼畫面或代名詞？",
        type: "paragraph",
        required: false,
      },
      {
        id: "channels",
        label: "未來產品銷售的主要通路",
        type: "checkbox",
        required: false,
        options: [
          "門市（餐廳、實體門市、街邊店）",
          "百貨公司／商城（櫃位、店面）",
          "官網",
          "展覽",
          "電商平台（MOMO、蝦皮、露天⋯）",
        ],
        allowOther: true,
      },
      { id: "slogan", label: "是否已有 Slogan？", type: "text", required: false, placeholder: "若有，請寫下" },
    ],
  },

  // ─────────────────────────────────────────────
  // 5a. 品牌類細節（名片 / 文宣）
  // ─────────────────────────────────────────────
  {
    id: "brand-detail",
    title: "名片 / 文宣細節",
    titleEn: "BRAND COLLATERAL",
    description: "若有名片、菜單或文宣設計需求，請協助填寫以下細節。可全部留空。",
    appliesTo: ["brand"],
    questions: [
      {
        id: "cardInfo",
        label: "名片需要放上的詳細資訊",
        hint: "建議 6 項以內，避免名片資訊過於擁擠",
        type: "checkbox",
        required: false,
        options: [
          "中文名",
          "英文名",
          "職稱",
          "個人電話",
          "公司電話",
          "統編",
          "地址",
          "網站（網址、QR 皆可）",
          "社群媒體（IG、FB）",
          "LINE（建議放 QR）",
          "SLOGAN",
          "產品服務",
        ],
        allowOther: true,
      },
      {
        id: "cardMaterial",
        label: "名片材質偏好",
        type: "radio",
        required: false,
        options: [
          "一般紙張（銅西、銅版、雪銅）— 僅限數位印刷",
          "UV 紙張（雙面亮／霧、局部上光）— 僅限數位印刷",
          "高級厚磅美術紙",
          "由設計師為您量身精選（多數客戶推薦）",
        ],
      },
      {
        id: "cardFinish",
        label: "後加工選擇",
        hint: "可複選，適用高級版方案；最多建議 1–3 種",
        type: "checkbox",
        required: false,
        options: [
          "上光（光影變化）",
          "導圓角",
          "燙色（燙金、燙銀、霧金屬⋯）",
          "特殊造型、軋型",
          "雷射雕刻",
          "打凸",
          "打凹",
          "壓印",
          "壓線",
          "對裱",
          "由設計師量身精選",
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────
  // 5b. 產品類細節（包裝）
  // ─────────────────────────────────────────────
  {
    id: "product-detail",
    title: "包裝設計細節",
    titleEn: "PACKAGING DETAIL",
    description: "辛苦了！這是針對包裝設計的最後一段。",
    appliesTo: ["product"],
    questions: [
      {
        id: "products",
        label: "產品的主要銷售內容",
        hint: "若有多類產品，請以 1. 2. 3. 標示品項及用途",
        type: "paragraph",
        required: true,
      },
      {
        id: "labels",
        label: "是否已有完整的法定標籤／仿單？",
        hint: "若沒有，請先確認法定規範格式及內容",
        type: "radio",
        required: true,
        options: [
          "有",
          "沒有",
          "還在更新中，之後提供",
          "設計師不用協助，包裝印出後自行處理",
        ],
      },
      {
        id: "dieline",
        label: "是否已有包裝刀模？（ai / pdf）",
        type: "radio",
        required: true,
        options: ["有，會提供給設計師", "沒有，須設計師另外設計刀模結構（價格另計）"],
      },
      {
        id: "printAssist",
        label: "是否需要協助印刷？",
        type: "radio",
        required: true,
        options: ["是", "否"],
      },
    ],
  },

  // ─────────────────────────────────────────────
  // 5c. 工藝類細節
  // ─────────────────────────────────────────────
  {
    id: "crafts-detail",
    title: "工藝專案細節",
    titleEn: "CRAFTS DETAIL",
    description: "讓我們更了解您對工藝專案的想像。",
    appliesTo: ["crafts"],
    questions: [
      {
        id: "craftsConcept",
        label: "想像中的工藝主題或概念",
        hint: "例：產地材料、文化敘事、聯名故事⋯",
        type: "paragraph",
        required: false,
      },
      {
        id: "craftsMaterial",
        label: "偏好或想嘗試的材質",
        hint: "可寫多種：陶、木、金屬、玻璃、複合媒材⋯",
        type: "text",
        required: false,
      },
      {
        id: "craftsQuantity",
        label: "預計製作數量／規模",
        type: "text",
        required: false,
        placeholder: "例：限量 50 件、單件藝術裝置⋯",
      },
      {
        id: "craftsChannel",
        label: "預計展示或銷售的場域",
        type: "paragraph",
        required: false,
      },
    ],
  },
]

export function getApplicableSections(categoryIds: string[]) {
  return briefSections.filter(
    (s) => !s.appliesTo || s.appliesTo.some((c) => categoryIds.includes(c))
  )
}
