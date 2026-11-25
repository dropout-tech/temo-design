-- Advisor performance batch: unindexed FKs, duplicate index, auth_rls_initplan
-- Generated 20261122 from Supabase get_advisors for project xfsfpaqypzkglkqibzyk.
-- Only advisor-flagged objects are touched; objects are resolved from the catalog at apply time.
CREATE SCHEMA IF NOT EXISTS advisor_backup_20261122;
REVOKE ALL ON SCHEMA advisor_backup_20261122 FROM PUBLIC;
CREATE TABLE IF NOT EXISTS advisor_backup_20261122.index_def (idx text PRIMARY KEY, def text, created_by_fix boolean);
CREATE TABLE IF NOT EXISTS advisor_backup_20261122.policy_def (tbl text, pol name, qual text, with_check text, PRIMARY KEY (tbl,pol));
-- 0001 unindexed_foreign_keys (2): add a btree covering index per FK (IF NOT EXISTS).
-- Plain CREATE INDEX (not CONCURRENTLY) because it runs inside a DO block; tables are small.
-- For large tables run the generated statements one by one with CONCURRENTLY instead.
DO $$
DECLARE r record; cols text; iname text;
BEGIN
  FOR r IN SELECT c.oid, c.conrelid, c.conname, c.conkey
             FROM pg_constraint c
             JOIN (VALUES ('public.work_designers','work_designers_designer_id_fkey'),('public.work_industries','work_industries_industry_value_fkey')) v(tbl,con) ON c.conrelid = to_regclass(v.tbl) AND c.conname = v.con
            WHERE c.contype='f'
  LOOP
    SELECT string_agg(quote_ident(a.attname), ', ' ORDER BY k.ord) INTO cols
      FROM unnest(r.conkey) WITH ORDINALITY k(attnum,ord)
      JOIN pg_attribute a ON a.attrelid=r.conrelid AND a.attnum=k.attnum;
    iname := left('advfk_' || r.conname, 63);
    EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON %s (%s)', iname, r.conrelid::regclass, cols);
    INSERT INTO advisor_backup_20261122.index_def VALUES (iname, NULL, true) ON CONFLICT DO NOTHING;
  END LOOP;
END $$;
-- 0003 auth_rls_initplan (1): wrap auth.<fn>() / current_setting() in (select ...)
-- so they are evaluated once per statement. Semantics unchanged. Original expressions saved.
DO $$
DECLARE r record; nq text; nw text;
  pat constant text := '(?<!select )((auth\.(uid|jwt|role|email)\(\))|(current_setting\([^()]*\)))';
BEGIN
  FOR r IN SELECT pc.oid AS tbl, format('%I.%I', ns.nspname, pc.relname) AS tbltxt, p.polname, pg_get_expr(p.polqual,p.polrelid) AS qual, pg_get_expr(p.polwithcheck,p.polrelid) AS wc
             FROM pg_policy p JOIN pg_class pc ON pc.oid=p.polrelid JOIN pg_namespace ns ON ns.oid=pc.relnamespace
             JOIN (VALUES ('public.profiles','profiles_self_select')) v(t,pol) ON p.polrelid = to_regclass(v.t) AND p.polname = v.pol
  LOOP
    INSERT INTO advisor_backup_20261122.policy_def VALUES (r.tbltxt, r.polname, r.qual, r.wc) ON CONFLICT DO NOTHING;
    nq := regexp_replace(r.qual, pat, '(select \1)', 'gi');
    nw := regexp_replace(r.wc,   pat, '(select \1)', 'gi');
    IF r.qual IS NOT NULL AND nq <> r.qual THEN
      EXECUTE format('ALTER POLICY %I ON %s USING (%s)', r.polname, r.tbl::regclass, nq);
    END IF;
    IF r.wc IS NOT NULL AND nw <> r.wc THEN
      EXECUTE format('ALTER POLICY %I ON %s WITH CHECK (%s)', r.polname, r.tbl::regclass, nw);
    END IF;
  END LOOP;
END $$;
