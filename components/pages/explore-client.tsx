"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { CATEGORY_LANDINGS } from "@/lib/category-landing-data"

// ─── Data ─────────────────────────────────────────────────────────────────────

// 順序對應 TodayStage 的 SECTIONS（品牌 → 裝置 → 產品 → 工藝）
const SERVICES = [
  {
    num: "01",
    id: "brand",
    landingSlug: "brand-graphic",
    zhShort: "品牌平面",
    zh: "品牌平面設計",
    en: "Brand & Graphic",
    tagline: "識別，從第一眼開始",
    description:
      "我們相信品牌不只是造型，更是一種療癒與解方。從 Logo 到完整 VI 系統，讓品牌在市場中被清晰識別、被真正記住。",
    cards: [
      { title: "品牌識別系統", body: "Logo、色票、字型、使用規範——完整的視覺語言體系，確保品牌在任何媒介都保持一致性。", cta: "查看案例" },
      { title: "包裝設計", body: "從結構到印刷工藝，打造讓消費者拿起來就捨不得放下的包裝體驗。", cta: "查看案例" },
      { title: "平面設計", body: "名片、型錄、海報、菜單——每一張印刷品都是品牌故事的一頁。", cta: "查看案例" },
      { title: "店面 VI 應用", body: "招牌、制服、空間視覺——讓走進店面的每一刻都感受到品牌溫度。", cta: "查看案例" },
    ],
    colors: { bg: "#1a1815", accent: "#cda96d", text: "#f2eadd" },
  },
  {
    num: "02",
    id: "installation",
    landingSlug: "public-art",
    zhShort: "裝置藝術",
    zh: "裝置藝術",
    en: "Installation Art",
    tagline: "空間，因藝術而呼吸",
    description:
      "我們以裝置作為品牌與觀者的對話媒介，把材質、光線與敘事融合成可被走進、被觸碰的體驗，讓品牌精神在實體空間中具象呈現。",
    cards: [
      { title: "品牌快閃裝置", body: "從概念到落地，打造短期內最具話題與打卡張力的空間裝置體驗。", cta: "查看案例" },
      { title: "展覽展場設計", body: "敘事動線、視覺節奏、互動細節——讓展覽不只是展示，而是一段旅程。", cta: "查看案例" },
      { title: "公共藝術裝置", body: "結合在地文化與材質工法，為公共空間注入長期駐留的藝術能量。", cta: "查看案例" },
      { title: "互動體驗設計", body: "感應、燈光、聲音的整合——讓觀者從觀看者成為參與者。", cta: "查看案例" },
    ],
    colors: { bg: "#181715", accent: "#cda96d", text: "#f2eadd" },
  },
  {
    num: "03",
    id: "product",
    landingSlug: "product-design",
    zhShort: "產品設計",
    zh: "產品設計",
    en: "Product Design",
    tagline: "解決問題，才是真正的設計",
    description:
      "設計師不只是造物者，更是另一種形式的醫生。透過觀察生活中的細微問題，幫使用者解決他們的困擾，讓產品真正被需要。",
    cards: [
      { title: "使用者研究", body: "深度訪談、田野觀察、競品分析——在動手設計之前，先真正理解使用者。", cta: "了解流程" },
      { title: "UX / UI 設計", body: "從資訊架構到視覺細節，打造直覺好用又美觀的數位產品體驗。", cta: "了解流程" },
      { title: "工業設計", body: "外觀造型、人機工學、材質選型——讓產品在功能與美感之間找到完美平衡。", cta: "了解流程" },
      { title: "原型測試", body: "快速迭代、真實測試、持續優化——確保產品在上市前已解決所有核心問題。", cta: "了解流程" },
    ],
    colors: { bg: "#171614", accent: "#b0aca1", text: "#f2eadd" },
  },
  {
    num: "04",
    id: "crafts",
    landingSlug: "crafts-design",
    zhShort: "工藝設計",
    zh: "工藝設計",
    en: "Crafts Design",
    tagline: "以美為本，為生活注入溫度",
    description:
      "提摩孕育大地之母 GAIA 的靈感與器量，進而產下了 KAIA 凱柏工藝，專為愛美人士打造現成工藝產品，讓生活美學不再是奢侈。",
    cards: [
      { title: "KAIA 工藝系列", body: "源自大地美學的工藝品牌，每一件作品都是對自然之美的致敬與再詮釋。", cta: "進入店鋪" },
      { title: "聯名合作", body: "與品牌或藝術家合作，創作限定聯名工藝品，將兩個世界的美學融為一體。", cta: "洽談合作" },
      { title: "限定系列開發", body: "為品牌量身打造的限量工藝系列，讓禮物不再只是禮物，而是一種情感連結。", cta: "洽談合作" },
      { title: "藝術裝置", body: "為空間注入靈魂，從概念到執行，打造讓人駐足的藝術裝置體驗。", cta: "查看案例" },
    ],
    colors: { bg: "#1c1916", accent: "#cda96d", text: "#eadec8" },
  },
]

