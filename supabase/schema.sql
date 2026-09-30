-- Natural by Cara — booking app schema
--
-- SECURITY MODEL
-- ---------------
-- This app has no browser-facing Supabase access at all: every read and
-- write goes through Next.js Route Handlers running on the server, which
-- use the Supabase SERVICE ROLE key (see src/lib/supabase.ts). The service
-- role key bypasses Row Level Security entirely.
--
-- RLS is still enabled on every table below as defense-in-depth: if the
-- anon/public key were ever leaked or accidentally used from the browser,
-- these default-deny policies (i.e. no policies at all) mean it could not
-- read or write anything. There is intentionally no policy that grants the
-- `anon` or `authenticated` roles any access — all access is via the
-- service role from trusted server code.
--
-- Paste this whole file into the Supabase SQL editor on a fresh project.

-- Required for gen_random_uuid()
create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- services
-- ---------------------------------------------------------------------
create table if not exists services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  duration_minutes int not null check (duration_minutes > 0),
  price numeric(10, 2),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table services enable row level security;

-- Natural By Cara is a massage/spa business (not a hair salon — an earlier
-- draft of this seed data used hair-service placeholders by mistake).
-- Seeded from real pricing visible on the business's Instagram
-- (@natural.by.cara). These are a starting point only — the owner can
-- add/edit/remove services herself from /admin.
insert into services (name, duration_minutes, price, active) values
  ('Back & Neck', 45, 250.00, true),
  ('Full Body', 60, 450.00, true);

-- ---------------------------------------------------------------------
-- availability_rules — recurring weekly opening hours.
-- A "closed all day" weekday is modeled simply by having ZERO rows for
-- that weekday (no is_closed flag needed). A day can have multiple rows
-- for split shifts (e.g. 09:00-12:00 and 13:00-17:00).
-- ---------------------------------------------------------------------
create table if not exists availability_rules (
  id uuid primary key default gen_random_uuid(),
  weekday int not null check (weekday between 0 and 6), -- 0 = Sunday .. 6 = Saturday
  start_time time not null,
  end_time time not null check (end_time > start_time),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_availability_rules_weekday on availability_rules (weekday);

alter table availability_rules enable row level security;

-- ---------------------------------------------------------------------
-- date_overrides — one-off exceptions to the weekly rule for a specific
-- calendar date (holidays, extra hours, etc). If a row exists for a date:
--   * is_closed = true  -> the day is fully closed regardless of weekday rule
--   * is_closed = false -> start_time/end_time (if set) replace the weekday
--                          rule's hours for that single date
-- ---------------------------------------------------------------------
create table if not exists date_overrides (
  id uuid primary key default gen_random_uuid(),
  date date not null unique,
  is_closed boolean not null default false,
  start_time time,
  end_time time,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint date_overrides_hours_check check (
    is_closed = true or start_time is null or end_time is null or end_time > start_time
  )
);

alter table date_overrides enable row level security;

-- ---------------------------------------------------------------------
-- bookings
-- ---------------------------------------------------------------------
create table if not exists bookings (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references services (id),
  client_name text not null,
  client_phone text not null,
  booking_date date not null,
  start_time time not null,
  end_time time not null check (end_time > start_time),
  status text not null default 'confirmed' check (status in ('confirmed', 'cancelled')),
  created_at timestamptz not null default now()
);

create index if not exists idx_bookings_date_status on bookings (booking_date, status);

alter table bookings enable row level security;

-- No policies are defined for any table above: with RLS enabled and zero
-- policies, all access via the anon/authenticated roles is denied by
-- default. Only the service role (used exclusively server-side) can read
-- or write.
