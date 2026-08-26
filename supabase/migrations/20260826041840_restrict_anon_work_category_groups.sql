-- 明確限制公開角色為唯讀；避免專案層級 default privileges 賦予新表寫入權限。
revoke insert, update, delete, truncate, references, trigger
  on table public.work_category_groups
  from anon;
