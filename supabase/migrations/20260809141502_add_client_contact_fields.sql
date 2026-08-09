alter table if exists public.clients
  add column if not exists address text,
  add column if not exists phone text,
  add column if not exists website text;
