-- Staylift v6: make the revenue claim measurable.
--
-- 1. Economics settings live on the property (plan, margin, card fees, holdout).
-- 2. Holdout: a random share of bookings gets check-in but no offers, so lift
--    is measured against a control group instead of assumed.
-- 3. Desk sales: front-desk sales of the same items are logged for EVERY guest
--    (orders.channel = 'desk'), otherwise the holdout baseline reads as zero.
-- 4. paid_at: "revenue today" means captured today, not "ordered or served today".
-- 5. Messages carry their billed cost (Meta bills utility templates and in-window
--    replies from 1 Oct 2026).
-- 6. A deterministic 60-day pilot history so the desk has a real sample.

alter table properties add column if not exists launched_on date;
alter table properties add column if not exists plan_id text not null default 'A';
alter table properties add column if not exists plan_per_room_monthly numeric not null default 1;
alter table properties add column if not exists plan_base_monthly numeric not null default 0;
alter table properties add column if not exists plan_rev_share_pct numeric not null default 7;
alter table properties add column if not exists margin_pct numeric not null default 60;
alter table properties add column if not exists card_pct numeric not null default 3.5;
alter table properties add column if not exists card_fixed_cents integer not null default 0;
alter table properties add column if not exists holdout_pct integer not null default 20;
-- US WhatsApp utility template $0.004 + BSP $0.005 = 0.9 cents per message.
alter table properties add column if not exists message_cost_cents numeric not null default 0.9;

update properties set launched_on = coalesce(launched_on, CURRENT_DATE - 60) where id = 'marlowe';

alter table reservations add column if not exists holdout boolean not null default false;

alter table orders add column if not exists channel text not null default 'guest_page';
alter table orders add column if not exists paid_at timestamptz;
update orders
set paid_at = coalesce(decided_at, created_at)
where status in ('paid', 'fulfilled') and paid_at is null;
create index if not exists orders_paid_at_idx on orders (paid_at);

alter table messages add column if not exists kind text not null default 'utility';
alter table messages add column if not exists cost_cents numeric not null default 0;
update messages
set cost_cents = case when channel in ('sms', 'whatsapp') and status = 'sent' then 0.9 else 0 end;

-- Lean messaging: only two recipes send a phone/email message (both carry
-- service content: the check-in link and arrival details). The rest change
-- which offers the stay page leads with. Offers never ride inside a message.
alter table recipes add column if not exists sends_message boolean not null default false;
update recipes set sends_message = true,
  summary = 'Message: check-in link (utility). Page leads with upgrade, breakfast, airport transfer.'
where id = 'rec_booking';
update recipes set sends_message = true,
  summary = 'Message: arrival details 3 days out (utility). Page leads with breakfast, spa, transfer.'
where id = 'rec_prearrival';
update recipes set sends_message = false,
  summary = 'No message. At online check-in the page leads with upgrade, early check-in, breakfast.'
where id = 'rec_checkin';
update recipes set sends_message = false,
  summary = 'No message. On arrival day the page leads with breakfast, spa, parking.'
where id = 'rec_arrival';
update recipes set sends_message = false,
  summary = 'No message. During the stay the page leads with spa, late checkout, breakfast.'
where id = 'rec_instay';
update recipes set sends_message = false,
  summary = 'No message. The night before departure the page leads with late checkout, breakfast, transfer.'
where id = 'rec_depart';

-- Messages carry service content only; offers live on the page. Seeded
-- subjects that pitched offers would be billed (and judged) as marketing.
update messages set subject = 'Check in online for your stay' where id in ('msg_maya_1', 'msg_elena_1', 'msg_callum_1');
update messages set subject = 'Your room is ready from 3 PM' where id = 'msg_amina_1';
update messages set subject = 'Checkout details for tomorrow' where id = 'msg_sofia_1';

-- Demo book: Owen is in the holdout (check-in only, no offers).
update reservations set holdout = true where id = 'res_owen';

