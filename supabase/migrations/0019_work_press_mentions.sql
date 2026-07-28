-- 作品「新聞報導」欄位：與 awards 同模式的 text[]，一行一筆。
-- 每筆格式「媒體名稱 https://連結」（連結選填）；前台內頁有值才顯示 Press 區塊。
-- 可安全重跑（if not exists）。
alter table works add column if not exists press_mentions text[] not null default '{}';
