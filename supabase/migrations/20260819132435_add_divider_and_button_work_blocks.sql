-- 作品內容新增分隔線與連結按鈕，既有 image/video/text 資料完全保留。
-- 樣式欄位維持 nullable，由應用程式提供安全預設，避免回填或鎖表成本。

alter table if exists public.work_blocks
  add column if not exists divider_color text,
  add column if not exists divider_width smallint,
  add column if not exists divider_thickness smallint,
  add column if not exists button_text text,
  add column if not exists button_url text,
  add column if not exists button_open_new_tab boolean,
  add column if not exists button_width smallint,
  add column if not exists button_height smallint,
  add column if not exists button_text_color text,
  add column if not exists button_background_color text,
  add column if not exists button_font_size smallint,
  add column if not exists button_font_weight smallint;

alter table if exists public.work_blocks
  drop constraint if exists work_blocks_type_check;

alter table if exists public.work_blocks
  add constraint work_blocks_type_check
  check (type in ('image', 'video', 'text', 'divider', 'button'));

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'work_blocks_divider_width_check'
      and conrelid = 'public.work_blocks'::regclass
  ) then
    alter table public.work_blocks
      add constraint work_blocks_divider_width_check
      check (divider_width is null or divider_width between 10 and 100);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'work_blocks_divider_thickness_check'
      and conrelid = 'public.work_blocks'::regclass
  ) then
    alter table public.work_blocks
      add constraint work_blocks_divider_thickness_check
      check (divider_thickness is null or divider_thickness between 1 and 8);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'work_blocks_button_dimensions_check'
      and conrelid = 'public.work_blocks'::regclass
  ) then
    alter table public.work_blocks
      add constraint work_blocks_button_dimensions_check
      check (
        (button_width is null or button_width between 120 and 720)
        and (button_height is null or button_height between 40 and 120)
      );
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'work_blocks_button_typography_check'
      and conrelid = 'public.work_blocks'::regclass
  ) then
    alter table public.work_blocks
      add constraint work_blocks_button_typography_check
      check (
        (button_font_size is null or button_font_size between 12 and 40)
        and (button_font_weight is null or button_font_weight in (300, 400, 500, 600, 700, 800, 900))
      );
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'work_blocks_color_format_check'
      and conrelid = 'public.work_blocks'::regclass
  ) then
    alter table public.work_blocks
      add constraint work_blocks_color_format_check
      check (
        (divider_color is null or divider_color ~ '^#[0-9A-Fa-f]{6}$')
        and (button_text_color is null or button_text_color ~ '^#[0-9A-Fa-f]{6}$')
        and (button_background_color is null or button_background_color ~ '^#[0-9A-Fa-f]{6}$')
      );
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'work_blocks_button_content_length_check'
      and conrelid = 'public.work_blocks'::regclass
  ) then
    alter table public.work_blocks
      add constraint work_blocks_button_content_length_check
      check (
        (button_text is null or char_length(button_text) between 1 and 120)
        and (button_url is null or char_length(button_url) between 1 and 2048)
      );
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'work_blocks_button_required_content_check'
      and conrelid = 'public.work_blocks'::regclass
  ) then
    alter table public.work_blocks
      add constraint work_blocks_button_required_content_check
      check (
        type <> 'button'
        or (
          button_text is not null
          and char_length(btrim(button_text)) between 1 and 120
          and button_url is not null
          and char_length(button_url) between 1 and 2048
          and (
            button_url ~* '^(https?://|mailto:|tel:)'
            or button_url like '#%'
            or button_url like '?%'
            or (button_url like '/%' and button_url not like '//%')
          )
        )
      );
  end if;
end $$;
