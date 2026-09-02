-- 作品參與人員的署名 Title：正式成員存於關聯表，臨時設計師保留作品層級 JSON。
-- 全域 designers.role 不變；舊作品沒有自訂值時由前台繼續沿用原職稱。

alter table if exists public.work_designers
  add column if not exists credit_title text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'work_designers_credit_title_check'
      and conrelid = 'public.work_designers'::regclass
  ) then
    alter table public.work_designers
      add constraint work_designers_credit_title_check
      check (
        credit_title is null
        or (
          credit_title = btrim(credit_title)
          and char_length(credit_title) between 1 and 100
        )
      );
  end if;
end
$$;

comment on column public.work_designers.credit_title is
  '正式團隊成員在單一作品中的自訂署名 Title；留空時前台沿用 designers.role';

alter table if exists public.works
  add column if not exists guest_designer_credits jsonb not null default '[]'::jsonb;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'works_guest_designer_credits_check'
      and conrelid = 'public.works'::regclass
  ) then
    alter table public.works
      add constraint works_guest_designer_credits_check
      check (
        jsonb_typeof(guest_designer_credits) = 'array'
        and jsonb_array_length(guest_designer_credits) <= 20
      );
  end if;
end
$$;

-- 舊資料只含姓名；依既有順序轉成結構化署名，Title 留空以維持原顯示。
update public.works as work
set guest_designer_credits = coalesce(
  (
    select jsonb_agg(
      jsonb_build_object('name', guest.name, 'creditTitle', '')
      order by guest.ordinality
    )
    from unnest(work.guest_designer_names) with ordinality as guest(name, ordinality)
    where btrim(guest.name) <> ''
  ),
  '[]'::jsonb
)
where work.guest_designer_credits = '[]'::jsonb
  and cardinality(work.guest_designer_names) > 0;

comment on column public.works.guest_designer_credits is
  '作品專屬臨時設計師署名陣列 [{name, creditTitle}]；guest_designer_names 保留供舊版相容';
