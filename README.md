# 🩸 Blood SOS

A web app that alerts **nearby, compatible blood donors** by **SMS and email** when a hospital needs blood urgently, so staff no longer have to rely on phone calls and social media posts.

**Stack:** Next.js 16 (App Router, Server Actions) · PostgreSQL · Tailwind CSS · Nodemailer (email) · Twilio (SMS)

## How it works

```
Hospital staff (verified login) ──► Raise SOS: blood type, units, urgency, radius
                                        │
                                        ▼
        Match donors: compatible blood type + available + not donated in 90 days
                      + verified + within radius (haversine distance)
                                        │
                                        ▼
                    SMS + email to each donor with a magic link
                                        │
                                        ▼
      Donor taps the link (or opens the Donor portal) ──► "I can donate" / "Not now"
                                        │
                                        ▼
     Hospital dashboard updates live, and the donor's phone number is revealed
     only after they accept. Staff can widen the search, mark donated, or close.
```

## Features

- **Two separate portals:** a **Donor portal** (`/donor`) and a **Hospital portal** (`/hospital`). Each portal has its own login cookie, so you can be signed in to both in the same browser while testing.
- **Donor registration:** name, email, phone, password, blood type, last donation date, and location (GPS or choose a dzongkhag). Registering signs you straight in.
- **Donor login** with email or phone number plus password. Donors who forget their password can request a one-time magic link by email and SMS.
- **Open SOS requests on the donor dashboard**, with "I can donate" and "Not now" buttons.
- **Only verified hospitals can raise an SOS**, which prevents fake requests.
- **Blood compatibility matching.** For example, an A+ patient can receive A+, A−, O+ and O−.
- **Eligibility rule:** donors who gave blood in the last 90 days are not alerted.
- **Location matching** by distance from the hospital, plus a **"Widen search"** button that doubles the radius and alerts only the newly covered donors.
- **One-tap response page** that needs no login. Donors who accept get directions and the hospital's phone number.
- **Live hospital dashboard** that refreshes every 10 seconds. The hospital also gets an email when a donor accepts.
- **Privacy:** donor names and phone numbers stay hidden until the donor accepts.
- **Mark donated** records the donation date, so the donor rests for 90 days.

## Getting started

Requirements: Node.js 20+ and PostgreSQL.

```bash
npm install
cp .env.example .env.local      # then edit if needed
createdb blood_sos
npm run db:setup                # create tables
npm run db:seed                 # demo hospital + 5 demo donors (local only)
npm run dev                     # http://localhost:3000
```

If port 3000 is busy, run `npm run dev -- -p 3100` and set `APP_URL=http://localhost:3100` in `.env.local` so magic links point to the right place.

**Local demo logins** (all passwords are `password123`). `db:seed` refuses to run against a non-local database, so these never exist on the live site:

| Portal   | Login                                                          |
|----------|----------------------------------------------------------------|
| Hospital | `bloodbank@demo.bt`                                            |
| Donor    | `karma@demo.bt` (O−), also `sonam@`, `tashi@`, `pema@`, `ugyen@` `demo.bt` |

Other scripts: `npm run db:reset` drops and recreates all tables. Run `npm run db:seed` afterwards to add the demo data again.

## Demo walkthrough

1. In the **Donor portal**, register with a password and choose *Thimphu* as your location. You are signed in right away.
2. Open the **Hospital portal** in a new tab of the same browser (use the link in the footer) and log in as the demo hospital.
3. Raise an SOS (for example A+, 10 km).
4. Go back to the donor tab and refresh. The request appears under **Open SOS requests**. Click **I can donate**.
5. The hospital page now shows your name and phone number. Try **Mark donated**, **Widen search** and **Mark fulfilled**.

## Real email and SMS

Without a provider, messages are skipped. In development the full text (including its links) is printed in the terminal running `npm run dev`; in production only a warning is logged. To send real ones, fill in `.env.local` (or the Render Environment tab):

- **Email:** any SMTP server. For Gmail, use host `smtp.gmail.com`, port `587`, your Gmail address, and an [App Password](https://myaccount.google.com/apppasswords).
- **SMS:** a [Twilio](https://www.twilio.com/) account SID, auth token, and a sending number. A trial account can only text numbers you have verified. Use the international format (`+975...`).

## Deploying to Render

`render.yaml` creates the web service and a managed Postgres database, both in Singapore (the closest Render region to Bhutan).

1. Push this project to a GitHub repository.
2. In the Render dashboard choose **New > Blueprint** and pick the repository. Render creates `blood-sos` and `blood-sos-db` and connects them with `DATABASE_URL`.
3. When asked, fill in the SMTP and Twilio values. You can leave them empty and add them later under **Environment**, but donors won't receive alerts until you do.
4. Wait for the deploy. Each start runs `npm run db:setup`, which creates any missing tables, so there is no separate migration step.
5. Add real hospital accounts from your computer. Copy the **External Database URL** from the database's page in Render and run:

   ```bash
   DATABASE_URL="<external url>?sslmode=require" npm run hospital:add -- \
     --name "JDW National Referral Hospital (Blood Bank)" --email bloodbank@example.bt \
     --phone +97517000000 --address "Gongphel Lam, Thimphu" --lat 27.4661 --lng 89.6419
   ```

   It prints a random password for the hospital. Give it to them privately.

Notes:

- Links in emails and SMS use the Render address (`RENDER_EXTERNAL_URL`) automatically. If you add a custom domain, set `APP_URL` to it.
- Render's **free Postgres expires after 30 days**, and free web services sleep after 15 minutes without traffic (the next visit takes about a minute to load). For a site people rely on, upgrade both, or point `DATABASE_URL` at another provider such as [Neon](https://neon.tech) or [Supabase](https://supabase.com) (use their connection string with `?sslmode=require`).
- Server logs, including failed email/SMS sends, are under the service's **Logs** tab.

## Project structure

```
db/schema.sql                 All tables (hospitals, donors, blood_requests, alerts, ...)
scripts/                      setup-db, seed (local demo data), add-hospital
render.yaml                   Render Blueprint (web service + Postgres)
src/lib/
  db.ts                       PostgreSQL connection pool
  blood.ts                    Blood types, compatibility table, 90-day rule
  matching.ts                 Finds matching donors and sends the alerts  ← core logic
  notify.ts                   Email (Nodemailer) + SMS (Twilio)
  session.ts                  Login sessions (one cookie per portal)
  places.ts                   Dzongkhag coordinates for the location picker
src/components/               Shared UI (logo, location picker, badges, buttons)
src/app/
  page.tsx                    Home page (choose a portal)
  donor/                      Donor portal: register, login, dashboard, profile
    respond/[token]/          Page a donor opens from the SOS link (no login needed)
    verify/[token]/           "Forgot password" magic link
  hospital/                   Hospital portal: login, dashboard, raise SOS, request details
```

## Limitations and future work

- Hospital accounts are created by an admin with `npm run hospital:add`. An admin panel would make this easier.
- SMS costs money per message, and a local Bhutanese SMS gateway would be cheaper than Twilio.
- Donor location is a saved point, not live GPS (better for privacy and battery).
- Possible additions: web push notifications, a map view, donation history and certificates, and multiple languages (Dzongkha).
