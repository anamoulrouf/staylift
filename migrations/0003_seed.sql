-- Demo property: The Marlowe, 42-room independent boutique (Austin).
-- Dates are relative to CURRENT_DATE so the desk always looks live.

insert into properties (id, name, city, rooms, occupancy_pct, avg_stay_nights, tagline)
values (
  'marlowe',
  'The Marlowe',
  'Austin',
  42,
  62,
  2.1,
  'A 42-room independent house in the heart of Austin.'
)
on conflict (id) do nothing;

insert into room_types (id, property_id, name, nightly_cents, inventory)
values
  ('rt_standard', 'marlowe', 'Standard Queen', 18900, 18),
  ('rt_deluxe', 'marlowe', 'Deluxe Courtyard', 24900, 16),
  ('rt_suite', 'marlowe', 'Marlowe Suite', 32900, 8)
on conflict (id) do nothing;

insert into offers (
  id, property_id, name, short_label, description, category,
  price_cents, price_unit, inventory, cutoff_hours, auto_approve,
  owner_type, active, from_room_type_id, to_room_type_id, sort_order
)
values
  (
    'off_upgrade', 'marlowe', 'Upgrade your room', 'Deluxe Courtyard',
    'More space, a courtyard window, and a soaking tub. Available until 3 hours before arrival.',
    'upgrade', 4000, 'night', 3, 3, false, 'HOTEL', true,
    'rt_standard', 'rt_deluxe', 1
  ),
  (
    'off_breakfast', 'marlowe', 'Breakfast for two', 'House kitchen',
    'Slow eggs, seasonal fruit, and pour-over coffee in the courtyard. Served 7:30–10:30.',
    'breakfast', 2400, 'night', null, 12, true, 'HOTEL', true, null, null, 2
  ),
  (
    'off_late', 'marlowe', 'Late checkout', 'Until 2:00 PM',
    'Keep the room until two. Auto-approved when inventory allows.',
    'late_checkout', 3000, 'stay', 20, 24, true, 'HOTEL', true, null, null, 3
  ),
  (
    'off_early', 'marlowe', 'Early check-in', 'From 12:00 PM',
    'Drop bags and settle in at noon instead of three.',
    'early_checkin', 2500, 'stay', 12, 12, true, 'HOTEL', true, null, null, 4
  ),
  (
    'off_parking', 'marlowe', 'Secure parking', 'Covered spot',
    'A reserved space in the house garage, in and out as you like.',
    'parking', 1800, 'night', 8, 6, true, 'HOTEL', true, null, null, 5
  ),
  (
    'off_spa', 'marlowe', 'Relax at the spa', '60-minute treatment',
    'A quiet treatment room off the courtyard. Choose massage or facial at check-in.',
    'spa', 7500, 'stay', 6, 6, false, 'HOTEL', true, null, null, 6
  ),
  (
    'off_transfer', 'marlowe', 'Airport transfer', 'AUS, one way',
    'A private car timed to your flight. Driver waits 45 minutes.',
    'transfer', 4500, 'stay', null, 24, true, 'HOTEL', true, null, null, 7
  )
on conflict (id) do nothing;

insert into recipes (
  id, property_id, name, summary, trigger_event, offset_hours, offer_ids, active, sort_order
)
values
  (
    'rec_booking', 'marlowe', 'New booking',
    'Right after the reservation lands: upgrade, breakfast, airport transfer.',
    'booking_created', 24, 'off_upgrade,off_breakfast,off_transfer', true, 1
  ),
  (
    'rec_prearrival', 'marlowe', 'Pre-arrival',
    'Three days out: breakfast, spa, transfer.',
    'days_before_arrival', -72, 'off_breakfast,off_spa,off_transfer', true, 2
  ),
  (
    'rec_checkin', 'marlowe', 'Online check-in',
    'The revenue gateway: upgrade, early check-in, breakfast.',
    'online_checkin', 0, 'off_upgrade,off_early,off_breakfast', true, 3
  ),
  (
    'rec_arrival', 'marlowe', 'Arrival day',
    'Same-day: kitchen, spa, parking.',
    'arrival_day', 0, 'off_breakfast,off_spa,off_parking', true, 4
  ),
  (
    'rec_instay', 'marlowe', 'In-stay',
    'During the stay: dinner, spa, late checkout.',
    'in_stay', 24, 'off_spa,off_late,off_breakfast', true, 5
  ),
  (
    'rec_depart', 'marlowe', 'Departure',
    'The night before: late checkout, breakfast, transfer.',
    'departure', -24, 'off_late,off_breakfast,off_transfer', true, 6
  )
on conflict (id) do nothing;

