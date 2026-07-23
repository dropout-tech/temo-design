# STATUS — TEMO 官網

> 會變的狀態放這裡（不變的事實放 CLAUDE.md）。開場先讀。

## 目前進度（2026-07-24）

### 本次完成：作品內容區塊「文字」升級富文本編輯器（已 push ba7c4cc，Vercel 自動部署）

**需求（使用者原話）**：後台內容區塊文字不夠好，要加粗體、顏色、大小、斜體、列表等功能，
參考講師資源站（夢想一號 Dream_One_Teacher_Web）的編輯系統改寫成適合這裡的形式。

**做法**：
- 沿用講師站同技術 `react-quill-new`（Quill 2，支援 React 19），新元件
  `components/studio/rich-text-editor.tsx`：字級（小/正常/大/特大，picker 已中文化）、
  粗體/斜體/底線/刪除線、文字色/背景色、有序/無序列表、對齊、連結、清除格式；
  深色主題配 studio。不放圖片/影片鈕（已有專門區塊）。
- **關鍵修復**：`useSemanticHTML={false}` 取 Quill 內部 HTML——預設的 getSemanticHTML()
  會丟列表 data-list 與清單內對齊 class（Playwright 驗收抓到的兩個真 bug）。
- **補了講師站沒有的安全層**：`lib/sanitize-rich-text.ts` 存檔白名單消毒（防 XSS；
  style/class 開放至 strong/em/u/s/a，因 Quill 會把顏色直掛格式標籤；剔除 ql-ui 空 span）。
- 前台 `portfolio-detail-client.tsx` 雙模式：HTML → `.rich-text` 樣式渲染（globals.css），
  舊純文字照舊分段；舊資料開進編輯器自動轉段落。**不動 DB**（HTML 存既有 text_content）。

**驗證**：消毒確定性測試 19/19（XSS 剝除＋格式保留，scratchpad/sanitize-test.ts 親跑）；
Playwright 確定性斷言初輪 7/9 → 修列表 bug 後重測 9/9 全過（含手機 375px 無溢出、
截圖 rte-desktop/picker/mobile/fixed.png 經 agent 判讀＋主對話抽查檔案存在）；
tsc 0 錯、build ✓；commit 單獨在 git worktree 檢出重 build ✓（39/39 頁）。
臨時驗證頁 /rte-harness 已刪。

**下一步**：使用者登入 /studio 開一筆作品、在文字區塊實際用格式工具列存檔驗收
（登入後流程我測不到）；前台看該作品內頁格式是否如編輯器所見。

**地雷**：
- **並行 session 警示（本次實際發生）**：同 repo 另一 session 在做「作品客戶 LOGO」
  （migration 0017 未套用、work-form/actions/detail-client 等檔混有兩邊改動）——
  本次用 hunk 級分割只提交富文本部分，對方改動原封留在工作區。**該 session 收尾時
  注意：git status 會看到富文本已 commit，勿重複提交或誤 restore。**
- Quill 內部格式：無序列表也輸出 `<ol>`＋`li[data-list="bullet"]`（非 `<ul>`），
  前台 CSS 兩種格式都支援。sanitize 白名單改動時記得跑 scratchpad/sanitize-test.ts。

### 同日（客戶 LOGO session）：作品內頁「客戶 LOGO」欄位——**已上線並線上驗證（commit b29cae9）**

**需求（使用者原話）**：作品頂端右上角可放客戶 logo，該欄資訊順勢往下，後台要能管理。

**做法**（完全比照 hero_url 既有模式，works 表加 `client_logo_url`）：
- `supabase/migrations/0017_work_client_logo.sql`（新檔，if not exists 可安全重跑）
- `lib/portfolio-supabase.ts`：fallback-safe 獨立查詢（migration 未套用時安靜回 null 不壞站）
- `components/pages/portfolio-detail-client.tsx`：側欄 sticky 頂端渲染 logo（h-16 object-contain，
  有值才渲染；沒值 DOM 與原本完全相同）
- `components/studio/work-form.tsx`：「封面與影片」區新增「客戶 LOGO（選填）」上傳/預覽/清除，
  提示深色底建議上傳白色/淺色版
- `app/studio/(app)/works/actions.ts`＋`lib/studio/works.ts`：存檔映射＋編輯帶出

