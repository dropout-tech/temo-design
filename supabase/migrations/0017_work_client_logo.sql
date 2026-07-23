-- 0017: 作品客戶 LOGO 欄位（選填，顯示於作品內頁右側資訊欄最頂端）
-- 套用方式：psql "$DATABASE_URI" -v ON_ERROR_STOP=1 -f supabase/migrations/0017_work_client_logo.sql

alter table works add column if not exists client_logo_url text;
