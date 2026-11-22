-- ROLLBACK of security batch
-- Generated 20261122 from Supabase get_advisors for project xfsfpaqypzkglkqibzyk.
-- Only advisor-flagged objects are touched; objects are resolved from the catalog at apply time.
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT p.oid::regprocedure AS fn FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
            WHERE n.nspname||'.'||p.proname = ANY(ARRAY['public.temo_set_updated_at']::text[])
              AND p.oid IN (SELECT to_regprocedure(fn)::oid FROM advisor_backup_20261122.func_acl WHERE proconfig IS NULL OR NOT EXISTS (SELECT 1 FROM unnest(proconfig) c WHERE c LIKE 'search_path=%'))
  LOOP EXECUTE format('ALTER FUNCTION %s RESET search_path', r.fn); END LOOP;
END $$;
-- restore the exact saved EXECUTE ACL entries for PUBLIC/anon/authenticated
DO $$
DECLARE r record; a record;
BEGIN
  FOR r IN SELECT to_regprocedure(fn) AS fn, proacl FROM advisor_backup_20261122.func_acl WHERE acl_saved AND to_regprocedure(fn) IS NOT NULL LOOP
    IF r.proacl IS NULL THEN
      EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO PUBLIC', r.fn);
    ELSE
      FOR a IN SELECT grantee FROM aclexplode(r.proacl) x
                WHERE x.privilege_type='EXECUTE'
                  AND (x.grantee=0 OR x.grantee IN (SELECT oid FROM pg_roles WHERE rolname IN ('anon','authenticated')))
      LOOP
        EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO %s', r.fn,
                       CASE WHEN a.grantee=0 THEN 'PUBLIC' ELSE quote_ident((SELECT rolname FROM pg_roles WHERE oid=a.grantee)) END);
      END LOOP;
    END IF;
  END LOOP;
END $$;