**順手修（同次一起上）**：內頁文字長網址撐破手機版（ilo-2025 貼的華視新聞 URL →
scrollWidth 495/375）——文字區塊兩處渲染加 `break-words`；富文本 `.rich-text`（globals.css）
也補 `overflow-wrap: break-word` 預防同款 bug。此溢出正式站現在就看得到。

**驗證**：tsc 乾淨（僅 .next 的 rte-harness 殘影兩個假錯，非真錯）；Playwright 確定性腳本——
桌面 1440 全 PASS（logo 在資訊欄頂端、y 在「客戶 Client」之上、≤64px、無溢出）；
手機 375 修 break-words 後 4/4 PASS（scrollWidth=375、無 logo 資料時 DOM 回原樣、無 page error）；
4 張截圖 fresh agent 判讀通過（scratchpad/client-logo-*.png）。⚠️ 後台表單存檔流程需登入未測。

**上線紀錄（2026-07-24，使用者選「同意，套欄位並上線」）**：psql 套 0017 進正式 Supabase
（information_schema 確認 client_logo_url|text 存在）→ commit b29cae9（只含本功能 8 檔，
未夾帶孤兒改動）→ push → 90 秒間隔輪詢至部署生效 → **線上確定性腳本 7/7 PASS**
（temo-design.vercel.app/portfolio/ilo-2025：手機 375 scrollWidth=375 長網址斷行生效、
未設 logo 時版面照舊、桌面/手機 200、無 page error；scratchpad/verify-live-client-logo.js）。

**下一步**：使用者登入 /studio → 作品 → 「封面與影片」區上傳一張客戶 LOGO 存檔，
前台內頁確認顯示（深色底建議白色/淺色版 logo）。後台存檔流程需登入，我測不到。

**地雷**：工作區還留著兩個不明歸屬的未提交檔（app/layout.tsx 加字重 900、
category-landing-client.tsx 改 & 符號樣式），非本 session 改的、富文本 session 也沒提交，
勿夾帶、待查明歸屬。

---

## 前次進度（2026-07-21）

### 本次完成：報價「重疊內容自動扣抵」＋聯絡頁分頁放大＋聯絡頁報價改讀 DB（已上線已驗，commit a6c52ad）

**需求（使用者原話）**：(1) 聯絡我們的即時報價：品牌包套會往上加，但重疊內容要自動扣掉
（例：已選單獨 LOGO，又選到內含 LOGO 的包套 → 自動扣一份，不重複計價），且邏輯要能在後台管理。
(2) 即時報價／傳送訊息那三個 tab 放大一點，讓客人知道可以點。

**做法**：
- **內容元件扣抵制**（新概念）：後台可建「內容元件」清單（LOGO/名片/社群背景…），每個元件設一個
  「抵扣值」（通常＝單獨買的價格）；每個方案勾選它內含哪些元件。前台計算規則：同一元件被 N(≥2)
  個已選方案包含 → 扣 (N-1) 份抵扣值。同時把計算機改成「同大類可複選多個方案」（使用者選定）。
- 檔案：`supabase/migrations/0014_quote_overlap_components.sql`（新表 quote_components＋
  quote_packages.component_ids，含 seed＋自動掛載既有方案）；`lib/content-supabase.ts`（容錯讀取，
  migration 未套用也不會壞）；`components/quote/quote-calculator.tsx`（複選＋扣抵計算＋明細顯示）；
  `components/studio/quote-manager.tsx`＋`app/studio/(app)/quote/actions.ts`（後台元件 CRUD＋方案勾元件）；
  `app/quote/page.tsx`、`app/contact/page.tsx`＋`components/pages/contact-page-client.tsx`（傳 components）。
- **順手修的既有問題**：`/contact` 的即時報價 tab 原本用寫死的 fallback、完全沒讀後台價目，
  已改成 fetch getQuotePricing → 後台改價現在 /contact 也會生效。
- **分頁放大**：`contact-page-client.tsx` 三顆 tab 改成藥丸狀（金色實心作用中、灰框可點閒置），
  高度 40px→50px、字 xs→sm、icon w-4→w-5。

