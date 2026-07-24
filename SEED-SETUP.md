# Seed Data — Setup Notes

## New dev dependencies

```bash
npm install -D tsx dotenv
```

## Add to package.json scripts

```json
"scripts": {
  "seed": "tsx src/database/seed/seed.ts"
}
```

## Running it

```bash
npm run seed
```

Requires `MONGODB_URI` to be set (loaded from `.env.local` via the `dotenv/config`
import at the top of the script). Point it at a local or dev database —
**never run this against production**, since it deletes existing aircraft,
quotes, bookings, and payments before reseeding.

## What it creates

- 7 aircraft, one per category, with realistic specs and no photos
  (the fleet cards/gallery already degrade gracefully to the navy
  placeholder treatment — upload real photos via the admin dashboard
  once you have them)
- 1 placeholder admin user + 3 demo customers
- 3 quotes spanning pending / reviewing / rejected states
- 1 confirmed booking with a completed M-Pesa payment, so the
  dashboards and receipt view have something real to render

## Important limitation

Seeded users have placeholder Clerk IDs (`seed_admin_placeholder`,
`seed_customer_1`, etc.) and **cannot actually sign in** — Clerk owns
real authentication, and there's no way to fabricate a valid Clerk
session for a user Clerk doesn't know about.

To explore the app as a real logged-in user:

1. Sign up normally through `/sign-up` — this creates a real Clerk
   account and, via the webhook, a matching MongoDB `User` with the
   `customer` role.
2. To get an admin account, either:
   - Manually set `publicMetadata.role = "admin"` on that user in the
     Clerk dashboard, and update the matching MongoDB document's
     `role` field to `"admin"` to match, **or**
   - If you already have one admin, use `/admin/customers` to promote
     the new account via "Grant Admin Access."

The seeded admin/customers exist so the *admin* dashboard's list and
detail views (bookings, quotes, customers, payments) have realistic
data to browse immediately — not so you can log in as them.
