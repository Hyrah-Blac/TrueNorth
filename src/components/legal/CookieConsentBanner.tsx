"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Cookie, X } from "lucide-react";

const STORAGE_KEY = "cookieNoticeDismissed:v1";

/**
 * This site currently sets only strictly-necessary cookies (auth session,
 * CSRF, maintenance-mode check) — see /legal/cookie-policy. Those don't
 * legally require opt-in consent, so rather than present a misleading
 * "Accept / Reject" choice with nothing non-essential to actually reject,
 * this is an honest, dismissible notice: it tells the visitor what's set
 * and why, links to the full policy, and gets out of the way. If
 * analytics/marketing cookies are added later, this is the component to
 * upgrade into a real accept/reject prompt gating those specific scripts.
 *
 * A `fixed` element floats over whatever page content happens to be in
 * view underneath it — on the home page specifically, PlanAFlightBanner's
 * From/To search bar sits in normal page flow right after a near-full-
 * height hero, so it's already visible on first load. Staying compact
 * and strictly left-anchored (never spanning toward the WhatsApp/
 * Concierge buttons on the right) is what actually avoids that, rather
 * than tuning bottom-offset numbers against one specific page's layout.
 *
 * rounded-2xl rather than rounded-full: on a narrow phone, "Essential
 * cookies only — no tracking. Learn more" doesn't fit on one line next
 * to an icon and two buttons without either truncating mid-sentence or
 * shrinking the text to the point of being fussy to read. A pill shape
 * assumes single-line content; a softly-rounded rectangle degrades
 * gracefully to two lines on the smallest screens instead, without
 * looking broken — it still reads as one clean, compact block on
 * anything wider.
 */
export function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);
  // Separate from `visible` so the entrance can actually transition:
  // mounting already-visible classes in the same render as `visible`
  // flipping true gives the browser nothing to animate from. Flipping
  // `entered` true one tick later gives it a starting state (translated
  // + transparent) to transition away from.
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    try {
      const dismissed = window.localStorage.getItem(STORAGE_KEY);
      if (!dismissed) {
        setVisible(true);
        const raf = requestAnimationFrame(() => setEntered(true));
        return () => cancelAnimationFrame(raf);
      }
    } catch {
      // localStorage can throw in private-browsing/sandboxed contexts —
      // fail quietly by just not showing the banner rather than crashing.
    }
  }, []);

  function dismiss() {
    setEntered(false);
    // Wait for the exit transition to finish before unmounting, so
    // dismissing doesn't just pop the notice away instantly.
    window.setTimeout(() => setVisible(false), 300);
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // Best-effort only — if storage fails, the notice just reappears
      // next visit, which is a fine fallback.
    }
  }

  if (!visible) return null;

  return (
    <div
      role="region"
      aria-label="Cookie notice"
      // env(safe-area-inset-bottom) keeps this clear of the home
      // indicator on notched phones; bottom-4/sm:bottom-6 supplies the
      // actual visual gap above it.
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      className={`fixed bottom-4 left-4 z-50 w-[calc(100vw-2rem)] max-w-sm transition-all duration-300 ease-out sm:bottom-6 sm:left-6 sm:w-auto ${
        entered ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
      }`}
    >
      <div className="flex items-center gap-2.5 rounded-2xl border border-navy-900/10 bg-white/95 py-2.5 pl-3 pr-2.5 shadow-[0_8px_30px_rgba(11,22,34,0.18)] backdrop-blur-md sm:gap-3 sm:py-3 sm:pl-4 sm:pr-3">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sky-50 text-sky-600 sm:h-8 sm:w-8">
          <Cookie className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden="true" />
        </span>

        <p className="min-w-0 flex-1 text-[0.6875rem] leading-snug text-slate-600 sm:text-xs sm:leading-relaxed">
          Essential cookies only — no tracking.{" "}
          <Link
            href="/legal/cookie-policy"
            className="whitespace-nowrap text-sky-600 underline underline-offset-2 hover:text-sky-700"
          >
            Learn more
          </Link>
        </p>

        <button
          type="button"
          onClick={dismiss}
          className="font-display shrink-0 rounded-full bg-navy-900 px-3 py-1.5 text-[0.625rem] font-medium uppercase tracking-[0.1em] text-white transition-colors duration-300 hover:bg-navy-800 sm:px-3.5 sm:py-2 sm:text-[0.6875rem]"
        >
          Got it
        </button>

        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss cookie notice"
          className="shrink-0 rounded-full p-1 text-slate-400 transition-colors duration-300 hover:bg-slate-100 hover:text-navy-900"
        >
          <X className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}