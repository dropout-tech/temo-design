-- Studio 統一控制前台作品篩選欄位的顯示語言。
-- 既有正式站已採英文，預設值設為 en，避免 migration 後畫面改變。
alter table public.site_settings
  add column if not exists portfolio_filter_language text;

update public.site_settings
set portfolio_filter_language = 'en'
where portfolio_filter_language is null
   or portfolio_filter_language not in ('bilingual', 'zh', 'en');

alter table public.site_settings
  alter column portfolio_filter_language set default 'en',
  alter column portfolio_filter_language set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'site_settings_portfolio_filter_language_check'
      and conrelid = 'public.site_settings'::regclass
  ) then
    alter table public.site_settings
      add constraint site_settings_portfolio_filter_language_check
      check (portfolio_filter_language in ('bilingual', 'zh', 'en'));
  end if;
end $$;

-- 公開頁只需讀取；Studio 登入者只需讀取與 upsert，不提供刪除權限。
alter table public.site_settings enable row level security;
revoke all on table public.site_settings from anon, authenticated;
grant select on table public.site_settings to anon;
grant select, insert, update on table public.site_settings to authenticated;
