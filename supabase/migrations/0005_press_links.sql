-- ─────────────────────────────────────────────────────────────────────────────
-- 階段 7：新聞 / 部落客連結（媒體報導 Press，可後台自由新增／刪除）
-- 每筆是一個「可點擊連到外部文章」的卡片：標題＋來源＋連結＋縮圖
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.press_links (
  id         uuid primary key default gen_random_uuid(),
  title      text not null,          -- 文章標題
  source     text not null default '', -- 媒體 / 部落客名稱（顯示在標題下方）
  url        text not null,          -- 外部文章連結
  image_url  text not null default '', -- 縮圖（storage 公開網址；可留空顯示佔位）
  sort       int  not null default 0,
  created_at timestamptz not null default now()
);

-- RLS：公開可讀、登入者可寫（同 award_logos / client_logos）
alter table public.press_links enable row level security;
create policy press_links_public_read on public.press_links
  for select using (true);
create policy press_links_auth_all on public.press_links
  for all to authenticated using (true) with check (true);

-- 範例資料 3 筆（縮圖留空會顯示報紙佔位圖）——看完前台效果後可在 /studio/press 直接刪除
insert into public.press_links (title, source, url, image_url, sort) values
  ('【範例】提摩設計榮獲 2025 國際設計大獎，作品登上國際舞台', '設計媒體 DESIGN NEWS', 'https://example.com/press-1', '', 0),
  ('【範例】專訪創辦人：以人為本的品牌設計如何幫企業提升 20%–300% 業績', '部落客・品牌觀察筆記', 'https://example.com/press-2', '', 1),
  ('【範例】從紅海突圍──提摩設計操刀金鐘 60 台灣女孩日視覺', '文創產業週報', 'https://example.com/press-3', '', 2);
