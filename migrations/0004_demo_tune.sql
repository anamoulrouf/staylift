-- Enough offer-page views that conversion cannot exceed 100%.
insert into events (reservation_id, kind, created_at)
select r.id, 'view', now() - interval '1 day'
from reservations r
where not exists (
  select 1 from events e where e.reservation_id = r.id and e.kind = 'view'
);
