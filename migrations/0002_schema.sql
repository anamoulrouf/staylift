-- Staylift core: single-property concierge MVP (unowned demo rows)

create table if not exists properties (
  id text primary key,
  name text not null,
  city text not null,
  rooms integer not null,
  occupancy_pct integer not null,
  avg_stay_nights numeric not null,
  tagline text not null
);

create table if not exists room_types (
  id text primary key,
  property_id text not null references properties (id),
  name text not null,
  nightly_cents integer not null,
  inventory integer not null
);

create table if not exists offers (
  id text primary key,
  property_id text not null references properties (id),
  name text not null,
  short_label text not null,
  description text not null,
  category text not null,
  price_cents integer not null,
  price_unit text not null,
  inventory integer,
  cutoff_hours integer,
  auto_approve boolean not null default true,
  owner_type text not null default 'HOTEL',
  active boolean not null default true,
  from_room_type_id text,
  to_room_type_id text,
  sort_order integer not null default 0
);

create table if not exists recipes (
  id text primary key,
  property_id text not null references properties (id),
  name text not null,
  summary text not null,
  trigger_event text not null,
  offset_hours integer not null default 0,
  offer_ids text not null,
  active boolean not null default true,
  sort_order integer not null default 0
);

create table if not exists reservations (
  id text primary key,
  property_id text not null references properties (id),
  booking_ref text not null,
  source text not null,
  guest_name text not null,
  arrival date not null,
  departure date not null,
  room_type_id text not null references room_types (id),
  guests integer not null,
  token text not null unique,
  email_kind text not null,
  phone_kind text not null,
  consent text not null default 'transactional',
  notes text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists reservations_arrival_idx on reservations (arrival);
create index if not exists reservations_token_idx on reservations (token);

create table if not exists orders (
  id text primary key,
  reservation_id text not null references reservations (id),
  offer_id text not null references offers (id),
  qty integer not null default 1,
  amount_cents integer not null,
  status text not null,
  for_date date,
  for_time text,
  created_at timestamptz not null default now(),
  decided_at timestamptz
);

create index if not exists orders_reservation_idx on orders (reservation_id);
create index if not exists orders_status_idx on orders (status);

create table if not exists messages (
  id text primary key,
  reservation_id text not null references reservations (id),
  recipe_id text,
  channel text not null,
  subject text not null,
  status text not null default 'sent',
  sent_at timestamptz not null default now()
);

create table if not exists events (
  id serial primary key,
  reservation_id text not null references reservations (id),
  offer_id text,
  kind text not null,
  created_at timestamptz not null default now()
);

create table if not exists checkins (
  reservation_id text primary key references reservations (id),
  eta text,
  real_email_captured boolean not null default false,
  completed_at timestamptz
);
