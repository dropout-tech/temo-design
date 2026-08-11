alter table public.works
  add column if not exists cover_zoom numeric(4, 2) not null default 1.00,
  add column if not exists cover_position_x numeric(5, 2) not null default 50.00,
  add column if not exists cover_position_y numeric(5, 2) not null default 50.00;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'works_cover_zoom_range'
  ) then
    alter table public.works
      add constraint works_cover_zoom_range check (cover_zoom between 1.00 and 3.00);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'works_cover_position_x_range'
  ) then
    alter table public.works
      add constraint works_cover_position_x_range check (cover_position_x between 0.00 and 100.00);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'works_cover_position_y_range'
  ) then
    alter table public.works
      add constraint works_cover_position_y_range check (cover_position_y between 0.00 and 100.00);
  end if;
end
$$;

comment on column public.works.cover_zoom is
  '作品探索封面縮放倍率；1 為原始 cover 裁切，最大 3 倍。';
comment on column public.works.cover_position_x is
  '作品探索封面水平焦點百分比；0 為最左，100 為最右。';
comment on column public.works.cover_position_y is
  '作品探索封面垂直焦點百分比；0 為最上，100 為最下。';
