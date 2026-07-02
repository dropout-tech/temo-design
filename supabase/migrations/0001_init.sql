-- ─────────────────────────────────────────────────────────────────────────────
-- TEMO 自建 CMS — 初始 schema（依 CMS_BLUEPRINT.md 設計）
-- 在 Supabase Postgres 建立所有內容資料表 + 關聯 + RLS 權限。
-- 這些表與現有 Payload 的表（portfolio 等）互不衝突，可共存；Payload 之後階段再移除。
-- 執行方式：psql "$DATABASE_URI" -v ON_ERROR_STOP=1 -f supabase/migrations/0001_init.sql
-- ─────────────────────────────────────────────────────────────────────────────

-- 共用：自動更新 updated_at
create or replace function temo_set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ── 分類（可編輯清單） ──────────────────────────────────────────────────────
create table if not exists category_groups (
  value text primary key,          -- 例 brand-planning
  label text not null,             -- 例 品牌規劃設計
  sort  int  not null default 0
);

create table if not exists industries (
  value text primary key,          -- 例 food-beverage
  label text not null,             -- 例 餐飲
  sort  int  not null default 0
);

-- ── 客戶 ────────────────────────────────────────────────────────────────────
create table if not exists clients (
  id         uuid primary key default gen_random_uuid(),
  slug       text unique not null,
  name       text not null,
  brief      text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger clients_set_updated_at before update on clients
  for each row execute function temo_set_updated_at();

-- ── 設計師 / 團隊（合併作品頁 + 關於頁兩套） ────────────────────────────────
create table if not exists designers (
  id           uuid primary key default gen_random_uuid(),
  slug         text unique,        -- 有獨立作品頁者填，例 kevin
  name         text not null,      -- 英文名
  name_zh      text,               -- 中文名
  role         text,               -- 職稱
  category     text not null default 'DESIGNER'
                 check (category in ('DESIGNER','VENDOR','CONSULTANT','PARTNER')),
  photo_url    text,
  instagram    text,
  bio          text[] not null default '{}',   -- 多段自我介紹
  achievements text[] not null default '{}',   -- 得獎 / 資歷
  expertise    text[] not null default '{}',   -- 專長（對應 category_groups.value）
  tags         text[] not null default '{}',   -- 專長標籤（about 頁卡片顯示用）
  has_page     boolean not null default false, -- 是否有 /team/[slug] 頁
  sort         int not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create trigger designers_set_updated_at before update on designers
  for each row execute function temo_set_updated_at();

-- ── 作品（核心） ────────────────────────────────────────────────────────────
create table if not exists works (
  id             uuid primary key default gen_random_uuid(),
  slug           text unique not null,
  title          text not null,
  subtitle       text,
  category_group text references category_groups(value) on delete set null,
  year           text,
  client_id      uuid references clients(id) on delete set null,
  cover_url      text,
  video_url      text,             -- YouTube / Vimeo（lib/video.ts 已能解析）
  size           text not null default 'medium'
                   check (size in ('large','medium','small')),
  description    text,
  services       text[] not null default '{}',
  deliverables   text[] not null default '{}',
  challenge      text,
  approach       text,
  result         text,
  quote_text     text,
  quote_author   text,
  awards         text[] not null default '{}',
  published      boolean not null default true,
  sort           int not null default 100,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create trigger works_set_updated_at before update on works
  for each row execute function temo_set_updated_at();
create index if not exists works_category_group_idx on works(category_group);
create index if not exists works_client_id_idx on works(client_id);
create index if not exists works_published_sort_idx on works(published, sort);

-- 作品 ↔ 設計師（多對多）
create table if not exists work_designers (
  work_id     uuid references works(id) on delete cascade,
  designer_id uuid references designers(id) on delete cascade,
  sort        int not null default 0,
  primary key (work_id, designer_id)
);

-- 作品 ↔ 行業（多對多）
create table if not exists work_industries (
  work_id        uuid references works(id) on delete cascade,
  industry_value text references industries(value) on delete cascade,
  primary key (work_id, industry_value)
);

-- 作品畫廊圖（一對多）
create table if not exists work_gallery (
  id      uuid primary key default gen_random_uuid(),
  work_id uuid references works(id) on delete cascade,
  src     text not null,
  alt     text,
  caption text,
  sort    int not null default 0
);
create index if not exists work_gallery_work_id_idx on work_gallery(work_id);

-- 註：services / faqs / testimonials / site_settings 這 4 張表與 Payload 現有同名表衝突，
--     延到階段 4（Payload 移除後）再以後續 migration 建立。本階段只建作品相關表。

-- ── 表單來信（訪客送出，只有登入者能看） ──────────────────────────────────
create table if not exists contact_submissions (
  id         uuid primary key default gen_random_uuid(),
  name       text,
  email      text,
  company    text,
  phone      text,
  subject    text,
  message    text,
  created_at timestamptz not null default now()
);

create table if not exists quote_submissions (
  id         uuid primary key default gen_random_uuid(),
  payload    jsonb not null default '{}',
  created_at timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- RLS 權限：公開內容任何人可讀；只有登入者能改。表單任何人可送、只有登入者能讀。
-- （用 psql 以 owner 身分匯入資料時會略過 RLS，不受影響。）
-- ─────────────────────────────────────────────────────────────────────────────

-- 公開可讀 + 登入者全權的內容表
do $$
declare t text;
begin
  foreach t in array array[
    'category_groups','industries','clients','designers',
    'work_designers','work_industries','work_gallery'
  ] loop
    execute format('alter table %I enable row level security;', t);
    execute format('create policy %I on %I for select using (true);', t||'_public_read', t);
    execute format('create policy %I on %I for all to authenticated using (true) with check (true);', t||'_auth_all', t);
  end loop;
end $$;

-- 作品：公開只讀「已發布」，登入者可讀寫全部
alter table works enable row level security;
create policy works_public_read_published on works for select using (published = true);
create policy works_auth_all on works for all to authenticated using (true) with check (true);

-- 表單來信：任何人可送出（insert），只有登入者可讀
do $$
declare t text;
begin
  foreach t in array array['contact_submissions','quote_submissions'] loop
    execute format('alter table %I enable row level security;', t);
    execute format('create policy %I on %I for insert to anon, authenticated with check (true);', t||'_anyone_submit', t);
    execute format('create policy %I on %I for select to authenticated using (true);', t||'_auth_read', t);
  end loop;
end $$;
