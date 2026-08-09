-- 作品可額外列出不在正式團隊名冊中的單次合作設計師。
-- 使用 text[] 保留後台輸入順序；既有 works RLS 會一併保護此欄位。
alter table public.works
  add column if not exists guest_designer_names text[] not null default '{}'::text[];

comment on column public.works.guest_designer_names is
  '作品專屬的外部／單次合作設計師顯示名稱，不建立 designers 關聯或個人頁';
