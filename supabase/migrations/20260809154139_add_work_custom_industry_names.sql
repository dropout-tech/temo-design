alter table public.works
  add column if not exists custom_industry_names text[] not null default '{}'::text[];

comment on column public.works.custom_industry_names is
  '作品專屬、未列入固定 industries 選項的行業顯示名稱；前台只顯示文字，不提供篩選連結。';