**驗證**：`npx tsc --noEmit` 全專案 0 錯誤；扣抵數學用確定性腳本 8/8 通過
（scratchpad/dedup-test.mjs，含使用者原話場景：單獨LOGO5萬+含LOGO包套5.7萬→顯示5.7萬）；
Playwright 實測 /contact（agent 判讀截圖）：tab 高 50px 藥丸狀可點、三分頁切換正常、
複選生效（LOGO 5萬→加名片 5.68萬→toggle 關回 6,800）、手機 390px 不破版。截圖在 scratchpad/。
**線上已驗（2026-07-21，使用者授權「可以上線囉」）**：migration 0014 已套進正式 Supabase
（psql，7 元件 seed、9 方案自動掛載）→ push a6c52ad → Vercel 部署完成 →
Playwright 實測正式站 temo-design.vercel.app/contact：單獨 LOGO 5萬＋含 LOGO 的初生之犢包套 5.7萬
→ 明細顯示「− 重複的LOGO 商標 −NT$50,000」、小計 10.7萬、**參考總價 NT$57,000**（LOGO 只算一次）；
不重疊情境（單選主視覺）不誤扣、總價＝原價。截圖 scratchpad/live-deduction.png 等。

**下一步（可選）**：使用者登入 /studio → 報價試算，用新的「內容元件」區實際增/改一個元件與方案勾選
（登入後台流程我測不到）。社群背景抵扣值目前 placeholder 3000，可自行調整。

**地雷**：抵扣值設定原則＝寧可少扣（少扣＝照原價，多扣＝少收錢）；後台已寫這句提醒。
社群背景無單獨售價，seed 給 placeholder 3000，請使用者自行調整或設 0。

---

### 本次完成（作品系統 session）：作品內容區塊系統（仿 Adobe Portfolio）＋篩選連動修復（已上線：migration 0015 已套用＋已 push ed0b660）

**需求（使用者原話重點）**：(1) 作品探索的設計師/年份標籤跟後台沒連動；(2) 作品封面與內頁首圖
要能分開設定（也可相同）、首圖可放影片；(3) 新增作品要像 Adobe Portfolio 一樣彈性——圖片下方可加
文字、可嵌 YouTube 影片、直式橫式依圖片形狀自適應、同一橫列可放兩張、順序自由調整。

**做法**：
- **篩選連動修復**：`components/pages/portfolio-page-client.tsx`——設計師/年份/客戶三顆下拉
  改從 DB 真實作品動態推導（原本讀 lib/portfolio-data.ts 寫死陣列）；`lib/portfolio-supabase.ts`
  getAllWorks 加抓 clients.name／designers.name_zh，選單顯示正式名稱不再靠寫死對照表。
- **內容區塊系統**：新表 `work_blocks`（migration 0015：type image/video/text、src2=同列雙圖、
  width/height 存原始尺寸供自適應）＋ works.hero_url（內頁首圖，留空＝沿用封面）。
  後台 `components/studio/work-form.tsx`：gallery 編輯區整個換成「內容區塊」編輯器（單圖/雙圖/
  文字/影片四種、↑↓排序、✕刪除、上傳自動記錄圖片尺寸）＋「內頁首圖」欄位；`works/actions.ts`
  改存 work_blocks（不再寫 work_gallery，舊資料 migration 會自動搬）。
  前台 `components/pages/portfolio-detail-client.tsx`：blocks 渲染器——圖片依原始比例呈現不硬裁、
  雙圖桌面並排手機堆疊、文字段落、VideoEmbed；首圖改用 hero（fallback cover）。
- **防禦設計**：migration 0015 未套用前，前台一切照舊（gallery 自動轉 image blocks、hero=cover），
  已實測不壞站；但**後台存作品會失敗**（work_blocks 表不存在），所以 push 要等 migration 套完。

**驗證**：`npx tsc --noEmit` 0 錯誤；`npm run build` ✓；確定性 Playwright 腳本 10/10 通過
（5 顆下拉存在、選真實設計師/客戶/年份能篩到作品、內頁 13 張區塊圖全部依原始比例顯示零偏差、
手機 375px 兩頁無橫向溢出、無 console 錯誤；scratchpad/verify-blocks.js）；截圖 4 張經 agent
判讀通過（scratchpad/verify-*.png）。⚠️ 後台表單的實際存檔流程需 migration＋登入才能測，未測。

**上線紀錄**：使用者 2026-07-21 授權「套用並上線」→ migration 0015 已套進正式 Supabase
（16 張舊 gallery 圖已搬入 work_blocks、hero_url 欄位確認存在）→ push ed0b660 → Vercel 已部署。
**線上已驗**（防護解除後補跑，2026-07-21）：temo-design.vercel.app 確定性腳本 4/4 通過——
5 顆篩選下拉、設計師/年份下拉有 DB 真實選項、內頁 13 張區塊圖依原始比例零偏差。
（過程插曲：部署後 15 秒間隔輪詢觸發 Vercel Security Checkpoint 擋了本機 IP 約 10 分鐘，
真實訪客不受影響，已入全域 lessons。）

