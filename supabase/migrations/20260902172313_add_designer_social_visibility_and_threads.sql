-- 團隊成員可個別控制各社群連結是否公開，並新增 Threads。
-- 顯示開關預設 true，確保 migration 套用後既有前台行為不變。

alter table public.designers
  add column if not exists threads_url text,
  add column if not exists show_instagram boolean not null default true,
  add column if not exists show_facebook boolean not null default true,
  add column if not exists show_line boolean not null default true,
  add column if not exists show_threads boolean not null default true,
  add column if not exists show_website boolean not null default true;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'designers_instagram_public_url_check'
      and conrelid = 'public.designers'::regclass
  ) then
    alter table public.designers
      add constraint designers_instagram_public_url_check
      check (
        instagram is null
        or (
          instagram = btrim(instagram)
          and char_length(instagram) between 1 and 500
          and instagram ~* '^https?://[^[:space:]]+$'
        )
      );
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'designers_facebook_public_url_check'
      and conrelid = 'public.designers'::regclass
  ) then
    alter table public.designers
      add constraint designers_facebook_public_url_check
      check (
        facebook is null
        or (
          facebook = btrim(facebook)
          and char_length(facebook) between 1 and 500
          and facebook ~* '^https?://[^[:space:]]+$'
        )
      );
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'designers_threads_public_url_check'
      and conrelid = 'public.designers'::regclass
  ) then
    alter table public.designers
      add constraint designers_threads_public_url_check
      check (
        threads_url is null
        or (
          threads_url = btrim(threads_url)
          and char_length(threads_url) between 1 and 500
          and threads_url ~* '^https?://[^[:space:]]+$'
        )
      );
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'designers_website_public_url_check'
      and conrelid = 'public.designers'::regclass
  ) then
    alter table public.designers
      add constraint designers_website_public_url_check
      check (
        website is null
        or (
          website = btrim(website)
          and char_length(website) between 1 and 500
          and website ~* '^https?://[^[:space:]]+$'
        )
      );
  end if;
end
$$;

comment on column public.designers.threads_url is
  '團隊成員的 Threads 公開連結；僅在 show_threads=true 時由 server 傳給前台';
comment on column public.designers.show_instagram is '是否在前台公開 Instagram 連結';
comment on column public.designers.show_facebook is '是否在前台公開 Facebook 連結';
comment on column public.designers.show_line is '是否在前台公開 LINE 連結';
comment on column public.designers.show_threads is '是否在前台公開 Threads 連結';
comment on column public.designers.show_website is '是否在前台公開個人網站連結';
