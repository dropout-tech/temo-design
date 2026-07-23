-- 0018：執行項目歸屬服務落地頁
--   category_groups.landing_slug：此執行項目屬於哪個 /services/[slug] 落地頁；
--   null = 不屬於任何落地頁（只出現在 /portfolio 總覽篩選）。
--   各落地頁下方作品列表 = 歸屬該頁的所有執行項目的作品（修「點每個分類都是同一批作品」）。
-- 全檔可安全重跑（if not exists / 只填未設定者 / on conflict do nothing）。
-- 套用：psql "$DATABASE_URI" -v ON_ERROR_STOP=1 -f supabase/migrations/0018_category_group_landing.sql

alter table category_groups add column if not exists landing_slug text;

-- 既有 11 個平面／品牌類執行項目 → 歸屬 01 BRAND & GRAPHIC（只填尚未設定者）
update category_groups set landing_slug = 'brand-graphic'
where landing_slug is null
  and value in (
    'brand-planning','logo-trademark','packaging','business-card','menu',
    'poster','storefront','web-visual','graphic','exhibition','merchandise'
  );

-- 公共藝術／產品設計／工藝設計：各自新增專屬執行項目並歸屬對應落地頁
insert into category_groups (value, label, sort, landing_slug) values
  ('public-art',     '公共藝術', 11, 'public-art'),
  ('product-design', '產品設計', 12, 'product-design'),
  ('crafts-design',  '工藝設計', 13, 'crafts-design')
on conflict (value) do nothing;
