# TEMO 自建 CMS — 全站資料藍圖

> 目標：打造一套「提摩樣子」的自建後台（`temo.design/studio`），用 **Supabase**（登入 + 資料庫 + 圖片儲存）當引擎，讓你自己就能管理整個網站內容，不再使用 Payload 的介面。
>
> 這份文件是「建築藍圖」：一次把全站內容的資料結構設計完整、收斂掉目前散落各處的重複版本。**設計一次到位，施工分階段進行。**

---

## 0. 現況體檢（為什麼要重做）

探索整個專案後發現：

- 內容散在 **15+ 個地方**，其中好幾樣有「打架的重複版本」。
- 目前**只有「作品詳情頁」會讀 CMS**，其餘全部寫死在程式碼裡。
- 真正在網站上顯示的作品資料模型（`lib/portfolio-data.ts` 的 `Work`）比 Payload 的舊 schema 完整很多。

### 需要收斂的重複版本

| 內容 | 現在有幾套 | 收斂決定 |
|---|---|---|
| 作品分類 | 3 套（`categoryGroup+industries` / Payload 5 中文 / tags） | ✅ 用 `categoryGroup`(11) + `industries`(7)，其餘淘汰 |
| 設計師 | 2 套（作品頁 5 人有 slug／關於頁 7 人有得獎資歷、名字不同） | ⚠️ **需要你決定名冊**（見 §6 決策 1） |
| 服務 | 3 套（落地頁 4 / explore 4 / Payload 空） | ✅ 合併成單一 `services`，以落地頁 4 筆為主幹 |
| FAQ | 2 套（實際顯示的 4 分類 / Payload 5 分類） | ✅ 用實際顯示的 4 分類 |
| 網站聯絡資訊 | 3 套（Payload global / site-config / hero 內） | ✅ 合併成單一 `site_settings` |
| 作品真實資料 | 8 筆在靜態碼、7 筆假資料在 DB | ✅ 以 **8 筆真作品**為匯入來源，DB 假資料丟棄 |

---

## 1. 技術架構

```
訪客 ─────────────►  前台網站（Next.js，維持現在的黑金設計）
                          │ 讀取（只讀已發布內容）
                          ▼
你 ──► /studio 後台  ──►  Supabase
     （自己刻，黑金提摩風）    ├─ 🔐 Auth      登入（Email + 密碼）
                          ├─ 🗄️ Postgres  內容資料（你已經有）
                          └─ 📦 Storage   圖片檔案
```

- **後台 UI**：`app/studio/`，重用現有設計系統（`temo-gold #cda96d`、`temo-black #1a1a1a`）與已安裝的 shadcn 元件（`table`、`dialog`、`form`、`sidebar`、`sonner`…全都在）。
- **表單**：改用已安裝但目前沒在用的 `react-hook-form + zod + ui/form.tsx + sonner`（零新增套件、好維護）。
- **權限（RLS）**：任何人可讀「已發布」內容；只有登入者可新增/修改/刪除。
- **要新增的套件**：`@supabase/supabase-js`、`@supabase/ssr`（目前尚未安裝）。
- **最終移除**：`payload`、`@payloadcms/*`、`collections/`、`globals/`、`app/(payload)/`、`lib/payload.ts`（順便解決 Payload×Next16 的命令列相容性地雷）。

---

## 2. 資料表設計（Supabase Postgres）

### 分類（可編輯的清單）

**`category_groups`（執行項目，單選來源）** — 11 筆
| 欄位 | 型別 | 說明 |
|---|---|---|
| `value` | text PK | 例 `brand-planning` |
| `label` | text | 例 `品牌規劃設計` |
| `sort` | int | 排序 |

**`industries`（行業分類，複選來源）** — 7 筆　同結構（`value` / `label` / `sort`）

### 客戶

**`clients`**
| 欄位 | 型別 | 說明 |
|---|---|---|
| `id` | uuid PK | |
| `slug` | text unique | 例 `four-noble` |
| `name` | text | 客戶名 |
| `brief` | text? | 一句話簡介 |

### 設計師（合併兩套）

**`designers`**
| 欄位 | 型別 | 說明 |
|---|---|---|
| `id` | uuid PK | |
| `slug` | text unique | 有作品頁者用，例 `elise` |
| `name` | text | 英文名 |
| `name_zh` | text? | 中文名 |
| `role` | text | 職稱 |
| `category` | text | `DESIGNER` / `VENDOR` / `CONSULTANT` / `PARTNER` |
| `photo_url` | text | 大頭照 |
| `instagram` | text? | |
| `bio` | text[] | 多段自我介紹 |
| `achievements` | text[]? | 得獎/資歷（關於頁用） |
| `expertise` | text[]? | 專長（對應 `category_groups.value`） |
| `has_page` | bool | 是否有獨立 `/team/[slug]` 頁 |
| `sort` | int | |

### 作品（核心）