**補完（2026-07-21 稍晚）**：使用者問「舊作品有沒有新功能」→ 已說明舊作品自動升級；
並把 16 張搬遷舊圖缺的 width/height 補進 DB（backfill-dims.sh，sips 量測實圖，只填 NULL；
16/16 成功、線上重驗 4/4 過）。

---

### 同日再完成（作品系統 session）：作品分類頁重做＋全站後台排序拖曳化

**需求（使用者原話重點）**：作品類別的 UI 太糟糕請改版（不直覺不好看不好用）；全站後台
所有排序都改拖曳，但不要統一樣式，依每個區塊的使用情境設計。

**設計決策（依情境）**：作品分類頁＝整頁重做成緊湊列表（一列一分類：把手/名稱點著改
onBlur 自動存/代碼 badge/刪除，底部 inline 新增，無數字框無每列儲存鈕）；Logo 牆三頁
（客戶/得獎/媒體）＝grid 上直接拖卡片；選單（三組各自拖）/FAQ/社群＝整列拖；
問卷與報價（兩層）＝大單位拖大單位、小單位在自己容器內拖；作品內容區塊＝拖曳＋保留↑↓
雙軌（卡片高，微調用按鈕）；落地頁＝查證 sort 前台根本沒用到→只拆數字框不硬加拖曳。
底層 `sortable-list.tsx` 升級為滑鼠(HTML5 drag)＋觸控(Pointer Events+elementFromPoint)
雙路徑，API 不變（designer-manager 零改動沿用）。

**改動**：12 個 studio 元件＋9 個 actions 檔（各新增 reorderXxx(ids) 整批寫 sort，照
designers/actions.ts 既有模式）。無 DB schema 變更、無新套件。

**驗證**：tsc 0 錯、build ✓；臨時 harness 頁（已刪）＋Playwright 確定性腳本 8/8 全過——
滑鼠拖曳重排✓、放開 onCommit✓、**手機觸控拖曳重排✓**（CDP touch 事件）、分類頁無數字框✓
有把手✓（scratchpad/verify-drag.js）；分類頁桌面+手機截圖經 agent 判讀「層級清楚、
無破版、較舊版大幅升級」。⚠️ 各管理頁「拖完存進 DB」的完整流程需登入後台才能實測，
未測（reorder actions 全部照已上線可用的 designer-manager 同模式）。

**下一步**：使用者登入 /studio 用新「內容區塊」編輯器實際建/改一筆作品驗收
（存檔流程需登入，我測不到）。

**地雷**：本 repo 同時有另一 session 在做報價扣抵（migration 0014/0016 是他們的）；
commit 時已嚴格只提交作品系統的 8 個檔案。work_gallery 表保留未刪（穩定後可清理）。
教訓：偵測 Vercel 部署完成不要用 15 秒間隔 curl 輪詢（會觸發 bot 防護）——改用 ≥60 秒間隔。

**wrap-up 收尾（2026-07-22，commit d43a187）**：/wrap-up 全流程走完——multi-agent code review
（3 視角＋11 信心評分員）找到 3 個確認發現並全數修復（詳 REVIEW.md）：①【Critical】拖曳排序後
編輯任一筆會把舊 sort 寫回 DB 弄亂順序（10 個 manager 的 commit 同步 state sort 修復，複核通過）
②【Critical】migration 0015 policy 缺重跑防護（已包 if not exists）③【Warning】拖曳落庫失敗
UI 靜默（已接 orderError 顯示，Playwright 實測生效）。報告在
docs/reports/2026-07-21-portfolio-blocks-and-studio-drag-sort.md；CMS_BLUEPRINT 已註記
work_gallery→work_blocks。低於門檻未修的觀察（social 連結無 protocol 白名單、reorder 無交易等）
見 review 過程紀錄，均屬既有慣例延續、非本次引入。

---

## 前次進度（2026-07-10）

### 完成：作品集篩選區改下拉式選單（手機 557223e＋桌面 96c3779，皆已部署已驗）

**需求**：使用者截圖反映篩選區 11+1 顆執行項目 chip＋7 顆行業 chip 太佔空間太醜，要改下拉選單；
先做手機版，使用者看過後追加「桌面也改」→ chip 牆全面退役。

