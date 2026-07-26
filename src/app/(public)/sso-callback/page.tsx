"use client";

import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";

// Required by the custom sign-in flow's authenticateWithRedirect() call.
// The prebuilt <SignIn> component used to handle the OAuth handshake
// internally; now that sign-in is a custom form, Clerk needs this
// explicit callback route to complete the Google redirect and finish
// establishing the session.
//
// Place this file at:
//   src/app/(public)/sso-callback/page.tsx
export default function SSOCallbackPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-5 bg-navy-950">
      <div className="h-9 w-9 animate-spin rounded-full border-2 border-white/15 border-t-sky-400" />
      <p className="text-sm font-light text-white/50">Completing sign in…</p>
      <AuthenticateWithRedirectCallback
        signInFallbackRedirectUrl="/sign-in"
        signUpFallbackRedirectUrl="/sign-up"
      />
    </div>
  );
}