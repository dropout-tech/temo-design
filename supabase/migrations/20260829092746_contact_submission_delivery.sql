-- Contact form delivery metadata and least-privilege access.
-- Public visitors submit through the server-only /api/contact route. The route
-- uses the service role so customer details are never directly writable/readable
-- with the browser's public key.

alter table public.contact_submissions
  add column if not exists request_id uuid,
  add column if not exists email_status text,
  add column if not exists email_sent_at timestamptz,
  add column if not exists email_provider_id text,
  add column if not exists email_error text,
  add column if not exists request_ip_hash text;

-- Preserve old records without pretending that a notification email was sent.
update public.contact_submissions
set
  request_id = coalesce(request_id, gen_random_uuid()),
  email_status = coalesce(email_status, 'unknown')
where request_id is null or email_status is null;

alter table public.contact_submissions
  alter column request_id set default gen_random_uuid(),
  alter column request_id set not null,
  alter column email_status set default 'pending',
  alter column email_status set not null;

create unique index if not exists contact_submissions_request_id_key
  on public.contact_submissions (request_id);

create index if not exists contact_submissions_created_at_idx
  on public.contact_submissions (created_at desc);

create index if not exists contact_submissions_rate_limit_idx
  on public.contact_submissions (request_ip_hash, created_at desc)
  where request_ip_hash is not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'contact_submissions_email_status_check'
      and conrelid = 'public.contact_submissions'::regclass
  ) then
    alter table public.contact_submissions
      add constraint contact_submissions_email_status_check
      check (email_status in ('pending', 'sent', 'failed', 'unknown'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'contact_submissions_field_lengths_check'
      and conrelid = 'public.contact_submissions'::regclass
  ) then
    alter table public.contact_submissions
      add constraint contact_submissions_field_lengths_check
      check (
        (name is null or char_length(name) between 1 and 100)
        and (email is null or char_length(email) between 3 and 254)
        and (company is null or char_length(company) <= 150)
        and (phone is null or char_length(phone) <= 50)
        and (subject is null or char_length(subject) <= 50)
        and (message is null or char_length(message) between 1 and 10000)
        and (email_provider_id is null or char_length(email_provider_id) <= 255)
        and (email_error is null or char_length(email_error) <= 1000)
        and (request_ip_hash is null or char_length(request_ip_hash) = 64)
      ) not valid;
  end if;
end
$$;

drop policy if exists contact_submissions_anyone_submit
  on public.contact_submissions;
drop policy if exists contact_submissions_auth_read
  on public.contact_submissions;

revoke all on table public.contact_submissions from anon, authenticated;
grant select on table public.contact_submissions to authenticated;
grant select, insert, update on table public.contact_submissions to service_role;

create policy contact_submissions_studio_read
  on public.contact_submissions
  for select
  to authenticated
  using (true);
