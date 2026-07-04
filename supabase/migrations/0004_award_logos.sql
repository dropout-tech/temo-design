-- ─────────────────────────────────────────────────────────────────────────────
-- 階段 6：得獎紀錄 Logo 牆（可後台自由新增／刪除，結構同 client_logos）
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.award_logos (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,          -- 獎項名稱（同時作為 alt / tooltip）
  image_url  text not null,          -- public 路徑或 storage 公開網址
  sort       int  not null default 0,
  created_at timestamptz not null default now()
);

-- RLS：公開可讀、登入者可寫
alter table public.award_logos enable row level security;
create policy award_logos_public_read on public.award_logos
  for select using (true);
create policy award_logos_auth_all on public.award_logos
  for all to authenticated using (true) with check (true);

-- 初始 15 筆（來自品牌提供的得獎合成圖，切開後放在 /public/awards/）
insert into public.award_logos (name, image_url, sort) values
  ('iF Design Award',                '/awards/if-design.png',                  0),
  ('red dot Design Award',           '/awards/reddot.png',                     1),
  ('James Dyson Award',              '/awards/james-dyson.png',                2),
  ('Lexus Design Award',             '/awards/lexus-design.png',               3),
  ('金點概念設計獎 Golden Pin Concept','/awards/golden-pin-concept.png',        4),
  ('WGA 2025 Silver Winner',         '/awards/wga-silver-2025.png',            5),
  ('時報金犢獎 Times Young Creative', '/awards/times-young-creative.png',       6),
  ('海峽兩岸工業設計大獎賽',          '/awards/cross-strait-idc.png',           7),
  ('Yangzhou 揚州',                  '/awards/yangzhou.png',                   8),
  ('經濟部工業局 IDB',               '/awards/idb-moea.png',                   9),
  ('金趣咪獎',                       '/awards/jinqumi.png',                    10),
  ('WGA 2025 Winner',                '/awards/wga-winner-2025.png',           11),
  ('KYMCO',                          '/awards/kymco.png',                      12),
  ('得獎標誌（待確認）',              '/awards/honor-mark.png',                 13),
  ('台灣珠寶金工創作協會',            '/awards/taiwan-jewelry-metalsmithing.png',14);