-- 0004 inserted a view for every demo booking so conversion could not exceed
-- 100%. Replace that shortcut with the real set: everyone who bought through
-- the page viewed it, plus the guests who opened the link without buying.
delete from events
where kind = 'view'
  and reservation_id in (
    'res_maya', 'res_james', 'res_sofia', 'res_noah', 'res_elena', 'res_theo', 'res_amina',
    'res_callum', 'res_priya', 'res_luca', 'res_henri', 'res_jade', 'res_owen', 'res_iris'
  );
insert into events (reservation_id, kind, created_at)
values
  ('res_maya', 'view', now() - interval '4 hours'),
  ('res_james', 'view', now() - interval '2 days'),
  ('res_sofia', 'view', now() - interval '2 hours'),
  ('res_theo', 'view', now() - interval '5 hours'),
  ('res_noah', 'view', now() - interval '5 hours'),
  ('res_elena', 'view', now() - interval '1 hour'),
  ('res_amina', 'view', now() - interval '1 day'),
  ('res_luca', 'view', now() - interval '19 hours'),
  ('res_henri', 'view', now() - interval '28 days'),
  ('res_jade', 'view', now() - interval '20 days'),
  ('res_iris', 'view', now() - interval '12 days');

-- ---------------------------------------------------------------------------
-- Pilot history: 720 completed stays over the 60-day pilot (42 rooms × 62% ÷
-- 2.1 nights ≈ 12.4 bookings/day). Deterministic draws from md5(), so every
-- database gets the same book. Rates are realistic, not flattering:
--   reachable ≈ 88%, page views ≈ 55% of reachable treatment bookings,
--   buyers ≈ 14.5% of viewers, desk sales 2% (treatment) vs 4.5% (holdout).
-- ---------------------------------------------------------------------------

create table pilot_draws as
with seeds as (
  select
    i,
    decode(md5('stay-' || i), 'hex') as a,
    decode(md5('buy-' || i), 'hex') as b,
    decode(md5('counter-' || i), 'hex') as c
  from generate_series(1, 720) as i
)
select
  i,
  (get_byte(a, 0) * 256 + get_byte(a, 1)) / 65536.0 as u_src,
  (get_byte(a, 2) * 256 + get_byte(a, 3)) / 65536.0 as u_len,
  (get_byte(a, 4) * 256 + get_byte(a, 5)) / 65536.0 as u_hold,
  (get_byte(a, 6) * 256 + get_byte(a, 7)) / 65536.0 as u_phone,
  (get_byte(a, 8) * 256 + get_byte(a, 9)) / 65536.0 as u_room,
  (get_byte(a, 10) * 256 + get_byte(a, 11)) / 65536.0 as u_guests,
  (get_byte(a, 12) * 256 + get_byte(a, 13)) / 65536.0 as u_lead,
  (get_byte(b, 0) * 256 + get_byte(b, 1)) / 65536.0 as u_view,
  (get_byte(b, 2) * 256 + get_byte(b, 3)) / 65536.0 as u_buy,
  (get_byte(b, 4) * 256 + get_byte(b, 5)) / 65536.0 as u_offer,
  (get_byte(b, 6) * 256 + get_byte(b, 7)) / 65536.0 as u_second,
  (get_byte(b, 8) * 256 + get_byte(b, 9)) / 65536.0 as u_offer2,
  (get_byte(c, 0) * 256 + get_byte(c, 1)) / 65536.0 as u_desk,
  (get_byte(c, 2) * 256 + get_byte(c, 3)) / 65536.0 as u_deskitem,
  (get_byte(c, 4) * 256 + get_byte(c, 5)) / 65536.0 as u_capture,
  (get_byte(c, 6) * 256 + get_byte(c, 7)) / 65536.0 as u_prearr
from seeds;

