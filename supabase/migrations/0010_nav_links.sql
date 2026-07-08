-- ─────────────────────────────────────────────────────────────────────────────
-- 0010 導覽選單 / 頁尾連結（後台可自訂）
--   單一表 nav_links，用 location 區分三處：
--     header = 右上角導覽（桌機）      label_en 大字 + label 中文小字
--     menu   = 漢堡全螢幕選單           label_en 大字 + label 中文小字
--     footer = 頁尾「快速連結」         只用 label（中文）
--   seed 只在表為空時寫入目前站台既有的連結（可安全重跑）。
-- 套用：psql "$DATABASE_URI" -v ON_ERROR_STOP=1 -f supabase/migrations/0010_nav_links.sql
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists nav_links (
  id         uuid primary key default gen_random_uuid(),
  location   text not null check (location in ('header','menu','footer')),
  href       text not null,
  label      text not null,          -- 主要文字（中文）
  label_en   text,                   -- 英文（header/menu 用；footer 可留空）
  sort       int  not null default 0,
  created_at timestamptz not null default now()
);

alter table nav_links enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='nav_links' and policyname='nav_links_public_read') then
    create policy nav_links_public_read on nav_links for select using (true);
  end if;
  if not exists (select 1 from pg_policies where tablename='nav_links' and policyname='nav_links_auth_all') then
    create policy nav_links_auth_all on nav_links for all to authenticated using (true) with check (true);
  end if;
end $$;

-- 初始化（僅在整表為空時寫入，避免重跑重複）
insert into nav_links (location, href, label, label_en, sort)
select v.location, v.href, v.label, v.label_en, v.sort
from (values
  ('header', '/contact', '聯絡我們', 'CONTACT US', 0),
  ('header', '/about',   '關於我們', 'ABOUT US',   1),
  ('menu',   '/',        '首頁',     'HOME',       0),
  ('menu',   '/about',   '關於我們', 'ABOUT',      1),
  ('menu',   '/explore', '作品探索', 'WORKS',      2),
  ('menu',   '/faq',     '常見問題', 'FAQ',        3),
  ('menu',   '/contact', '聯絡我們', 'CONTACT',    4),
  ('footer', '/',        '首頁',     null,         0),
  ('footer', '/about',   '關於我們', null,         1),
  ('footer', '/explore', '作品探索', null,         2),
  ('footer', '/faq',     '常見問題', null,         3),
  ('footer', '/contact', '聯絡我們', null,         4)
) as v(location, href, label, label_en, sort)
where not exists (select 1 from nav_links);