insert into reservations (
  id, property_id, booking_ref, source, guest_name, arrival, departure,
  room_type_id, guests, token, email_kind, phone_kind, consent, notes, created_at
)
values
  (
    'res_maya', 'marlowe', 'BK-441902', 'Booking.com', 'Maya Chen',
    CURRENT_DATE + 12, CURRENT_DATE + 15, 'rt_standard', 2, 'maya',
    'masked', 'valid', 'transactional', 'OTA booking. Wants a quiet room.',
    now() - interval '6 hours'
  ),
  (
    'res_james', 'marlowe', 'DIR-1184', 'Direct', 'James Whit',
    CURRENT_DATE, CURRENT_DATE + 3, 'rt_deluxe', 2, 'james',
    'real', 'valid', 'marketing', 'Anniversary. Direct website.',
    now() - interval '14 days'
  ),
  (
    'res_sofia', 'marlowe', 'EX-88311', 'Expedia', 'Sofia Alves',
    CURRENT_DATE - 2, CURRENT_DATE + 1, 'rt_suite', 2, 'sofia',
    'masked', 'valid', 'transactional', '',
    now() - interval '21 days'
  ),
  (
    'res_noah', 'marlowe', 'BK-442017', 'Booking.com', 'Noah Park',
    CURRENT_DATE + 3, CURRENT_DATE + 5, 'rt_standard', 1, 'noah',
    'masked', 'valid', 'transactional', 'Solo, arriving late.',
    now() - interval '2 days'
  ),
  (
    'res_elena', 'marlowe', 'DIR-1199', 'Direct', 'Elena Rossi',
    CURRENT_DATE + 16, CURRENT_DATE + 19, 'rt_deluxe', 2, 'elena',
    'real', 'valid', 'marketing', '',
    now() - interval '3 hours'
  ),
  (
    'res_theo', 'marlowe', 'AG-22091', 'Agoda', 'Theo March',
    CURRENT_DATE - 1, CURRENT_DATE + 2, 'rt_standard', 2, 'theo',
    'masked', 'valid', 'transactional', '',
    now() - interval '18 days'
  ),
  (
    'res_amina', 'marlowe', 'BK-442108', 'Booking.com', 'Amina Diallo',
    CURRENT_DATE, CURRENT_DATE + 2, 'rt_deluxe', 1, 'amina',
    'masked', 'valid', 'none', 'Phone captured at booking.',
    now() - interval '9 days'
  ),
  (
    'res_callum', 'marlowe', 'EX-88402', 'Expedia', 'Callum Reid',
    CURRENT_DATE + 6, CURRENT_DATE + 8, 'rt_standard', 2, 'callum',
    'masked', 'placeholder', 'none', 'Masked email and placeholder phone.',
    now() - interval '1 day'
  ),
  (
    'res_priya', 'marlowe', 'DIR-1204', 'Direct', 'Priya Shah',
    CURRENT_DATE + 1, CURRENT_DATE + 4, 'rt_suite', 2, 'priya',
    'real', 'valid', 'marketing', '',
    now() - interval '5 days'
  ),
  (
    'res_luca', 'marlowe', 'BK-441610', 'Booking.com', 'Luca Moretti',
    CURRENT_DATE - 4, CURRENT_DATE, 'rt_deluxe', 2, 'luca',
    'real', 'valid', 'transactional', 'Email captured at check-in.',
    now() - interval '26 days'
  ),
  (
    'res_henri', 'marlowe', 'DIR-1160', 'Direct', 'Henri Cole',
    CURRENT_DATE - 11, CURRENT_DATE - 9, 'rt_standard', 2, 'henri',
    'real', 'valid', 'marketing', '',
    now() - interval '30 days'
  ),
  (
    'res_jade', 'marlowe', 'BK-440882', 'Booking.com', 'Jade Nguyen',
    CURRENT_DATE - 8, CURRENT_DATE - 6, 'rt_deluxe', 2, 'jade',
    'real', 'valid', 'transactional', 'Email captured at check-in.',
    now() - interval '22 days'
  ),
  (
    'res_owen', 'marlowe', 'EX-87990', 'Expedia', 'Owen Blake',
    CURRENT_DATE + 9, CURRENT_DATE + 11, 'rt_standard', 1, 'owen',
    'masked', 'valid', 'transactional', '',
    now() - interval '8 hours'
  ),
  (
    'res_iris', 'marlowe', 'DIR-1210', 'Direct', 'Iris Holm',
    CURRENT_DATE - 3, CURRENT_DATE - 1, 'rt_suite', 2, 'iris',
    'real', 'valid', 'marketing', '',
    now() - interval '19 days'
  )
on conflict (id) do nothing;

