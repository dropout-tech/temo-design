# TEMO 官網表單：Google Apps Script 寄信設定

官網會先把聯絡表單保存至 Supabase，再由 Next.js 伺服器呼叫 Google Apps Script。Apps Script 使用 `MailApp`，把通知寄到 `temo.design0531@gmail.com`；訪客 Email 只會作為 `Reply-To`。

## 一、建立 Apps Script

1. 使用 `temo.design0531@gmail.com` 登入 [Google Apps Script](https://script.google.com/)。
2. 建立新專案，名稱可設為 `TEMO Contact Form Mailer`。
3. 將 [`integrations/google-apps-script/contact-mailer.gs`](../integrations/google-apps-script/contact-mailer.gs) 的完整內容貼到 `Code.gs`。
4. 進入「專案設定 → 指令碼屬性」，新增：
   - `WEBHOOK_SECRET`：至少 32 字元的隨機密鑰。
   - `CONTACT_TO_EMAIL`：`temo.design0531@gmail.com`。

`WEBHOOK_SECRET` 不能貼在程式碼、GitHub、對話或任何前端環境變數中。

## 二、部署 Web App

1. 點「部署 → 新增部署作業」。
2. 類型選擇「網頁應用程式」。
3. 執行身分選「我」。
4. 存取權選擇「任何人」。公開端點仍必須通過 `WEBHOOK_SECRET` 驗證才會寄信。
5. 完成 Google 的寄信權限授權。
6. 複製結尾為 `/exec` 的 Web App URL；不要使用只供開發測試的 `/dev` URL。

## 三、設定 Vercel 環境變數

在 Vercel 的 Production 環境加入：

```dotenv
GOOGLE_APPS_SCRIPT_WEB_APP_URL=https://script.google.com/macros/s/DEPLOYMENT_ID/exec
CONTACT_MAIL_WEBHOOK_SECRET=與指令碼屬性完全相同的密鑰
CONTACT_FORM_RATE_LIMIT_SALT=另一組至少32字元的隨機密鑰
SUPABASE_SERVICE_ROLE_KEY=Supabase伺服器端金鑰
```

Preview、Development 應使用獨立的非正式 Supabase 專案與密鑰，或維持寄信功能關閉；不要為了預覽方便而把正式環境的 `SUPABASE_SERVICE_ROLE_KEY` 複製過去。

修改 Apps Script 程式後，必須建立新版本並更新 Web App 部署，線上 `/exec` 才會使用新程式。

## 四、正式驗證

1. 先套用 `supabase/migrations/20260829092746_contact_submission_delivery.sql`。
2. 部署網站後，用測試資料送出一筆表單。
3. 確認 Gmail 實際收到信，直接回覆時收件者是表單填寫者。
4. 登入 `/studio/submissions`，確認完整內容與「通知信已寄出」狀態。
5. 刪除或註記測試資料，確認沒有多餘紀錄。

個人 Gmail 的 Apps Script `MailApp` 配額目前是每日 100 位收件人；若未來表單量接近此限制，應改用 Gmail API 或專業寄信服務。