// ─── Stage 1: TODAY selector ───────────────────────────────────────────────────
// Layout: 整合自 public/four-doors-prototype.html
// 詳細拆解見 今天我想來點_文件/01-技術文件.md
//
// 結構：
//   - 整面水泥背景（z-1）
//   - 4 個 .tg-char-pair（z-2，全頁面 + clip-path 切出斜線梯形）
//       每個含：自己的水泥背景（會跟著抬）+ 漢字 + 編號
//   - 5 條白色斜線（z-3）
//   - 左側 TODAY / 副標 / 今天 / body（z-5）
//   - hover 該區段時抬升至 z-6（蓋過線）
// 互動：點擊任一區塊 → onSelect(idx) 進入 Stage 2

const SECTIONS = [
  {
    num: "01",
    top: "品牌",
    bottom: "平面",
    color: "#c6c6c6",
    textLeft: "21.54%",
    numLeft: "43.67%",
    clip: "polygon(56.44% 0, 70.98% 0, 25.37% 100%, 10.78% 100%)",
    clipHover: "polygon(50.44% 0, 76.98% 0, 31.37% 100%, 4.78% 100%)",
  },
  {
    num: "02",
    top: "裝置",
    bottom: "藝術",
    color: "#757575",
    textLeft: "36.70%",
    numLeft: "57.20%",
    clip: "polygon(70.98% 0, 85.52% 0, 39.86% 100%, 25.37% 100%)",
    clipHover: "polygon(64.98% 0, 91.52% 0, 45.86% 100%, 19.37% 100%)",
  },
  {
    num: "03",
    top: "產品",
    bottom: "設計",
    color: "#585858",
    textLeft: "51.80%",
    numLeft: "71.48%",
    clip: "polygon(85.52% 0, 99.60% 0, 53.94% 100%, 39.86% 100%)",
    clipHover: "polygon(79.52% 0, 105.60% 0, 59.94% 100%, 33.86% 100%)",
  },
  {
    num: "04",
    top: "工藝",
    bottom: "設計",
    color: "#222222",
    textLeft: "66.95%",
    numLeft: "85.60%",
    clip: "polygon(99.60% 0, 114.40% 0, 68.95% 100%, 53.94% 100%)",
    clipHover: "polygon(93.60% 0, 120.40% 0, 74.95% 100%, 47.94% 100%)",
  },
]

