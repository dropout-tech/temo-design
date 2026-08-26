-- 作品可複選執行項目：以多對多關聯保存，並保留 works.category_group 作為舊版相容的主要分類。
create table if not exists public.work_category_groups (
  work_id uuid not null references public.works(id) on delete cascade,
  category_group_value text not null references public.category_groups(value) on delete cascade,
  sort int not null default 0,
  primary key (work_id, category_group_value)
);

create index if not exists work_category_groups_value_idx
  on public.work_category_groups(category_group_value, work_id);

-- 舊作品原本的單一分類自動成為第一個執行項目。
insert into public.work_category_groups (work_id, category_group_value, sort)
select id, category_group, 0
from public.works
where category_group is not null
on conflict (work_id, category_group_value) do nothing;

-- Supabase Data API 需要 grants 與 RLS 同時存在：公開前台唯讀、登入後台可維護。
grant select on table public.work_category_groups to anon;
grant select, insert, update, delete on table public.work_category_groups to authenticated;
grant select, insert, update, delete on table public.work_category_groups to service_role;

alter table public.work_category_groups enable row level security;

drop policy if exists work_category_groups_public_read on public.work_category_groups;
create policy work_category_groups_public_read
  on public.work_category_groups for select to anon using (true);

drop policy if exists work_category_groups_auth_all on public.work_category_groups;
create policy work_category_groups_auth_all
  on public.work_category_groups for all to authenticated using (true) with check (true);
