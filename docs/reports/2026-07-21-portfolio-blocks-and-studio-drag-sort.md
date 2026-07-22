# 作品內容區塊系統（仿 Adobe Portfolio）＋全站後台排序拖曳化

# Description

- 使用者三項需求：(1) 作品探索的設計師/年份篩選跟後台沒連動；(2) 作品封面與內頁首圖分離（可相同可不同、可放影片）；(3) 作品內容要像 Adobe Portfolio 一樣彈性（圖下加文字、嵌 YouTube、直橫式依形狀自適應、同列雙圖、順序可調）。
- 追加需求：「作品分類」後台頁 UI 重做（原版被評不直覺不好看不好用）；全站後台所有排序改拖曳，且依各區塊使用情境設計、不套同一模板。

# Changes Made

- **篩選連動修復**：設計師/年份/客戶下拉改由 DB 真實作品動態推導；getAllWorks 加抓 clients.name／designers.name_zh 顯示正式名稱
  `components/pages/portfolio-page-client.tsx`、`lib/portfolio-supabase.ts`、`lib/portfolio-data.ts`
- **內容區塊系統**：新表 `work_blocks`（type image/video/text、src2=同列雙圖、width/height 原始尺寸）＋ `works.hero_url`（內頁首圖，留空＝沿用封面）；舊 work_gallery 16 張圖由 migration 自動搬入並補量測尺寸（backfill-dims.sh）
  `supabase/migrations/0015_work_hero_and_blocks.sql`、`lib/studio/works.ts`
- **後台作品表單**：gallery 編輯區換成內容區塊編輯器（單圖/雙圖/文字/影片、排序、上傳自動記錄尺寸）＋內頁首圖欄位
  `components/studio/work-form.tsx`、`app/studio/(app)/works/actions.ts`
- **前台作品內頁**：blocks 渲染器——依原始比例不硬裁、雙圖桌面並排手機堆疊、文字段落、VideoEmbed；hero fallback cover
  `components/pages/portfolio-detail-client.tsx`
- **作品分類頁重做**：肥卡片＋數字排序框＋每列儲存鈕 → 緊湊列表（把手拖曳／名稱 onBlur 自動存／inline 新增／刪除）
  `components/studio/category-manager.tsx`、`app/studio/(app)/categories/actions.ts`
- **全站排序拖曳化（依情境）**：Logo 牆三頁 grid 直接拖卡片；選單（三組各自）/FAQ/社群整列拖；問卷/報價兩層各自容器內拖；作品內容區塊拖曳＋↑↓雙軌；落地頁查證 sort 前台未用→只拆數字框。`sortable-list.tsx` 升級滑鼠(HTML5 drag)＋觸控(Pointer Events+elementFromPoint)雙路徑，API 不變。9 個 actions 檔新增 reorderXxx 整批寫 sort
  `components/studio/*-manager.tsx`（12 檔）、`app/studio/(app)/*/actions.ts`（9 檔）

Result: Success — 全部上線（commits ed0b660、3025f2d＋修復 commit；migration 0015 經使用者授權套用至正式 Supabase）

# Updates

- Fixed [Critical] components/studio/*（10 manager）— 拖曳排序後編輯任一筆會把載入時的舊 sort 寫回 DB 弄亂順序；修法：commit 時把新 index 同步回每列 state 的 sort（與 reorder action 寫入值一致），複核 agent 逐檔確認
- Fixed [Critical] supabase/migrations/0015:30 — RLS policy 缺可安全重跑防護（違反 8d89b6a 起的 repo 慣例）；已包 `do $$ if not exists $$`
- Fixed [Warning] components/studio/*（12 manager）— 拖曳落庫失敗 UI 靜默且樂觀顯示新順序；已接 res.error → orderError 顯示，Playwright 實測未登入拖曳確實顯示錯誤
- 過程插曲：部署後 15 秒間隔 curl 輪詢觸發 Vercel Security Checkpoint、本機 IP 被擋約 10 分鐘（訪客不受影響）；教訓入 ~/.claude/rules/lessons.md（改 ≥60 秒間隔）

# Result

- `npx tsc --noEmit` 0 錯誤；`npm run build` ✓（修復前後各跑一次）
- 確定性 Playwright：本地 10/10（篩選/區塊比例/手機無溢出）、拖曳 harness 8/8（滑鼠＋CDP 觸控實拖、onCommit 落庫）、修復重驗 3/3（含 WR-01 錯誤提示實測）、線上 4/4（temo-design.vercel.app 篩選選項與 13 張區塊圖零比例偏差）
- Code review（3 視角 agent＋11 個信心評分員，門檻 80）：3 發現全修復，REVIEW.md 有完整記錄與處置
- 資料庫：migration 0015 已套用（16 張舊圖搬入 work_blocks、尺寸 backfill 16/16）；work_gallery 保留未刪（穩定後可清理）
- 未驗項：後台登入後的實際存檔流程（需 /studio 權限，留使用者驗收）；同 repo 另有平行 session 的報價扣抵功能（a6c52ad），本報告不涵蓋

# Unsolved Issues

- [Info] 首頁 hero 影片 poster 404（`components/sections/hero-section.tsx:45` 引用不存在的 `/images/hero-poster.jpg`，既有問題，見 STATUS.md 地雷欄）
- [Info] 專案根目錄無 CLAUDE.md（STATUS.md 引用了它但檔案不存在；建議之後補建，範本照九豆專案）
