"use client";

import { useState } from "react";
import { useClerk, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { UserCircle } from "@phosphor-icons/react";
import { Button } from "@/components/shared/buttons/Button";

interface WrongAccountNoticeProps {
  /** What kind of resource the link pointed to, e.g. "quote", "booking", "payment". Used only for the copy. */
  resourceLabel: string;
}

/**
 * Shown instead of a generic 404 when a signed-in user opens a
 * quote/booking/payment link (typically from an email notification)
 * that belongs to a *different* account. This is the common case where
 * someone has two accounts (e.g. personal + company email) and clicked
 * the link while the "wrong" one was active in that browser — a plain
 * "Page Not Found" gives them no way to tell that apart from a broken
 * or expired link, so they can't self-serve a fix.
 *
 * Not shown for a genuinely missing/invalid resource — pages should
 * keep using notFound() for that case, and only render this for an
 * authorization mismatch (ForbiddenError) specifically.
 */
export function WrongAccountNotice({ resourceLabel }: WrongAccountNoticeProps) {
  const { signOut } = useClerk();
  const { user } = useUser();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const currentEmail = user?.primaryEmailAddress?.emailAddress;

  const handleSwitchAccount = async () => {
    setLoading(true);
    // Preserve the exact link so the sign-in flow can send them right
    // back here once they've authenticated with the correct account,
    // instead of dropping them on the generic dashboard home.
    const returnTo = window.location.pathname;
    await signOut();
    router.push(`/sign-in?redirect_url=${encodeURIComponent(returnTo)}`);
  };

  return (
    <div className="mx-auto flex max-w-xl flex-col items-center gap-4 rounded-2xl border border-slate-200 bg-white px-8 py-14 text-center">
      <UserCircle className="h-10 w-10 text-slate-400" weight="light" />
      <h1 className="font-display text-lg font-medium text-navy-900">Wrong account signed in</h1>
      <p className="max-w-md text-sm text-slate-600">
        This {resourceLabel} link is for a different account than the one you're currently signed in
        with{currentEmail ? ` (${currentEmail})` : ""}. Sign out and sign back in with the account that
        received the original email to view it.
      </p>
      <Button onClick={handleSwitchAccount} disabled={loading} variant="primary" size="md">
        {loading ? "Signing out\u2026" : "Switch account"}
      </Button>
    </div>
  );
}
