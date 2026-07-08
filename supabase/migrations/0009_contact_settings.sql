-- ─────────────────────────────────────────────────────────────────────────────
-- 0009 聯絡資訊擴充：營業時間、LINE 官方帳號
--   site_settings 加三個欄位：business_hours（營業時間，一行一時段）、
--   line_url（LINE 連結）、line_qr_url（LINE QR 圖片網址）。
--   並把目前站台既有的聯絡資訊寫進 DB（首次初始化，不覆蓋日後後台的編輯），
--   以及依需求把營業時間預設為 09:00–21:00、週六日休息。
-- 套用：psql "$DATABASE_URI" -v ON_ERROR_STOP=1 -f supabase/migrations/0009_contact_settings.sql
-- ─────────────────────────────────────────────────────────────────────────────

alter table site_settings add column if not exists business_hours text;
alter table site_settings add column if not exists line_url       text;
alter table site_settings add column if not exists line_qr_url     text;

-- 首次初始化：若尚無設定列，用目前站台既有聯絡資訊建立（已存在則不動）
insert into site_settings (id, name, description, email, phone, address, instagram, facebook, behance)
values (
  1,
  'TEMO DESIGN',
  '以人為本的品牌設計工作室。我們相信設計不只是造型，更是一種療癒與解方。服務超過 200+ 品牌。',
  'temo.design0531@gmail.com',
  '0913-322-070',
  '台中市西區台灣大道二段229號13樓之2',
  'https://www.instagram.com/_temo_design/',
  'https://www.facebook.com/temodesignss',
  'https://www.behance.net/temodesign0531'
)
on conflict (id) do nothing;

-- 依需求設定營業時間（僅在尚未設定過時填入，避免覆蓋日後後台的修改）
update site_settings
set business_hours = '週一 — 週五｜09:00 – 21:00' || chr(10) || '週六 · 週日｜休息'
where id = 1 and (business_hours is null or business_hours = '');

-- 修正過期的聯絡資訊：DB 仍是舊台北地址／舊信箱電話，程式碼（site-config、footer）
-- 已於 commit 52d27bb / 6c39151 更新為台中辦公室，但當時未同步 DB，導致線上聯絡頁
-- 仍顯示舊資訊。以下只在偵測到舊值時覆蓋（可安全重跑，不覆蓋日後後台的修改）。
update site_settings set
  email     = 'temo.design0531@gmail.com',
  phone     = '0913-322-070',
  address   = '台中市西區台灣大道二段229號13樓之2',
  instagram = 'https://www.instagram.com/_temo_design/',
  facebook  = 'https://www.facebook.com/temodesignss',
  behance   = 'https://www.behance.net/temodesign0531'
where id = 1 and (address like '台北%' or email = 'info@temo.design');
