# STATUS — TEMO 官網

> 會變的狀態放這裡（不變的事實放 CLAUDE.md）。開場先讀。

## 目前進度（2026-07-09）

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
