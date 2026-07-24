# Auth & Middleware — Setup Notes

## New dependencies

```bash
npm install @clerk/nextjs svix mongoose zod
```

## Files delivered in this phase

```
src/middleware.ts                          # root — Clerk edge protection
src/middleware/auth.ts                      # requireAuth, getCurrentDbUser
src/middleware/admin.ts                     # requireAdmin
src/app/api/webhooks/clerk/route.ts         # syncs Clerk → MongoDB User
src/database/connection.ts
src/database/constants/roles.ts
src/database/plugins/softDelete.ts
src/database/plugins/timestamps.ts
src/database/models/User.ts
src/types/user.ts
src/lib/config/env.ts
src/lib/errors/AppError.ts
src/lib/logging/logger.ts
src/features/auth/**                        # actions, schemas, hooks, components
.env.example
```

## Wiring into your root layout

Your `src/app/layout.tsx` (not included here — belongs to the public-pages
phase) needs to wrap the app in `<ClerkProvider>`:

```tsx
import { ClerkProvider } from "@clerk/nextjs";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}
```

## Clerk dashboard configuration (required)

See `src/features/auth/README.md` for the full explanation. Summary:

1. Add a custom session claim so `role` is available without extra API calls:
   **Sessions → Customize session token**
   ```json
   { "metadata": "{{user.public_metadata}}" }
   ```
2. Create a webhook endpoint at `{APP_URL}/api/webhooks/clerk` subscribed to
   `user.created`, `user.updated`, `user.deleted`. Copy the signing secret
   into `CLERK_WEBHOOK_SIGNING_SECRET`.
3. Bootstrap your first admin: sign up normally (creates a `customer`), then
   manually set `publicMetadata.role = "admin"` on that user in the Clerk
   dashboard and update the matching MongoDB `User` doc's `role` field to
   `"admin"` to match.

## What's intentionally deferred

- `src/middleware/rate-limit.ts` — belongs with the API routes phase, since
  it needs the actual endpoints to protect.
- Sign-in / sign-up pages and the public route group — belongs with the
  public-pages phase.
- Full `env.ts` (Cloudinary, Resend, M-Pesa keys) — extend the same schema
  in `src/lib/config/env.ts` as those phases land; don't create a second
  env file.
