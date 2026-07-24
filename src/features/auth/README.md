# Auth Feature

Clerk-based authentication with two roles: `customer` and `admin`.

## Structure

- `actions/` — server actions for profile self-service and admin role management
- `components/` — `RoleGuard` (client-side UI gating) and `Unauthorized` fallback
- `hooks/` — `useCurrentUser`, a typed wrapper around Clerk's `useUser`
- `lib/` — `permissions.ts`, pure functions answering "can this role do X"
- `schemas/` — zod validation for profile updates and role assignment
- `types/` — shared types for this feature

## How authorization works (three layers)

1. **Edge** — `src/middleware.ts` reads `sessionClaims.metadata.role` to
   redirect unauthenticated users and non-admins away from `/admin/*`
   and `/dashboard/*` before the page even renders. Fast, but a hint,
   not the security boundary.
2. **Server** — every server action and API route handler calls
   `requireAuth()` (`src/middleware/auth.ts`) or `requireAdmin()`
   (`src/middleware/admin.ts`) as its first line. This is the
   authoritative check — it re-verifies the Clerk session server-side
   and throws `UnauthorizedError` / `ForbiddenError` if it fails.
3. **Client** — `RoleGuard` hides admin-only UI from customers as a
   UX nicety. It must never be the only thing standing between a
   customer and admin data, since client state can be inspected/edited.

## Data model

- **Clerk** owns sign-in/sign-up, sessions, and `publicMetadata.role`
  (the fast-path claim read by edge middleware).
- **MongoDB `User`** mirrors each Clerk user (kept in sync via the
  `/api/webhooks/clerk` webhook on `user.created` / `user.updated` /
  `user.deleted`) and is the source of truth for profile fields
  (name, phone, company) and for role-based queries elsewhere in the app.
- Both must be updated together on role changes — see
  `updateUserRole` in `actions/user.actions.ts` for the pattern.

## Required Clerk dashboard setup

1. In **Sessions → Customize session token**, add a custom claim:
   ```json
   { "metadata": "{{user.public_metadata}}" }
   ```
   This is what makes `sessionClaims.metadata.role` available in
   both edge middleware and server actions without an extra API call.
2. In **Webhooks**, create an endpoint pointing to
   `{APP_URL}/api/webhooks/clerk` subscribed to `user.created`,
   `user.updated`, and `user.deleted`. Copy the signing secret into
   `CLERK_WEBHOOK_SIGNING_SECRET`.
3. New users default to `role: "customer"` in both Clerk and MongoDB.
   Promote an account to admin by calling `updateUserRole` (or setting
   `publicMetadata.role = "admin"` directly in the Clerk dashboard for
   the very first admin account, then updating its MongoDB doc to match).