**做法**：`components/pages/portfolio-page-client.tsx` 的 FilterBar——五顆下拉
（執行項目/行業分類/客戶/設計師/年份），手機（<768px）兩欄、桌面單列排開（件數＋清除鈕同列靠右）；
行業複選＝下拉點選加入、再選同項移除、金色 pill 可 ✕ 移除。
所有用到 FilterBar 的頁面（/portfolio 與各服務作品頁）一體生效。

**驗證**：確定性 Playwright 腳本兩輪全過——手機輪 16 條（390/375px 無橫向溢出、5 顆下拉高 48px≥44、
篩選件數正確、複選加入/移除正確）；桌面輪 8 條（1280px chip 已移除、5 顆下拉同列等高 y=778、
篩選/複選生效、手機迴歸 OK）；`tsc --noEmit` 0 錯誤；**線上已驗**（temo-design.vercel.app/portfolio
桌面 chipGone=true selects=5、手機 selects=5 無溢出）。截圖在 scratchpad/filter-desktop-dropdown-1280.png 等。

**過程備註**：視覺判讀 agent 曾報「下拉上方有 chip 殘影」，經 DOM 裁決是本來就存在的 CategoryTicker
分類索引橫條（非 bug）。agent 建議日後可把原生 select 換自訂樣式（箭頭/hover 態）更精緻，非必要。

---

### 同日完成：修好 /explore「TODAY」區塊在寬扁視窗頂到 logo 的問題

**症狀**：TODAY 大標題與左上角 logo 重疊、左欄文字間距看起來走位。

**根因**：桌機版構圖鎖在 1834×1062 畫布用 cover 縮放；視窗比畫布更「寬扁」時
（筆電瀏覽器扣掉網址列、21:9 超寬），上下裁切把左欄文字整組推進 logo 區。
字距本身一直符合設計稿，是整欄被抬高才看起來亂。

**修法**：`components/pages/explore-client.tsx` — 左欄四段文字包成一組，
偵測頂部裁切過深時整組下移到安全線（logo 底 68px + 20px 緩衝），段落間距不變；
正常比例視窗版面完全不動。commit 9f9cbdb，已 push（Vercel 自動部署）。

**驗證**：Playwright 腳本量測 7 種視窗（16:9／16:10／MacBook 視窗／1632×751／
21:9／小筆電／iPhone），修復前 3 種重疊、修復後全部無重疊且左欄不超出視窗；
tsc 0 錯誤；兩張截圖經 agent 判讀構圖正常。腳本在 scratchpad/measure-today.js（暫存）。
⚠️ 21:9 超寬下最右側漢字下緣仍有約 22px 貼底裁切（既有現象、非本次造成，
且漢字本來就是「部分露出、hover 抬門看全字」的設計）。

---

## 前次進度（2026-07-10 稍早）

### 完成：修好「關於我們」客戶/得獎牆爆卡問題

**症狀**：後台新增客戶(55)＋得獎(15) logo 後，關於頁超級卡。

**根因**：客戶/得獎牆是一直在跑的跑馬燈動畫；圖片全用 `unoptimized`（不壓縮直送原圖），
得獎圖 1000～4000px、卻只顯示 68～150px，55＋15 張大點陣圖一直被 GPU 重新合成 → 爆卡。
（GPU 貼圖記憶體估算：改前約 200MB，改後約 30MB。）

| 修法 | 檔案 | 證據 |
|---|---|---|
| 客戶 logo 改走 Supabase CDN 即時縮圖(render/image, contain, webp) | `lib/image-url.ts` + `components/sections/clients-honors-section.tsx` | Playwright：原圖抓取 0 次、最大解碼寬 500px(原 11052)、110 張縮圖端點皆 200 |
| 得獎本地圖 `public/awards/*.png` 縮到最長邊 500px | 15 檔（sips） | 資料夾 2.3M→940K；原檔備份在 scratchpad |
| 跑馬燈捲離畫面自動暫停動畫 | 同 section（第二個 IntersectionObserver 控 animationPlayState） | Playwright：offscreenPlayState=paused |
| logo 改 eager 載入杜絕跑馬燈空白 | 同 section | Playwright：140 張 broken=0、載入 6ms(快取) |
| 三個後台上傳器加「上傳前自動縮圖」(≤800px webp) 防再傳巨圖 | `lib/downscale-image.ts` + client/award/press-link-manager | tsc 0 錯誤 |

