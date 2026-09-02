-- 每個文字區塊可獨立調整基礎排版；圖片區塊向後擴充為最多四張。
-- 所有新欄位維持 nullable，舊資料與舊版程式會繼續沿用既有顯示。

alter table if exists public.work_blocks
  add column if not exists src3 text,
  add column if not exists alt3 text,
  add column if not exists width3 integer,
  add column if not exists height3 integer,
  add column if not exists desktop_height_percent3 smallint,
  add column if not exists src4 text,
  add column if not exists alt4 text,
  add column if not exists width4 integer,
  add column if not exists height4 integer,
  add column if not exists desktop_height_percent4 smallint,
  add column if not exists text_font_size smallint,
  add column if not exists text_line_height numeric(4, 3),
  add column if not exists text_letter_spacing numeric(4, 3),
  add column if not exists text_font_weight smallint;

-- 每件作品的區塊排序必須唯一；也作為 RPC 父列鎖之外的第二層並行保護。
create unique index if not exists work_blocks_work_id_sort_unique
  on public.work_blocks (work_id, sort);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'work_blocks_desktop_height_percent3_check'
      and conrelid = 'public.work_blocks'::regclass
  ) then
    alter table public.work_blocks
      add constraint work_blocks_desktop_height_percent3_check
      check (desktop_height_percent3 is null or desktop_height_percent3 between 50 and 200);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'work_blocks_desktop_height_percent4_check'
      and conrelid = 'public.work_blocks'::regclass
  ) then
    alter table public.work_blocks
      add constraint work_blocks_desktop_height_percent4_check
      check (desktop_height_percent4 is null or desktop_height_percent4 between 50 and 200);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'work_blocks_additional_image_continuity_check'
      and conrelid = 'public.work_blocks'::regclass
  ) then
    alter table public.work_blocks
      add constraint work_blocks_additional_image_continuity_check
      check (
        type <> 'image'
        or (
          (
            src2 is null
            or (
              nullif(btrim(src), '') is not null
              and nullif(btrim(src2), '') is not null
            )
          )
          and (
            src3 is null
            or (
              nullif(btrim(src), '') is not null
              and nullif(btrim(src2), '') is not null
              and nullif(btrim(src3), '') is not null
            )
          )
          and (
            src4 is null
            or (
              nullif(btrim(src), '') is not null
              and nullif(btrim(src2), '') is not null
              and nullif(btrim(src3), '') is not null
              and nullif(btrim(src4), '') is not null
            )
          )
        )
      );
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'work_blocks_text_typography_check'
      and conrelid = 'public.work_blocks'::regclass
  ) then
    alter table public.work_blocks
      add constraint work_blocks_text_typography_check
      check (
        (text_font_size is null or text_font_size between 12 and 72)
        and (text_line_height is null or text_line_height between 1.000 and 2.400)
        and (text_letter_spacing is null or text_letter_spacing between -0.050 and 0.300)
        and (text_font_weight is null or text_font_weight in (300, 400, 500, 700, 900))
      );
  end if;
end
$$;

comment on column public.work_blocks.src3 is '三圖或四圖區塊的第 3 張圖片';
comment on column public.work_blocks.src4 is '四圖區塊的第 4 張圖片';
comment on column public.work_blocks.text_font_size is '文字區塊基礎字級 px；null 沿用網站預設';
comment on column public.work_blocks.text_line_height is '文字區塊行高倍率；null 沿用網站預設';
comment on column public.work_blocks.text_letter_spacing is '文字區塊字距 em；null 沿用網站預設';
comment on column public.work_blocks.text_font_weight is '文字區塊基礎字重；null 沿用網站預設';

-- 以單一資料庫函式原子替換一件作品的全部區塊：任何一筆 insert 失敗時，delete 也會回滾。
create or replace function public.replace_work_blocks(p_work_id uuid, p_blocks jsonb)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if p_blocks is null or jsonb_typeof(p_blocks) <> 'array' then
    raise exception 'p_blocks must be a JSON array';
  end if;

  -- 同一件作品的兩次儲存必須排隊，避免兩個 transaction 同時 delete 後各自 insert。
  perform 1
  from public.works
  where id = p_work_id
  for update;

  if not found then
    raise exception 'work not found';
  end if;

  delete from public.work_blocks
  where work_id = p_work_id;

  insert into public.work_blocks (
    work_id,
    type,
    src,
    alt,
    width,
    height,
    desktop_height_percent,
    src2,
    alt2,
    width2,
    height2,
    desktop_height_percent2,
    src3,
    alt3,
    width3,
    height3,
    desktop_height_percent3,
    src4,
    alt4,
    width4,
    height4,
    desktop_height_percent4,
    text_content,
    text_font_size,
    text_line_height,
    text_letter_spacing,
    text_font_weight,
    video_url,
    caption,
    caption_mobile,
    divider_color,
    divider_width,
    divider_thickness,
    button_text,
    button_url,
    button_open_new_tab,
    button_width,
    button_height,
    button_text_color,
    button_background_color,
    button_font_size,
    button_font_weight,
    sort
  )
  select
    p_work_id,
    block.type,
    block.src,
    block.alt,
    block.width,
    block.height,
    block.desktop_height_percent,
    block.src2,
    block.alt2,
    block.width2,
    block.height2,
    block.desktop_height_percent2,
    block.src3,
    block.alt3,
    block.width3,
    block.height3,
    block.desktop_height_percent3,
    block.src4,
    block.alt4,
    block.width4,
    block.height4,
    block.desktop_height_percent4,
    block.text_content,
    block.text_font_size,
    block.text_line_height,
    block.text_letter_spacing,
    block.text_font_weight,
    block.video_url,
    block.caption,
    block.caption_mobile,
    block.divider_color,
    block.divider_width,
    block.divider_thickness,
    block.button_text,
    block.button_url,
    block.button_open_new_tab,
    block.button_width,
    block.button_height,
    block.button_text_color,
    block.button_background_color,
    block.button_font_size,
    block.button_font_weight,
    block.sort
  from jsonb_to_recordset(p_blocks) as block (
    type text,
    src text,
    alt text,
    width integer,
    height integer,
    desktop_height_percent smallint,
    src2 text,
    alt2 text,
    width2 integer,
    height2 integer,
    desktop_height_percent2 smallint,
    src3 text,
    alt3 text,
    width3 integer,
    height3 integer,
    desktop_height_percent3 smallint,
    src4 text,
    alt4 text,
    width4 integer,
    height4 integer,
    desktop_height_percent4 smallint,
    text_content text,
    text_font_size smallint,
    text_line_height numeric(4, 3),
    text_letter_spacing numeric(4, 3),
    text_font_weight smallint,
    video_url text,
    caption text,
    caption_mobile text,
    divider_color text,
    divider_width smallint,
    divider_thickness smallint,
    button_text text,
    button_url text,
    button_open_new_tab boolean,
    button_width smallint,
    button_height smallint,
    button_text_color text,
    button_background_color text,
    button_font_size smallint,
    button_font_weight smallint,
    sort integer
  );
end;
$$;

revoke execute on function public.replace_work_blocks(uuid, jsonb) from public;
revoke execute on function public.replace_work_blocks(uuid, jsonb) from anon;
grant execute on function public.replace_work_blocks(uuid, jsonb) to authenticated;
