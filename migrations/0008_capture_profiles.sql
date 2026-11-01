-- Phase B (check-in capture) and phase C (guest profiles, occasions, consent).
--
-- Privacy rules built into the schema:
--   * Contact details are stored encrypted (*_enc, AES-256-GCM, app-held key)
--     with a keyed hash (*_hash, HMAC-SHA256) for matching. No plaintext column.
--   * Occasions keep month and day only, never a year of birth.
--   * Companions have no contact columns at all: they are never messaged.
--     Children are stored by age band, without a name.
--   * Consent is an append-only ledger (consent_events). The current state of a
--     purpose is its latest event.
--   * Without a durable consent, what the guest told us lives on the stay
--     (checkins) and is purged on that stay's clock.

-- ------------------------------------------------------------ properties
alter table properties add column if not exists capture_launched_on date;
alter table properties add column if not exists service_retention_days integer not null default 30;
alter table properties add column if not exists last_purge_on date;
alter table properties add column if not exists demo_seeded_capture boolean not null default false;
-- Demo hotel: the capture step went live three weeks ago, so the gate has data.
update properties set capture_launched_on = CURRENT_DATE - 21
where id = 'marlowe' and capture_launched_on is null;

-- ---------------------------------------------------------- guest profiles
create table if not exists guest_profiles (
  id text primary key,
  property_id text not null default current_setting('app.property_id', true)
    references properties (id) on delete cascade,
  display_name text not null,
  language text not null default 'en',
  email_enc text,
  email_hash text,
  email_verified_at timestamptz,
  phone_enc text,
  phone_hash text,
  phone_verified_at timestamptz,
  pref_token_hash text unique,
  merged_into text references guest_profiles (id),
  erased_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists guest_profiles_email_idx on guest_profiles (property_id, email_hash)
  where email_hash is not null and merged_into is null and erased_at is null;
create unique index if not exists guest_profiles_phone_idx on guest_profiles (property_id, phone_hash)
  where phone_hash is not null and merged_into is null and erased_at is null;
create index if not exists guest_profiles_property_idx on guest_profiles (property_id, created_at desc);

alter table reservations add column if not exists profile_id text references guest_profiles (id);
alter table reservations add column if not exists anonymized_at timestamptz;
create index if not exists reservations_profile_idx on reservations (profile_id);

create table if not exists companions (
  id text primary key,
  property_id text not null default current_setting('app.property_id', true)
    references properties (id) on delete cascade,
  profile_id text not null references guest_profiles (id) on delete cascade,
  relation text not null check (relation in ('partner', 'child', 'parent', 'sibling', 'friend', 'colleague', 'other')),
  first_name text,
  age_band text check (age_band in ('0-2', '3-12', '13-17')),
  created_at timestamptz not null default now(),
  -- Children: an age band and no name. Adults: no age band.
  check ((relation = 'child' and first_name is null and age_band is not null)
      or (relation <> 'child' and age_band is null))
);

create table if not exists occasions (
  id text primary key,
  property_id text not null default current_setting('app.property_id', true)
    references properties (id) on delete cascade,
  profile_id text not null references guest_profiles (id) on delete cascade,
  companion_id text references companions (id) on delete cascade,
  kind text not null check (kind in ('birthday', 'anniversary', 'achievement', 'other')),
  label text,
  month integer not null check (month between 1 and 12),
  day integer check (day between 1 and 31),
  source text not null default 'guest' check (source in ('guest', 'staff')),
  created_at timestamptz not null default now()
);
create index if not exists occasions_profile_idx on occasions (profile_id);
create index if not exists occasions_month_idx on occasions (property_id, month, day);

create table if not exists profile_holidays (
  property_id text not null default current_setting('app.property_id', true)
    references properties (id) on delete cascade,
  profile_id text not null references guest_profiles (id) on delete cascade,
  holiday text not null,
  created_at timestamptz not null default now(),
  primary key (profile_id, holiday)
);

create table if not exists consent_events (
  id bigserial primary key,
  property_id text not null default current_setting('app.property_id', true)
    references properties (id) on delete cascade,
  profile_id text not null references guest_profiles (id) on delete cascade,
  purpose text not null check (purpose in ('marketing_email', 'marketing_whatsapp', 'profile_memory')),
  granted boolean not null,
  wording_version text not null,
  wording text not null,
  source text not null check (source in ('online_checkin', 'desk_tablet', 'qr', 'preference_centre', 'staff', 'erasure')),
  reservation_id text,
  at timestamptz not null default now()
);
create index if not exists consent_events_profile_idx on consent_events (profile_id, purpose, at desc);

-- Hashes of contacts that asked to be erased or unsubscribed everywhere, so a
-- later booking cannot quietly re-add them to marketing.
create table if not exists suppressions (
  property_id text not null default current_setting('app.property_id', true)
    references properties (id) on delete cascade,
  value_hash text not null,
  reason text not null,
  at timestamptz not null default now(),
  primary key (property_id, value_hash)
);

-- --------------------------------------------------- check-in capture step
alter table checkins add column if not exists started_at timestamptz;
alter table checkins add column if not exists source text not null default 'online';
alter table checkins add column if not exists celebration text;
alter table checkins add column if not exists celebration_whose text;
alter table checkins add column if not exists celebration_month integer;
alter table checkins add column if not exists celebration_day integer;
alter table checkins add column if not exists party jsonb not null default '[]'::jsonb;
alter table checkins add column if not exists contact_channel text;
alter table checkins add column if not exists service_email_enc text;
alter table checkins add column if not exists service_phone_enc text;
alter table checkins add column if not exists contact_verified_at timestamptz;
alter table checkins add column if not exists purge_on date;
-- Consent ticket: issued only to whoever just entered a valid code, valid 30
-- minutes. Consents at check-in need it, so holding the stay link alone (front
-- desk staff can see stay links) is not enough to opt a guest in.
alter table checkins add column if not exists consent_ticket_hash text;
alter table checkins add column if not exists consent_ticket_expires_at timestamptz;

create table if not exists contact_verifications (
  id text primary key,
  property_id text not null default current_setting('app.property_id', true)
    references properties (id) on delete cascade,
  reservation_id text not null references reservations (id) on delete cascade,
  channel text not null check (channel in ('email', 'whatsapp')),
  value_enc text not null,
  value_hash text not null,
  code_hash text not null,
  attempts integer not null default 0,
  expires_at timestamptz not null,
  verified_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists contact_verifications_res_idx on contact_verifications (reservation_id, created_at desc);

-- Step-level funnel for the capture flow, so a completion drop can be traced
-- to the step that causes it.
create table if not exists capture_events (
  id bigserial primary key,
  property_id text not null default current_setting('app.property_id', true)
    references properties (id) on delete cascade,
  reservation_id text not null references reservations (id) on delete cascade,
  step text not null check (step in ('started', 'celebration', 'party', 'code_sent', 'verified', 'consented', 'completed')),
  source text not null default 'online',
  at timestamptz not null default now()
);
create index if not exists capture_events_res_idx on capture_events (property_id, reservation_id);

-- ------------------------------------------------ same-hotel references
-- See 0007: composite keys keep every reference inside its own hotel.
alter table guest_profiles add constraint guest_profiles_tenant_key unique (id, property_id);
alter table companions add constraint companions_tenant_key unique (id, property_id);
alter table reservations add constraint reservations_profile_tenant_fk
  foreign key (profile_id, property_id) references guest_profiles (id, property_id);
alter table guest_profiles add constraint guest_profiles_merge_tenant_fk
  foreign key (merged_into, property_id) references guest_profiles (id, property_id);
alter table companions add constraint companions_profile_tenant_fk
  foreign key (profile_id, property_id) references guest_profiles (id, property_id) on delete cascade;
alter table occasions add constraint occasions_profile_tenant_fk
  foreign key (profile_id, property_id) references guest_profiles (id, property_id) on delete cascade;
alter table occasions add constraint occasions_companion_tenant_fk
  foreign key (companion_id, property_id) references companions (id, property_id) on delete cascade;
alter table profile_holidays add constraint profile_holidays_profile_tenant_fk
  foreign key (profile_id, property_id) references guest_profiles (id, property_id) on delete cascade;
alter table consent_events add constraint consent_events_profile_tenant_fk
  foreign key (profile_id, property_id) references guest_profiles (id, property_id);
alter table contact_verifications add constraint contact_verifications_res_tenant_fk
  foreign key (reservation_id, property_id) references reservations (id, property_id) on delete cascade;
alter table capture_events add constraint capture_events_res_tenant_fk
  foreign key (reservation_id, property_id) references reservations (id, property_id) on delete cascade;

-- ----------------------------------------------------------- grants + RLS
grant select, insert, update, delete on
  guest_profiles, companions, occasions, profile_holidays, suppressions, contact_verifications
  to staylift_app;
-- Ledgers: append-only for the app.
grant select, insert on consent_events, capture_events to staylift_app;
-- Erasure removes ledger rows with the profile via ON DELETE CASCADE only when a
-- hotel is deleted; guest erasure keeps the ledger as proof of consent.
grant usage, select on all sequences in schema public to staylift_app;

do $$
declare t text;
begin
  foreach t in array array['guest_profiles', 'companions', 'occasions', 'profile_holidays',
                           'consent_events', 'suppressions', 'contact_verifications', 'capture_events']
  loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists tenant on %I', t);
    execute format(
      'create policy tenant on %I to staylift_app
         using (property_id = current_setting(''app.property_id'', true))
         with check (property_id = current_setting(''app.property_id'', true))', t);
  end loop;
end
$$;
