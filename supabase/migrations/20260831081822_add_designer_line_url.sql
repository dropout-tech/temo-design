alter table public.designers
  add column if not exists line_url text;

alter table public.designers
  add constraint designers_line_url_https_check
  check (
    line_url is null
    or (
      line_url = btrim(line_url)
      and char_length(line_url) between 1 and 500
      and line_url ~* '^https://[^[:space:]]+$'
    )
  );

comment on column public.designers.line_url is
  '團隊成員的 LINE 公開連結，使用 https://lin.ee 或 https://line.me';
