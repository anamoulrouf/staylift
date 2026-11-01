import { a as nightsBetween } from "./format-BLHOf1yn.mjs";
import { n as TSS_SERVER_FUNCTION, t as createServerFn } from "./ssr.mjs";
import { a as object, i as number, n as boolean, o as string, t as _enum } from "../_libs/zod.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/server-Bz_0TPY5.js
var createServerRpc = (serverFnMeta, splitImportFn) => {
	const url = "/_serverFn/" + serverFnMeta.id;
	return Object.assign(splitImportFn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
var _0002_schema_default = "-- Staylift core: single-property concierge MVP (unowned demo rows)\n\ncreate table if not exists properties (\n  id text primary key,\n  name text not null,\n  city text not null,\n  rooms integer not null,\n  occupancy_pct integer not null,\n  avg_stay_nights numeric not null,\n  tagline text not null\n);\n\ncreate table if not exists room_types (\n  id text primary key,\n  property_id text not null references properties (id),\n  name text not null,\n  nightly_cents integer not null,\n  inventory integer not null\n);\n\ncreate table if not exists offers (\n  id text primary key,\n  property_id text not null references properties (id),\n  name text not null,\n  short_label text not null,\n  description text not null,\n  category text not null,\n  price_cents integer not null,\n  price_unit text not null,\n  inventory integer,\n  cutoff_hours integer,\n  auto_approve boolean not null default true,\n  owner_type text not null default 'HOTEL',\n  active boolean not null default true,\n  from_room_type_id text,\n  to_room_type_id text,\n  sort_order integer not null default 0\n);\n\ncreate table if not exists recipes (\n  id text primary key,\n  property_id text not null references properties (id),\n  name text not null,\n  summary text not null,\n  trigger_event text not null,\n  offset_hours integer not null default 0,\n  offer_ids text not null,\n  active boolean not null default true,\n  sort_order integer not null default 0\n);\n\ncreate table if not exists reservations (\n  id text primary key,\n  property_id text not null references properties (id),\n  booking_ref text not null,\n  source text not null,\n  guest_name text not null,\n  arrival date not null,\n  departure date not null,\n  room_type_id text not null references room_types (id),\n  guests integer not null,\n  token text not null unique,\n  email_kind text not null,\n  phone_kind text not null,\n  consent text not null default 'transactional',\n  notes text not null default '',\n  created_at timestamptz not null default now()\n);\n\ncreate index if not exists reservations_arrival_idx on reservations (arrival);\ncreate index if not exists reservations_token_idx on reservations (token);\n\ncreate table if not exists orders (\n  id text primary key,\n  reservation_id text not null references reservations (id),\n  offer_id text not null references offers (id),\n  qty integer not null default 1,\n  amount_cents integer not null,\n  status text not null,\n  for_date date,\n  for_time text,\n  created_at timestamptz not null default now(),\n  decided_at timestamptz\n);\n\ncreate index if not exists orders_reservation_idx on orders (reservation_id);\ncreate index if not exists orders_status_idx on orders (status);\n\ncreate table if not exists messages (\n  id text primary key,\n  reservation_id text not null references reservations (id),\n  recipe_id text,\n  channel text not null,\n  subject text not null,\n  status text not null default 'sent',\n  sent_at timestamptz not null default now()\n);\n\ncreate table if not exists events (\n  id serial primary key,\n  reservation_id text not null references reservations (id),\n  offer_id text,\n  kind text not null,\n  created_at timestamptz not null default now()\n);\n\ncreate table if not exists checkins (\n  reservation_id text primary key references reservations (id),\n  eta text,\n  real_email_captured boolean not null default false,\n  completed_at timestamptz\n);\n";
var _0003_seed_default = "-- Demo property: The Marlowe, 42-room independent boutique (Austin).\n-- Dates are relative to CURRENT_DATE so the desk always looks live.\n\ninsert into properties (id, name, city, rooms, occupancy_pct, avg_stay_nights, tagline)\nvalues (\n  'marlowe',\n  'The Marlowe',\n  'Austin',\n  42,\n  62,\n  2.1,\n  'A 42-room independent house in the heart of Austin.'\n)\non conflict (id) do nothing;\n\ninsert into room_types (id, property_id, name, nightly_cents, inventory)\nvalues\n  ('rt_standard', 'marlowe', 'Standard Queen', 18900, 18),\n  ('rt_deluxe', 'marlowe', 'Deluxe Courtyard', 24900, 16),\n  ('rt_suite', 'marlowe', 'Marlowe Suite', 32900, 8)\non conflict (id) do nothing;\n\ninsert into offers (\n  id, property_id, name, short_label, description, category,\n  price_cents, price_unit, inventory, cutoff_hours, auto_approve,\n  owner_type, active, from_room_type_id, to_room_type_id, sort_order\n)\nvalues\n  (\n    'off_upgrade', 'marlowe', 'Upgrade your room', 'Deluxe Courtyard',\n    'More space, a courtyard window, and a soaking tub. Available until 3 hours before arrival.',\n    'upgrade', 4000, 'night', 3, 3, false, 'HOTEL', true,\n    'rt_standard', 'rt_deluxe', 1\n  ),\n  (\n    'off_breakfast', 'marlowe', 'Breakfast for two', 'House kitchen',\n    'Slow eggs, seasonal fruit, and pour-over coffee in the courtyard. Served 7:30–10:30.',\n    'breakfast', 2400, 'night', null, 12, true, 'HOTEL', true, null, null, 2\n  ),\n  (\n    'off_late', 'marlowe', 'Late checkout', 'Until 2:00 PM',\n    'Keep the room until two. Auto-approved when inventory allows.',\n    'late_checkout', 3000, 'stay', 20, 24, true, 'HOTEL', true, null, null, 3\n  ),\n  (\n    'off_early', 'marlowe', 'Early check-in', 'From 12:00 PM',\n    'Drop bags and settle in at noon instead of three.',\n    'early_checkin', 2500, 'stay', 12, 12, true, 'HOTEL', true, null, null, 4\n  ),\n  (\n    'off_parking', 'marlowe', 'Secure parking', 'Covered spot',\n    'A reserved space in the house garage, in and out as you like.',\n    'parking', 1800, 'night', 8, 6, true, 'HOTEL', true, null, null, 5\n  ),\n  (\n    'off_spa', 'marlowe', 'Relax at the spa', '60-minute treatment',\n    'A quiet treatment room off the courtyard. Choose massage or facial at check-in.',\n    'spa', 7500, 'stay', 6, 6, false, 'HOTEL', true, null, null, 6\n  ),\n  (\n    'off_transfer', 'marlowe', 'Airport transfer', 'AUS, one way',\n    'A private car timed to your flight. Driver waits 45 minutes.',\n    'transfer', 4500, 'stay', null, 24, true, 'HOTEL', true, null, null, 7\n  )\non conflict (id) do nothing;\n\ninsert into recipes (\n  id, property_id, name, summary, trigger_event, offset_hours, offer_ids, active, sort_order\n)\nvalues\n  (\n    'rec_booking', 'marlowe', 'New booking',\n    'Right after the reservation lands: upgrade, breakfast, airport transfer.',\n    'booking_created', 24, 'off_upgrade,off_breakfast,off_transfer', true, 1\n  ),\n  (\n    'rec_prearrival', 'marlowe', 'Pre-arrival',\n    'Three days out: breakfast, spa, transfer.',\n    'days_before_arrival', -72, 'off_breakfast,off_spa,off_transfer', true, 2\n  ),\n  (\n    'rec_checkin', 'marlowe', 'Online check-in',\n    'The revenue gateway: upgrade, early check-in, breakfast.',\n    'online_checkin', 0, 'off_upgrade,off_early,off_breakfast', true, 3\n  ),\n  (\n    'rec_arrival', 'marlowe', 'Arrival day',\n    'Same-day: kitchen, spa, parking.',\n    'arrival_day', 0, 'off_breakfast,off_spa,off_parking', true, 4\n  ),\n  (\n    'rec_instay', 'marlowe', 'In-stay',\n    'During the stay: dinner, spa, late checkout.',\n    'in_stay', 24, 'off_spa,off_late,off_breakfast', true, 5\n  ),\n  (\n    'rec_depart', 'marlowe', 'Departure',\n    'The night before: late checkout, breakfast, transfer.',\n    'departure', -24, 'off_late,off_breakfast,off_transfer', true, 6\n  )\non conflict (id) do nothing;\n\ninsert into reservations (\n  id, property_id, booking_ref, source, guest_name, arrival, departure,\n  room_type_id, guests, token, email_kind, phone_kind, consent, notes, created_at\n)\nvalues\n  (\n    'res_maya', 'marlowe', 'BK-441902', 'Booking.com', 'Maya Chen',\n    CURRENT_DATE + 12, CURRENT_DATE + 15, 'rt_standard', 2, 'maya',\n    'masked', 'valid', 'transactional', 'OTA booking. Wants a quiet room.',\n    now() - interval '6 hours'\n  ),\n  (\n    'res_james', 'marlowe', 'DIR-1184', 'Direct', 'James Whit',\n    CURRENT_DATE, CURRENT_DATE + 3, 'rt_deluxe', 2, 'james',\n    'real', 'valid', 'marketing', 'Anniversary. Direct website.',\n    now() - interval '14 days'\n  ),\n  (\n    'res_sofia', 'marlowe', 'EX-88311', 'Expedia', 'Sofia Alves',\n    CURRENT_DATE - 2, CURRENT_DATE + 1, 'rt_suite', 2, 'sofia',\n    'masked', 'valid', 'transactional', '',\n    now() - interval '21 days'\n  ),\n  (\n    'res_noah', 'marlowe', 'BK-442017', 'Booking.com', 'Noah Park',\n    CURRENT_DATE + 3, CURRENT_DATE + 5, 'rt_standard', 1, 'noah',\n    'masked', 'valid', 'transactional', 'Solo, arriving late.',\n    now() - interval '2 days'\n  ),\n  (\n    'res_elena', 'marlowe', 'DIR-1199', 'Direct', 'Elena Rossi',\n    CURRENT_DATE + 16, CURRENT_DATE + 19, 'rt_deluxe', 2, 'elena',\n    'real', 'valid', 'marketing', '',\n    now() - interval '3 hours'\n  ),\n  (\n    'res_theo', 'marlowe', 'AG-22091', 'Agoda', 'Theo March',\n    CURRENT_DATE - 1, CURRENT_DATE + 2, 'rt_standard', 2, 'theo',\n    'masked', 'valid', 'transactional', '',\n    now() - interval '18 days'\n  ),\n  (\n    'res_amina', 'marlowe', 'BK-442108', 'Booking.com', 'Amina Diallo',\n    CURRENT_DATE, CURRENT_DATE + 2, 'rt_deluxe', 1, 'amina',\n    'masked', 'valid', 'none', 'Phone captured at booking.',\n    now() - interval '9 days'\n  ),\n  (\n    'res_callum', 'marlowe', 'EX-88402', 'Expedia', 'Callum Reid',\n    CURRENT_DATE + 6, CURRENT_DATE + 8, 'rt_standard', 2, 'callum',\n    'masked', 'placeholder', 'none', 'Masked email and placeholder phone.',\n    now() - interval '1 day'\n  ),\n  (\n    'res_priya', 'marlowe', 'DIR-1204', 'Direct', 'Priya Shah',\n    CURRENT_DATE + 1, CURRENT_DATE + 4, 'rt_suite', 2, 'priya',\n    'real', 'valid', 'marketing', '',\n    now() - interval '5 days'\n  ),\n  (\n    'res_luca', 'marlowe', 'BK-441610', 'Booking.com', 'Luca Moretti',\n    CURRENT_DATE - 4, CURRENT_DATE, 'rt_deluxe', 2, 'luca',\n    'real', 'valid', 'transactional', 'Email captured at check-in.',\n    now() - interval '26 days'\n  ),\n  (\n    'res_henri', 'marlowe', 'DIR-1160', 'Direct', 'Henri Cole',\n    CURRENT_DATE - 11, CURRENT_DATE - 9, 'rt_standard', 2, 'henri',\n    'real', 'valid', 'marketing', '',\n    now() - interval '30 days'\n  ),\n  (\n    'res_jade', 'marlowe', 'BK-440882', 'Booking.com', 'Jade Nguyen',\n    CURRENT_DATE - 8, CURRENT_DATE - 6, 'rt_deluxe', 2, 'jade',\n    'real', 'valid', 'transactional', 'Email captured at check-in.',\n    now() - interval '22 days'\n  ),\n  (\n    'res_owen', 'marlowe', 'EX-87990', 'Expedia', 'Owen Blake',\n    CURRENT_DATE + 9, CURRENT_DATE + 11, 'rt_standard', 1, 'owen',\n    'masked', 'valid', 'transactional', '',\n    now() - interval '8 hours'\n  ),\n  (\n    'res_iris', 'marlowe', 'DIR-1210', 'Direct', 'Iris Holm',\n    CURRENT_DATE - 3, CURRENT_DATE - 1, 'rt_suite', 2, 'iris',\n    'real', 'valid', 'marketing', '',\n    now() - interval '19 days'\n  )\non conflict (id) do nothing;\n\ninsert into orders (\n  id, reservation_id, offer_id, qty, amount_cents, status, for_date, for_time, created_at, decided_at\n)\nvalues\n  (\n    'ord_james_bf', 'res_james', 'off_breakfast', 3, 7200, 'paid',\n    CURRENT_DATE, '08:00', now() - interval '2 days', now() - interval '2 days'\n  ),\n  (\n    'ord_theo_spa', 'res_theo', 'off_spa', 1, 7500, 'pending_approval',\n    CURRENT_DATE + 1, '15:00', now() - interval '4 hours', null\n  ),\n  (\n    'ord_sofia_late', 'res_sofia', 'off_late', 1, 3000, 'pending_approval',\n    CURRENT_DATE + 1, '14:00', now() - interval '90 minutes', null\n  ),\n  (\n    'ord_luca_late', 'res_luca', 'off_late', 1, 3000, 'paid',\n    CURRENT_DATE, '14:00', now() - interval '18 hours', now() - interval '16 hours'\n  ),\n  (\n    'ord_henri_up', 'res_henri', 'off_upgrade', 2, 8000, 'paid',\n    CURRENT_DATE - 11, null, now() - interval '28 days', now() - interval '27 days'\n  ),\n  (\n    'ord_henri_pk', 'res_henri', 'off_parking', 2, 3600, 'paid',\n    CURRENT_DATE - 11, null, now() - interval '28 days', now() - interval '28 days'\n  ),\n  (\n    'ord_jade_bf', 'res_jade', 'off_breakfast', 2, 4800, 'paid',\n    CURRENT_DATE - 8, '08:30', now() - interval '20 days', now() - interval '20 days'\n  ),\n  (\n    'ord_jade_spa', 'res_jade', 'off_spa', 1, 7500, 'paid',\n    CURRENT_DATE - 7, '16:00', now() - interval '19 days', now() - interval '19 days'\n  ),\n  (\n    'ord_iris_tr', 'res_iris', 'off_transfer', 1, 4500, 'paid',\n    CURRENT_DATE - 3, '11:00', now() - interval '12 days', now() - interval '12 days'\n  ),\n  (\n    'ord_amina_early', 'res_amina', 'off_early', 1, 2500, 'paid',\n    CURRENT_DATE, '12:00', now() - interval '1 day', now() - interval '1 day'\n  )\non conflict (id) do nothing;\n\ninsert into messages (id, reservation_id, recipe_id, channel, subject, status, sent_at)\nvalues\n  ('msg_maya_1', 'res_maya', 'rec_booking', 'sms', 'Your stay at The Marlowe', 'sent', now() - interval '5 hours'),\n  ('msg_noah_1', 'res_noah', 'rec_prearrival', 'whatsapp', 'Three days until Austin', 'sent', now() - interval '6 hours'),\n  ('msg_james_1', 'res_james', 'rec_checkin', 'email', 'Complete check-in', 'sent', now() - interval '2 days'),\n  ('msg_amina_1', 'res_amina', 'rec_arrival', 'sms', 'Welcome — a few extras', 'sent', now() - interval '8 hours'),\n  ('msg_sofia_1', 'res_sofia', 'rec_depart', 'whatsapp', 'Need a later checkout?', 'sent', now() - interval '2 hours'),\n  ('msg_elena_1', 'res_elena', 'rec_booking', 'email', 'Enhance your stay', 'sent', now() - interval '2 hours'),\n  ('msg_callum_1', 'res_callum', 'rec_booking', 'email', 'Your stay at The Marlowe (OTA relay)', 'bounced', now() - interval '20 hours')\non conflict (id) do nothing;\n\ninsert into events (reservation_id, offer_id, kind, created_at)\nvalues\n  ('res_maya', null, 'view', now() - interval '4 hours'),\n  ('res_james', 'off_breakfast', 'purchase', now() - interval '2 days'),\n  ('res_james', null, 'view', now() - interval '2 days'),\n  ('res_sofia', 'off_late', 'purchase', now() - interval '90 minutes'),\n  ('res_sofia', null, 'view', now() - interval '2 hours'),\n  ('res_theo', 'off_spa', 'purchase', now() - interval '4 hours'),\n  ('res_theo', null, 'view', now() - interval '5 hours'),\n  ('res_luca', 'off_late', 'purchase', now() - interval '18 hours'),\n  ('res_luca', null, 'email_captured', now() - interval '4 days'),\n  ('res_henri', 'off_upgrade', 'purchase', now() - interval '28 days'),\n  ('res_henri', 'off_parking', 'purchase', now() - interval '28 days'),\n  ('res_jade', 'off_breakfast', 'purchase', now() - interval '20 days'),\n  ('res_jade', 'off_spa', 'purchase', now() - interval '19 days'),\n  ('res_jade', null, 'email_captured', now() - interval '8 days'),\n  ('res_iris', 'off_transfer', 'purchase', now() - interval '12 days'),\n  ('res_amina', 'off_early', 'purchase', now() - interval '1 day'),\n  ('res_noah', null, 'view', now() - interval '5 hours'),\n  ('res_elena', null, 'view', now() - interval '1 hour')\non conflict do nothing;\n\ninsert into checkins (reservation_id, eta, real_email_captured, completed_at)\nvalues\n  ('res_james', '14:30', true, now() - interval '8 hours'),\n  ('res_luca', '15:00', true, now() - interval '4 days'),\n  ('res_jade', '13:00', true, now() - interval '8 days'),\n  ('res_amina', '12:10', false, now() - interval '3 hours')\non conflict (reservation_id) do nothing;\n";
/**
* Migration bookkeeping shared by the two appliers — `scripts/migrate.mjs`
* (deploy, `readdir`) and `src/lib/db.ts` (PGLite preview, `import.meta.glob`).
*
* Applied files are keyed by BASENAME, so the same file applies once no matter
* which directory it is globbed from. That is what makes the auth schema safe to
* copy from `migrations/auth/` into `migrations/` when an app turns sign-in on:
* a database that already has `0001_auth.sql` will not re-run it.
*
* Neither applier descends into subdirectories, so `migrations/auth/*.sql` is
* out of scope for both until it is copied up.
*/
/**
* The `_migrations` key for a migration path (or bare filename).
* @param {string} path
* @returns {string}
*/
function migrationName(path) {
	return path.split("/").pop() ?? path;
}
/**
* @param {string} path
* @returns {boolean}
*/
function isMigrationFile(path) {
	return path.endsWith(".sql");
}
/**
* Migrations in `paths` that are not yet in `applied`, in apply order.
* Non-`.sql` entries (a `readdir` also yields `migrations/auth/`) are dropped.
* @param {Iterable<string>} paths
* @param {Iterable<string>} applied
* @returns {Array<{ name: string, path: string }>}
*/
function pendingMigrations(paths, applied) {
	const done = new Set(applied);
	return [...paths].filter(isMigrationFile).map((path) => ({
		name: migrationName(path),
		path
	})).sort((a, b) => a.name.localeCompare(b.name)).filter(({ name }) => !done.has(name));
}
var rawDatabaseUrl = typeof process !== "undefined" ? process.env.DATABASE_URL : void 0;
var databaseUrl = rawDatabaseUrl && rawDatabaseUrl.trim() ? rawDatabaseUrl : void 0;
/**
* Active backend: real **Neon** when `DATABASE_URL` is set (deployed / configured
* sandbox), otherwise a local embedded **PGLite** (Postgres compiled to WASM) so
* the app has a working database even with nothing configured — the live preview
* included. Swap in Neon later by just setting `DATABASE_URL`; no code changes.
*/
var dbSource = databaseUrl ? "neon" : "pglite";
/**
* Init state lives on globalThis as promises: dev HMR creates new instances of
* this module, and two instances racing module-level state would open a second
* pool or run two concurrent PGLite migration passes (whose duplicate
* `_migrations` insert rejects — and would get memoized, poisoning every later
* `getSql()`). A failed init clears its slot so the next call retries.
*/
var globalRef = globalThis;
/**
* Result-type parity: Postgres sends every value as text plus a type OID — the
* JS value is the DRIVER's parsing choice, and pg and PGLite disagree (pg:
* int8 -> string, date -> local-midnight Date; PGLite: int8 -> BigInt, which
* JSON.stringify rejects, date -> UTC Date). Normalize both so preview and
* production return identical, JSON-safe shapes:
*   int8/bigint (incl. count(*)) -> number (past 2^53 loses precision — cast
*                                   `::text` if you ever need huge integers)
*   date                         -> 'YYYY-MM-DD' string
*   interval                     -> Postgres interval text
* numeric already comes back as a string on both (arbitrary precision).
*/
var OID_INT8 = 20;
var OID_DATE = 1082;
var OID_INTERVAL = 1186;
var identity = (v) => v;
/** Wrap a query runner in the tagged-template + `.query()` `Sql` surface. */
function toSql(run) {
	const sql = (async (strings, ...values) => {
		let text = strings[0];
		for (let i = 0; i < values.length; i += 1) text += `$${i + 1}${strings[i + 1]}`;
		return run(text, values);
	});
	sql.query = (text, params = []) => run(text, params);
	return sql;
}
function createNeonSql() {
	globalRef.__pgSqlPromise__ ??= (async () => {
		const { Pool, types } = await import("../_libs/pg.mjs").then((n) => n.t);
		types.setTypeParser(OID_INT8, Number);
		types.setTypeParser(OID_DATE, identity);
		types.setTypeParser(OID_INTERVAL, identity);
		const pool = new Pool({ connectionString: databaseUrl });
		return toSql(async (text, params) => {
			return (await pool.query(text, params)).rows;
		});
	})().catch((err) => {
		globalRef.__pgSqlPromise__ = void 0;
		throw err;
	});
	return globalRef.__pgSqlPromise__;
}
async function createPgliteSql() {
	globalRef.__pgliteInstance__ ??= (async () => {
		const { PGlite } = await import("../_libs/electric-sql__pglite.mjs").then((n) => n.t);
		const pg = new PGlite({ parsers: {
			[OID_INT8]: Number,
			[OID_DATE]: identity,
			[OID_INTERVAL]: identity
		} });
		await pg.waitReady;
		await pg.exec("create table if not exists _migrations (name text primary key, applied_at timestamptz not null default now())");
		return pg;
	})().catch((err) => {
		globalRef.__pgliteInstance__ = void 0;
		throw err;
	});
	const pg = await globalRef.__pgliteInstance__;
	const migrate = async () => {
		const migrations = /* #__PURE__ */ Object.assign({
			"/migrations/0002_schema.sql": _0002_schema_default,
			"/migrations/0003_seed.sql": _0003_seed_default
		});
		const done = (await pg.query("select name from _migrations")).rows.map((r) => r.name);
		for (const { name, path } of pendingMigrations(Object.keys(migrations), done)) await pg.transaction(async (tx) => {
			await tx.exec(migrations[path]);
			await tx.query("insert into _migrations (name) values ($1)", [name]);
		});
	};
	const pass = (globalRef.__pgliteMigrateChain__ ?? Promise.resolve()).catch(() => void 0).then(migrate);
	globalRef.__pgliteMigrateChain__ = pass;
	await pass;
	return toSql(async (text, params) => {
		return (await pg.query(text, params)).rows;
	});
}
var sqlPromise = null;
async function createSql() {
	if (typeof window !== "undefined") throw new Error("@/lib/db is server-only — call getSql() from a createServerFn handler or a server route loader, never from client code.");
	return dbSource === "neon" ? createNeonSql() : createPgliteSql();
}
/**
* Get the shared, **server-only** SQL client. Neon when `DATABASE_URL` is set,
* otherwise the local PGLite fallback. Memoized — safe to call per request.
*
* Schema comes from `migrations/*.sql`, auto-applied before the first query on
* both backends — define tables there, never inline in server functions.
*/
function getSql() {
	sqlPromise ??= createSql().catch((err) => {
		sqlPromise = null;
		throw err;
	});
	return sqlPromise;
}
/**
* Finish DB bootstrap before the server handles traffic.
*
* - **PGLite** (preview / no `DATABASE_URL`): open the in-memory DB and apply
*   `migrations/*.sql`. Idempotent — concurrent callers share one promise.
* - **Neon**: no-op (pool is created lazily on first query).
*
* Vite `configureServer` awaits this at dev startup; production imports of this
* module kick it off immediately (see bottom of file).
*/
function ensureDbReady() {
	if (dbSource !== "pglite") return Promise.resolve();
	return getSql().then(() => void 0);
}
var globalBoot = globalThis;
if (typeof window === "undefined" && dbSource === "pglite") globalBoot.__pgBootstrapPromise__ ??= ensureDbReady().catch((err) => {
	globalBoot.__pgBootstrapPromise__ = void 0;
	console.error("[db] PGLite bootstrap failed:", err);
	throw err;
});
var MONTHS = {
	january: "01",
	february: "02",
	march: "03",
	april: "04",
	may: "05",
	june: "06",
	july: "07",
	august: "08",
	september: "09",
	october: "10",
	november: "11",
	december: "12"
};
function toIso(raw) {
	const trimmed = raw.trim();
	const iso = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
	if (iso) return iso[0];
	const us = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
	if (us) {
		const m = us[1].padStart(2, "0");
		const d = us[2].padStart(2, "0");
		return `${us[3]}-${m}-${d}`;
	}
	const long = trimmed.match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/);
	if (long) {
		const month = MONTHS[long[2].toLowerCase()];
		if (!month) return null;
		return `${long[3]}-${month}-${long[1].padStart(2, "0")}`;
	}
	return null;
}
function detectSource(text) {
	if (/booking\.com/i.test(text)) return "Booking.com";
	if (/expedia/i.test(text)) return "Expedia";
	if (/agoda/i.test(text)) return "Agoda";
	if (/airbnb/i.test(text)) return "Airbnb";
	return "Forwarded email";
}
function emailKind(email) {
	if (!email) return "none";
	if (/guest\.booking\.com|mci\.hotels\.expedia|guest\.agoda|expediapartnercentral|airbnb\.com$/i.test(email)) return "masked";
	return "real";
}
function phoneKind(phone) {
	if (!phone) return "none";
	const digits = phone.replace(/\D/g, "");
	if (!digits || /^1+$/.test(digits) || digits.length < 8) return "placeholder";
	return "valid";
}
function parseReservationEmail(text) {
	const body = text.trim();
	if (body.length < 20) return { error: "Paste a full confirmation email." };
	const refMatch = body.match(/(?:reservation|confirmation|booking)\s*(?:number|id|#)?\s*[:#]?\s*([A-Z0-9-]{5,})/i);
	const nameMatch = body.match(/(?:guest(?:\s*name)?|name)\s*[:.]\s*([A-Za-z][A-Za-z' .-]{1,60})/i);
	const inMatch = body.match(/check[-\s]?in\s*[:.]?\s*(\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}\/\d{4}|\d{1,2}\s+[A-Za-z]+\s+\d{4})/i);
	const outMatch = body.match(/check[-\s]?out\s*[:.]?\s*(\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}\/\d{4}|\d{1,2}\s+[A-Za-z]+\s+\d{4})/i);
	const roomMatch = body.match(/room(?:\s*type)?\s*[:.]\s*([A-Za-z][A-Za-z ]{2,40})/i);
	const guestsMatch = body.match(/(?:number of guests|guests|occupancy)\s*[:.]\s*(\d{1,2})/i);
	const emailMatch = body.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
	const phoneMatch = body.match(/(?:telephone|phone|mobile|tel)\s*[:.]\s*([+\d][\d .()-]{6,})/i);
	if (!nameMatch) return { error: "Could not find a guest name." };
	const arrival = inMatch ? toIso(inMatch[1]) : null;
	const departure = outMatch ? toIso(outMatch[1]) : null;
	if (!arrival || !departure) return { error: "Could not read check-in and check-out dates." };
	if (nightsBetween(arrival, departure) < 1) return { error: "Departure must be after arrival." };
	return {
		bookingRef: refMatch?.[1] ?? `EM-${Date.now().toString(36).toUpperCase()}`,
		source: detectSource(body),
		guestName: nameMatch[1].trim().replace(/\s+/g, " "),
		arrival,
		departure,
		roomTypeHint: (roomMatch?.[1] ?? "Standard Queen").trim(),
		guests: guestsMatch ? Number(guestsMatch[1]) : 2,
		emailKind: emailKind(emailMatch?.[0]),
		phoneKind: phoneKind(phoneMatch?.[1])
	};
}
var PROPERTY_ID = "marlowe";
function iso(value) {
	if (value instanceof Date) return value.toISOString();
	return String(value);
}
function dateOnly(value) {
	if (value instanceof Date) return value.toISOString().slice(0, 10);
	return String(value).slice(0, 10);
}
function stayStatus(arrival, departure, today) {
	if (arrival > today) return "upcoming";
	if (departure > today) return "in_house";
	if (departure === today) return "departing";
	return "departed";
}
function reachable(email, phone) {
	return email !== "none" || phone === "valid";
}
function channels(email, phone, source) {
	const list = [];
	if (email === "real") list.push("Email");
	if (email === "masked") list.push("OTA relay");
	if (phone === "valid") list.push("SMS", "WhatsApp");
	if (list.length === 0 && source !== "Direct") list.push("None");
	return list;
}
function nid(prefix) {
	return `${prefix}_${crypto.randomUUID().slice(0, 8)}`;
}
function mapProperty(row) {
	return {
		id: row.id,
		name: row.name,
		city: row.city,
		rooms: row.rooms,
		occupancyPct: row.occupancy_pct,
		avgStayNights: Number(row.avg_stay_nights),
		tagline: row.tagline
	};
}
function mapOffer(row) {
	return {
		id: row.id,
		name: row.name,
		shortLabel: row.short_label,
		description: row.description,
		category: row.category,
		priceCents: row.price_cents,
		priceUnit: row.price_unit,
		inventory: row.inventory,
		cutoffHours: row.cutoff_hours,
		autoApprove: row.auto_approve,
		ownerType: row.owner_type === "PARTNER" ? "PARTNER" : "HOTEL",
		active: row.active,
		fromRoomTypeId: row.from_room_type_id,
		toRoomTypeId: row.to_room_type_id,
		sortOrder: row.sort_order
	};
}
function mapReservation(row, today) {
	const arrival = dateOnly(row.arrival);
	const departure = dateOnly(row.departure);
	const emailKind = row.email_kind;
	const phoneKind = row.phone_kind;
	return {
		id: row.id,
		bookingRef: row.booking_ref,
		source: row.source,
		guestName: row.guest_name,
		arrival,
		departure,
		nights: nightsBetween(arrival, departure),
		roomTypeId: row.room_type_id,
		roomTypeName: row.room_type_name,
		guests: row.guests,
		token: row.token,
		emailKind,
		phoneKind,
		consent: row.consent,
		notes: row.notes,
		status: stayStatus(arrival, departure, today),
		reachable: reachable(emailKind, phoneKind),
		eligibleChannels: channels(emailKind, phoneKind, row.source),
		createdAt: iso(row.created_at)
	};
}
function mapOrder(row) {
	return {
		id: row.id,
		reservationId: row.reservation_id,
		guestName: row.guest_name,
		offerId: row.offer_id,
		offerName: row.offer_name,
		category: row.category,
		qty: row.qty,
		amountCents: row.amount_cents,
		status: row.status,
		forDate: row.for_date ? dateOnly(row.for_date) : null,
		forTime: row.for_time,
		autoApprove: row.auto_approve,
		createdAt: iso(row.created_at),
		token: row.token
	};
}
async function todayIso(sql) {
	return (await sql`select CURRENT_DATE::text as d`)[0]?.d ?? (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
}
async function loadProperty(sql) {
	const row = (await sql`
    select id, name, city, rooms, occupancy_pct, avg_stay_nights, tagline
    from properties where id = ${PROPERTY_ID}
  `)[0];
	if (!row) throw new Error("Demo property missing. Reload after migrate.");
	return mapProperty(row);
}
function addDays(isoDate, days) {
	const [y, m, d] = isoDate.split("-").map(Number);
	const dt = new Date(Date.UTC(y, (m ?? 1) - 1, d ?? 1));
	dt.setUTCDate(dt.getUTCDate() + days);
	return dt.toISOString().slice(0, 10);
}
function isEligible(offer, res, today) {
	if (!offer.active) return false;
	if (offer.inventory === 0) return false;
	if (offer.fromRoomTypeId && res.roomTypeId !== offer.fromRoomTypeId) return false;
	if (offer.category === "late_checkout") return res.status === "in_house" || res.status === "departing";
	if (offer.category === "early_checkin") return res.status === "upcoming" && res.arrival <= addDays(today, 1);
	if (offer.category === "upgrade") return res.status === "upcoming" || res.arrival === today;
	return true;
}
function computeAmount(offer, res, qty) {
	const q = Math.max(1, qty);
	switch (offer.priceUnit) {
		case "night": return offer.priceCents * Math.min(q, res.nights);
		case "person": return offer.priceCents * res.guests * q;
		case "person_night": return offer.priceCents * res.guests * Math.min(q, res.nights);
		default: return offer.priceCents * q;
	}
}
var getDashboard_createServerFn_handler = createServerRpc({
	id: "9545075549869e93ca0c583fa429aa1d82c58b85b483b2f4ef537e04c8d342a6",
	name: "getDashboard",
	filename: "src/lib/staylift/server.ts"
}, (opts) => getDashboard.__executeServer(opts));
var getDashboard = createServerFn({ method: "GET" }).handler(getDashboard_createServerFn_handler, async () => {
	const sql = await getSql();
	const property = await loadProperty(sql);
	const today = await todayIso(sql);
	const [paid, pending, arriving, allRes, viewRows, nightRows] = await Promise.all([
		sql`
        select
          coalesce(sum(o.amount_cents) filter (
            where o.created_at::date = CURRENT_DATE and o.status in ('paid','fulfilled')
          ), 0)::int as today_cents,
          coalesce(sum(o.amount_cents) filter (
            where o.status in ('paid','fulfilled')
          ), 0)::int as period_cents,
          count(*) filter (
            where o.status in ('paid','fulfilled','pending_approval')
          )::int as purchases,
          (
            select f.name from orders o2
            join offers f on f.id = o2.offer_id
            where o2.status in ('paid','fulfilled')
            group by f.name
            order by sum(o2.amount_cents) desc
            limit 1
          ) as top_name,
          (
            select sum(o2.amount_cents)::int from orders o2
            join offers f on f.id = o2.offer_id
            where o2.status in ('paid','fulfilled')
            group by f.name
            order by sum(o2.amount_cents) desc
            limit 1
          ) as top_cents
        from orders o
      `,
		sql`
        select o.id, o.reservation_id, r.guest_name, o.offer_id, f.name as offer_name,
          f.category, o.qty, o.amount_cents, o.status, o.for_date::text as for_date,
          o.for_time, f.auto_approve, o.created_at, r.token
        from orders o
        join reservations r on r.id = o.reservation_id
        join offers f on f.id = o.offer_id
        where o.status = 'pending_approval'
        order by o.created_at desc
      `,
		sql`
        select r.id, r.booking_ref, r.source, r.guest_name, r.arrival::text as arrival,
          r.departure::text as departure, r.room_type_id, rt.name as room_type_name,
          r.guests, r.token, r.email_kind, r.phone_kind, r.consent, r.notes, r.created_at
        from reservations r
        join room_types rt on rt.id = r.room_type_id
        where r.arrival <= CURRENT_DATE + 3 and r.departure > CURRENT_DATE
        order by r.arrival, r.guest_name
      `,
		sql`
        select email_kind, phone_kind from reservations
      `,
		sql`select count(*)::int as n from events where kind = 'view'`,
		sql`
        select coalesce(sum((departure - arrival)), 0)::int as n from reservations
      `
	]);
	const bookings = allRes.length;
	const reached = allRes.filter((r) => reachable(r.email_kind, r.phone_kind)).length;
	const stats = paid[0];
	const periodCents = stats?.period_cents ?? 0;
	const purchases = stats?.purchases ?? 0;
	const views = viewRows[0]?.n ?? 0;
	const occupancyNights = nightRows[0]?.n ?? 0;
	return {
		property,
		todayCents: stats?.today_cents ?? 0,
		periodCents,
		revenuePerBooking: bookings ? periodCents / 100 / bookings : 0,
		revenuePerNight: occupancyNights ? periodCents / 100 / occupancyNights : 0,
		attachRate: bookings ? purchases / bookings : 0,
		conversion: views ? purchases / views : 0,
		topOffer: stats?.top_name && stats.top_cents ? {
			name: stats.top_name,
			cents: stats.top_cents
		} : null,
		funnel: {
			bookings,
			reached,
			views,
			purchases,
			revenueCents: periodCents
		},
		pending: pending.map(mapOrder),
		arriving: arriving.map((r) => mapReservation(r, today)),
		occupancyNights
	};
});
var listReservations_createServerFn_handler = createServerRpc({
	id: "e005ae3fe6737096f628bb575fa2e07981255027cfa2cf35fe354982568de78c",
	name: "listReservations",
	filename: "src/lib/staylift/server.ts"
}, (opts) => listReservations.__executeServer(opts));
var listReservations = createServerFn({ method: "GET" }).handler(listReservations_createServerFn_handler, async () => {
	const sql = await getSql();
	const today = await todayIso(sql);
	const rows = await sql`
      select r.id, r.booking_ref, r.source, r.guest_name, r.arrival::text as arrival,
        r.departure::text as departure, r.room_type_id, rt.name as room_type_name,
        r.guests, r.token, r.email_kind, r.phone_kind, r.consent, r.notes, r.created_at
      from reservations r
      join room_types rt on rt.id = r.room_type_id
      order by r.arrival, r.guest_name
    `;
	const totals = await sql`
      select reservation_id, coalesce(sum(amount_cents),0)::int as cents
      from orders
      where status in ('paid','fulfilled','pending_approval')
      group by reservation_id
    `;
	const ordersByRes = {};
	for (const t of totals) ordersByRes[t.reservation_id] = t.cents;
	return {
		reservations: rows.map((r) => mapReservation(r, today)),
		ordersByRes
	};
});
var listOffers_createServerFn_handler = createServerRpc({
	id: "7d4d3029c956a2dc0be47a3add105c5cc271c8c19f49451142f9186baf44051a",
	name: "listOffers",
	filename: "src/lib/staylift/server.ts"
}, (opts) => listOffers.__executeServer(opts));
var listOffers = createServerFn({ method: "GET" }).handler(listOffers_createServerFn_handler, async () => {
	return (await (await getSql())`
    select id, name, short_label, description, category, price_cents, price_unit,
      inventory, cutoff_hours, auto_approve, owner_type, active,
      from_room_type_id, to_room_type_id, sort_order
    from offers
    order by sort_order
  `).map(mapOffer);
});
var listFulfillment_createServerFn_handler = createServerRpc({
	id: "b0d162ce6a18dd112f1335203c458e9a3e56d0bd623aac4d8ac33a22093b5264",
	name: "listFulfillment",
	filename: "src/lib/staylift/server.ts"
}, (opts) => listFulfillment.__executeServer(opts));
var listFulfillment = createServerFn({ method: "GET" }).handler(listFulfillment_createServerFn_handler, async () => {
	const orders = (await (await getSql())`
      select o.id, o.reservation_id, r.guest_name, o.offer_id, f.name as offer_name,
        f.category, o.qty, o.amount_cents, o.status, o.for_date::text as for_date,
        o.for_time, f.auto_approve, o.created_at, r.token
      from orders o
      join reservations r on r.id = o.reservation_id
      join offers f on f.id = o.offer_id
      where o.status in ('pending_approval','paid','fulfilled')
      order by o.created_at desc
    `).map(mapOrder);
	return {
		pending: orders.filter((o) => o.status === "pending_approval"),
		paid: orders.filter((o) => o.status === "paid" || o.status === "fulfilled")
	};
});
var listRecipes_createServerFn_handler = createServerRpc({
	id: "203df204520c9387e632c5da4f2f6d2b6bfc762461bf5eed55a228c0f1c07a57",
	name: "listRecipes",
	filename: "src/lib/staylift/server.ts"
}, (opts) => listRecipes.__executeServer(opts));
var listRecipes = createServerFn({ method: "GET" }).handler(listRecipes_createServerFn_handler, async () => {
	return (await (await getSql())`
    select id, name, summary, trigger_event, offset_hours, offer_ids, active, sort_order
    from recipes
    order by sort_order
  `).map((r) => ({
		id: r.id,
		name: r.name,
		summary: r.summary,
		triggerEvent: r.trigger_event,
		offsetHours: r.offset_hours,
		offerIds: r.offer_ids.split(",").filter(Boolean),
		active: r.active,
		sortOrder: r.sort_order
	}));
});
var getAnalytics_createServerFn_handler = createServerRpc({
	id: "846f0b12b91c3c4d0e7808c19431a224dac23758fc680a55736ae3b1d9d9c01a",
	name: "getAnalytics",
	filename: "src/lib/staylift/server.ts"
}, (opts) => getAnalytics.__executeServer(opts));
var getAnalytics = createServerFn({ method: "GET" }).handler(getAnalytics_createServerFn_handler, async () => {
	const sql = await getSql();
	return {
		byOffer: await sql`
    select f.name, coalesce(sum(o.amount_cents),0)::int as cents, count(*)::int as n
    from orders o
    join offers f on f.id = o.offer_id
    where o.status in ('paid','fulfilled')
    group by f.name
    order by cents desc
  `,
		bySource: await sql`
    select r.source,
      coalesce(sum(o.amount_cents) filter (where o.status in ('paid','fulfilled')),0)::int as cents,
      count(distinct r.id)::int as bookings
    from reservations r
    left join orders o on o.reservation_id = r.id
    group by r.source
    order by cents desc
  `,
		capture: (await sql`
    select
      count(*) filter (where c.real_email_captured)::int as captured,
      count(*) filter (where r.source <> 'Direct')::int as ota
    from reservations r
    left join checkins c on c.reservation_id = r.id
  `)[0] ?? {
			captured: 0,
			ota: 0
		}
	};
});
var getStay_createServerFn_handler = createServerRpc({
	id: "913f2c3bfc30e3f2e5dc8e4ba4d80b162148e9e0dbc83f47fa7f23bcccd834cb",
	name: "getStay",
	filename: "src/lib/staylift/server.ts"
}, (opts) => getStay.__executeServer(opts));
var getStay = createServerFn({ method: "GET" }).validator(object({ token: string().min(1) })).handler(getStay_createServerFn_handler, async ({ data }) => {
	const sql = await getSql();
	const today = await todayIso(sql);
	const property = await loadProperty(sql);
	const row = (await sql`
      select r.id, r.booking_ref, r.source, r.guest_name, r.arrival::text as arrival,
        r.departure::text as departure, r.room_type_id, rt.name as room_type_name,
        r.guests, r.token, r.email_kind, r.phone_kind, r.consent, r.notes, r.created_at
      from reservations r
      join room_types rt on rt.id = r.room_type_id
      where r.token = ${data.token}
    `)[0];
	if (!row) throw new Error("This stay link is not valid.");
	const reservation = mapReservation(row, today);
	const offerRows = await sql`
      select id, name, short_label, description, category, price_cents, price_unit,
        inventory, cutoff_hours, auto_approve, owner_type, active,
        from_room_type_id, to_room_type_id, sort_order
      from offers
      where active = true
      order by sort_order
    `;
	const orderRows = await sql`
      select o.id, o.reservation_id, r.guest_name, o.offer_id, f.name as offer_name,
        f.category, o.qty, o.amount_cents, o.status, o.for_date::text as for_date,
        o.for_time, f.auto_approve, o.created_at, r.token
      from orders o
      join reservations r on r.id = o.reservation_id
      join offers f on f.id = o.offer_id
      where r.token = ${data.token}
        and o.status in ('pending_approval','paid','fulfilled')
    `;
	const check = (await sql`
      select eta, real_email_captured, completed_at
      from checkins where reservation_id = ${reservation.id}
    `)[0];
	const bought = new Set(orderRows.map((o) => o.offer_id));
	return {
		property,
		reservation,
		offers: offerRows.map(mapOffer).filter((o) => isEligible(o, reservation, today) && !bought.has(o.id)),
		orders: orderRows.map(mapOrder),
		checkin: {
			eta: check?.eta ?? null,
			realEmailCaptured: Boolean(check?.real_email_captured),
			completed: Boolean(check?.completed_at)
		}
	};
});
var recordStayView_createServerFn_handler = createServerRpc({
	id: "d5512689bf8a39527cf4ee62fa0277df60d3e2918b45b9e6a5baacbefbf78d88",
	name: "recordStayView",
	filename: "src/lib/staylift/server.ts"
}, (opts) => recordStayView.__executeServer(opts));
var recordStayView = createServerFn({ method: "POST" }).validator(object({ token: string().min(1) })).handler(recordStayView_createServerFn_handler, async ({ data }) => {
	const sql = await getSql();
	const row = (await sql`
      select id from reservations where token = ${data.token}
    `)[0];
	if (!row) return { ok: false };
	if (((await sql`
      select count(*)::int as n from events
      where reservation_id = ${row.id}
        and kind = 'view'
        and created_at > now() - interval '20 minutes'
    `)[0]?.n ?? 0) === 0) await sql`
        insert into events (reservation_id, kind)
        values (${row.id}, 'view')
      `;
	return { ok: true };
});
var purchaseOffer_createServerFn_handler = createServerRpc({
	id: "239081f157676747d342000e32b55dd13093091740bf20f98a203013d6911d1a",
	name: "purchaseOffer",
	filename: "src/lib/staylift/server.ts"
}, (opts) => purchaseOffer.__executeServer(opts));
var purchaseOffer = createServerFn({ method: "POST" }).validator(object({
	token: string().min(1),
	offerId: string().min(1),
	qty: number().int().min(1).max(14),
	forTime: string().optional()
})).handler(purchaseOffer_createServerFn_handler, async ({ data }) => {
	const sql = await getSql();
	const today = await todayIso(sql);
	const resRow = (await sql`
      select r.id, r.booking_ref, r.source, r.guest_name, r.arrival::text as arrival,
        r.departure::text as departure, r.room_type_id, rt.name as room_type_name,
        r.guests, r.token, r.email_kind, r.phone_kind, r.consent, r.notes, r.created_at
      from reservations r
      join room_types rt on rt.id = r.room_type_id
      where r.token = ${data.token}
    `)[0];
	if (!resRow) throw new Error("Stay not found.");
	const reservation = mapReservation(resRow, today);
	const offerRow = (await sql`
      select id, name, short_label, description, category, price_cents, price_unit,
        inventory, cutoff_hours, auto_approve, owner_type, active,
        from_room_type_id, to_room_type_id, sort_order
      from offers where id = ${data.offerId}
    `)[0];
	if (!offerRow) throw new Error("Offer not found.");
	const offer = mapOffer(offerRow);
	if (!isEligible(offer, reservation, today)) throw new Error("That offer is not available for this stay.");
	if (((await sql`
      select count(*)::int as n from orders
      where reservation_id = ${reservation.id}
        and offer_id = ${offer.id}
        and status in ('pending_approval','paid','fulfilled')
    `)[0]?.n ?? 0) > 0) throw new Error("Already on this stay.");
	if (offer.inventory !== null) {
		if (offer.inventory < 1) throw new Error("Sold out for these dates.");
		await sql`
        update offers set inventory = inventory - 1
        where id = ${offer.id} and inventory > 0
      `;
	}
	const amount = computeAmount(offer, reservation, data.qty);
	const status = offer.autoApprove ? "paid" : "pending_approval";
	const id = nid("ord");
	const forDate = offer.category === "late_checkout" ? reservation.departure : offer.category === "early_checkin" ? reservation.arrival : reservation.arrival;
	await sql`
      insert into orders (
        id, reservation_id, offer_id, qty, amount_cents, status, for_date, for_time
      )
      values (
        ${id}, ${reservation.id}, ${offer.id}, ${data.qty}, ${amount},
        ${status}, ${forDate}, ${data.forTime ?? null}
      )
    `;
	await sql`
      insert into events (reservation_id, offer_id, kind)
      values (${reservation.id}, ${offer.id}, 'purchase')
    `;
	return {
		id,
		status,
		amountCents: amount,
		autoApprove: offer.autoApprove
	};
});
var decideOrder_createServerFn_handler = createServerRpc({
	id: "5b029795fa7d5c45c42b3994b18a742fe9c16adad2e8831db116932a041f8745",
	name: "decideOrder",
	filename: "src/lib/staylift/server.ts"
}, (opts) => decideOrder.__executeServer(opts));
var decideOrder = createServerFn({ method: "POST" }).validator(object({
	orderId: string().min(1),
	decision: _enum(["approve", "decline"])
})).handler(decideOrder_createServerFn_handler, async ({ data }) => {
	const sql = await getSql();
	const row = (await sql`
      select id, status, offer_id, reservation_id from orders where id = ${data.orderId}
    `)[0];
	if (!row) throw new Error("Order not found.");
	if (row.status !== "pending_approval") throw new Error("Already decided.");
	if (data.decision === "approve") await sql`
        update orders set status = 'paid', decided_at = now()
        where id = ${data.orderId}
      `;
	else {
		await sql`
        update orders set status = 'declined', decided_at = now()
        where id = ${data.orderId}
      `;
		await sql`
        update offers set inventory = inventory + 1
        where id = ${row.offer_id} and inventory is not null
      `;
	}
	return { ok: true };
});
var completeCheckin_createServerFn_handler = createServerRpc({
	id: "1bd6e17c4f2408addcfb9940a60f81f3fc98ea0a29d89bd3f2bb58e4fbff1a30",
	name: "completeCheckin",
	filename: "src/lib/staylift/server.ts"
}, (opts) => completeCheckin.__executeServer(opts));
var completeCheckin = createServerFn({ method: "POST" }).validator(object({
	token: string().min(1),
	eta: string().max(16),
	captureEmail: boolean()
})).handler(completeCheckin_createServerFn_handler, async ({ data }) => {
	const sql = await getSql();
	const row = (await sql`
      select id from reservations where token = ${data.token}
    `)[0];
	if (!row) throw new Error("Stay not found.");
	await sql`
      insert into checkins (reservation_id, eta, real_email_captured, completed_at)
      values (${row.id}, ${data.eta}, ${data.captureEmail}, now())
      on conflict (reservation_id) do update set
        eta = excluded.eta,
        real_email_captured = checkins.real_email_captured or excluded.real_email_captured,
        completed_at = excluded.completed_at
    `;
	if (data.captureEmail) {
		await sql`
        update reservations set email_kind = 'real', consent = 'transactional'
        where id = ${row.id} and email_kind <> 'real'
      `;
		await sql`
        insert into events (reservation_id, kind)
        values (${row.id}, 'email_captured')
      `;
	}
	return { ok: true };
});
var toggleRecipe_createServerFn_handler = createServerRpc({
	id: "b29bfbd1059862c2dcddd6b6480e31368d47de3f903fa9f0efb2f70c07e5e82d",
	name: "toggleRecipe",
	filename: "src/lib/staylift/server.ts"
}, (opts) => toggleRecipe.__executeServer(opts));
var toggleRecipe = createServerFn({ method: "POST" }).validator(object({
	id: string(),
	active: boolean()
})).handler(toggleRecipe_createServerFn_handler, async ({ data }) => {
	await (await getSql())`update recipes set active = ${data.active} where id = ${data.id}`;
	return { ok: true };
});
var toggleOffer_createServerFn_handler = createServerRpc({
	id: "32bdd37eeae6bf4fa697d818b95d9db34d8395eb6050242c7b0fb3ae6d109942",
	name: "toggleOffer",
	filename: "src/lib/staylift/server.ts"
}, (opts) => toggleOffer.__executeServer(opts));
var toggleOffer = createServerFn({ method: "POST" }).validator(object({
	id: string(),
	active: boolean()
})).handler(toggleOffer_createServerFn_handler, async ({ data }) => {
	await (await getSql())`update offers set active = ${data.active} where id = ${data.id}`;
	return { ok: true };
});
var sendStayLink_createServerFn_handler = createServerRpc({
	id: "2f8cbd865a42aba2820452b741023497a6fcbd01a6419ebf8747b3a19d632a62",
	name: "sendStayLink",
	filename: "src/lib/staylift/server.ts"
}, (opts) => sendStayLink.__executeServer(opts));
var sendStayLink = createServerFn({ method: "POST" }).validator(object({
	reservationId: string(),
	recipeId: string().optional(),
	channel: _enum([
		"email",
		"sms",
		"whatsapp"
	])
})).handler(sendStayLink_createServerFn_handler, async ({ data }) => {
	const sql = await getSql();
	const row = (await sql`
      select id, guest_name, email_kind, phone_kind
      from reservations where id = ${data.reservationId}
    `)[0];
	if (!row) throw new Error("Reservation not found.");
	if (data.channel === "email" && row.email_kind === "none") throw new Error("No email on file.");
	if (data.channel !== "email" && row.phone_kind !== "valid") throw new Error("No valid phone on file — placeholder numbers are rejected.");
	const recipe = data.recipeId ? await sql`select name from recipes where id = ${data.recipeId}` : [];
	const first = row.guest_name.split(" ")[0] ?? row.guest_name;
	const subject = recipe[0]?.name ? `${recipe[0].name} — ${first}` : `Your stay at The Marlowe`;
	await sql`
      insert into messages (id, reservation_id, recipe_id, channel, subject, status)
      values (
        ${nid("msg")}, ${row.id}, ${data.recipeId ?? null},
        ${data.channel}, ${subject}, 'sent'
      )
    `;
	return { ok: true };
});
var ingestSchema = object({
	bookingRef: string().min(2),
	source: string().min(2),
	guestName: string().min(2).max(80),
	arrival: string().regex(/^\d{4}-\d{2}-\d{2}$/),
	departure: string().regex(/^\d{4}-\d{2}-\d{2}$/),
	roomTypeId: string(),
	guests: number().int().min(1).max(6),
	emailKind: _enum([
		"real",
		"masked",
		"none"
	]),
	phoneKind: _enum([
		"valid",
		"placeholder",
		"none"
	])
});
var ingestReservation_createServerFn_handler = createServerRpc({
	id: "dcb9f0e23412424a06ad2c99eb5eef7f035e116aed5f503821a625237d96763e",
	name: "ingestReservation",
	filename: "src/lib/staylift/server.ts"
}, (opts) => ingestReservation.__executeServer(opts));
var ingestReservation = createServerFn({ method: "POST" }).validator(ingestSchema).handler(ingestReservation_createServerFn_handler, async ({ data }) => {
	if (data.departure <= data.arrival) throw new Error("Departure must be after arrival.");
	const sql = await getSql();
	if (!(await sql`
      select id from room_types where id = ${data.roomTypeId}
    `)[0]) throw new Error("Unknown room type.");
	const token = data.guestName.toLowerCase().replace(/[^a-z]+/g, "").slice(0, 12).concat(crypto.randomUUID().slice(0, 3));
	const id = nid("res");
	await sql`
      insert into reservations (
        id, property_id, booking_ref, source, guest_name, arrival, departure,
        room_type_id, guests, token, email_kind, phone_kind, consent
      ) values (
        ${id}, ${PROPERTY_ID}, ${data.bookingRef}, ${data.source}, ${data.guestName},
        ${data.arrival}, ${data.departure}, ${data.roomTypeId}, ${data.guests},
        ${token}, ${data.emailKind}, ${data.phoneKind},
        ${data.emailKind === "real" ? "marketing" : "transactional"}
      )
    `;
	return {
		id,
		token
	};
});
var previewEmailParse_createServerFn_handler = createServerRpc({
	id: "7dff6f832948d6de9832cfa9dbd286c537cf1210499fd822757188686edc1b92",
	name: "previewEmailParse",
	filename: "src/lib/staylift/server.ts"
}, (opts) => previewEmailParse.__executeServer(opts));
var previewEmailParse = createServerFn({ method: "POST" }).validator(object({ text: string().min(10) })).handler(previewEmailParse_createServerFn_handler, async ({ data }) => {
	const parsed = parseReservationEmail(data.text);
	if ("error" in parsed) return parsed;
	const rooms = await (await getSql())`
      select id, name from room_types order by nightly_cents
    `;
	const hint = parsed.roomTypeHint.toLowerCase();
	const match = rooms.find((r) => hint.includes(r.name.toLowerCase().split(" ")[0] ?? "")) ?? rooms.find((r) => r.name.toLowerCase().includes("standard")) ?? rooms[0];
	return {
		...parsed,
		roomTypeId: match?.id ?? "rt_standard"
	};
});
var listRoomTypes_createServerFn_handler = createServerRpc({
	id: "0fc2eb144562abddcd3055adeb402d75c97c47bcd6078f1bd8b4d357ec77427f",
	name: "listRoomTypes",
	filename: "src/lib/staylift/server.ts"
}, (opts) => listRoomTypes.__executeServer(opts));
var listRoomTypes = createServerFn({ method: "GET" }).handler(listRoomTypes_createServerFn_handler, async () => {
	return (await getSql())`
    select id, name from room_types order by nightly_cents
  `;
});
var listMessages_createServerFn_handler = createServerRpc({
	id: "77b73ca1f567b1585e3ec27c74056deb367e9eb2899861a4593499d29377762c",
	name: "listMessages",
	filename: "src/lib/staylift/server.ts"
}, (opts) => listMessages.__executeServer(opts));
var listMessages = createServerFn({ method: "GET" }).handler(listMessages_createServerFn_handler, async () => {
	return (await (await getSql())`
    select m.id, r.guest_name, m.channel, m.subject, m.status, m.sent_at, r.token
    from messages m
    join reservations r on r.id = m.reservation_id
    order by m.sent_at desc
    limit 20
  `).map((r) => ({
		id: r.id,
		guestName: r.guest_name,
		channel: r.channel,
		subject: r.subject,
		status: r.status,
		sentAt: iso(r.sent_at),
		token: r.token
	}));
});
//#endregion
export { completeCheckin_createServerFn_handler, decideOrder_createServerFn_handler, getAnalytics_createServerFn_handler, getDashboard_createServerFn_handler, getStay_createServerFn_handler, ingestReservation_createServerFn_handler, listFulfillment_createServerFn_handler, listMessages_createServerFn_handler, listOffers_createServerFn_handler, listRecipes_createServerFn_handler, listReservations_createServerFn_handler, listRoomTypes_createServerFn_handler, previewEmailParse_createServerFn_handler, purchaseOffer_createServerFn_handler, recordStayView_createServerFn_handler, sendStayLink_createServerFn_handler, toggleOffer_createServerFn_handler, toggleRecipe_createServerFn_handler };
