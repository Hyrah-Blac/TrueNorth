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
  "/privacy": "the Privacy Policy page",
  "/terms": "the Terms of Service page",
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

  // Unrecognized route (admin, sign-in, etc.) — omit context rather than
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
