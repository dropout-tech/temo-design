-- ─────────────────────────────────────────────────────────────────────────────
-- 0012 服務分類落地頁（/services/[slug]）後台可自訂
--   category_landings：4 個服務介紹頁的 hero 文案與設定。
--   seed 由 scripts/seed-landings.ts 從 lib/category-landing-data.ts 產生（附於檔末）。
-- 套用：psql "$DATABASE_URI" -v ON_ERROR_STOP=1 -f supabase/migrations/0012_category_landings.sql
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists category_landings (
  slug            text primary key,
  num             text,                       -- 顯示序號 01/02/03/04
  title_en        text[] not null default '{}',   -- 大標，每行一個元素
  tagline_zh      text,                        -- 中文標語（可含換行）
  tagline_en      text,                        -- 英文標語（可含換行）
  cta_label       text,                        -- 右下按鈕文字（可空 = 不顯示按鈕）
  cta_href        text,
  portfolio_group text not null default 'all', -- 下方作品預設執行項目篩選；all=全部
  hide_filters    boolean not null default false,
  sort            int not null default 0,
  created_at      timestamptz not null default now()
);

alter table category_landings enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='category_landings' and policyname='category_landings_public_read') then
    create policy category_landings_public_read on category_landings for select using (true);
    create policy category_landings_auth_all   on category_landings for all to authenticated using (true) with check (true);
  end if;
end $$;

-- ===== 附加：seed（由 scripts/seed-landings.ts 產生；表為空時才執行）=====
do $$ begin
if not exists (select 1 from category_landings) then
  insert into category_landings (slug, num, title_en, tagline_zh, tagline_en, cta_label, cta_href, portfolio_group, hide_filters, sort) values ('brand-graphic', '01', array['BRAND','&','GRAPHIC']::text[], '品牌是訴說理念的媒介，
而包裝則是讓您的品牌成為最亮眼那顆星的利器！', 'A BRAND SPEAKS
PACKAGING MAKES IT UNFORGETTABLE.', '價格試算表單', '/contact', 'all', false, 0);
  insert into category_landings (slug, num, title_en, tagline_zh, tagline_en, cta_label, cta_href, portfolio_group, hide_filters, sort) values ('public-art', '02', array['PUBLIC','ART','DESIGN']::text[], '藝術是情感抽象的表現形式，
裝置藝術則是為冷豔的社會添加一絲美麗！', 'Art gives form to unseen emotions
installation art softens a distant world
with a trace of beauty.', '價格試算表單', '/contact', 'all', true, 1);
  insert into category_landings (slug, num, title_en, tagline_zh, tagline_en, cta_label, cta_href, portfolio_group, hide_filters, sort) values ('product-design', '03', array['PRODUCT','DESIGN']::text[], '我認為設計師並不是一位單純替人發明創造產品的maker，而是另一種形式的醫生，透過觀察生活中的細節來對症下藥，替使用者解決他們的問題！', 'Not just a maker, but a doctor of design
healing problems through observation
and creation..', '價格試算表單', '/contact', 'all', true, 2);
  insert into category_landings (slug, num, title_en, tagline_zh, tagline_en, cta_label, cta_href, portfolio_group, hide_filters, sort) values ('crafts-design', '04', array['CRAFTS','DESIGN']::text[], '人為美而生，提摩為追求工藝之美而設計...
提摩透過大地之母 - GAIA的靈感與餽贈，進而產下了KAIA 凱婭工藝。專為愛與美人士打造現成工藝產品。', 'Born for beauty. Crafted by TEMO.
Inspired by GAIA, created as KAIA.
For those who live for love and aesthetics.', '價格試算表單', '/contact', 'all', true, 3);
end if;
end $$;
