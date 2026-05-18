"use client"

import { useEffect, useState, useRef } from "react"
import type { MouseEvent as ReactMouseEvent } from "react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { LogoMeaningSection } from "@/components/sections/logo-meaning-section"
import { StatsSection } from "@/components/sections/stats-section"
import { ClientsHonorsSection } from "@/components/sections/clients-honors-section"
import { ArrowUpRight, ChevronDown, Instagram, X } from "lucide-react"
import Link from "next/link"

type Person = {
  name: string
  nameZh?: string
  role: string
  image: string
  instagram?: string
  bio?: string[]
  achievements?: string[]
  tags?: string[]
}

const CATEGORY_ORDER = ["DESIGNER", "VENDOR", "CONSULTANT", "PARTNER"] as const
type Category = (typeof CATEGORY_ORDER)[number]

const categories: Record<Category, Person[]> = {
  DESIGNER: [
    {
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

function DesignerCard({ person, onClick }: { person: Person; onClick?: () => void }) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [tilt, setTilt] = useState<string>("")
  const [hovered, setHovered] = useState(false)

  const handleMouseMove = (e: ReactMouseEvent<HTMLDivElement>) => {
    const el = cardRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const dx = (x - rect.width / 2) / (rect.width / 2)
    const dy = (y - rect.height / 2) / (rect.height / 2)
    const rotateY = dx * 10
    const rotateX = -dy * 10
    const translateX = dx * 8
    const translateY = dy * 8
    setTilt(
      `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translate3d(${translateX}px, ${translateY}px, 0) scale(1.04)`
    )
  }

  const handleMouseLeave = () => {
    setHovered(false)
    setTilt("")
  }

  return (
    <div
      ref={cardRef}
      onMouseEnter={() => setHovered(true)}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => (e.key === "Enter" || e.key === " ") && onClick() : undefined}
      className="group relative shrink-0 w-40 h-64 md:w-48 md:h-80 cursor-pointer"
      style={{
        transform: tilt || "perspective(900px)",
        transition: hovered ? "transform 0.08s ease-out" : "transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
        transformStyle: "preserve-3d",
        willChange: "transform",
      }}
    >
      <div
        className="relative overflow-hidden rounded-[80px] md:rounded-[100px] w-full h-full"
        style={{
          boxShadow: hovered
            ? "0 30px 60px -15px rgba(0, 0, 0, 0.65)"
            : "0 15px 35px -15px rgba(0, 0, 0, 0.4)",
          transition: "box-shadow 0.4s ease",
        }}
      >
        <img
          src={person.image}
          alt={person.name}
          className="w-full h-full object-cover transition-all duration-500 filter grayscale group-hover:grayscale-0"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute bottom-6 md:bottom-8 left-0 right-0 text-center px-2">
          <span className="font-bold text-white tracking-wider text-lg md:text-xl block">
            {person.name}
          </span>
        </div>
      </div>
    </div>
  )
}

function DesignerDetailPanel({
  person,
  onClose,
}: {
  person: Person | null
  onClose: () => void
}) {
  const open = !!person

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        aria-hidden="true"
        className={`fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm transition-opacity duration-500 ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      />
      {/* Slide-in panel */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-hidden={!open}
        className={`fixed top-0 right-0 z-[101] h-full w-full md:w-[min(1080px,94vw)] bg-temo-black border-l border-white/10 shadow-[0_0_80px_rgba(0,0,0,0.6)] transition-transform duration-[500ms] ease-[cubic-bezier(0.4,0,0.2,1)] ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {person && (
          <div className="relative h-full overflow-y-auto">
            <button
              type="button"
              onClick={onClose}
              aria-label="關閉"
              className="absolute top-6 right-6 z-10 w-11 h-11 rounded-full border border-white/20 flex items-center justify-center text-white/70 hover:text-white hover:border-white/60 hover:bg-white/5 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="grid md:grid-cols-[auto_1fr] gap-10 md:gap-16 p-8 md:p-16 lg:p-20 min-h-full">
              {/* Portrait */}
              <div className="relative w-full max-w-[340px] md:w-[340px] aspect-[3/4] md:h-[560px] md:aspect-auto rounded-[160px] md:rounded-[180px] overflow-hidden bg-white/5 mx-auto md:mx-0">
                <img
                  src={person.image}
                  alt={person.name}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Info */}
              <div className="flex flex-col gap-5 pt-2 md:pt-8 max-w-xl">
                <h2 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight text-white leading-[0.95]">
                  {person.name}
                </h2>

                {person.nameZh && (
                  <p className="text-sm md:text-base text-white pt-2">
                    <span className="font-bold">{person.name}</span>
                    <span className="text-white/70"> {person.nameZh}</span>
                  </p>
                )}

                <p className="text-xs md:text-sm text-white/60 tracking-wide">
                  {person.role}
                </p>

                {person.instagram && (
                  <a
                    href={person.instagram}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="Instagram"
                    className="inline-flex w-10 h-10 rounded-full border border-white/20 items-center justify-center text-white/70 hover:text-white hover:border-white/60 hover:bg-white/5 transition"
                  >
                    <Instagram className="w-4 h-4" />
                  </a>
                )}

                {person.bio && person.bio.length > 0 && (
                  <div className="space-y-4 text-white/80 leading-[2] text-sm md:text-[15px] mt-4">
                    {person.bio.map((p, i) => (
                      <p key={i}>{p}</p>
                    ))}
                  </div>
                )}

                {person.achievements && person.achievements.length > 0 && (
                  <ul className="mt-6 space-y-2 text-white/75 text-sm md:text-[15px] leading-[1.8]">
                    {person.achievements.map((a, i) => (
                      <li key={i} className="flex gap-3">
                        <span aria-hidden className="mt-[0.55em] inline-block w-2.5 h-2.5 shrink-0 bg-white/60" />
                        <span>{a}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {person.tags && person.tags.length > 0 && (
                  <div className="mt-8 flex flex-wrap gap-2">
                    {person.tags.map((t, i) => (
                      <span
                        key={i}
                        className="text-xs md:text-sm text-white/70 border border-white/20 rounded-full px-3 py-1"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  )
}

export function AboutPageClient() {
  const [visible, setVisible] = useState(false)
  const [activeCategory, setActiveCategory] = useState<Category>("DESIGNER")
  const [menuOpen, setMenuOpen] = useState(false)
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const marqueeContainerRef = useRef<HTMLDivElement>(null)
  const marqueeTrackRef = useRef<HTMLDivElement>(null)
  const mouseXRef = useRef<number | null>(null)
  const translateXRef = useRef(0)

  const currentList = categories[activeCategory]
  const shouldMarquee = currentList.length >= 4

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80)
    return () => clearTimeout(t)
  }, [])

  // Reset marquee position when switching category
  useEffect(() => {
    translateXRef.current = 0
    if (marqueeTrackRef.current) {
      marqueeTrackRef.current.style.transform = "translate3d(0, 0, 0)"
    }
  }, [activeCategory])

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!menuOpen) return
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [menuOpen])

  useEffect(() => {
    let rafId = 0
    const MAX_SPEED = 5 // px per frame
    const EDGE_RATIO = 0.3 // 30% from each edge is the trigger zone

    const tick = () => {
      const container = marqueeContainerRef.current
      const track = marqueeTrackRef.current
      if (container && track) {
        const containerWidth = container.clientWidth
        // Use the offsetLeft of the duplicated set's first item as the exact wrap distance
        const secondSetFirst = track.children[currentList.length] as HTMLElement | undefined
        const wrapWidth = secondSetFirst?.offsetLeft ?? track.scrollWidth / 2

        let speed = 0
        const mouseX = mouseXRef.current
        if (mouseX !== null && wrapWidth > 0) {
          const edgeZone = containerWidth * EDGE_RATIO
          if (mouseX < edgeZone) {
            const intensity = 1 - mouseX / edgeZone
            speed = intensity * MAX_SPEED // positive = track moves right
          } else if (mouseX > containerWidth - edgeZone) {
            const intensity = (mouseX - (containerWidth - edgeZone)) / edgeZone
            speed = -intensity * MAX_SPEED
          }
        }

        if (speed !== 0 && wrapWidth > 0) {
          translateXRef.current += speed
          if (translateXRef.current > 0) translateXRef.current -= wrapWidth
          else if (translateXRef.current < -wrapWidth) translateXRef.current += wrapWidth
          track.style.transform = `translate3d(${translateXRef.current}px, 0, 0)`
        }
      }
      rafId = requestAnimationFrame(tick)
    }
    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
  }, [currentList.length])

  const handleMarqueeMouseMove = (e: ReactMouseEvent<HTMLDivElement>) => {
    const rect = marqueeContainerRef.current?.getBoundingClientRect()
    if (!rect) return
    mouseXRef.current = e.clientX - rect.left
  }

  const handleMarqueeMouseLeave = () => {
    mouseXRef.current = null
  }

  return (
    <>
      <Navbar />
      <main className="pt-20">
        {/* Hero — light-themed manifesto */}
        <section className="relative min-h-[88vh] flex flex-col overflow-hidden bg-[#bdbcb7]">
          {/* Background：整張岩石圖 + 白色遮罩 */}
          <div className="absolute inset-0 pointer-events-none">
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage: `url("/images/about/hero.jpg")`,
                filter: "grayscale(100%)",
              }}
            />
            {/* 白色遮罩：把整張照片柔化成淺色紋理 */}
            <div className="absolute inset-0 bg-white/65" />
          </div>

          {/* 右下角斜線裝飾 */}
          <div
            aria-hidden="true"
            className="absolute bottom-20 right-6 md:right-12 z-10 pointer-events-none"
            style={{
              transition: "opacity 1.1s ease 0.6s",
              opacity: visible ? 0.55 : 0,
            }}
          >
            <svg
              width="56"
              height="56"
              viewBox="0 0 56 56"
              fill="none"
              className="text-[#2a2a28]"
            >
              <line x1="6" y1="50" x2="50" y2="6" stroke="currentColor" strokeWidth="1.5" />
              <line x1="20" y1="50" x2="50" y2="20" stroke="currentColor" strokeWidth="1.5" />
              <line x1="34" y1="50" x2="50" y2="34" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </div>

          {/* 主內容：左右雙欄；靠上對齊讓文字停在岩石上方乾淨區 */}
          <div className="relative z-10 flex-1 flex items-start">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-12 w-full pt-20 md:pt-24 pb-12">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
                {/* 左欄：英文 manifesto，三段層級 */}
                <div className="lg:col-span-7">
                  <h1
                    style={{
                      transition: "opacity 0.9s ease, transform 0.9s ease",
                      opacity: visible ? 1 : 0,
                      transform: visible ? "translateY(0)" : "translateY(28px)",
                    }}
                    className="text-4xl md:text-5xl lg:text-6xl font-bold text-[#2a2a28] leading-[1.05] tracking-tight"
                  >
                    WE DESIGN WHAT LASTS
                  </h1>

                  <div
                    style={{
                      transition: "opacity 0.9s ease 0.18s, transform 0.9s ease 0.18s",
                      opacity: visible ? 1 : 0,
                      transform: visible ? "translateY(0)" : "translateY(20px)",
                    }}
                    className="mt-8 md:mt-10 space-y-1.5"
                  >
                    <p className="text-xs md:text-sm tracking-[0.32em] text-[#4a4a47] uppercase font-medium">
                      Shaped by time
                    </p>
                    <p className="text-xs md:text-sm tracking-[0.32em] text-[#6e6e6a] uppercase font-medium">
                      Defined by precision
                    </p>
                  </div>

                  <h2
                    style={{
                      transition: "opacity 0.9s ease 0.3s, transform 0.9s ease 0.3s",
                      opacity: visible ? 1 : 0,
                      transform: visible ? "translateY(0)" : "translateY(20px)",
                    }}
                    className="mt-10 md:mt-14 text-2xl md:text-3xl lg:text-4xl font-bold text-[#2a2a28] tracking-tight"
                  >
                    BUILT TO BECOME
                  </h2>
                </div>

                {/* 右欄：中文敘事 + CTA */}
                <div
                  className="lg:col-span-5 lg:pt-2"
                  style={{
                    transition: "opacity 0.9s ease 0.4s, transform 0.9s ease 0.4s",
                    opacity: visible ? 1 : 0,
                    transform: visible ? "translateY(0)" : "translateY(20px)",
                  }}
                >
                  <div className="space-y-5 text-[#3a3a37] text-[15px] md:text-base leading-[1.85] max-w-md lg:max-w-none">
                    <p>
                      提摩不為短暫的流行而設計，而是專注於創造能夠長久存在的價值。每一個品牌，都是在時間中被塑造；每一個細節，都是精準思考後的結果。
                    </p>
                    <p>
                      我們相信，真正有力量的設計，不只是被看見，而是能夠被記住、被信任，最終成為品牌的一部分。
                    </p>
                    <p>
                      不是瞬間的亮點，而是能夠沉澱、承載，並持續發生影響的存在。
                    </p>
                  </div>

                  <Link
                    href="/quote"
                    className="group mt-10 inline-flex items-center gap-3 px-7 py-3.5 border border-[#2a2a28] rounded-full text-sm text-[#2a2a28] hover:bg-[#2a2a28] hover:text-[#e7e6e2] transition-colors"
                  >
                    <span className="tracking-wider">填寫設計報價表單</span>
                    <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* 底部標語三段：TIME BUILT · PRECISION DRIVEN · LEGACY FORMED */}
          <div
            className="relative z-10 border-t border-[#2a2a28]/15"
            style={{
              transition: "opacity 0.9s ease 0.55s",
              opacity: visible ? 1 : 0,
            }}
          >
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-12 py-5 md:py-6 grid grid-cols-3 gap-4 text-[10px] md:text-[11px] tracking-[0.4em] uppercase text-[#3a3a37]">
              <span className="text-left">Time Built</span>
              <span className="text-center">Precision Driven</span>
              <span className="text-right">Legacy Formed</span>
            </div>
          </div>
        </section>

        {/* Designer Team Section */}
        <section className="relative py-16 bg-gradient-to-b from-temo-black to-temo-dark overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-temo-gold/20 to-transparent" />
          </div>

          <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {/* Section Label */}
            <div
              className="flex items-center justify-center gap-6 md:gap-12 mb-12"
              style={{
                transition: "opacity 0.8s ease",
                opacity: visible ? 1 : 0,
              }}
            >
              <div className="h-px w-16 md:w-24 bg-white/20" />

              <div ref={menuRef} className="relative">
                <button
                  type="button"
                  onClick={() => setMenuOpen((o) => !o)}
                  className="flex items-center gap-3 px-6 md:px-8 py-3 border border-white/30 rounded-full hover:bg-white/5 transition-colors"
                  aria-haspopup="listbox"
                  aria-expanded={menuOpen}
                >
                  <span className="text-xs md:text-sm tracking-[0.3em] text-temo-white uppercase font-medium">
                    {activeCategory}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-temo-white transition-transform duration-300 ${menuOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {menuOpen && (
                  <div
                    role="listbox"
                    className="absolute top-full left-1/2 -translate-x-1/2 mt-3 min-w-[200px] bg-temo-black/95 backdrop-blur-sm border border-white/20 rounded-2xl py-2 z-50 shadow-2xl"
                  >
                    {CATEGORY_ORDER.map((cat) => {
                      const isActive = cat === activeCategory
                      return (
                        <button
                          key={cat}
                          type="button"
                          role="option"
                          aria-selected={isActive}
                          onClick={() => {
                            setActiveCategory(cat)
                            setMenuOpen(false)
                          }}
                          className={`w-full px-6 py-2.5 text-xs tracking-[0.3em] uppercase text-left transition-colors ${
                            isActive
                              ? "text-temo-gold"
                              : "text-white/60 hover:text-white hover:bg-white/5"
                          }`}
                        >
                          {cat}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>

              <div className="h-px w-16 md:w-24 bg-white/20" />
            </div>

            {/* Designer Cards — marquee for many, centered for few */}
            {shouldMarquee ? (
              <div
                ref={marqueeContainerRef}
                onMouseMove={handleMarqueeMouseMove}
                onMouseLeave={handleMarqueeMouseLeave}
                className="relative w-full overflow-hidden py-4"
                style={{
                  transition: "opacity 0.8s ease 0.2s",
                  opacity: visible ? 1 : 0,
                  maskImage:
                    "linear-gradient(to right, transparent, black 8%, black 92%, transparent)",
                  WebkitMaskImage:
                    "linear-gradient(to right, transparent, black 8%, black 92%, transparent)",
                }}
              >
                <div
                  ref={marqueeTrackRef}
                  className="flex gap-6 md:gap-8 w-max will-change-transform"
                >
                  {[...currentList, ...currentList].map((person, i) => (
                    <DesignerCard
                      key={`${activeCategory}-${person.name}-${i}`}
                      person={person}
                      onClick={() => setSelectedPerson(person)}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div
                className="relative w-full py-4"
                style={{
                  transition: "opacity 0.8s ease 0.2s",
                  opacity: visible ? 1 : 0,
                }}
              >
                <div className="flex justify-center flex-wrap gap-6 md:gap-8">
                  {currentList.map((person) => (
                    <DesignerCard
                      key={`${activeCategory}-${person.name}`}
                      person={person}
                      onClick={() => setSelectedPerson(person)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ─── 影片底圖 wrapper：跨「品牌理念 + Logo Meaning」兩段共用一份影片 ─── */}
        <div className="relative bg-temo-black overflow-hidden">
          {/* 單一影片，cover 兩段全部高度 */}
          <div className="absolute inset-0 pointer-events-none">
            <video
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              aria-hidden="true"
              className="absolute inset-0 w-full h-full object-cover motion-reduce:hidden"
              style={{ filter: "grayscale(60%) brightness(0.85)" }}
            >
              <source src="/videos/philosophy-bg.mp4" type="video/mp4" />
            </video>

            {/* 主遮罩：均勻 72% 黑覆蓋全長度，兩段對比一致 */}
            <div className="absolute inset-0 bg-temo-black/72" />

            {/* 頂部 vignette：與上一段（設計師團隊）銜接 */}
            <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-temo-black to-transparent" />
            {/* 底部 vignette：與下一段 StatsSection 銜接 */}
            <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-temo-black to-transparent" />

            {/* 微微 radial 聚焦 */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  "radial-gradient(ellipse at center, transparent 0%, transparent 40%, rgba(0,0,0,0.30) 100%)",
              }}
            />
          </div>

          {/* 品牌理念 section（透明，疊在影片上） */}
          <section className="relative py-24 md:py-32 overflow-hidden">

          <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {/* Big title */}
            <div className="flex items-center gap-6 mb-16">
              <div className="h-px flex-1 bg-gradient-to-r from-temo-gold/30 to-transparent" />
              <h2 className="text-4xl md:text-5xl font-black text-temo-white tracking-[0.15em]">品牌理念</h2>
              <div className="h-px flex-1 bg-gradient-to-l from-temo-gold/30 to-transparent" />
            </div>

            {/* Single column — Chinese on top, English below */}
            <div className="max-w-3xl mx-auto border-l border-temo-gold/30 pl-8 space-y-10">

              {/* Chinese paragraphs */}
              <div className="space-y-5">
                <p className="text-temo-white text-sm leading-[2] font-light">
                  在提摩，我們始終相信⸺設計不只是造型，更是一種療癒與解方。
                  我們以「以人為本」為核心，相信設計師並非只是替品牌打造外觀的 maker，
                  而更像是以洞察為診斷、以創意為處方的「品牌醫生」。透過精準觀察市場、
                  消費者與生活中的細微問題，對症下藥，替每一位客戶找出最適合的設計解決方案，
                  讓品牌真正被看見、被理解、被選擇。
                </p>
                <p className="text-temo-white text-sm leading-[2] font-light">
                  品牌名稱「提摩」源自摩西分紅海的故事。「提」象徵提拔、提筆、帶領，「摩」代表摩西。
                  寓意無論市場再怎麼飽和、競爭再怎麼激烈，只要找到提摩，我們都能像摩西分海般⸺
                  替品牌分開紅海，開出一條屬於自己的獨特道路。
                </p>
                <p className="text-temo-white text-sm leading-[2] font-light">
                  當品牌在洪流中感到害怕、迷惘或停滯時，提摩就是那面象徵信念與保護的盾牌，
                  是面對困境時最堅實的靠山。我們相信，就算是看似不可能的挑戰，
                  也能透過洞察、策略與設計手法找到突破口，為品牌打開新的航道。
                </p>
                <p className="text-temo-gold text-sm leading-[2] font-medium">
                  讓我們陪你一起，讓你的品牌成為業界最亮眼的一顆星⸺
                  在商業藍海的巨浪中領航前進，激起屬於你的市場迴響。
                </p>
              </div>

              {/* Divider */}
              <div className="w-12 h-px bg-temo-gold/30" />

              {/* English paragraphs */}
              <div className="space-y-5">
                <p className="text-temo-white text-xs leading-[2.2] font-light">
                  At TEMO, we believe that design is not merely about appearance—it is a form of healing and a solution.
                  With a people-centered philosophy at our core, we see designers not simply as makers who craft a brand&apos;s exterior,
                  but as &quot;brand doctors&quot; who diagnose through insight and prescribe through creativity.
                  By carefully observing the market, consumer behavior, and the subtle details of everyday life,
                  we identify problems with precision and deliver tailored design solutions for every client—
                  allowing brands to truly be seen, understood, and chosen.
                </p>
                <p className="text-temo-white text-xs leading-[2.2] font-light">
                  The name TEMO is inspired by the biblical story of Moses parting the Red Sea.
                  &quot;Te&quot; symbolizes lifting, leading, and creation; &quot;Mo&quot; represents Moses.
                  The name reflects our belief that no matter how saturated the market or how fierce the competition may be,
                  when brands find TEMO, we can help part the Red Sea of the marketplace, opening a unique path forward.
                </p>
                <p className="text-temo-white text-xs leading-[2.2] font-light">
                  When brands feel uncertain, overwhelmed, or stagnant in the current of competition,
                  TEMO becomes a shield of belief and protection—a reliable force in moments of challenge.
                  We believe that even the most impossible obstacles can reveal new opportunities through insight,
                  strategy, and design innovation, opening fresh routes for brands to move forward.
                </p>
                <p className="text-temo-gold/80 text-xs leading-[2.2] font-light">
                  Let us walk alongside you and help your brand become one of the brightest stars in the industry—
                  navigating the vast blue ocean of business and creating waves that resonate across the market.
                </p>
              </div>
            </div>
          </div>
        </section>

          <LogoMeaningSection />
        </div>
        {/* ─── 影片底圖 wrapper 結束 ─── */}

        <StatsSection />
        <ClientsHonorsSection />
      </main>
      <Footer />
      <DesignerDetailPanel person={selectedPerson} onClose={() => setSelectedPerson(null)} />
    </>
  )
}
