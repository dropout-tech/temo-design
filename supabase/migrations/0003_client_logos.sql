-- ─────────────────────────────────────────────────────────────────────────────
-- 階段 5：客戶 Logo 牆（可後台自由新增／刪除）
-- ─────────────────────────────────────────────────────────────────────────────

-- 客戶 Logo
create table if not exists public.client_logos (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,          -- 客戶名稱（同時作為 alt / tooltip）
  image_url  text not null,          -- public 路徑或 storage 公開網址
  sort       int  not null default 0,
  created_at timestamptz not null default now()
);

-- RLS：公開可讀、登入者可寫（與 faqs / testimonials 同一套規則）
alter table public.client_logos enable row level security;
create policy client_logos_public_read on public.client_logos
  for select using (true);
create policy client_logos_auth_all on public.client_logos
  for all to authenticated using (true) with check (true);

-- 初始 18 筆（來自品牌提供的白色 logo 檔，放在 /public/clients/）
insert into public.client_logos (name, image_url, sort) values
  ('Mr.Whisky 威士忌先生',        '/clients/mr-whisky.png',      0),
  ('歐可麗 Oral Clean',           '/clients/oral-clean.png',     1),
  ('湫羊肉',                       '/clients/chiu-lamb.png',      2),
  ('喜常來',                       '/clients/xi-chang-lai.png',   3),
  ('品千年 Wine Ways',            '/clients/wine-ways.png',      4),
  ('鉅成 King Tile',              '/clients/king-tile.png',      5),
  ('愛羽球',                       '/clients/ai-badminton.png',   6),
  ('微笑城堡 Smile Castle',       '/clients/smile-castle.png',   7),
  ('瑞記雞飯 Ruikee',             '/clients/ruikee.png',         8),
  ('維記火鍋 Victoria Hotpot',    '/clients/victoria-hotpot.png',9),
  ('嘉新床墊 Chia Sleep',         '/clients/chia-sleep.png',     10),
  ('琢奧科技 DROPOUT',            '/clients/dropout.png',        11),
  ('福櫻 Fukusakura',             '/clients/fukusakura.png',     12),
  ('海冠 Hai Guan',               '/clients/hai-guan.png',       13),
  ('Fortune AI Technologies',     '/clients/fortune-ai.png',     14),
  ('GBTDA 全球羽球科技發展協會',  '/clients/gbtda.png',          15),
  ('火火燒肉販賣所',              '/clients/hoho-yakiniku.png',  16),
  ('玉山雨 熟成雞肉飯',           '/clients/mountain-wang.png',  17);
