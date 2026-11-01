-- Phase A: hotel accounts, roles, per-hotel data separation, audit.
--
-- Tenancy model
--   * Every hotel-owned row carries property_id. Child tables (orders, messages,
--     events, checkins) get it too, so each table can be checked on its own.
--   * Row-level security: app queries run inside a transaction that sets
--     app.property_id and switches to the non-owner role staylift_app
--     (see src/lib/staylift/tenant-db.ts). Policies only show that hotel's rows.
--     A query that forgets the setting sees nothing: fail closed.
--   * property_id defaults to the transaction's app.property_id, so inserts land
--     in the right hotel without each statement naming it.
--   * The owner role (migrations, sign-in, membership lookups, scheduled purges)
--     is not subject to these policies (RLS is enabled, not forced).
--   * audit_log is append-only for the app role: select + insert, no update/delete.

-- ------------------------------------------------------------- properties
alter table properties add column if not exists market text not null default 'US';
alter table properties add column if not exists timezone text not null default 'America/Chicago';
alter table properties add column if not exists code text;
alter table properties add column if not exists is_demo boolean not null default false;
alter table properties add column if not exists sender_email text;
alter table properties add column if not exists created_at timestamptz not null default now();
update properties set code = id where code is null;
update properties set is_demo = true where id = 'marlowe';
create unique index if not exists properties_code_idx on properties (code);

-- ------------------------------------------------- property_id everywhere
alter table orders add column if not exists property_id text references properties (id);
alter table messages add column if not exists property_id text references properties (id);
alter table events add column if not exists property_id text references properties (id);
alter table checkins add column if not exists property_id text references properties (id);

update orders o set property_id = r.property_id
from reservations r where r.id = o.reservation_id and o.property_id is null;
update messages m set property_id = r.property_id
from reservations r where r.id = m.reservation_id and m.property_id is null;
update events e set property_id = r.property_id
from reservations r where r.id = e.reservation_id and e.property_id is null;
update checkins c set property_id = r.property_id
from reservations r where r.id = c.reservation_id and c.property_id is null;

alter table orders alter column property_id set not null;
alter table messages alter column property_id set not null;
alter table events alter column property_id set not null;
alter table checkins alter column property_id set not null;

alter table room_types alter column property_id set default current_setting('app.property_id', true);
alter table offers alter column property_id set default current_setting('app.property_id', true);
alter table recipes alter column property_id set default current_setting('app.property_id', true);
alter table reservations alter column property_id set default current_setting('app.property_id', true);
alter table orders alter column property_id set default current_setting('app.property_id', true);
alter table messages alter column property_id set default current_setting('app.property_id', true);
alter table events alter column property_id set default current_setting('app.property_id', true);
alter table checkins alter column property_id set default current_setting('app.property_id', true);

create index if not exists orders_property_idx on orders (property_id);
create index if not exists messages_property_idx on messages (property_id);
create index if not exists events_property_idx on events (property_id);
create index if not exists reservations_property_idx on reservations (property_id);

-- Booking references are unique per hotel and channel, not globally.
create unique index if not exists reservations_ref_idx on reservations (property_id, source, booking_ref);

-- Same-hotel references. Foreign-key checks bypass row-level security, so a
-- plain FK would let a row in hotel A point at a reservation of hotel B.
-- Composite keys (id, property_id) make every reference stay inside its hotel.
alter table room_types add constraint room_types_tenant_key unique (id, property_id);
alter table offers add constraint offers_tenant_key unique (id, property_id);
alter table reservations add constraint reservations_tenant_key unique (id, property_id);
alter table reservations add constraint reservations_room_tenant_fk
  foreign key (room_type_id, property_id) references room_types (id, property_id);
alter table orders add constraint orders_res_tenant_fk
  foreign key (reservation_id, property_id) references reservations (id, property_id) on delete cascade;
alter table orders add constraint orders_offer_tenant_fk
  foreign key (offer_id, property_id) references offers (id, property_id);
alter table messages add constraint messages_res_tenant_fk
  foreign key (reservation_id, property_id) references reservations (id, property_id) on delete cascade;
alter table events add constraint events_res_tenant_fk
  foreign key (reservation_id, property_id) references reservations (id, property_id) on delete cascade;
alter table checkins add constraint checkins_res_tenant_fk
  foreign key (reservation_id, property_id) references reservations (id, property_id) on delete cascade;

-- ------------------------------------------------------- staff and access
-- user_id is Better Auth's "user".id (text). No FK: the auth schema is owned
-- by Better Auth and may live in a different migration order.
create table if not exists memberships (
  user_id text not null,
  property_id text not null references properties (id) on delete cascade,
  role text not null check (role in ('owner', 'manager', 'front_desk')),
  created_at timestamptz not null default now(),
  primary key (user_id, property_id)
);
create index if not exists memberships_property_idx on memberships (property_id);

create table if not exists user_settings (
  user_id text primary key,
  active_property_id text references properties (id) on delete set null
);

create table if not exists invitations (
  id text primary key,
  property_id text not null references properties (id) on delete cascade,
  email text not null,
  role text not null check (role in ('owner', 'manager', 'front_desk')),
  token_hash text not null unique,
  invited_by text not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  accepted_at timestamptz,
  accepted_by text,
  revoked_at timestamptz
);

-- ------------------------------------------------------------ audit log
create table if not exists audit_log (
  id bigserial primary key,
  property_id text not null default current_setting('app.property_id', true)
    references properties (id) on delete cascade,
  actor_kind text not null check (actor_kind in ('staff', 'guest', 'system')),
  actor_id text,
  actor_label text,
  action text not null,
  target_type text,
  target_id text,
  detail jsonb not null default '{}'::jsonb,
  at timestamptz not null default now()
);
create index if not exists audit_log_property_at_idx on audit_log (property_id, at desc);

-- ------------------------------------------------------------- app role
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'staylift_app') then
    create role staylift_app nologin;
  end if;
end
$$;

-- The connecting role must be able to SET ROLE staylift_app. Superusers can
-- already; a managed-Postgres owner (Neon) holds ADMIN on roles it creates and
-- grants itself membership here.
do $$
begin
  execute format('grant staylift_app to %I', current_user);
exception when others then
  raise notice 'grant staylift_app to %: %', current_user, sqlerrm;
end
$$;

grant usage on schema public to staylift_app;
grant select, insert, update, delete on
  properties, room_types, offers, recipes, reservations, orders, messages, events, checkins
  to staylift_app;
grant select, insert on audit_log to staylift_app;
grant usage, select on all sequences in schema public to staylift_app;

-- -------------------------------------------------------------- policies
alter table properties enable row level security;
alter table room_types enable row level security;
alter table offers enable row level security;
alter table recipes enable row level security;
alter table reservations enable row level security;
alter table orders enable row level security;
alter table messages enable row level security;
alter table events enable row level security;
alter table checkins enable row level security;
alter table audit_log enable row level security;

drop policy if exists tenant on properties;
create policy tenant on properties to staylift_app
  using (id = current_setting('app.property_id', true))
  with check (id = current_setting('app.property_id', true));

do $$
declare t text;
begin
  foreach t in array array['room_types', 'offers', 'recipes', 'reservations', 'orders',
                           'messages', 'events', 'checkins', 'audit_log']
  loop
    execute format('drop policy if exists tenant on %I', t);
    execute format(
      'create policy tenant on %I to staylift_app
         using (property_id = current_setting(''app.property_id'', true))
         with check (property_id = current_setting(''app.property_id'', true))', t);
  end loop;
end
$$;
