# STATUS — TEMO 官網

> 會變的狀態放這裡（不變的事實放 CLAUDE.md）。開場先讀。

## 目前進度（2026-07-10）

### 本次完成：作品集篩選區手機版改下拉式選單（commit 557223e，已部署已驗）

**需求**：使用者截圖反映手機版篩選區 11+1 顆執行項目 chip＋7 顆行業 chip 太佔空間太醜，要改下拉選單。

**做法**：`components/pages/portfolio-page-client.tsx` 的 FilterBar——手機（<768px）收成五顆下拉
（執行項目/行業分類/客戶/設計師/年份，兩欄）；行業複選＝下拉點選加入、再選同項移除、金色 pill 可 ✕ 移除；
**桌面版 chip 牆不變**。所有用到 FilterBar 的頁面（/portfolio 與各服務作品頁）一體生效。

**驗證**：確定性 Playwright 腳本 16 條斷言全過（390/375px 無橫向溢出、chip 已隱藏、5 顆下拉高度 48px≥44、
下拉篩選件數正確、複選加入/移除正確、桌面 1280px chips 照舊）；`tsc --noEmit` 0 錯誤；
**線上已驗**（temo-design.vercel.app/portfolio 手機視窗：selects=5、chip 隱藏、無溢出）。
截圖在 scratchpad/filter-mobile-390x844-filters.png、filter-prod-390.png。

**過程備註**：視覺判讀 agent 曾報「下拉上方有 chip 殘影」，經 DOM 裁決是本來就存在的 CategoryTicker
分類索引橫條（非 bug、非本次改動）。

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
- [ ] **部署上線**：程式碼已 commit，待 push→Vercel 部署（DB 已先行套用，且皆為新增型、舊碼相容，未破壞線上）。
- [ ] 使用者登入 /studio 實際點測 5 個後台頁（作品分類/選單頁尾/報價問卷/服務落地頁/網站設定擴充）。
- [ ] 部署後開真實線上 URL 確認營業時間等新功能生效。

## 地雷 / 待辦（非本次範圍）
- `/faq` 頁有既有的 React 重複 key 警告（非本次改動造成，不影響顯示）——之後可順手修。
- 前台多處 client 元件（navbar/footer/需求單）改為 client 端讀 DB：預設值＝現值，故無閃動；若日後改值，會在下次載入更新。
- 專案有雙 lockfile 等既有債（見 CLAUDE.md），本次未動。
