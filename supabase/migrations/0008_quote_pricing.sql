-- ─────────────────────────────────────────────────────────────────────────────
-- 階段 8：即時報價試算（可後台自由改價 / 增刪方案 / 管理加購池）
-- 原本寫死在 components/quote/quote-calculator.tsx，改為三張表存進 Supabase。
--   quote_categories → 服務大類（純享單品 / 品牌包套 / 社群圖文…）
--   quote_packages   → 每類底下的方案（含價格、特色清單、推薦標記）
--   quote_addons     → 共用加購池（bundle 方案勾選 show_addons 才顯示）
-- ─────────────────────────────────────────────────────────────────────────────

-- 1) 服務大類
create table if not exists public.quote_categories (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,           -- 中文類別名（分頁標籤）
  title_en    text not null default '',
  description text not null default '',
  icon        text not null default '', -- 手機分頁前的單字圖示（S / B / C…）
  sort        int  not null default 0,
  created_at  timestamptz not null default now()
);

-- 2) 方案
create table if not exists public.quote_packages (
  id             uuid primary key default gen_random_uuid(),
  category_id    uuid not null references public.quote_categories(id) on delete cascade,
  name           text not null,               -- 中文方案名
  name_en        text not null default '',
  base_price     int  not null default 0,     -- 起價（New Taiwan Dollar）
  original_price int,                          -- 原價（有值時前台顯示刪除線）
  price_note     text,                         -- 價格備註（範圍價 / 現省…）
  features       jsonb not null default '[]',  -- 特色清單，字串陣列
  recommended    boolean not null default false,
  show_addons    boolean not null default false, -- 是否顯示共用加購池
  sort           int  not null default 0,
  created_at     timestamptz not null default now()
);
create index if not exists quote_packages_category_idx on public.quote_packages(category_id);

-- 3) 共用加購池
create table if not exists public.quote_addons (
  id         uuid primary key default gen_random_uuid(),
  label      text not null,
  price      int  not null default 0,
  sort       int  not null default 0,
  created_at timestamptz not null default now()
);

-- RLS：公開可讀、登入者可寫（與 faqs / client_logos 同一套規則）
do $$
declare t text;
begin
  foreach t in array array['quote_categories','quote_packages','quote_addons'] loop
    execute format('alter table public.%I enable row level security;', t);
    execute format('create policy %I on public.%I for select using (true);', t||'_public_read', t);
    execute format('create policy %I on public.%I for all to authenticated using (true) with check (true);', t||'_auth_all', t);
  end loop;
end $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 初始資料：把目前寫死的官方價目表 seed 進來（2026-05 snapshot）
-- ─────────────────────────────────────────────────────────────────────────────

-- 加購池（提摩官方加價購表）
insert into public.quote_addons (label, price, sort) values
  ('文宣海報 / A3 菜單 (1 款)',        5500,  0),
  ('招牌設計 (1 款)',                  5000,  1),
  ('超值包裝設計 (1 款)',              6800,  2),
  ('高質感包裝設計 (1 款)',            11000, 3),
  ('名片數位印刷 (250 張/人)',         1200,  4),
  ('名片複雜加工數位印刷',             3500,  5),
  ('凸版名片印刷 (200 張/人)',         13500, 6);

-- 大類
insert into public.quote_categories (title, title_en, description, icon, sort) values
  ('純享單品', 'PURE DESIGN',    '單一品項設計，依需求挑選',                 'S', 0),
  ('品牌包套', 'BRAND BUNDLE',   '適合創業初期、電商或中小企業的整套品牌方案', 'B', 1),
  ('社群圖文', 'SOCIAL CONTENT', '穩定產出社群貼文素材，月 / 季 / 年訂閱制',   'C', 2);

-- 方案：純享單品
insert into public.quote_packages
  (category_id, name, name_en, base_price, original_price, price_note, recommended, show_addons, sort, features)
select id, v.name, v.name_en, v.base_price, v.original_price, v.price_note, v.recommended, v.show_addons, v.sort, v.features
from public.quote_categories c,
(values
  ('LOGO 商標設計', 'LOGO', 50000, null::int, null::text, true, false, 0,
    '["協助基本商標名稱檢索","共出 3 款 LOGO 設計 (標準色、標準字、圖形)","三擇一進入細修","一次大幅度修改 (可整個打掉重來，但只再出 2 款)","兩次細修，超過每次加收 1,600 元","完稿後會提供視覺手冊比例規範"]'::jsonb),
  ('名片設計 + 數位印刷', 'BUSINESS CARD', 6800, null, '方案一 / 不含印刷 NT$4,800 起', false, false, 1,
    '["協助印刷 (約 200–250 張)","簡單加工：上光、四邊倒圓角","共出 3 款名片設計，三擇一","兩次細修，超過每次加收 350 元","若需多人員，每人加收 400 元"]'::jsonb),
  ('文宣 / 菜單設計', 'GRAPHIC', 6800, null, 'NT$6,800 ~ 9,800', false, false, 2,
    '["不含印刷","共出 2 款文宣設計，二擇一","一次大幅度修改、一次細修","超過每次加收 800 元","可協助印刷，印刷報價另議"]'::jsonb),
  ('主視覺設計', 'KEY VISUAL', 18980, null, 'NT$18,980 ~ 35,000', false, false, 3,
    '["共出 2 款主視覺，二擇一","一次大幅度修改、一次細修","超過每次加收 1,600 元","適用形象 KV、活動主視覺"]'::jsonb),
  ('超值包裝設計', 'PACKAGE', 8800, null, 'NT$8,800 ~ 15,980 (高質感另計)', false, false, 4,
    '["廠商須提供包裝刀模檔","共出 2 款包裝設計，二擇一","一次大幅度修改、一次細修","若需重新設計刀模，須加收結構開發費"]'::jsonb),
  ('招牌設計', 'SHOP SIGN', 12800, null, '燈箱招牌 NT$5,500 起', false, false, 5,
    '["不含招牌工程","共出 2 款設計，二擇一","可協助模擬 3D","可協助台灣全區招牌工程，工程報價另議"]'::jsonb),
  ('顧問諮詢', 'CONSULTANT', 6000, null, null, false, false, 6,
    '["每次諮詢服務 1 HR","可協助品牌方向、問題、品牌定位","及創意市場規劃方向探討","委辦顧問會議紀錄為 PDF 一份"]'::jsonb)
) as v(name, name_en, base_price, original_price, price_note, recommended, show_addons, sort, features)
where c.sort = 0;

