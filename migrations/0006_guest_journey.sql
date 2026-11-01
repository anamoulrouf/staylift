-- Guest journey: OTA booking → personalised booking email → personalised stay
-- page → offer booked → hotelier dashboard. This migration adds the
-- attribution columns that connect those steps, and backfills the pilot.

-- Where a stay-page visit / an order came from: 'email', 'whatsapp', 'sms', or null (direct).
alter table events add column if not exists source text;
alter table orders add column if not exists source text;

-- The booking email is a recipe like the others; make its copy match what it now does.
update recipes set
  summary = 'Email: confirmation, online check-in and the 3 offers picked for this stay. Phone: check-in link only.',
  offer_ids = 'off_upgrade,off_breakfast,off_transfer'
where id = 'rec_booking';

-- Demo book: give the personalisation rules something to read.
update reservations set notes = 'Celebrating an anniversary. Flying in from Denver.' where id = 'res_elena';
update reservations set notes = 'Driving from Houston.' where id = 'res_noah';

-- Demo guests who already received a booking email.
insert into messages (id, reservation_id, recipe_id, channel, subject, status, sent_at, kind, cost_cents)
values
  ('msg_maya_email', 'res_maya', 'rec_booking', 'email', 'Maya, your Austin stay is confirmed', 'sent', now() - interval '6 hours', 'booking_light', 0),
  ('msg_elena_email', 'res_elena', 'rec_booking', 'email', 'Elena, your Austin stay is confirmed', 'sent', now() - interval '3 hours', 'booking_full', 0),
  ('msg_priya_email', 'res_priya', 'rec_booking', 'email', 'Priya, your Austin stay is confirmed', 'sent', now() - interval '5 days', 'booking_full', 0)
on conflict (id) do nothing;
update events set source = 'email' where kind = 'view' and reservation_id in ('res_elena', 'res_maya');

-- ---------------------------------------------------------------------------
-- Pilot backfill. Every pilot booking with an email address got the booking
-- email a few minutes after it landed (holdout: service-only version).
-- ---------------------------------------------------------------------------
insert into messages (id, reservation_id, recipe_id, channel, subject, status, sent_at, kind, cost_cents)
select
  'msg_' || r.id || '_booking',
  r.id,
  'rec_booking',
  'email',
  split_part(r.guest_name, ' ', 1) || ', your Austin stay is confirmed',
  'sent',
  r.created_at + interval '4 minutes',
  case
    when r.holdout then 'booking_service'
    when r.email_kind = 'masked' then 'booking_light'
    else 'booking_full'
  end,
  0
from reservations r
where r.notes = 'Pilot history' and r.email_kind <> 'none'
on conflict (id) do nothing;

-- Which channel brought each pilot guest to the stay page: about 3 in 5 came
-- from the booking email; the rest from the WhatsApp check-in link.
update events e set source = case
    when r.email_kind <> 'none'
      and (r.phone_kind <> 'valid'
           or (get_byte(decode(md5('src-' || r.id), 'hex'), 0) / 256.0) < 0.62)
      then 'email'
    when r.phone_kind = 'valid' then 'whatsapp'
    else null
  end
from reservations r
where e.reservation_id = r.id and e.kind = 'view' and r.notes = 'Pilot history';

-- Orders inherit the source of the visit that produced them.
update orders o set source = (
    select e.source from events e
    where e.reservation_id = o.reservation_id and e.kind = 'view'
    order by e.created_at limit 1
  )
where o.channel = 'guest_page'
  and o.reservation_id in (select id from reservations where notes = 'Pilot history');
