-- Advisor security batch: function_search_path_mutable + SECURITY DEFINER trigger functions
-- Generated 20261122 from Supabase get_advisors for project xfsfpaqypzkglkqibzyk.
-- Only advisor-flagged objects are touched; objects are resolved from the catalog at apply time.
CREATE SCHEMA IF NOT EXISTS advisor_backup_20261122;
REVOKE ALL ON SCHEMA advisor_backup_20261122 FROM PUBLIC;
CREATE TABLE IF NOT EXISTS advisor_backup_20261122.func_acl (fn regprocedure PRIMARY KEY, proacl aclitem[], proconfig text[], acl_saved boolean DEFAULT false);
-- 0011 function_search_path_mutable (1). Pin to the Supabase role default
-- ("$user", public, extensions) so name resolution is unchanged, plus pg_temp last.
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT p.oid::regprocedure AS fn, p.proacl AS acl, p.proconfig
             FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
            WHERE n.nspname||'.'||p.proname = ANY(ARRAY['public.temo_set_updated_at']::text[])
              AND NOT EXISTS (SELECT 1 FROM unnest(coalesce(p.proconfig,'{}')) c WHERE c LIKE 'search_path=%')
  LOOP
    INSERT INTO advisor_backup_20261122.func_acl VALUES (r.fn, r.acl, r.proconfig, false) ON CONFLICT DO NOTHING;
    EXECUTE format('ALTER FUNCTION %s SET search_path = "$user", public, extensions, pg_temp', r.fn);
  END LOOP;
END $$;
-- 0028/0029 SECURITY DEFINER callable by anon/authenticated: ONLY trigger / event_trigger
-- functions are changed here. Triggers fire regardless of the caller's EXECUTE privilege,
-- so revoking EXECUTE from API roles cannot change app behaviour. Callable RPCs are NOT
-- touched (they need a per-function caller review; see plan-v1.md).
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT p.oid::regprocedure AS fn, p.proacl AS acl, p.proconfig
             FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
            WHERE n.nspname||'.'||p.proname = ANY(ARRAY['public.handle_new_user','public.is_admin','public.is_staff']::text[])
              AND p.prosecdef
              AND p.prorettype IN ('trigger'::regtype, 'event_trigger'::regtype)
  LOOP
    INSERT INTO advisor_backup_20261122.func_acl VALUES (r.fn, r.acl, r.proconfig, true)
      ON CONFLICT (fn) DO UPDATE SET proacl = EXCLUDED.proacl, acl_saved = true
      WHERE NOT advisor_backup_20261122.func_acl.acl_saved;
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon, authenticated', r.fn);
  END LOOP;
END $$;