create table pilot_stays as
select
  d.*,
  'res_p' || lpad(i::text, 4, '0') as res_id,
  'p' || lpad(i::text, 4, '0') as token,
  case
    when u_src < 0.45 then 'Booking.com'
    when u_src < 0.65 then 'Expedia'
    when u_src < 0.75 then 'Agoda'
    else 'Direct'
  end as source,
  case
    when u_len < 0.30 then 1
    when u_len < 0.70 then 2
    when u_len < 0.90 then 3
    else 4
  end as nights,
  case
    when u_room < 0.45 then 'rt_standard'
    when u_room < 0.82 then 'rt_deluxe'
    else 'rt_suite'
  end as room_type_id,
  case when u_guests < 0.3 then 1 else 2 end as guests,
  u_hold < 0.20 as holdout,
  case
    when u_phone < 0.78 then 'valid'
    when u_phone < 0.88 then 'placeholder'
    else 'none'
  end as phone_kind,
  (CURRENT_DATE - 60) + ((i - 1) * 55 / 720) as arrival
from pilot_draws d;

alter table pilot_stays add column email_kind text;
update pilot_stays set email_kind = case
  when source = 'Direct' then 'real'
  when source = 'Agoda' and u_phone > 0.5 then 'none'
  when u_phone > 0.9 then 'none'
  else 'masked'
end;

alter table pilot_stays add column reachable boolean;
update pilot_stays set reachable = (email_kind <> 'none' or phone_kind = 'valid');

alter table pilot_stays add column viewed boolean;
update pilot_stays set viewed = (not holdout and reachable and u_view < 0.55);

alter table pilot_stays add column guest_name text;
update pilot_stays set guest_name =
  (array['Ava','Ben','Chloe','Daniel','Elif','Felix','Grace','Hugo','Isla','Jonas',
         'Kira','Leo','Mila','Nate','Olga','Pablo','Quinn','Rosa','Sven','Tara'])[1 + (i * 7) % 20]
  || ' ' ||
  (array['Adler','Brooks','Castro','Dubois','Evans','Fischer','Garcia','Hughes','Ito','Jensen',
         'Kowalski','Lopez','Moreau','Novak','Okafor','Patel','Quint','Rossi','Silva','Tanaka'])[1 + (i * 13) % 20];

insert into reservations (
  id, property_id, booking_ref, source, guest_name, arrival, departure,
  room_type_id, guests, token, email_kind, phone_kind, consent, notes, created_at, holdout
)
select
  res_id,
  'marlowe',
  case source
    when 'Booking.com' then 'BK-'
    when 'Expedia' then 'EX-'
    when 'Agoda' then 'AG-'
    else 'DIR-'
  end || (500000 + i)::text,
  source,
  guest_name,
  arrival,
  arrival + nights,
  room_type_id,
  guests,
  token,
  email_kind,
  phone_kind,
  case when source = 'Direct' then 'marketing' else 'transactional' end,
  'Pilot history',
  arrival::timestamptz - make_interval(days => 3 + floor(u_lead * 37)::int),
  holdout
from pilot_stays
on conflict (id) do nothing;

-- Offer page views (treatment only — holdout guests never see offers).
insert into events (reservation_id, kind, created_at)
select res_id, 'view', arrival::timestamptz - interval '5 days' + make_interval(hours => (i % 12))
from pilot_stays
where viewed;

-- Page purchases: buyers are ~14.5% of viewers; ~15% of buyers add a second item.
create table pilot_orders (
  res_id text,
  offer_id text,
  channel text,
  slot integer,
  paid_at timestamptz,
  for_date date
);

insert into pilot_orders (res_id, offer_id, channel, slot, paid_at, for_date)
select
  res_id,
  case
    when u_offer < 0.30 then 'off_breakfast'
    when u_offer < 0.48 then 'off_late'
    when u_offer < 0.62 then case when room_type_id = 'rt_standard' then 'off_upgrade' else 'off_breakfast' end
    when u_offer < 0.74 then 'off_early'
    when u_offer < 0.84 then 'off_parking'
    when u_offer < 0.93 then 'off_transfer'
    else 'off_spa'
  end,
  'guest_page',
  1,
  arrival::timestamptz - interval '5 days' + make_interval(hours => (i % 12), mins => 7),
  arrival
from pilot_stays
where viewed and u_buy < 0.145;

