# Natural By Cara — Booking Website

A simple self-serve booking website so clients can pick an open time slot
themselves instead of texting on WhatsApp and waiting for you to check Fresha.

Two parts:
- **`/book`** — the public page you share with clients. They pick a
  service, a date, an open time slot, enter their name and phone number,
  and confirm. No app or account needed on their end.
- **`/admin`** — your private area (password-protected) where you set your
  weekly hours, block off specific dates (holidays etc.), manage your
  services and prices, and see/cancel bookings.

This does **not** replace Fresha for payments or client history — it only
solves "let the client pick an actually-open slot themselves."

---

## 1. What you need to set up (one-time, ~15 minutes)

You need two free accounts: **Supabase** (the database that stores your
services, hours and bookings) and **Vercel** (hosts the website for free).

### Step 1 — Create a free Supabase project

1. Go to [supabase.com](https://supabase.com) and sign up (free tier is enough).
2. Click **New project**. Pick any name (e.g. "natural-by-cara"), set a
   database password (save it somewhere, you likely won't need it again),
   pick a region close to South Africa, and create it. Wait a minute or two
   for it to finish setting up.
3. Once it's ready, open the **SQL Editor** (left sidebar) → **New query**.
4. Open the file `supabase/schema.sql` from this project, copy the whole
   thing, paste it into the SQL editor, and click **Run**. This creates all
   the tables and adds two starter services ("Back & Neck" and "Full Body")
   which you can rename, reprice, or replace later from `/admin` → Services.
5. Go to **Project Settings → API**. You'll need three values from this
   page in Step 3 below:
   - **Project URL**
   - **anon / public key**
   - **service_role key** (click "Reveal" — keep this one secret, never
     share it publicly)

### Step 2 — Pick your admin password

Decide on a password you'll type in to open `/admin` (just for you, no
username needed). Also generate a random "session secret" — this is just a
long random string used internally to keep your login secure; you never
type it in yourself. If you have a terminal handy you can run
`openssl rand -hex 32` to generate one, or use any password generator to
make a long random string (32+ characters).

### Step 3 — Set your environment variables

This project needs 5 values, called "environment variables":

| Variable | Where it comes from |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API → anon public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API → service_role key (secret!) |
| `ADMIN_PASSWORD` | The password you chose in Step 2 |
| `SESSION_SECRET` | The random string you generated in Step 2 |

**For running it on your own computer:** copy `.env.local.example` to a new
file named `.env.local` in the project folder, and fill in the 5 values.
This file is never uploaded anywhere (it's git-ignored) — it's just for
your own machine.

**For the live website (Vercel):** you'll enter these same 5 values into
Vercel's dashboard in Step 4 below — Vercel does not read your local
`.env.local` file.

### Step 4 — Deploy to Vercel (makes the site live on the internet, free)

1. Go to [vercel.com](https://vercel.com) and sign up (you can sign up with
   GitHub, which makes this easier).
2. Push this project to a GitHub repository (if it isn't already), then in
   Vercel click **Add New → Project** and import that GitHub repo.
3. Before clicking Deploy, open **Environment Variables** in the import
   screen and add all 5 variables from the table above with their real
   values.
4. Click **Deploy**. After a minute or two you'll get a live URL like
   `https://natural-by-cara.vercel.app`.
5. If you ever change an environment variable later, go to your project in
   Vercel → **Settings → Environment Variables**, update it, then
   **Deployments → ⋯ → Redeploy** for the change to take effect.

That's it — the site is now live and working with real data.

---

## 2. Everyday use

### Sharing the booking link with clients

Your public booking page is:

```
https://<your-vercel-domain>/book
```

Put this link in:
- Your **Instagram bio** (@natural.by.cara) — clients tap it straight from
  your profile.
- A **saved/quick reply on WhatsApp** — when someone texts asking for an
  appointment, send them this link instead of going back and forth. They
  pick their own open slot and you'll see it appear in `/admin`.

### Managing your hours and bookings — `/admin`

Go to:

```
https://<your-vercel-domain>/admin
```

Log in with the `ADMIN_PASSWORD` you set. From there:

- **Bookings** — see upcoming bookings (client name, phone, service, date,
  time). Cancel one if needed — this frees the slot back up for other
  clients to book. There's a toggle to also view past/cancelled bookings.
- **Weekly Availability** — set your normal opening hours for each day of
  the week (e.g. closed Sundays, 9am–5pm Mon–Sat). You can add a second
  time range on a day if you take a lunch break / split shift.
- **Date Overrides** — block off a specific date entirely (e.g. a public
  holiday or a day off) or give a specific date different hours than usual,
  without changing your normal weekly schedule.
- **Services** — add, edit, deactivate, or delete your services (name,
  duration in minutes, price). Deactivating a service hides it from `/book`
  without deleting its booking history.

Log out with the button in the admin header when you're done, especially on
a shared/public computer.

---

## For developers (running locally)

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You'll need a
`.env.local` file (see Step 3 above) for the database/login features to
work — without it, `/book` and `/admin` will show errors when they try to
reach Supabase, which is expected until it's configured.

Other useful commands:

```bash
npm run build   # production build
npm run lint    # code linting
npm run test    # unit tests for the slot-availability logic (src/lib/availability.ts)
```

### Project structure

- `src/app/book/` — public booking flow
- `src/app/admin/` — password-gated admin dashboard
- `src/app/api/` — backend API routes used by both of the above
- `src/lib/availability.ts` — the core "which time slots are actually
  bookable" logic (pure functions, unit tested in
  `src/lib/availability.test.ts`)
- `supabase/schema.sql` — the full database schema; paste into the Supabase
  SQL editor on a fresh project to set everything up
- `.env.local.example` — template for the environment variables described
  above