function TodayStage({
  onSelect,
}: {
  onSelect: (idx: number) => void
}) {
  const [mounted, setMounted] = useState(false)
  // 桌機版構圖鎖在 1834×1062 的設計畫布上，用 scale 依螢幕 cover 縮放 → 換任何螢幕比例都不跑版
  // 水平靠左（保護左側 TODAY 文字不被裁）、垂直置中（超寬螢幕的裁切平均分到上下空白帶，漢字不被切）
  const [canvas, setCanvas] = useState({ scale: 1, offsetY: 0, textShift: 0 })

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 100)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    function update() {
      // cover：取寬/高兩個縮放比的較大者，確保畫布永遠鋪滿視窗、不留空邊
      const scale = Math.max(window.innerWidth / 1834, window.innerHeight / 1062)
      const offsetY = (window.innerHeight - 1062 * scale) / 2
      // 寬扁視窗會裁掉畫布頂部，把 TODAY 推進左上角 Logo（top 20 + 高 48 + 緩衝 20 = 88px）。
      // 此時把左欄文字整組往下滑到安全線，四段文字的相對間距不變；一般比例下 shift = 0。
      const textShift = Math.max(0, (88 - offsetY) / scale - 157)
      setCanvas({ scale, offsetY, textShift })
    }
    update()
    window.addEventListener("resize", update)
    return () => window.removeEventListener("resize", update)
  }, [])

  return (
    <div
      className="relative w-full h-full overflow-hidden select-none"
      style={{ opacity: mounted ? 1 : 0, transition: "opacity 0.5s ease" }}
    >
      {/* Layer 1: 水泥背景（手機版底圖；桌機版會被下方縮放畫布蓋滿） */}
      <div
        className="absolute inset-0 z-[1] bg-cover bg-center"
        style={{ backgroundImage: `url('/cement-light.png')` }}
      />

      {/* ── 桌機版：鎖 1834×1062 比例的設計畫布，cover 縮放（桌機限定） ── */}
      <div
        className="hidden md:block absolute left-0 z-[2] origin-top-left"
        style={{ width: 1834, height: 1062, top: canvas.offsetY, transform: `scale(${canvas.scale})` }}
      >
        {/* 畫布底層水泥：與斜切區塊同張同比例 → 未 hover 時區塊與底圖無縫、隱形 */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url('/cement-light.png')` }}
        />

        {/* 4 個可點擊的斜線區塊（每個內含背景 + 漢字 + 編號） */}
        {SECTIONS.map((s, i) => (
          <button
            key={s.num}
            type="button"
            onClick={() => onSelect(i)}
            aria-label={`${s.top}${s.bottom}`}
            className="tg-char-pair"
            style={
              {
                ["--tg-clip" as string]: s.clip,
                ["--tg-clip-hover" as string]: s.clipHover,
              } as React.CSSProperties
            }
          >
            {/* 區塊背景（同樣的水泥紋，跟著 hover 一起抬起） */}
            <span
              aria-hidden
              className="absolute inset-0 bg-cover bg-center pointer-events-none"
              style={{ backgroundImage: `url('/cement-light.png')` }}
            />
            {/* 漢字（上下兩排） */}
            <span
              aria-hidden
              className="tg-char-text"
              style={{ left: s.textLeft, top: "65.63%", color: s.color }}
            >
              <span className="block">{s.top}</span>
              <span className="block" style={{ marginTop: "0.37em" }}>{s.bottom}</span>
            </span>
            {/* 編號 */}
            <span
              aria-hidden
              className="tg-num"
              style={{ left: s.numLeft, top: "38.61%" }}
            >
              {s.num}
            </span>
          </button>
        ))}

        {/* 5 條白色斜線 */}
        <svg
          className="absolute inset-0 z-[3] w-full h-full pointer-events-none"
          viewBox="0 0 1834 1062"
        >
          <line x1="260"  y1="983"  x2="901"  y2="170" stroke="#F2F2F2" strokeWidth="4" vectorEffect="non-scaling-stroke" />
          <line x1="533"  y1="976"  x2="1175" y2="161" stroke="#F2F2F2" strokeWidth="4" vectorEffect="non-scaling-stroke" />
          <line x1="806"  y1="967"  x2="1447" y2="154" stroke="#F2F2F2" strokeWidth="4" vectorEffect="non-scaling-stroke" />
          <line x1="1065" y1="966"  x2="1706" y2="153" stroke="#F2F2F2" strokeWidth="4" vectorEffect="non-scaling-stroke" />
          <line x1="1292" y1="1027" x2="1832" y2="339" stroke="#F2F2F2" strokeWidth="4" vectorEffect="non-scaling-stroke" />
        </svg>

        {/* 左側文字（座標與字級一律用 px，相對固定畫布 → 永遠對齊；
            整欄包一層做 textShift：頂部被裁時整組下移避開 Logo，段落間距不變） */}
        <div
          className="absolute inset-0 z-[5] pointer-events-none"
          style={{ transform: `translateY(${canvas.textShift}px)` }}
        >
        <div
          className="absolute pointer-events-none"
          style={{
            left: 50,
            top: 157,
            fontFamily: "'Barlow', sans-serif",
            fontWeight: 900,
            fontSize: 150,
            lineHeight: 1,
            letterSpacing: "-0.01em",
            color: "rgba(196, 196, 196, 0.8)",
          }}
        >
          TODAY
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 50,
            top: 297,
            fontFamily: "'Barlow', sans-serif",
            fontWeight: 700,
            fontSize: 44,
            lineHeight: 1,
            letterSpacing: "0.09em",
            color: "rgba(196, 196, 196, 0.8)",
          }}
        >
          SOMETHING MORE...
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 50,
            top: 377,
            fontFamily: "'Noto Sans TC', sans-serif",
            fontWeight: 700,
            fontSize: 40,
            lineHeight: 1,
            letterSpacing: "0.25em",
            color: "rgba(196, 196, 196, 0.8)",
          }}
        >
          今天我想來點...
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            left: 49,
            top: 458,
            width: 371,
            fontFamily: "'Barlow', sans-serif",
            fontWeight: 600,
            fontSize: 16,
            lineHeight: 1.13,
            letterSpacing: "0.04em",
            color: "rgba(196, 196, 196, 0.8)",
          }}
        >
          <p>At TEMO, we believe that design is not merely about appearance—it is a form of healing and a solution.</p>
          <p style={{ marginTop: "0.9em" }}>
            With a people-centered philosophy at our core, we see designers not simply as makers who craft a brand&apos;s exterior, but as &ldquo;brand doctors&rdquo; who diagnose through insight and prescribe through creativity.
          </p>
        </div>
        </div>
      </div>

      {/* ── 手機版佈局：直向堆疊、可讀字級、整列大按鈕（桌機隱藏） ── */}
      <div className="md:hidden absolute inset-0 z-[4] flex flex-col overflow-y-auto px-6 pt-24 pb-10">
        {/* 標題區 */}
        <div className="text-[#2a2a28]">
          <p
            className="text-[17vw] leading-none font-black tracking-[-0.01em] text-[#F2F2F2]"
            style={{ fontFamily: "'Barlow', sans-serif", textShadow: "0 2px 18px rgba(0,0,0,0.25)" }}
          >
            TODAY
          </p>
          <p
            className="mt-3 text-sm font-bold tracking-[0.09em] text-[#F2F2F2]"
            style={{ fontFamily: "'Barlow', sans-serif", textShadow: "0 1px 8px rgba(0,0,0,0.3)" }}
          >
            SOMETHING MORE...
          </p>
          <p
            className="mt-2 text-base font-bold tracking-[0.25em] text-[#F2F2F2]"
            style={{ fontFamily: "'Noto Sans TC', sans-serif", textShadow: "0 1px 8px rgba(0,0,0,0.3)" }}
          >
            今天我想來點...
          </p>
        </div>

        {/* 4 個服務選項 — 斜切平行四邊形帶，呼應桌機版斜線構圖 */}
        <div className="mt-8 flex flex-1 flex-col justify-end gap-3">
          {SECTIONS.map((s, i) => (
            <button
              key={s.num}
              type="button"
              onClick={() => onSelect(i)}
              aria-label={`${s.top}${s.bottom}`}
              className="group relative flex min-h-[72px] items-center justify-between overflow-hidden px-7 py-5 text-left active:scale-[0.98] transition-transform"
              style={{ clipPath: "polygon(4% 0, 100% 0, 96% 100%, 0 100%)" }}
            >
              {/* 帶狀水泥背景 + 依序加深，做出遠近層次 */}
              <span
                aria-hidden
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: "url('/cement-light.png')" }}
              />
              <span
                aria-hidden
                className="absolute inset-0"
                style={{ background: `rgba(20,18,16,${0.05 + i * 0.04})` }}
              />
              <span className="relative flex items-baseline gap-4">
                <span
                  className="text-3xl font-black tracking-[0.13em]"
                  style={{ fontFamily: "'Noto Sans TC', sans-serif", color: s.color }}
                >
                  {s.top}
                  {s.bottom}
                </span>
              </span>
              <span
                className="relative text-lg font-black tracking-[0.12em] text-[#F2F2F2]"
                style={{ fontFamily: "'Barlow', sans-serif" }}
              >
                {s.num}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 左上角 Logo — 緊貼視窗左上角，但保留 navbar 同尺寸 h-12 */}
      <Link
        href="/"
        aria-label="TEMO DESIGN — 回首頁"
        className="absolute top-5 left-6 z-40 flex items-center h-12 hover:opacity-80 transition-opacity"
      >
        <img
          src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo-17-gxNRwXn7tMwIRkd2cGdAdl3qzorZib.png"
          alt="TEMO DESIGN"
          className="h-full w-auto object-contain"
        />
      </Link>

      {/* Hover 行為的 CSS（用 :hover 偽類，inline style 做不到）*/}
      <style>{`
        .tg-char-pair {
          position: absolute;
          inset: 0;
          z-index: 2;
          padding: 0;
          margin: 0;
          border: 0;
          background: transparent;
          cursor: pointer;
          pointer-events: auto;
          clip-path: var(--tg-clip);
          transition:
            transform 0.4s cubic-bezier(0.16, 1, 0.3, 1),
            filter 0.4s ease,
            clip-path 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .tg-char-pair:hover {
          transform: translateY(-10px);
          filter: brightness(1.13) drop-shadow(0 14px 22px rgba(0, 0, 0, 0.4));
          clip-path: var(--tg-clip-hover);
          z-index: 6;
        }
        .tg-char-text {
          position: absolute;
          font-family: 'Noto Sans TC', sans-serif;
          font-weight: 900;
          font-size: 100px;
          line-height: 1;
          letter-spacing: 0.13em;
          white-space: nowrap;
        }
        .tg-num {
          position: absolute;
          font-family: 'Barlow', sans-serif;
          font-weight: 900;
          font-size: 60px;
          line-height: 1;
          letter-spacing: 0.12em;
          color: #F2F2F2;
          pointer-events: none;
        }
      `}</style>
    </div>
  )
}

// ─── Stage 2: Card Fan ────────────────────────────────────────────────────────

function CardFanStage({
  serviceIdx,
  onBack,
}: {
  serviceIdx: number
  onBack: () => void
}) {
  const service = SERVICES[serviceIdx]
  const [mounted, setMounted] = useState(false)
  const [activeCard, setActiveCard] = useState<number | null>(null)
  const [switchingService, setSwitchingService] = useState(false)
  const [currentIdx, setCurrentIdx] = useState(serviceIdx)
  const current = SERVICES[currentIdx]

  useEffect(() => {
    setMounted(false)
    const t = setTimeout(() => setMounted(true), 80)
    return () => clearTimeout(t)
  }, [currentIdx])

  function goToService(idx: number) {
    setSwitchingService(true)
    setActiveCard(null)
    setTimeout(() => {
      setCurrentIdx(idx)
      setSwitchingService(false)
    }, 300)
  }

  return (
    <div
      className="relative w-full h-full flex flex-col overflow-hidden"
      style={{ backgroundColor: current.colors.bg }}
    >
      {/* Video / texture overlay */}
      <div className="absolute inset-0 pointer-events-none">
        <video
          autoPlay loop muted playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-10"
        >
          <source
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/freepik_-_kling_720p_16-9_24fps_57860-mPIC49MLEKEyvjV5OZbCDTi7rgIrbv.mp4"
            type="video/mp4"
          />
        </video>
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40" />
      </div>

      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between px-8 md:px-14 pt-8 pb-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 py-3 text-[10px] tracking-[0.3em] text-white/40 hover:text-white transition-colors uppercase"
        >
          <ArrowLeft className="w-3 h-3" />
          Today
        </button>

        {/* Service tabs */}
        <div className="flex items-center gap-1">
          {SERVICES.map((s, i) => (
            <button
              key={s.id}
              onClick={() => goToService(i)}
              className={cn(
                "px-3.5 py-3 md:px-3 md:py-1.5 text-[10px] tracking-[0.2em] uppercase transition-all duration-200 rounded-sm",
                currentIdx === i
                  ? "bg-white/15 text-white"
                  : "text-white/30 hover:text-white/60"
              )}
            >
              {s.num}
            </button>
          ))}
        </div>
      </div>

      {/* Service headline */}
      <div
        className="relative z-10 px-8 md:px-14 mb-6"
        style={{
          transition: "opacity 0.5s ease, transform 0.5s ease",
          opacity: mounted && !switchingService ? 1 : 0,
          transform: mounted && !switchingService ? "translateY(0)" : "translateY(16px)",
        }}
      >
        <p className="text-[10px] tracking-[0.5em] uppercase mb-1" style={{ color: current.colors.accent }}>
          {current.en}
        </p>
        <h2 className="text-3xl md:text-5xl font-black leading-tight text-white">
          {/* "One" styled differently */}
          <em className="not-italic font-light text-white/40 mr-2">One</em>
          <span>{current.zh}</span>
        </h2>
        <p className="text-xs text-white/40 mt-1 tracking-widest italic">{current.tagline}</p>
      </div>

      {/* Card fan */}
      <div
        className="relative z-10 flex-1 flex items-end px-8 md:px-14 pb-8 gap-3 overflow-x-auto"
        style={{
          transition: "opacity 0.5s ease 0.1s",
          opacity: mounted && !switchingService ? 1 : 0,
        }}
      >
        {current.cards.map((card, i) => {
          const isActive = activeCard === i
          const isInactive = activeCard !== null && activeCard !== i

          return (
            <div
              key={i}
              onMouseEnter={() => setActiveCard(i)}
              onMouseLeave={() => setActiveCard(null)}
              onClick={() => setActiveCard(isActive ? null : i)}
              className="relative flex-shrink-0 flex flex-col justify-end cursor-pointer overflow-hidden rounded-sm border border-white/10"
              style={{
                width: isActive ? "min(340px, 76vw)" : "100px",
                height: "min(380px, 48svh)",
                transition: "width 0.5s cubic-bezier(0.4,0,0.2,1), opacity 0.3s ease, border-color 0.3s ease",
                opacity: isInactive ? 0.35 : 1,
                borderColor: isActive ? `${current.colors.accent}60` : "rgba(255,255,255,0.08)",
                background: isActive
                  ? `linear-gradient(to top, ${current.colors.bg}, #242220)`
                  : "rgba(255,255,255,0.03)",
              }}
            >
              {/* Card number — always visible */}
              <div
                className="absolute top-5 left-0 right-0 flex justify-center"
                style={{
                  transition: "opacity 0.3s ease",
                  opacity: isActive ? 0 : 0.3,
                }}
              >
                <span
                  className="text-[10px] font-mono tracking-[0.2em]"
                  style={{ color: current.colors.accent }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
              </div>

              {/* Vertical label when collapsed */}
              <div
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
                style={{
                  transition: "opacity 0.25s ease",
                  opacity: isActive ? 0 : 0.7,
                }}
              >
                <p
                  className="text-xs font-medium text-white/60 tracking-[0.15em]"
                  style={{
                    writingMode: "vertical-rl",
                    textOrientation: "mixed",
                  }}
                >
                  {card.title}
                </p>
              </div>

              {/* Expanded content */}
              <div
                className="absolute inset-0 flex flex-col justify-between p-6 pointer-events-none"
                style={{
                  transition: "opacity 0.35s ease 0.15s",
                  opacity: isActive ? 1 : 0,
                }}
              >
                {/* Top accent line */}
                <div className="h-px w-12" style={{ background: current.colors.accent }} />

                {/* Content */}
                <div className="space-y-4">
                  <div>
                    <span
                      className="text-[10px] tracking-[0.35em] uppercase block mb-2"
                      style={{ color: current.colors.accent }}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <h3 className="text-lg font-bold text-white leading-tight">{card.title}</h3>
                  </div>
                  <p className="text-xs text-white/55 leading-relaxed">{card.body}</p>
                  <Link
                    href={`/services/${current.landingSlug}`}
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1.5 text-[11px] font-medium tracking-[0.2em] uppercase hover:gap-2.5 transition-all"
                    style={{ color: current.colors.accent, pointerEvents: isActive ? "auto" : "none" }}
                  >
                    {card.cta}
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>

              {/* Bottom accent */}
              <div
                className="absolute bottom-0 left-0 right-0 h-px transition-all duration-500"
                style={{
                  background: isActive ? current.colors.accent : "transparent",
                  opacity: isActive ? 0.6 : 0,
                }}
              />
            </div>
          )
        })}

        {/* CTA card — always last */}
        <div
          className="flex-shrink-0 flex flex-col justify-center items-center gap-4 w-[100px] border border-white/8 rounded-sm"
          style={{ height: "min(380px, 48svh)" }}
        >
          <Link
            href="/contact"
            className="flex flex-col items-center gap-2 group"
          >
            <div
              className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center group-hover:border-white/60 transition-colors"
            >
              <ArrowRight className="w-4 h-4 text-white/50 group-hover:text-white transition-colors" />
            </div>
            <p
              className="text-[9px] tracking-[0.25em] uppercase text-white/30 group-hover:text-white/60 transition-colors"
              style={{ writingMode: "vertical-rl" }}
            >
              聯繫我們
            </p>
          </Link>
        </div>
      </div>

      {/* Description */}
      <div
        className="relative z-10 px-8 md:px-14 pb-8"
        style={{
          transition: "opacity 0.5s ease 0.2s",
          opacity: mounted && !switchingService ? 1 : 0,
        }}
      >
        <p className="text-[11px] text-white/35 leading-relaxed max-w-xl">{current.description}</p>
      </div>
    </div>
  )
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export function ExploreClient() {
  const [stage, setStage] = useState<"today" | "cards">("today")
  const [selectedService, setSelectedService] = useState(0)
  const [transitioning, setTransitioning] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  function selectService(idx: number) {
    // 點擊 01/02/03/04 直接導向對應的 /services/[slug] 落地頁
    const landing = CATEGORY_LANDINGS[idx]
    if (landing) {
      setTransitioning(true)
      setTimeout(() => {
        router.push(`/services/${landing.slug}`)
      }, 200)
    }
  }

  function goBack() {
    setTransitioning(true)
    setTimeout(() => {
      setStage("today")
      setTransitioning(false)
    }, 280)
  }

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 overflow-hidden"
      style={{ fontFamily: "var(--font-sans)" }}
    >
      <div
        className="w-full h-full"
        style={{
          transition: "opacity 0.28s ease",
          opacity: transitioning ? 0 : 1,
        }}
      >
        {stage === "today" ? (
          <TodayStage onSelect={selectService} />
        ) : (
          <CardFanStage serviceIdx={selectedService} onBack={goBack} />
        )}
      </div>
    </div>
  )
}