insert into pilot_orders (res_id, offer_id, channel, slot, paid_at, for_date)
select
  s.res_id,
  case
    when s.u_offer2 < 0.35 then 'off_transfer'
    when s.u_offer2 < 0.65 then 'off_spa'
    else 'off_parking'
  end,
  'guest_page',
  2,
  s.arrival::timestamptz - interval '2 days',
  s.arrival
from pilot_stays s
join pilot_orders o on o.res_id = s.res_id and o.slot = 1
where s.u_second < 0.15
  and o.offer_id not in ('off_transfer', 'off_spa', 'off_parking');

-- Desk sales happen for everyone; the holdout buys more at the desk because
-- nothing was offered before arrival. This is the baseline the lift is net of.
insert into pilot_orders (res_id, offer_id, channel, slot, paid_at, for_date)
select
  res_id,
  case
    when u_deskitem < 0.45 then 'off_breakfast'
    when u_deskitem < 0.80 then 'off_late'
    else 'off_parking'
  end,
  'desk',
  3,
  arrival::timestamptz + interval '18 hours',
  arrival
from pilot_stays
where (holdout and u_desk < 0.045) or (not holdout and u_desk < 0.02);

insert into orders (
  id, reservation_id, offer_id, qty, amount_cents, status, for_date, for_time,
  created_at, decided_at, channel, paid_at
)
select
  'ord_' || o.res_id || '_' || o.slot,
  o.res_id,
  o.offer_id,
  case when f.price_unit in ('night', 'person_night') then s.nights else 1 end,
  case f.price_unit
    when 'night' then f.price_cents * s.nights
    when 'person' then f.price_cents * s.guests
    when 'person_night' then f.price_cents * s.guests * s.nights
    else f.price_cents
  end,
  'fulfilled',
  case when o.offer_id = 'off_late' then s.arrival + s.nights else o.for_date end,
  null,
  o.paid_at,
  case when f.auto_approve then null else o.paid_at + interval '3 hours' end,
  o.channel,
  case when f.auto_approve then o.paid_at else o.paid_at + interval '3 hours' end
from pilot_orders o
join pilot_stays s on s.res_id = o.res_id
join offers f on f.id = o.offer_id
on conflict (id) do nothing;

insert into events (reservation_id, offer_id, kind, created_at)
select res_id, offer_id, 'purchase', paid_at
from pilot_orders
where channel = 'guest_page';

-- Messages: every reachable booking gets the check-in link (holdout included —
-- check-in is a service, not an offer). Half of treatment guests also get the
-- arrival-details message. WhatsApp when a valid phone exists, else email.
insert into messages (id, reservation_id, recipe_id, channel, subject, status, sent_at, kind, cost_cents)
select
  'msg_' || res_id || '_1',
  res_id,
  'rec_booking',
  case when phone_kind = 'valid' then 'whatsapp' else 'email' end,
  'Check in online for your stay',
  'sent',
  arrival::timestamptz - interval '6 days',
  'utility',
  case when phone_kind = 'valid' then 0.9 else 0 end
from pilot_stays
where reachable
on conflict (id) do nothing;

insert into messages (id, reservation_id, recipe_id, channel, subject, status, sent_at, kind, cost_cents)
select
  'msg_' || res_id || '_2',
  res_id,
  'rec_prearrival',
  case when phone_kind = 'valid' then 'whatsapp' else 'email' end,
  'Arrival details',
  'sent',
  arrival::timestamptz - interval '3 days',
  'utility',
  case when phone_kind = 'valid' then 0.9 else 0 end
from pilot_stays
where reachable and not holdout and u_prearr < 0.5
on conflict (id) do nothing;

-- Online check-in, with the real-email capture step for masked OTA guests.
insert into checkins (reservation_id, eta, real_email_captured, completed_at)
select
  res_id,
  lpad((13 + (i % 6))::text, 2, '0') || ':00',
  email_kind = 'masked' and u_capture < 0.35,
  arrival::timestamptz - interval '1 day'
from pilot_stays
where reachable and u_view < 0.55
on conflict (reservation_id) do nothing;

drop table pilot_orders;
drop table pilot_stays;
drop table pilot_draws;
