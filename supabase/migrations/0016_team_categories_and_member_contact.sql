-- ─────────────────────────────────────────────────────────────────────────────
-- 0014 團隊「分類大項目」升級 + 成員個人聯絡/社群欄位
--
--   (1) 新表 team_categories：把原本散在 designers.category 的自由字串，升級成
--       可獨立「新增 / 改名 / 拖拉排序」的大項目登錄表（name 唯一 + sort）。
--       designers.category 仍沿用字串當分組鍵（不改成 FK，避免大改動），
--       前台分類順序改讀 team_categories.sort。改名時後台會同步更新
--       team_categories.name 與所有 designers.category（見 studio actions）。
--       seed：把現有 designers 既有分類帶入，順序沿用「各分類第一次出現的 sort」。
--
--   (2) designers 新增每位成員各自的欄位：
--       phone / address / email（個人聯絡；show_contact 控制是否公開顯示，預設不公開）
--       facebook / website（社群連結；instagram 欄位原本就有）
--
--   全部 if not exists / on conflict，可安全重跑。
-- 套用：psql "$DATABASE_URI" -v ON_ERROR_STOP=1 -f supabase/migrations/0016_team_categories_and_member_contact.sql
-- ─────────────────────────────────────────────────────────────────────────────

-- (1) 分類大項目登錄表 ────────────────────────────────────────────────────────
create table if not exists team_categories (
  id         uuid primary key default gen_random_uuid(),
  name       text not null unique,
  sort       int  not null default 0,
  created_at timestamptz not null default now()
);

alter table team_categories enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='team_categories' and policyname='team_categories_public_read') then
    create policy team_categories_public_read on team_categories for select using (true);
  end if;
  if not exists (select 1 from pg_policies where tablename='team_categories' and policyname='team_categories_auth_all') then
    create policy team_categories_auth_all on team_categories for all to authenticated using (true) with check (true);
  end if;
end $$;

-- seed：帶入現有 designers 的分類，順序＝各分類第一次出現（min sort）的順序
insert into team_categories (name, sort)
select category, (row_number() over (order by min(sort), category) - 1)::int as sort
from designers
where category is not null and category <> ''
group by category
on conflict (name) do nothing;

-- (2) 成員個人聯絡 / 社群欄位 ─────────────────────────────────────────────────
alter table designers
  add column if not exists phone        text,
  add column if not exists address      text,
  add column if not exists email        text,
  add column if not exists facebook     text,
  add column if not exists website      text,
  add column if not exists show_contact boolean not null default false;