**驗證**：`npx tsc --noEmit` 全專案 0 錯誤；Playwright 桌面+手機截圖經 agent 判讀「logo 清晰無破圖、可上線」；
55 張客戶縮圖已預熱進 Supabase CDN 快取（首位訪客不必等冷生成）。
⚠️ 未在真機 GPU 上量 fps（headless 軟體渲染值 41，不代表真機）；真正指標是貼圖記憶體 -85%。

---

## 前次進度（2026-07-09）

### 本次完成：後台可自訂範圍大幅擴充（5 項）＋ 一併修好聯絡資訊 bug

| 項目 | 完成內容 | 證據 |
|---|---|---|
| 1. 聯絡資訊＋營業時間 | 「網站設定」新增 營業時間 / LINE 連結 / LINE QR 上傳；footer 改讀 site_settings（原本寫死） | Playwright 實測聯絡頁+footer 顯示新值、無舊值殘留（migration 0009） |
| 2. 作品分類選項 | 新後台頁「作品分類」CRUD `category_groups`/`industries`；前台 /portfolio 篩選改讀 DB | Playwright：11 執行項目+7 行業 chip、篩選可用；DB 塞新分類前台即現 |
| 3. 選單／頁尾連結 | 新後台頁「選單 / 頁尾」CRUD `nav_links`（header/menu/footer 三處）；navbar+footer 改讀 DB | Playwright：測試連結出現於頁尾（migration 0010） |
| 4. 報價問卷題目 | 新後台頁「報價問卷」CRUD `brief_sections`/`brief_questions`（區塊→題目→選項）；需求單表單改讀 DB | Playwright：測試題目出現於「基本資料」區塊（migration 0011，seed 7 區塊 35 題） |
| 5. 服務落地頁文案 | 新後台頁「服務落地頁」編輯 4 個 /services/[slug] 的 Hero 文案；服務頁改讀 DB | curl DB round-trip 即時反映；Playwright 視覺正常（migration 0012） |

**額外修好的 bug**：DB 的 `site_settings` 仍是舊台北地址／舊信箱（commit 52d27bb/6c39151 只改了程式碼沒改 DB），導致線上聯絡頁一直顯示舊資訊 → 已於 migration 0009 修正為台中。

**營業時間**已依需求設為：週一–週五 09:00–21:00、週六日休息。

### 驗證狀態
- 前台：全部以 DB round-trip（塞測試資料→看前台→清除）＋ Playwright 截圖實測，零 console error。
- `npx tsc --noEmit` 0 錯誤；`npm run build` ✓ Compiled successfully、34 靜態頁全產生。
- **DB migrations（0009–0012）已套用到正式 Supabase**（使用者授權 psql 直跑）。
- ⚠️ **後台管理頁的 UI 點擊流程（存/刪按鈕經 auth）尚未由我實測**——需登入 /studio 才能測；目前依據：actions 全部 type-check 通過且照既有「報價試算」後台（已上線可用）的範本寫。

## 下一步
- [x] 部署上線（2026-07-10 已 push、Vercel 部署完成並線上驗證）。
- [ ] 使用者登入 /studio 實際點測 5 個後台頁（作品分類/選單頁尾/報價問卷/服務落地頁/網站設定擴充）。
- [x] 部署後開真實線上 URL 確認生效（2026-07-10 手機版掃 6 頁：狀態 200、無橫向溢出、
      篩選下拉正常；唯一紅字見地雷欄 hero-poster）。

## 地雷 / 待辦（非本次範圍）
- **首頁 hero 影片 poster 404**：`components/sections/hero-section.tsx:45` 引用
  `/images/hero-poster.jpg` 但 public/ 沒這檔（既有問題）。影響小：影片載入前無預覽圖。
  修法：補上該圖（從影片截一格）或拿掉 poster 屬性。
- dev 環境坑（2026-07-10 實測）：同 repo 兩台 `next dev` 併跑，後起那台會全站 404
  （只有 / 活著）。起 server 前先 `lsof -i :3000` 確認沒有別台在跑。
- `/faq` 頁有既有的 React 重複 key 警告（非本次改動造成，不影響顯示）——之後可順手修。
- 前台多處 client 元件（navbar/footer/需求單）改為 client 端讀 DB：預設值＝現值，故無閃動；若日後改值，會在下次載入更新。
- 專案有雙 lockfile 等既有債（見 CLAUDE.md），本次未動。
