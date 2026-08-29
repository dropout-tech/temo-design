begin;
select plan(10);

insert into public.site_settings (id, portfolio_filter_language)
values (1, 'en')
on conflict (id) do update
set portfolio_filter_language = excluded.portfolio_filter_language;

select has_column(
  'public',
  'site_settings',
  'portfolio_filter_language',
  'site_settings has the portfolio filter language setting'
);
select col_not_null(
  'public',
  'site_settings',
  'portfolio_filter_language',
  'portfolio filter language is required'
);
select ok(
  has_table_privilege('anon', 'public.site_settings', 'select'),
  'anon can read public site settings'
);
select ok(
  not has_table_privilege('anon', 'public.site_settings', 'insert,update,delete'),
  'anon cannot change public site settings'
);
select ok(
  has_table_privilege('authenticated', 'public.site_settings', 'select,insert,update'),
  'authenticated Studio users can read and save site settings'
);
select ok(
  not has_table_privilege('authenticated', 'public.site_settings', 'delete'),
  'authenticated Studio users cannot delete the singleton settings row'
);

set local role anon;
select results_eq(
  $$select portfolio_filter_language from public.site_settings where id = 1$$,
  array['en'::text],
  'anon reads the configured language'
);
select throws_ok(
  $$update public.site_settings set portfolio_filter_language = 'zh' where id = 1$$,
  '42501',
  null,
  'anon cannot update the configured language'
);

set local role authenticated;
select lives_ok(
  $$update public.site_settings set portfolio_filter_language = 'zh' where id = 1$$,
  'authenticated Studio users can update the configured language'
);
select throws_ok(
  $$update public.site_settings set portfolio_filter_language = 'invalid' where id = 1$$,
  '23514',
  null,
  'invalid language values are rejected'
);

select * from finish();
rollback;
