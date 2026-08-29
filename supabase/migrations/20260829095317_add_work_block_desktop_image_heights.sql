alter table if exists public.work_blocks
  add column if not exists desktop_height_percent smallint,
  add column if not exists desktop_height_percent2 smallint;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'work_blocks_desktop_height_percent_check'
      and conrelid = 'public.work_blocks'::regclass
  ) then
    alter table public.work_blocks
      add constraint work_blocks_desktop_height_percent_check
      check (desktop_height_percent is null or desktop_height_percent between 50 and 200);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'work_blocks_desktop_height_percent2_check'
      and conrelid = 'public.work_blocks'::regclass
  ) then
    alter table public.work_blocks
      add constraint work_blocks_desktop_height_percent2_check
      check (desktop_height_percent2 is null or desktop_height_percent2 between 50 and 200);
  end if;
end
$$;