insert into orders (
  id, reservation_id, offer_id, qty, amount_cents, status, for_date, for_time, created_at, decided_at
)
values
  (
    'ord_james_bf', 'res_james', 'off_breakfast', 3, 7200, 'paid',
    CURRENT_DATE, '08:00', now() - interval '2 days', now() - interval '2 days'
  ),
  (
    'ord_theo_spa', 'res_theo', 'off_spa', 1, 7500, 'pending_approval',
    CURRENT_DATE + 1, '15:00', now() - interval '4 hours', null
  ),
  (
    'ord_sofia_late', 'res_sofia', 'off_late', 1, 3000, 'pending_approval',
    CURRENT_DATE + 1, '14:00', now() - interval '90 minutes', null
  ),
  (
    'ord_luca_late', 'res_luca', 'off_late', 1, 3000, 'paid',
    CURRENT_DATE, '14:00', now() - interval '18 hours', now() - interval '16 hours'
  ),
  (
    'ord_henri_up', 'res_henri', 'off_upgrade', 2, 8000, 'paid',
    CURRENT_DATE - 11, null, now() - interval '28 days', now() - interval '27 days'
  ),
  (
    'ord_henri_pk', 'res_henri', 'off_parking', 2, 3600, 'paid',
    CURRENT_DATE - 11, null, now() - interval '28 days', now() - interval '28 days'
  ),
  (
    'ord_jade_bf', 'res_jade', 'off_breakfast', 2, 4800, 'paid',
    CURRENT_DATE - 8, '08:30', now() - interval '20 days', now() - interval '20 days'
  ),
  (
    'ord_jade_spa', 'res_jade', 'off_spa', 1, 7500, 'paid',
    CURRENT_DATE - 7, '16:00', now() - interval '19 days', now() - interval '19 days'
  ),
  (
    'ord_iris_tr', 'res_iris', 'off_transfer', 1, 4500, 'paid',
    CURRENT_DATE - 3, '11:00', now() - interval '12 days', now() - interval '12 days'
  ),
  (
    'ord_amina_early', 'res_amina', 'off_early', 1, 2500, 'paid',
    CURRENT_DATE, '12:00', now() - interval '1 day', now() - interval '1 day'
  )
on conflict (id) do nothing;

insert into messages (id, reservation_id, recipe_id, channel, subject, status, sent_at)
values
  ('msg_maya_1', 'res_maya', 'rec_booking', 'sms', 'Your stay at The Marlowe', 'sent', now() - interval '5 hours'),
  ('msg_noah_1', 'res_noah', 'rec_prearrival', 'whatsapp', 'Three days until Austin', 'sent', now() - interval '6 hours'),
  ('msg_james_1', 'res_james', 'rec_checkin', 'email', 'Complete check-in', 'sent', now() - interval '2 days'),
  ('msg_amina_1', 'res_amina', 'rec_arrival', 'sms', 'Welcome — a few extras', 'sent', now() - interval '8 hours'),
  ('msg_sofia_1', 'res_sofia', 'rec_depart', 'whatsapp', 'Need a later checkout?', 'sent', now() - interval '2 hours'),
  ('msg_elena_1', 'res_elena', 'rec_booking', 'email', 'Enhance your stay', 'sent', now() - interval '2 hours'),
  ('msg_callum_1', 'res_callum', 'rec_booking', 'email', 'Your stay at The Marlowe (OTA relay)', 'bounced', now() - interval '20 hours')
on conflict (id) do nothing;

insert into events (reservation_id, offer_id, kind, created_at)
values
  ('res_maya', null, 'view', now() - interval '4 hours'),
  ('res_james', 'off_breakfast', 'purchase', now() - interval '2 days'),
  ('res_james', null, 'view', now() - interval '2 days'),
  ('res_sofia', 'off_late', 'purchase', now() - interval '90 minutes'),
  ('res_sofia', null, 'view', now() - interval '2 hours'),
  ('res_theo', 'off_spa', 'purchase', now() - interval '4 hours'),
  ('res_theo', null, 'view', now() - interval '5 hours'),
  ('res_luca', 'off_late', 'purchase', now() - interval '18 hours'),
  ('res_luca', null, 'email_captured', now() - interval '4 days'),
  ('res_henri', 'off_upgrade', 'purchase', now() - interval '28 days'),
  ('res_henri', 'off_parking', 'purchase', now() - interval '28 days'),
  ('res_jade', 'off_breakfast', 'purchase', now() - interval '20 days'),
  ('res_jade', 'off_spa', 'purchase', now() - interval '19 days'),
  ('res_jade', null, 'email_captured', now() - interval '8 days'),
  ('res_iris', 'off_transfer', 'purchase', now() - interval '12 days'),
  ('res_amina', 'off_early', 'purchase', now() - interval '1 day'),
  ('res_noah', null, 'view', now() - interval '5 hours'),
  ('res_elena', null, 'view', now() - interval '1 hour')
on conflict do nothing;

insert into checkins (reservation_id, eta, real_email_captured, completed_at)
values
  ('res_james', '14:30', true, now() - interval '8 hours'),
  ('res_luca', '15:00', true, now() - interval '4 days'),
  ('res_jade', '13:00', true, now() - interval '8 days'),
  ('res_amina', '12:10', false, now() - interval '3 hours')
on conflict (reservation_id) do nothing;
