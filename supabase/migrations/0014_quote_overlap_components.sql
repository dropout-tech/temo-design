-- ─────────────────────────────────────────────────────────────────────────────
-- 階段 14：即時報價「重疊內容自動扣抵」
-- 需求：品牌包套的價格會往上加，但若客人同時選到內容重疊的方案（例：單獨選了
--       LOGO，又選了內含 LOGO 的包套），系統要自動扣掉重複的那一份，不要重複計價。
--
-- 作法：新增「內容元件」概念。
--   quote_components               → 內容元件清單（LOGO、名片、社群背景…），每個元件
--                                    設一個「抵扣值」（通常＝該品項單獨購買的價格）。
--   quote_packages.component_ids   → 每個方案「內含哪些內容元件」（元件 id 陣列）。
--
-- 前台計算規則：同一個內容元件若被 N（≥2）個「已選方案」同時包含，
--              就扣掉 (N-1) 份該元件的抵扣值 → 等於只算一次。
-- ⚠️ 抵扣值一律設「單獨購買的下限價」，寧可少扣也不要多扣（多扣＝少收錢）。
-- ─────────────────────────────────────────────────────────────────────────────

-- 1) 內容元件清單
create table if not exists public.quote_components (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,               -- 元件名稱（LOGO 商標 / 名片…）
  deduct_value int  not null default 0,      -- 抵扣值（重疊時每多一份就扣這個金額）
  sort         int  not null default 0,
  created_at   timestamptz not null default now()
);

-- 2) 方案上掛「內含哪些元件」（存元件 id 的字串陣列）
alter table public.quote_packages
  add column if not exists component_ids jsonb not null default '[]';

-- RLS：公開可讀、登入者可寫（與 quote_categories / quote_packages 同一套規則）
alter table public.quote_components enable row level security;
do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='quote_components' and policyname='quote_components_public_read') then
    create policy quote_components_public_read on public.quote_components for select using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='quote_components' and policyname='quote_components_auth_all') then
    create policy quote_components_auth_all on public.quote_components for all to authenticated using (true) with check (true);
  end if;
end $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 初始資料：seed 一份內容元件清單，並「盡力」自動幫既有方案掛上對應元件。
-- 只在 quote_components 還是空的時候跑一次（避免重複執行時洗掉後台已改的設定）。
-- 抵扣值取自 2026-05 官方單品下限價；社群背景無單獨售價，先給保守placeholder，後台可改。
-- 若你在後台改過方案的英文名（name_en），自動掛載可能對不上，屆時進後台手動勾選即可。
-- ─────────────────────────────────────────────────────────────────────────────
do $$
begin
  if (select count(*) from public.quote_components) = 0 then
    insert into public.quote_components (name, deduct_value, sort) values
      ('LOGO 商標',   50000, 0),
      ('名片',         6800, 1),
      ('文宣 / 菜單',  6800, 2),
      ('主視覺',      18980, 3),
      ('包裝',         8800, 4),
      ('招牌',        12800, 5),
      ('社群背景',     3000, 6);

    -- 純享單品：各方案掛自己對應的單一元件（以 name_en 對應）
    update public.quote_packages p set component_ids = to_jsonb(array[(select id::text from public.quote_components where name='LOGO 商標')])   where p.name_en = 'LOGO';
    update public.quote_packages p set component_ids = to_jsonb(array[(select id::text from public.quote_components where name='名片')])       where p.name_en = 'BUSINESS CARD';
    update public.quote_packages p set component_ids = to_jsonb(array[(select id::text from public.quote_components where name='文宣 / 菜單')]) where p.name_en = 'GRAPHIC';
    update public.quote_packages p set component_ids = to_jsonb(array[(select id::text from public.quote_components where name='主視覺')])     where p.name_en = 'KEY VISUAL';
    update public.quote_packages p set component_ids = to_jsonb(array[(select id::text from public.quote_components where name='包裝')])       where p.name_en = 'PACKAGE';
    update public.quote_packages p set component_ids = to_jsonb(array[(select id::text from public.quote_components where name='招牌')])       where p.name_en = 'SHOP SIGN';

    -- 品牌包套：掛上它們內含、且有單獨售價的重疊元件（LOGO / 名片 / 社群背景 / 文宣菜單）
    update public.quote_packages p
      set component_ids = (select coalesce(jsonb_agg(c.id::text), '[]'::jsonb) from public.quote_components c
                           where c.name = any (array['LOGO 商標','名片','社群背景']))
      where p.name_en = 'STARTUP';
    update public.quote_packages p
      set component_ids = (select coalesce(jsonb_agg(c.id::text), '[]'::jsonb) from public.quote_components c
                           where c.name = any (array['LOGO 商標','名片','文宣 / 菜單','社群背景']))
      where p.name_en = 'GROWING';
    update public.quote_packages p
      set component_ids = (select coalesce(jsonb_agg(c.id::text), '[]'::jsonb) from public.quote_components c
                           where c.name = any (array['LOGO 商標','名片','社群背景']))
      where p.name_en = 'ENTERPRISE VI';
  end if;
end $$;
