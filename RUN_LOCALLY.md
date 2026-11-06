# Run Staylift on your Mac

Easiest: double-click `start-staylift.command` in this folder. It installs
everything, starts the app, opens it in your browser, and saves output to logs/.
If the app was already running, close that Terminal window first: sign-in is
switched on at start-up, so an old server won't pick it up.

Or by hand — requires Node 22+ (`node -v`). From this folder, in Terminal:

    npm install
    npm run dev

Open http://localhost:8080 (use Chrome or Firefox; Safari may refuse the
secure sign-in cookie on plain http://localhost).

## First run

1. Go to `/hotel`. By default it opens straight away as the shared **Demo
   Visitor** (owner of The Marlowe) — no sign-in needed. To explore with your
   own account instead, set `STAYLIFT_OPEN_ACCESS=off` and restart, then choose
   **Create an account** (any email and an 8+ character password; nothing is
   sent).
2. From onboarding, pick **Explore the demo** (The Marlowe, with pilot data,
   guest profiles and the capture gate) or **Create hotel** for an empty one
   with a starter catalogue.
3. Try the guest side:
   - `/stay/maya`: check in, confirm an email (the code shows on screen in
     development), tick consents, open the preferences link.
   - `/desk`: the front-desk tablet.
   - `/c/marlowe`: the desk QR page (last name + booking reference).
4. Back in `/hotel`, see Guests, Team (invite a second account), Settings &
   privacy, and the Audit log.

Data lives in an embedded database (PGLite) and resets when the dev server
restarts, including accounts.

## Pages

- `/`            landing page with the ROI teaser
- `/roi`         full ROI calculator (shareable links)
- `/login`       staff sign-in (optional — "Just exploring?" link opens the demo); `/onboarding` create or join a hotel
- `/hotel`       hotel desk (open by default as the Demo Visitor; `STAYLIFT_OPEN_ACCESS=off` requires sign-in). Guests, Team, Settings, Audit are new
- `/desk`        check-in tablet for the front desk
- `/stay/<token>` guest page with the check-in step; `/stay/owen` is a holdout guest
- `/c/<code>`    desk QR lookup; `/p/<token>` guest preference centre
- `/invite/<token>` team invitation

## Settings for a real deployment

Set these as environment variables on the host (never in a file in the repo):

| Variable | What it does |
|---|---|
| `DATABASE_URL` | Postgres (Neon). Migrations run on build. |
| `STAYLIFT_DATA_KEY` | Encrypts guest contacts. `openssl rand -base64 32`. Required with a real database; keep a copy safe — losing it makes stored contacts unreadable. |
| `STAYLIFT_DATA_KEY_PREVIOUS` | Only while rotating keys. |
| `POSTMARK_SERVER_TOKEN` | Sends codes, invitations and booking email. |
| `STAYLIFT_FROM_EMAIL` | Fallback sender, e.g. `stay@mail.yourhotel.com` (each hotel can set its own in Settings). |
| `PUBLIC_APP_URL` | The site address used in emailed links. |
| `CRON_SECRET` | Protects the daily retention job (`/api/cron/retention`, scheduled in vercel.json). |
| `STAYLIFT_DEMO` | `on` to offer the demo hotel on a real database (visitors join as manager). Off by default there. |
| `STAYLIFT_OPEN_ACCESS` | **On by default.** Staff pages (`/hotel`, `/desk`) open signed-out as the shared **Demo Visitor** (owner of The Marlowe) — no sign-in wall. Set `off` to restore the sign-in requirement; real sign-in keeps working either way. |
| `STRIPE_SECRET_KEY` | Real money. When set, guest claims go through Stripe Checkout (charge at claim, refund on decline) in the hotel's market currency. Without it: demo charges are simulated — and on a real database, online payment is refused rather than pretended. |
| `WHATSAPP_TOKEN` + `WHATSAPP_PHONE_NUMBER_ID` | Meta Cloud API credentials. When set, check-in codes send as real WhatsApp utility templates (costs recorded per message). Without them: dev mode shows codes on screen; a real database refuses WhatsApp until connected. |
| `WHATSAPP_TEMPLATE_CODE` / `WHATSAPP_TEMPLATE_STAY_LINK` | Approved template names in your Meta account (defaults `verify_code` / `stay_link`). Body params: code template `[code, ttl-minutes]`, stay-link template `[hotel-name, url]`. |
| `WHATSAPP_LANG` / `WHATSAPP_UTILITY_COST_CENTS` | Template language (default `en`) and the modelled per-message cost (default 5¢). |

## Checks

    npm test            # unit tests incl. encryption, contact rules, roles, QR
    npm run typecheck
    npm run build

What changed and why: STAYLIFT_CHANGES.md
