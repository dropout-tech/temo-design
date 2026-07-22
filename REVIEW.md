---
reviewed: 2026-07-22T09:40:00+08:00
base: b20a26a
head: 3025f2d
files_reviewed_list:
  - app/studio/(app)/awards/actions.ts
  - app/studio/(app)/brief/actions.ts
  - app/studio/(app)/categories/actions.ts
  - app/studio/(app)/clients/actions.ts
  - app/studio/(app)/designers/actions.ts
  - app/studio/(app)/faqs/actions.ts
  - app/studio/(app)/navigation/actions.ts
  - app/studio/(app)/press/actions.ts
  - app/studio/(app)/quote/actions.ts
  - app/studio/(app)/settings/social-actions.ts
  - app/studio/(app)/works/actions.ts
  - components/pages/about-page-client.tsx
  - components/pages/contact-page-client.tsx
  - components/pages/portfolio-detail-client.tsx
  - components/pages/portfolio-page-client.tsx
  - components/quote/quote-calculator.tsx
  - components/studio/*.tsx (12 managers + sortable-list + work-form)
  - lib/content-supabase.ts
  - lib/portfolio-data.ts
  - lib/portfolio-supabase.ts
  - lib/studio/works.ts
  - supabase/migrations/0014, 0015, 0016
findings:
  critical: 2
  warning: 1
  total: 3
status: issues_found
---

# Code Review

**Status:** issues_found — 3 findings (2 critical, 1 warning). **處置（2026-07-22）：三項全部已修復**，經獨立複核 agent 逐項確認（CR-01 十個 manager 的 sort 同步、CR-02 migration 護欄、WR-01 錯誤浮出皆通過），並以 Playwright 實測驗證錯誤提示會真的顯示。修復 commit 見 git log。

**Files reviewed:** 40
**Diff range:** `b20a26a..3025f2d`
**Intent:** 四個功能批次——作品內容區塊系統（work_blocks/hero_url）、報價重疊扣抵、團隊後台＋SortableList 拖曳元件、全站後台排序拖曳化（12 管理頁、16 個 reorder actions）。

（審查方法備註：本 repo 無 CLAUDE.md 與 plan 檔，citation-only 的兩個視角（claude-md、plan-adherence）無來源可引、略過；實跑 bugs-security、git-history、quality-architecture 三視角，11 個候選發現經逐一信心評分，門檻 80 過濾後留 3 個。）

## Bugs & Security

### CR-01 — 拖曳排序後編輯任一筆資料，舊 sort 值寫回 DB 弄亂剛存好的順序

**File:** `components/studio/category-manager.tsx:237`（同型：award-logo-manager.tsx:141、designer-manager.tsx:502、quote-manager.tsx:523，以及所有同型 manager 的逐列 save）
**Severity:** Critical
**Confidence:** 100
**Issue:** SortableList 的 onCommit 只重排陣列並呼叫 reorder action 寫 DB，從不把新的 index 同步回每列 local state 的 `.sort` 欄位。之後使用者對任何一列做「改名/編輯→儲存」時，該列的 save 會把**頁面載入時的舊 sort** upsert 回 DB，蓋掉剛用拖曳存好的順序。重現：拖曳排序 → 不重新整理 → 改任一列名稱存檔 → 該列排序回跳。
**Fix:** 逐列 save 不再送 `sort`（改由 reorder action 全權管理該欄位），或 onCommit 時同步 `next.map((r,i)=>({...r, sort:i}))` 進 state。前者較徹底。

### WR-01 — 拖曳落庫失敗時 UI 靜默、且畫面已樂觀顯示新順序

**File:** `components/studio/award-logo-manager.tsx:27-32`（同型：全部 12 個接 SortableList 的 manager 的 commitOrder/reorderCommit）
**Severity:** Warning
**Confidence:** 80
**Issue:** onCommit 呼叫 reorder action 後直接丟棄回傳的 `{ error }`；UI 已先 setRows 顯示新順序，寫入失敗時使用者零感知。同檔案的 save/delete 都有 `if (res.error) setError(res.error)` 慣例，唯獨新排序路徑沒有比照。
**Fix:** 比照同檔慣例：`const res = await reorderXxx(ids); if (res.error) { setError(res.error); /* 視情況重載或還原順序 */ }`。

## Git History

### CR-02 — migration 0015 的 RLS policy 缺「可安全重跑」防護

**File:** `supabase/migrations/0015_work_hero_and_blocks.sql:30-31`
**Severity:** Critical
**Confidence:** 100
**Historical context:** commit 8d89b6a（fix(press): migration 改為可安全重跑）確立 `do $$ if not exists ... create policy $$` 慣例；同批 0014、0016 都已採用，唯獨 0015 用裸 `create policy`。
**Issue:** 0015 其餘語句皆 `if not exists`，僅兩條 policy 無防護；重跑該檔（重建環境、災後復原）會撞 42710 policy already exists 中止。已套用過的正式庫不受影響，影響的是未來重跑。
**Fix:** 兩條 policy 包進 `do $$ begin if not exists (select 1 from pg_policies where policyname='...' and tablename='work_blocks') then create policy ...; end if; end $$;`（照 0016 的寫法）。
