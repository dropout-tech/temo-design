-- 臨時設計師與其他合作夥伴分開保存，避免前台角色與後台名錄混用。
alter table if exists public.works
  add column if not exists collaborator_names text[] not null default '{}'::text[];

comment on column public.works.guest_designer_names is
  '作品專屬的外部／單次合作設計師顯示名稱，不建立 designers 關聯或個人頁';

comment on column public.works.collaborator_names is
  '作品專屬的攝影師、顧問或外部合作團隊顯示名稱，不建立 designers 關聯或人物頁';

-- 過去只有「其他合作夥伴」輸入介面，名稱暫存在 guest_designer_names。
-- 新欄位首次建立時將既有值原樣搬入，維持目前前台與後台所代表的合作夥伴語意；
-- guest_designer_names 清空後，專供恢復的「設計師 + 其他」使用。
update public.works
set
  collaborator_names = guest_designer_names,
  guest_designer_names = '{}'::text[]
where cardinality(guest_designer_names) > 0
  and cardinality(collaborator_names) = 0;