-- 方案：品牌包套（皆顯示加購池）
insert into public.quote_packages
  (category_id, name, name_en, base_price, original_price, price_note, recommended, show_addons, sort, features)
select id, v.name, v.name_en, v.base_price, v.original_price, v.price_note, v.recommended, v.show_addons, v.sort, v.features
from public.quote_categories c,
(values
  ('初生之犢創業品牌方案', 'STARTUP', 57000, 72800::int, '現省 NT$15,800', false, true, 0,
    '["LOGO、名片、社群背景、初期顧問諮詢","共出 3 款 LOGO 設計、3 款名片設計","共出 2 款社群背景設計 (FB / LINE / 官網 BANNER)","包含初期諮詢 3 次","適合剛創業、電商初創品牌"]'::jsonb),
  ('虎哩旺旺來品牌方案', 'GROWING', 66800, 93200, '現省 NT$26,400', true, true, 1,
    '["LOGO、名片、菜單、DM、廣告圖、社群背景","初期品牌顧問專業陪跑","1 年內品牌專屬諮詢 3 次 (每次 1 HR)","共出 3 款 LOGO、3 款名片、2 款社群背景、2 款 DM 菜單、2 款廣告圖","完稿後提供視覺手冊與規範"]'::jsonb),
  ('尊爵企業品牌 VI 系統', 'ENTERPRISE VI', 129980, 172200, '現省 NT$42,220', false, true, 2,
    '["完整 VI 品牌識別系統","協助品牌名稱、Slogan、Hashtag 規劃","LOGO ×3 / 名片 ×3 / 工牌 ×3 / 工藝制服 ×2","社群背景 ×2 / DM / 圖騰 / 輔助圖形 ×4","1 年內專屬顧問諮詢 7 次 (每次 1 HR)","完稿後提供完整視覺品牌手冊"]'::jsonb)
) as v(name, name_en, base_price, original_price, price_note, recommended, show_addons, sort, features)
where c.sort = 1;

-- 方案：社群圖文
insert into public.quote_packages
  (category_id, name, name_en, base_price, original_price, price_note, recommended, show_addons, sort, features)
select id, v.name, v.name_en, v.base_price, v.original_price, v.price_note, v.recommended, v.show_addons, v.sort, v.features
from public.quote_categories c,
(values
  ('基礎社群圖文・月付', 'BASIC · MONTHLY', 6800, null::int, null::text, false, false, 0,
    '["共出 4 篇單圖文，每篇 2 款二擇一","創意文案撰寫，每篇 1 則","每款圖設計與文案各一次大幅修改","兩次細修，超過每次加收 500 元","加一張內文加收 600 元"]'::jsonb),
  ('基礎社群圖文・季付', 'BASIC · QUARTERLY', 20000, 20400, '三個月一次付清', true, false, 1,
    '["共出 14 篇單圖文，每篇 2 款二擇一","每月固定產出 4–5 篇","創意文案撰寫，每篇 1 則","適合穩定經營社群的品牌"]'::jsonb),
  ('基礎社群圖文・年付', 'BASIC · YEARLY', 68000, 81600, '現省 NT$13,600', false, false, 2,
    '["共出 52 篇單圖文，每篇 2 款二擇一","全年穩定品牌發聲","適合品牌長線經營"]'::jsonb),
  ('多圖社群圖文・月付', 'MULTI · MONTHLY', 8800, null, null, false, false, 3,
    '["共出 4 篇圖文，每篇 1–5 張","創意文案撰寫，每篇 1 則","適合敘事型品牌內容"]'::jsonb),
  ('多圖社群圖文・季付', 'MULTI · QUARTERLY', 24000, 30800, '現省 NT$6,800', false, false, 4,
    '["共出 14 篇多圖圖文，每篇 1–5 張","每月固定產出多圖貼文"]'::jsonb),
  ('多圖社群圖文・年付', 'MULTI · YEARLY', 88000, 114400, '現省 NT$26,400', true, false, 5,
    '["共出 52 篇多圖圖文","全年穩定深度品牌敘事","適合品牌故事感經營"]'::jsonb)
) as v(name, name_en, base_price, original_price, price_note, recommended, show_addons, sort, features)
where c.sort = 2;
