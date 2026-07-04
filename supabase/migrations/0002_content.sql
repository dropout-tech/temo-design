-- ─────────────────────────────────────────────────────────────────────────────
-- 階段 4：移除 Payload 殘留舊表 + 建立自管內容表（FAQ / 見證 / 網站設定）
-- ─────────────────────────────────────────────────────────────────────────────

-- 1) 清掉 Payload 遺留的孤立表（程式已全移除，這些表無人使用）
drop table if exists
  public.payload_locked_documents_rels,
  public.payload_locked_documents,
  public.payload_preferences_rels,
  public.payload_preferences,
  public.payload_migrations,
  public.payload_kv,
  public.portfolio_tags,
  public.portfolio,
  public.media,
  public.services,
  public.site_settings,
  public.testimonials,
  public.faqs,
  public.users_sessions,
  public.users
  cascade;

-- 2) 共用 updated_at 觸發器函式（若之前 migration 已建則沿用）
create or replace function temo_set_updated_at()
returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

-- 3) FAQ
create table public.faqs (
  id         uuid primary key default gen_random_uuid(),
  question   text not null,
  answer     text not null,
  category   text,               -- 服務相關 / 合作流程 / 價格和預算 / 設計相關
  sort       int not null default 0,
  created_at timestamptz not null default now()
);

-- 4) 客戶見證
create table public.testimonials (
  id      uuid primary key default gen_random_uuid(),
  text    text not null,
  author  text not null,
  company text,
  rating  int not null default 5 check (rating between 1 and 5),
  sort    int not null default 0,
  created_at timestamptz not null default now()
);

-- 5) 網站設定（單筆）
create table public.site_settings (
  id          int primary key default 1 check (id = 1),
  name        text,
  description text,
  email       text,
  phone       text,
  address     text,
  instagram   text,
  facebook    text,
  behance     text,
  updated_at  timestamptz not null default now()
);
create trigger site_settings_set_updated_at before update on public.site_settings
  for each row execute function temo_set_updated_at();

-- 6) RLS：公開可讀、登入者可寫
do $$
declare t text;
begin
  foreach t in array array['faqs','testimonials','site_settings'] loop
    execute format('alter table public.%I enable row level security;', t);
    execute format('create policy %I on public.%I for select using (true);', t||'_public_read', t);
    execute format('create policy %I on public.%I for all to authenticated using (true) with check (true);', t||'_auth_all', t);
  end loop;
end $$;
