-- 內頁首圖的構圖獨立於作品列表封面；預設值保留既有的置中顯示。
alter table public.works
  add column if not exists hero_zoom numeric(4, 2) not null default 1.00
    constraint works_hero_zoom_range check (hero_zoom between 1.00 and 3.00),
  add column if not exists hero_position_x numeric(5, 2) not null default 50.00
    constraint works_hero_position_x_range check (hero_position_x between 0.00 and 100.00),
  add column if not exists hero_position_y numeric(5, 2) not null default 50.00
    constraint works_hero_position_y_range check (hero_position_y between 0.00 and 100.00);

comment on column public.works.hero_zoom is
  '內頁首圖縮放倍率；1 為原始 cover 裁切，最大 3 倍。';
comment on column public.works.hero_position_x is
  '內頁首圖水平焦點百分比；0 為最左，100 為最右。';
comment on column public.works.hero_position_y is
  '內頁首圖垂直焦點百分比；0 為最上，100 為最下。';
