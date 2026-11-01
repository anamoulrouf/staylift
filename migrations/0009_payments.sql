-- Stripe Checkout: the session behind a guest payment, kept on the order so the
-- return can be verified, an abandoned checkout retried, and a desk decline (or
-- a goodwill call) refunded against the real payment intent.
alter table orders add column if not exists checkout_session_id text;
alter table orders add column if not exists stripe_payment_intent text;
alter table orders add column if not exists checkout_expires_at timestamptz;

create index if not exists orders_checkout_session_idx on orders (checkout_session_id)
  where checkout_session_id is not null;
