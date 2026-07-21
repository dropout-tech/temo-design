-- 0015: 作品內頁首圖獨立欄位 + Adobe Portfolio 式彈性內容區塊
-- 套用方式：psql "$DATABASE_URI" -v ON_ERROR_STOP=1 -f supabase/migrations/0015_work_hero_and_blocks.sql

-- 1) 內頁首圖（留空 = 沿用封面 cover_url）
alter table works add column if not exists hero_url text;

-- 2) 彈性內容區塊表（取代 work_gallery 成為作品內容的唯一來源）
--    type: image（src 必填；src2 有值 = 同列雙圖）/ video（video_url 必填）/ text（text_content 必填）
--    width/height: 圖片原始像素尺寸，前台用來依圖片形狀自適應排版（可為空 = 未知）
create table if not exists work_blocks (
  id           uuid primary key default gen_random_uuid(),
  work_id      uuid not null references works(id) on delete cascade,
  type         text not null check (type in ('image','video','text')),
  src          text,
  alt          text,
  width        int,
  height       int,
  src2         text,
  alt2         text,
  width2       int,
  height2      int,
  text_content text,
  video_url    text,
  caption      text,
  sort         int not null default 0
);
create index if not exists work_blocks_work_id_idx on work_blocks(work_id);

alter table work_blocks enable row level security;
create policy work_blocks_public_read on work_blocks for select using (true);
create policy work_blocks_auth_all on work_blocks for all to authenticated using (true) with check (true);

-- 3) 既有 gallery 圖搬進 blocks（work_gallery 保留不刪，僅停用；確認穩定後可另行清理）
insert into work_blocks (work_id, type, src, alt, caption, sort)
select work_id, 'image', src, alt, caption, coalesce(sort, 0)
from work_gallery
where not exists (select 1 from work_blocks b where b.work_id = work_gallery.work_id);
