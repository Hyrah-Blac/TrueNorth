"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

/** Static routes get a fixed, hand-written label. */
const STATIC_PAGE_LABELS: Record<string, string> = {
  "/": "the homepage",
  "/fleet": "the fleet overview page, browsing the full aircraft lineup",
  "/fleet/compare": "the aircraft comparison page",
  "/destinations": "the destinations page",
  "/about": "the About page",
  "/contact": "the Contact page",
  "/request-charter": "the charter request form",
  "/legal/privacy-policy": "the Privacy Policy page",
  "/legal/terms-and-conditions": "the Terms and Conditions page",
  "/legal/refund-policy": "the Refund Policy page",
  "/legal/cookie-policy": "the Cookie Policy page",
  "/sign-in": "the sign-in page",
  "/sign-up": "the sign-up page",
  "/dashboard/bookings": "the customer's My Bookings list",
  "/dashboard/quotes": "the customer's My Quotes list",
  "/dashboard/payments": "the customer's My Payments list",
};

/**
 * Every page uses the root layout's title template (`"%s | Company Name"`),
 * so the segment before the separator is the page-specific title (e.g. an
 * aircraft name) — reading it costs nothing extra, no API call needed.
 */
function pageSpecificTitle(): string | undefined {
  if (typeof document === "undefined") return undefined;
  const [first] = document.title.split(" | ");
  return first?.trim() || undefined;
}

/**
 * Derives a short, natural-language description of the page the visitor
 * is currently on, sent alongside their message so the concierge can
 * reference what they're already looking at. Entirely client-side —
 * pathname + `document.title` only, no additional requests.
 */
export function usePageContext(): string | undefined {
  const pathname = usePathname();
  const [title, setTitle] = useState<string | undefined>(() => pageSpecificTitle());

  useEffect(() => {
    setTitle(pageSpecificTitle());
  }, [pathname]);

  if (pathname in STATIC_PAGE_LABELS) {
    return STATIC_PAGE_LABELS[pathname];
  }

  if (pathname.startsWith("/fleet/") && pathname !== "/fleet/compare") {
    return title ? `the ${title} aircraft detail page` : "an aircraft detail page";
  }

  if (pathname.startsWith("/dashboard/bookings/")) return "one of the customer's booking detail pages";
  if (pathname.startsWith("/dashboard/quotes/")) return "one of the customer's quote detail pages";
  if (pathname.startsWith("/dashboard/payments/")) return "one of the customer's payment pages";

  // Unrecognized route (admin, etc.) — omit context rather than
  // guess at what it is.
  return undefined;
}

/**
 * A small set of page-specific suggested prompts, layered on top of the
 * generic welcome-screen questions when the visitor is on a page the
 * concierge can say something specific about. Returns an empty array
 * everywhere else — the generic suggestions already cover those.
 */
export function useContextualSuggestedPrompts(): string[] {
  const pathname = usePathname();
  const [title, setTitle] = useState<string | undefined>(() => pageSpecificTitle());

  useEffect(() => {
    setTitle(pageSpecificTitle());
  }, [pathname]);

  if (pathname.startsWith("/fleet/") && pathname !== "/fleet/compare" && title) {
    return [`Tell me about the ${title}`, `Is the ${title} pet friendly?`];
  }

  if (pathname === "/destinations") {
    return ["What's the best aircraft for a safari trip?"];
  }

  return [];
}