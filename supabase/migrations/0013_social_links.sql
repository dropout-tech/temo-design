-- ─────────────────────────────────────────────────────────────────────────────
-- 0013 社群連結（後台可自訂，任意多組）
--   單一表 social_links：platform（平台代碼，見 components/social-icons.tsx）
--   + href（連結，可留空）+ visible（是否在頁尾顯示）+ sort。
--   前台頁尾只顯示 visible=true 且 href 有值的項目。
--   seed 只在表為空時寫入：instagram/facebook 帶入 site_settings 既有值，
--   behance 帶入既有值但預設不顯示（沿用目前前台原本沒顯示 behance 的行為），
--   其餘平台（line/youtube/threads/tiktok/x）留空、預設不顯示，由使用者自行填寫。
--   可安全重跑。
-- 套用：psql "$DATABASE_URI" -v ON_ERROR_STOP=1 -f supabase/migrations/0013_social_links.sql
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists social_links (
  id         uuid primary key default gen_random_uuid(),
  platform   text not null,
  href       text,
  visible    boolean not null default false,
  sort       int  not null default 0,
  created_at timestamptz not null default now()
);

alter table social_links enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='social_links' and policyname='social_links_public_read') then
    create policy social_links_public_read on social_links for select using (true);
  end if;
  if not exists (select 1 from pg_policies where tablename='social_links' and policyname='social_links_auth_all') then
    create policy social_links_auth_all on social_links for all to authenticated using (true) with check (true);
  end if;
end $$;

-- 初始化（僅在整表為空時寫入，避免重跑重複）
-- 用 left join 帶入 site_settings 既有值，即使 site_settings 尚無 id=1 那筆也不影響其餘平台的種子。
with existing as (
  select instagram, facebook, behance from site_settings where id = 1
)
insert into social_links (platform, href, visible, sort)
select v.platform, v.href, v.visible, v.sort
from (
  select 'instagram' as platform, e.instagram as href, (e.instagram is not null and e.instagram <> '') as visible, 0 as sort
  from (select 1) d left join existing e on true
  union all
  select 'facebook', e.facebook, (e.facebook is not null and e.facebook <> ''), 1
  from (select 1) d left join existing e on true
  union all
  select 'behance', e.behance, false, 2
  from (select 1) d left join existing e on true
  union all
  select 'line', null, false, 3
  union all
  select 'youtube', null, false, 4
  union all
  select 'threads', null, false, 5
  union all
  select 'tiktok', null, false, 6
  union all
  select 'x', null, false, 7
) as v(platform, href, visible, sort)
where not exists (select 1 from social_links);
