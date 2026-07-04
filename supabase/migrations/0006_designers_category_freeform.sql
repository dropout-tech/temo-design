-- ─────────────────────────────────────────────────────────────────────────────
-- 階段 8：讓「設計師 / 團隊」可在後台管理
-- designers.category 原本鎖死 4 個值（DESIGNER/VENDOR/CONSULTANT/PARTNER），
-- 團隊分類已改為 設計師/專利師/法律顧問，且日後可能新增，故改成自由字串。
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.designers
  drop constraint if exists designers_category_check;
