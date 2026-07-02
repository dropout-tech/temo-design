// ─────────────────────────────────────────────────────────────────────────────
// 團隊名冊（設計師 / 廠商 / 顧問 / 夥伴）— 從 about 頁抽出的真實資料。
// 目前作為 Supabase designers 表的匯入來源；階段 4 會讓 about 頁改讀這份（單一真相）。
// slug 只給有真實身分、可能有獨立頁的人；廠商/夥伴為佔位，暫不給 slug。
// ─────────────────────────────────────────────────────────────────────────────

export type Person = {
  slug?: string
  name: string
  nameZh?: string
  role: string
  image: string
  instagram?: string
  bio?: string[]
  achievements?: string[]
  tags?: string[]
}

export const CATEGORY_ORDER = ["DESIGNER", "VENDOR", "CONSULTANT", "PARTNER"] as const
export type Category = (typeof CATEGORY_ORDER)[number]

export const TEAM: Record<Category, Person[]> = {
  DESIGNER: [
    {
      slug: "kevin",
      name: "KEVIN KUO",
      nameZh: "HSIAO YUAN KUO / 郭孝淵",
      role: "FOUNDER 創辦人 / CREATIVE DIRECTOR 創意總監",
      image: "/images/team/kevin.jpg",
      instagram: "https://instagram.com/",
      bio: [
        "藝術創作領域 14 年，設計領域 12 年。",
        "擅長以「視覺設計 × 消費心理 × 五感體驗」打造能實際轉化的品牌系統，讓產品與視覺不只好看，而是成為銷售工具。多數合作品牌在改版後，銷售與詢問度平均提升 20%–300% 不等，協助品牌在紅海市場中創造可被記住的差異。曾服務 NVIDIA、金鐘 60、裕隆集團、多家知名連鎖餐飲等單位，讓設計真正為業績助力。",
      ],
      achievements: [
        "國際 TEDxYouth 演講者",
        "KAIA 凱婭工藝 - 品牌長／前 gogoro 台中站前中心 - 廠長",
        "前澳洲 eternite 保養品牌 - 策略長",
        "AIFULI 艾芙莉 - 品牌及設計顧問",
        "台科大 / 中科大 / 朝陽科大 - 設計系受邀講師、評審",
        "2025 國父紀念館 x 金鐘 60 - 台灣女孩日 設計操刀",
        "2025 苗栗縣政府 X 裕隆集團 - 金波米燒酎禮盒設計師",
        "2025 WGA 國際設計競賽 - 1 銀 / 3 銅 / 2 優勝",
        "2021 LEXUS DESIGN AWARDS - 全球前 30",
        "2021 金點設計獎新秀獎 - 入圍",
        "2021 白鷺杯海峽兩岸工業設計競賽 - 入圍",
        "2019 JAMES DYSON AWARDS - 兩件作品收藏",
        "2019 IF STUDENTS DESIGN TALENT - 兩件作品收藏",
        "2019 TJDMA 國際珠寶競賽 - 入圍",
        "2019 總太建設藝術雕塑 - 2 件作品收藏",
        "2017 英國 MOXY 酒店（文心分店）- 裝置藝術合作設計師",
      ],
      tags: ["連鎖品牌", "禮盒包裝", "創意策畫", "商業策略"],
    },
    {
      slug: "shirley",
      name: "SHIRLEY LIU",
      nameZh: "雪莉",
      role: "VISUAL DESIGNER 視覺設計師",
      image: "/images/team/shirley.jpg",
      instagram: "https://instagram.com/",
      bio: [
        "從事平面設計超過 12 年，產品設計超過 8 年。",
        "擅長以「視覺設計 × 商業體驗」打造能實際轉化的視覺及展會布置系統，透過平面視覺讓人想打卡、參與活動。",
      ],
      achievements: [
        "跨國企業品牌設計部主管",
        "曾擔任多種活動總視覺負責人作品",
        "曾在台北市立圖書館展出",
        "2025 WGA 國際設計競賽 - 1 優勝",
        "IF STUDENT DESIGN TALENT - 概念設計典藏",
        "中正紀念堂文創商品設計大賽 - 優選",
      ],
      tags: ["平面海報", "形象視覺", "名片設計", "2D 插畫"],
    },
    {
      slug: "elise",
      name: "ELISE WU",
      nameZh: "伊莉絲",
      role: "VISUAL DESIGNER 視覺設計師",
      image: "/images/team/elise.jpg",
      instagram: "https://instagram.com/",
      bio: [
        "品牌視覺設計師與插畫創作者，專注於品牌識別、包裝設計與視覺敘事，長期關注品牌敘事與視覺語言的轉譯。",
        "具品牌端實務與跨領域合作經驗，同時參與多項年度視覺開發計畫，擅長從概念發展延伸至視覺整合，將抽象想法轉化為清晰且具有系統性的設計語言。在結構與直覺之間取得平衡，創造兼具美感與商業溝通力的視覺表現。",
      ],
      achievements: [
        "現任連鎖咖啡品牌端 - 視覺設計師",
        "裕隆集團 苗栗大安溪生態公園辦復育 - VIP 禮盒設計師",
        "捷絡生技 TRUSE X - 包裝設計師",
        "王山而熟成雞肉飯連鎖 - 視覺設計師",
        "MR.WHISKY 威士忌先生 限定威士忌 - 酒標設計師",
        "呼嚕塔克寵物品牌 - 視覺暨包裝設計師",
      ],
      tags: ["品牌設計", "視覺策畫", "包裝設計", "跨部門整合"],
    },
    {
      slug: "simik",
      name: "SIMIK LIN",
      nameZh: "林育詩",
      role: "VISUAL DESIGNER 視覺設計師",
      image: "/images/team/simik.jpg",
      instagram: "https://instagram.com/",
      bio: [
        "從事平面品牌設計領域邁入 12 年。",
        "隨機應變保持彈性度。善於處理細節、洞察分析、整合脈絡方向，在亂中找到秩序與規律，以及尋找其中的獨特性。對於事物間的順序步驟以及運作方式充滿興趣。",
      ],
      achievements: [
        "曾任水美媒品牌企劃部 - 設計企劃",
        "曾任韓國 ETERNITE 保養品 - 商業及視覺設計師",
        "101 瑞記雞飯 / 瑞記海南雞飯連鎖 - 平面設計師",
        "新光三越 四喜雞煲 - 周邊應用平面設計師",
        "2025 WGA 國際設計競賽 - 2 銅獎",
      ],
      tags: ["品牌設計", "平面設計", "包裝設計", "電商設計"],
    },
    {
      slug: "sofia",
      name: "SOFIA HUANG",
      nameZh: "黃丞儀",
      role: "VISUAL DESIGNER 視覺設計師",
      image: "/images/team/sofia.jpg",
      instagram: "https://instagram.com/",
      bio: [
        "擅長視覺設計與插畫設計，為品牌建立專屬識別形象並延伸產品、場域。曾與國父紀念館、台中文化創意園區等單位合作，服務品牌涵蓋餐飲、旅宿、藥妝、珠寶等產業。",
      ],
      achievements: [
        "澳門蛋四分連鎖 - 餐車及連鎖店面視覺設計師",
        "微笑城堡窗簾 - 連鎖店面及視覺應用設計師",
        "2025 國父紀念館 x 金鐘 60 - 台灣女孩日 設計操刀",
        "2025 WGA 國際設計競賽 1 銅獎",
        "2024 國立中興大學農推中心 - 壁畫設計師",
        "2022 ADC 紐約藝術指導協會年度獎 入圍",
        "2022 金點新秀設計獎 包裝設計類 入圍",
      ],
      tags: ["品牌企劃", "平面設計", "店面裝飾", "2D 插畫"],
    },
    {
      slug: "eunice",
      name: "EUNICE ZHAUNG",
      nameZh: "毓庭",
      role: "VISUAL DESIGNER 視覺設計師",
      image: "/images/team/eunice.jpg",
      instagram: "https://instagram.com/",
      bio: [
        "致力於醫療、餐飲及商辦領域的品牌全案開發。",
        "擅長將室內空間機能與品牌識別深度整合，提供從商標設計、視覺形象到空間整合的全方位規劃。憑藉專業的跨產業觀察，協助品牌在實體場域中精準傳遞其獨特理念。",
      ],
      achievements: [
        "曾任職某知名飲料連鎖總公司 - 執行秘書",
        "曾任職室內裝修設計公司 - 平面設計師",
        "國立資訊圖書館設計師之手 - 作品典藏",
      ],
      tags: ["品牌設計", "平面設計", "視覺整合", "室內裝飾"],
    },
    {
      slug: "ada",
      name: "ADA YAN",
      nameZh: "艾達",
      role: "VISUAL DESIGNER 視覺設計師",
      image: "/images/team/ada.jpg",
      instagram: "https://instagram.com/",
      bio: [
        "擁有 7 年設計經驗，橫跨品牌、電商與展覽平面視覺領域，服務產業涵蓋餐飲、電商、醫療器材、不動產、寵物、政府標案及化妝品等。",
        "設計風格以日系質感為主，並能依據不同品牌需求靈活調整視覺表現。",
      ],
      achievements: [
        "日本化妝品品牌 - 品牌設計師",
        "曾任台灣眼鏡進口總代理 - 品牌設計",
        "曾參與多家不動產 - 廣告視覺設計",
        "曾執行昭和十八市集專案設計 - 平面視覺設計",
        "曾參與多項嘉義市政府標案 - 視覺設計",
      ],
      tags: ["廣告企劃", "平面設計", "電商設計", "展覽設計"],
    },
  ],
  VENDOR: [
    { name: "VENDOR 01", role: "印刷夥伴", image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=600&fit=crop&crop=face" },
    { name: "VENDOR 02", role: "影像製作", image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=600&fit=crop&crop=face" },
    { name: "VENDOR 03", role: "後製團隊", image: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&h=600&fit=crop&crop=face" },
    { name: "VENDOR 04", role: "特殊工藝", image: "https://images.unsplash.com/photo-1521119989659-a83eee488004?w=400&h=600&fit=crop&crop=face" },
    { name: "VENDOR 05", role: "物料供應", image: "https://images.unsplash.com/photo-1463453091185-61582044d556?w=400&h=600&fit=crop&crop=face" },
  ],
  CONSULTANT: [
    {
      slug: "jerry",
      name: "JERRY WANG",
      nameZh: "王志翔",
      role: "INTELLECTUAL PROPERTY & PATENT ATTORNEY 智慧財產及專利師",
      image: "/images/team/jerry.jpg",
      bio: [
        "擁有逾 30 年智慧財產權實務經驗，深耕專利與商標領域，橫跨台灣與中國市場，協助企業建立完整智財布局與競爭優勢。",
        "曾任知名專利商標事務所資深主管，主導專利申請、商標策略及跨國案件規劃，實戰經驗豐富，深受企業信賴。",
        "具備科技與法律雙重背景，能精準掌握技術核心並轉化為智慧財產價值，並擔任智財培訓講師，長期投入產業推廣。",
        "持有中國專利代理師及商標代理人資格，提供企業一站式兩岸智財服務。",
      ],
      achievements: [
        "國立台灣科技大學高階科技研發學程碩士 (EMRD)",
        "台北城市科技大學電機系",
        "政治大學法律研究所碩士學分班",
        "交大科技法律研究所推廣教育碩士學分班專利工程師結業",
        "大陸通商專業事務所資深副總經理 (2004-2019)",
        "長江專利商標事務所經理 (1990-2004)",
        "經濟部智慧財產局智財培訓學院種籽師資",
        "經濟部智慧財產局保護智慧財產權服務團講師",
        "中國專利代理師、商標代理人",
      ],
      tags: ["設計專利", "智慧財產權", "合約保障"],
    },
    {
      slug: "tina",
      name: "TINA WANG",
      nameZh: "티나（韓國、歐洲線）",
      role: "INTELLECTUAL PROPERTY & PATENT ATTORNEY 智慧財產及專利師",
      image: "/images/team/tina.jpg",
      bio: [
        "具備跨國學歷與國際實務經驗，專精專利商標布局與品牌國際化發展。畢業於國立政治大學，並於北京清華大學、首爾市立大學及韓國外國語大學進修，取得全球文化產業碩士，具備跨文化整合與語言優勢。",
        "曾任韓國前三大專利商標事務所大中華區負責人，長期協助企業進行跨境智財布局與市場拓展，熟悉韓國、台灣及中國實務。",
        "服務涵蓋知名太陽眼鏡品牌與化妝品企業，結合品牌與智財策略，協助企業打造國際競爭力。",
      ],
      achievements: [
        "國立政治大學 斯拉夫語文學系（主修）",
        "國立政治大學 韓文系（輔系）",
        "北京清華大學",
        "首爾市立大學",
        "韓國外國語大學",
        "全球文化產業系（碩士）",
      ],
      tags: ["設計專利", "智慧財產權", "國際化商業"],
    },
  ],
  PARTNER: [
    { name: "PARTNER 01", role: "創意夥伴", image: "https://images.unsplash.com/photo-1542909168-82c3e7fdca5c?w=400&h=600&fit=crop&crop=face" },
    { name: "PARTNER 02", role: "技術夥伴", image: "https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=400&h=600&fit=crop&crop=face" },
    { name: "PARTNER 03", role: "媒體夥伴", image: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=400&h=600&fit=crop&crop=face" },
    { name: "PARTNER 04", role: "通路夥伴", image: "https://images.unsplash.com/photo-1607990281513-2c110a25bd8c?w=400&h=600&fit=crop&crop=face" },
    { name: "PARTNER 05", role: "國際夥伴", image: "https://images.unsplash.com/photo-1513956589380-bad6acb9b9d4?w=400&h=600&fit=crop&crop=face" },
  ],
}
