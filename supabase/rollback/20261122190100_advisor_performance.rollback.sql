-- ROLLBACK of performance batch
-- Generated 20261122 from Supabase get_advisors for project xfsfpaqypzkglkqibzyk.
-- Only advisor-flagged objects are touched; objects are resolved from the catalog at apply time.
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT idx FROM advisor_backup_20261122.index_def WHERE created_by_fix LOOP
    EXECUTE format('DROP INDEX IF EXISTS %I.%I', (SELECT n.nspname FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname=r.idx LIMIT 1), r.idx);
  END LOOP;
END $$;
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT * FROM advisor_backup_20261122.policy_def LOOP
    IF r.qual IS NOT NULL THEN EXECUTE format('ALTER POLICY %I ON %s USING (%s)', r.pol, r.tbl::regclass, r.qual); END IF;
    IF r.with_check IS NOT NULL THEN EXECUTE format('ALTER POLICY %I ON %s WITH CHECK (%s)', r.pol, r.tbl::regclass, r.with_check); END IF;
  END LOOP;
END $$;
