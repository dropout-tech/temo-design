-- 合作夥伴比照臨時設計師，職稱屬於單一作品；保留舊名稱陣列相容。
alter table public.works
  add column if not exists collaborator_credits jsonb not null default '[]'::jsonb;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'works_collaborator_credits_check'
      and conrelid = 'public.works'::regclass
  ) then
    alter table public.works
      add constraint works_collaborator_credits_check
      check (
        jsonb_typeof(collaborator_credits) = 'array'
        and jsonb_array_length(collaborator_credits) <= 20
      );
  end if;
end
$$;

update public.works as work
set collaborator_credits = coalesce(
  (
    select jsonb_agg(
      jsonb_build_object('name', partner.name, 'creditTitle', '')
      order by partner.ordinality
    )
    from unnest(work.collaborator_names) with ordinality as partner(name, ordinality)
    where btrim(partner.name) <> ''
  ),
  '[]'::jsonb
)
where work.collaborator_credits = '[]'::jsonb
  and cardinality(work.collaborator_names) > 0;

comment on column public.works.collaborator_credits is
  '作品專屬合作夥伴署名陣列 [{name, creditTitle}]；collaborator_names 保留供舊版相容';
