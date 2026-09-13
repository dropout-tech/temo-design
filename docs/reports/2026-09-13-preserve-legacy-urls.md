# TEMO A 方案：保留舊網址

## 範圍

- 客戶確認 PDF 的 28 組網址採精確白名單，不按名稱猜測。獨立驗收 fixture 保留清單中的新站主標題。
- 茶覺未有確認的舊網址，保留 `/portfolio/oriental-beauty`。
- 舊路徑直接回傳同一套新站作品元件與資料，HTTP 200；不跳往 `/portfolio/...`。
- 已映射作品的 `/portfolio/...` 入口以 308 收斂回原舊路徑；這不是將舊網址轉走的 B 方案。
- 正式網址採 `https://temo.design`；頁面 canonical、作品連結、robots/sitemap 一致。作品名稱、內部 slug、資料庫與排版不改。
- 沒有修改 Cloudflare、Namecheap nameservers、郵件設定、舊站帳戶或訂閱；沒有帶入來源工作樹的 loading-screen 等 WIP。

## 驗證

- `pnpm exec tsx scripts/legacy-work-paths.test.ts`：28 組與核准清單逐一比對、唯一性、易混淆名稱、未知路徑及茶覺排除。
- `pnpm exec tsx scripts/verify-legacy-urls.ts <origin>`：全部舊路徑 200／無 Location、主標題正確、canonical 舊網址、無 noindex、圖片標籤、內部入口回舊路徑、sitemap、茶覺、未知頁 404、既有主要頁面與站內連結。
- TypeScript、指定 ESLint、既有合作夥伴署名測試、diff check 與正式 build。
- 正式 DNS 只能在 Vercel 部署與線上 28 筆驗證通過後修改。最後另檢驗 Namecheap、權威 DNS、正式網域 HTTPS 與前台顯示。

## 維護與回復

- 對照表為 `lib/legacy-work-paths.ts`；驗收 fixture 在 `scripts/fixtures/approved-legacy-works.json`。要改清單內作品 slug，須先同步更新這兩處，否則旧地址將無法讀到原作品。
- 舊站 Namecheap PremiumDNS：`pdns1.registrar-servers.com`、`pdns2.registrar-servers.com`，本次保留。
- 切換前 A `@` 與 A `www` 均為 `151.101.192.119`，TTL 30 分鐘。
- `_portfolio` TXT、根網域 SPF 與郵件轉寄 MX 均保留；DNSSEC 原本關閉，不作改動。
- Vercel 網域頁指定：A `@` 為 `216.150.1.1`；CNAME `www` 為 `9b52aa4b83f17c10.vercel-dns-017.com.`。
- 必要時依上述舊 A 記錄恢復兩個網站入口。DNS 回復不一定立即全網生效；舊站主機、帳戶、圖片來源先不要刪除或停訂。
- 未列入 28 筆的舊頁不推測轉址、不批次導首頁；舊站快照不等於完整全站備份。
- 搜尋排名不保證零波動；Search Console 排名／流量追蹤需要既有站點權限。
