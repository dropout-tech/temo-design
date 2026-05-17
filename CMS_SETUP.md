# CMS 後台設定步驟（Payload 3 + Supabase Postgres）

我已經把後台 CMS 的程式碼全部裝好了，但**資料庫帳號要你自己開**，不然我看不到你的密碼。
跟著下面四步，大概 5 分鐘就能讓後台跑起來。

---

## Step 1 — 開一個免費的 Supabase 專案

1. 開 https://supabase.com ，用 GitHub 登入（免信用卡）
2. 點 **New Project**
   - Name：`temo-cms`（隨便）
   - Database Password：**自己設一個強密碼，記下來**（之後還要用）
   - Region：選 **Northeast Asia (Tokyo)** 或 **Southeast Asia (Singapore)**
   - Plan：Free
3. 點 Create，等他建好（約 1~2 分鐘）

### 取得連線字串（重要！別選錯！）

Supabase 後台 → 左下齒輪 **Project Settings** → **Database** → 找 **Connection string** 區塊。
那邊會有 4 個 tab：`URI` / `PSQL` / `.NET` / `JDBC`，先選 **URI**。
URI 上方還有一排：**Direct connection** / **Session pooler** / **Transaction pooler**。

👉 **請選「Session pooler」這一條**（不是 Direct connection 也不是 Transaction pooler）

長這樣：
```
postgresql://postgres.xxxxxxxxxxxx:[YOUR-PASSWORD]@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres
```

把 `[YOUR-PASSWORD]` 換成你剛才設的資料庫密碼，整段複製起來。

> **為什麼一定要 Session pooler？**
> Direct 在 Vercel 部署會爆連線數；Transaction pooler 會破壞 Payload 的 prepared statement。
> Session pooler 兩邊通吃，是 Payload + Supabase 的最佳搭配。

## Step 2 — 建立 `.env.local`

在專案根目錄建立 `.env.local`（注意有 `.local`），內容：

```bash
DATABASE_URI=貼上你剛剛複製的 Supabase Session pooler 字串（記得密碼要填進去）
PAYLOAD_SECRET=隨意打一串長字串至少32個字元像是abcd1234efgh5678ijkl9012mnop3456
NEXT_PUBLIC_SERVER_URL=http://localhost:3000
```

> `.env.local` 已經在 `.gitignore` 裡，不會被推上 git，安心放。

## Step 3 — 啟動 dev、第一次進後台會建管理員帳號

```bash
pnpm dev
```

打開瀏覽器：**http://localhost:3000/admin**

第一次進去 Payload 會問你建立第一個帳號（你的 email + 密碼），輸入後送出。
這個帳號就是你之後登入後台的帳號。

進到後台之後就可以看到左邊有：
- Users（帳號管理）
- Media（圖片庫）
- 作品集 Portfolio
- 服務項目 Services
- 常見問答 FAQs
- 客戶見證 Testimonials
- 網站設定（Globals 區）

## Step 4 — 灌入既有的作品資料（一次性）

把目前寫在程式碼裡的 7 個作品案例倒進資料庫：

```bash
pnpm seed
```

跑完之後重新整理 `http://localhost:3000/portfolio`，你看到的作品就是從 CMS 來的了。
之後在後台改任何東西，**60 秒**內前台就會更新（這是 Next.js 的 ISR 設定，可調）。

---

## 之後要部署到 Vercel 時

在 Vercel 專案的 Environment Variables 加同樣三個變數：
- `DATABASE_URI`（**用同一條 Session pooler 字串**就好，不要換成 Direct connection）
- `PAYLOAD_SECRET`（同樣那串）
- `NEXT_PUBLIC_SERVER_URL`（改成你的正式網址）

部署完後，後台就在 `https://你的網址/admin`。

> **小提醒：** Supabase Free 方案閒置 7 天會把專案暫停，重新打開即可恢復。如果你的網站可能長期無人造訪，要記得偶爾登入 Supabase 點一下，或升級到 Pro。

---

## 我幫你做了什麼（給你一個地圖）

```
📁 collections/                    ← 後台「資料表」定義（每個 collection 一個檔）
   ├ Users.ts                      （登入帳號）
   ├ Media.ts                      （圖片上傳）
   ├ Portfolio.ts                  （作品集）
   ├ Services.ts                   （服務項目）
   ├ FAQs.ts                       （常見問答）
   └ Testimonials.ts               （客戶見證）

📁 globals/
   └ SiteSettings.ts               （網站設定，單一筆資料）

📁 app/(payload)/                  ← Payload 在 Next.js 裡的「房間」
   ├ layout.tsx                    （後台外殼）
   ├ admin/[[...segments]]/        （後台 UI 路由）
   └ api/                          （Payload REST + GraphQL API）

📁 lib/
   └ payload.ts                    （前台 server component 從 Payload 撈資料的 helper）

📁 scripts/
   └ seed.ts                       （一次性資料搬家）

📄 payload.config.ts               ← Payload 主設定檔
📄 .env.example                    ← 環境變數範本
📄 CMS_SETUP.md                    ← 你正在看的這份
```

## 還沒接 CMS 的部分（Phase 2）

目前**只有作品集 Portfolio 已經接到 CMS**，其他內容還是寫死在 code 裡：
- ✅ Portfolio listing `/portfolio`
- ✅ Portfolio detail `/portfolio/[slug]`
- ⏳ 首頁的服務區塊（Services）、見證、FAQ → 後台已建表，但前台頁面還沒切換
- ⏳ 網站設定（電話/Email/地址）→ 後台已建表，前台還是讀 `lib/site-config.ts`

這樣切是故意的：**先確認後台跑得起來、Portfolio 串得通，你滿意了我們再把其他頁面也搬過去**，
不然一次改太多東西，出問題會很難找原因。

跑通後跟我說「OK 第二階段」，我就把剩下的也接過去。