**`works`**
| 欄位 | 型別 | 說明 |
|---|---|---|
| `id` | uuid PK | |
| `slug` | text unique | `/portfolio/[slug]` |
| `title` | text | 中文標題 |
| `subtitle` | text? | 英文副標 |
| `category_group` | text FK→category_groups | 執行項目（單選） |
| `year` | text | 年份 |
| `client_id` | uuid FK→clients | 客戶（多對一） |
| `cover_url` | text | 封面圖（存 Supabase Storage 的網址） |
| `video_url` | text? | YouTube/Vimeo 連結（已做好解析，見 `lib/video.ts`） |
| `size` | text | `large` / `medium` / `small`（版面尺寸） |
| `description` | text | 簡述 |
| `services` | text[]? | 服務範疇 |
| `deliverables` | text[]? | 交付項目 |
| `challenge` | text? | 敘事：挑戰 |
| `approach` | text? | 敘事：做法 |
| `result` | text? | 敘事：成果 |
| `quote_text` | text? | 引言內文 |
| `quote_author` | text? | 引言出處 |
| `awards` | text[]? | 獎項 |
| `published` | bool | 是否上架 |
| `sort` | int | 排序 |
| `created_at` / `updated_at` | timestamptz | |

**關聯表**
- **`work_designers`**（作品↔設計師，多對多）：`work_id` FK、`designer_id` FK
- **`work_industries`**（作品↔行業，多對多）：`work_id` FK、`industry_value` FK
- **`work_gallery`**（作品畫廊圖，一對多）：`id`、`work_id` FK、`src`、`alt?`、`caption?`、`sort`

### 其他內容

**`services`（服務／落地頁，合併三套）** — 4 筆
`slug` / `num` / `title_en` text[] / `tagline_zh` / `tagline_en` / `cta_label?` / `cta_href?` / `portfolio_group`（`all` 或 category_group 值）/ `hide_filters` bool / `description?` / `cards` jsonb（explore 頁的 4 張卡）

**`faqs`** — 12 筆：`id` / `question` / `answer` / `category`（服務相關/合作流程/價格和預算/設計相關）/ `sort`

**`testimonials`** — `id` / `text` / `author` / `company?` / `rating`(1–5) / `sort`

**`site_settings`（單筆設定）**：`name` / `description` / `email` / `phone` / `address` / `instagram` / `facebook` / `behance` / `seo_title` / `seo_description` / `seo_keywords` text[] / `og_image?`

### 表單收件（目前送出根本沒存，⚠️ 見決策 2）
- **`contact_submissions`**：`name` / `email` / `company?` / `phone?` / `subject?` / `message` / `created_at`
- **`quote_submissions`**：`payload` jsonb（整份需求單答案）/ `created_at`

### 首頁/關於頁區塊（階段最後，可延後）
`stats`、`logo_meanings`、`philosophy_points`、`client_wall`、`honor_wall` — 純展示文案，先維持寫死，之後有需要再納管。

---

## 3. 關聯圖

```
category_groups ──(單選)──►  works  ◄──(多對一)── clients
                              │  ▲
      industries ──(多對多)───┘  └──(多對多)── designers
                                              (work_designers)
      works ──(一對多)──► work_gallery
```

---

## 4. 圖片儲存（Supabase Storage）

- 建一個 **public 讀取**的 bucket：`media`。
- 後台上傳封面/畫廊圖 → 存進 bucket → 資料表只存回傳的網址。
- 取代目前 Payload 的 `public/media` 本機儲存（本機儲存在 Vercel 上存不住，這也是要換掉的原因之一）。

---

## 5. 施工階段（設計一次、分批蓋）

| 階段 | 內容 | 產出 |
|---|---|---|
| **1 地基** | 裝 Supabase 套件、拿 API 金鑰、建上面所有表、設定 RLS、開 Auth 建你的管理員、開 Storage bucket、把 **8 個真作品 + 設計師 + 客戶**匯入 | 資料庫就緒、你能登入 |
| **2 作品後台** | `/studio` 登入頁 + 作品列表 + 新增/編輯表單（設計師/客戶選擇器、行業複選、**圖片上傳**、影片連結、畫廊、上架開關） | 你能自己管理作品 |
| **3 前台切換** | 作品集列表/詳情/團隊/落地頁改讀 Supabase | 網站前台吃你的資料庫 |
| **4 其他內容** | services / faqs / testimonials / site_settings / 關於頁團隊 陸續搬進後台 | 全站內容可自管 |
| **5 收尾** | 移除 Payload 全部殘留、清理孤兒檔、修正部署 | 乾淨、可上線 |

---

## 6. ⚠️ 需要你決定的事（施工前先收斂）

**決策 1 — 設計師名冊以哪套為準？**（最重要，影響資料表）
- A. 作品頁那 5 人（elise / yvonne / kevin / shirley / sim，有作品頁與專長）
- B. 關於頁那份更完整的名冊（7 位設計師 + 廠商/顧問/夥伴，有得獎資歷，但沒 slug、名字對不起來）
- 我的建議：**以 B 為主幹**（比較完整），幫每人補 slug，其中「有作品頁」的人打勾。但這需要你的真實資訊——**這幾個是不是同一批人？誰要有獨立作品頁？**

**決策 2 — 聯絡表單 / 報價需求單的填答要不要存進資料庫？**
（目前訪客送出後根本沒存、也沒寄信，等於石沉大海。）建議至少存進 `contact_submissions` / `quote_submissions`，你在後台看得到。

**決策 3 — FAQ 與服務的重複版本**（低風險，我已建議）：FAQ 用實際顯示的 4 分類、服務以落地頁 4 筆為主幹。若你沒意見我就照建議走。

---

## 7. 給你的重點提醒

- **你的客戶永遠看不到後台**，後台醜或美只有你自己感受——但我們既然要做，就會做成提摩的黑金樣子。
- **登入與圖片安全交給 Supabase**，我們不自己手刻這些危險零件（新手最容易在這裡出包）。
- 這是**跨多次對話的專案**，這份藍圖就是我們每次回來時的地圖。
