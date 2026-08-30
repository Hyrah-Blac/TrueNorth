"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { ConciergeButton } from "./ConciergeButton";

const loadConciergePanel = () => import("./ConciergePanelWithProvider").then((mod) => mod.ConciergePanelWithProvider);

const ConciergePanelLazy = dynamic(loadConciergePanel, { ssr: false });

interface AiConciergeProps {
  welcomeMessage: string;
  starterPrompts: string[];
}

export function AiConcierge({ welcomeMessage, starterPrompts }: AiConciergeProps) {
  const [open, setOpen] = useState(false);
  // Once true, the heavy bundle stays mounted (just visually hidden)
  // so an in-flight reply or draft message survives closing the panel.
  const [hasOpenedOnce, setHasOpenedOnce] = useState(false);

  // Touch devices tap the FAB with no hover beforehand, so hover-based
  // warm-up alone would miss them — this covers that case by prefetching
  // once the browser is idle (i.e. after anything more urgent on the
  // page has had a chance to run), rather than competing with initial
  // page load for bandwidth/main-thread time.
  useEffect(() => {
    if (typeof window === "undefined") return;

    // typeof-checked rather than a plain truthiness check on
    // window.requestIdleCallback: TS's DOM lib declares this method as
    // always present, so `window.requestIdleCallback && ...` reads to
    // the type checker as an always-true condition and gets flagged by
    // no-unnecessary-condition-style lint rules. At runtime it's very
    // much not always present — Safari has never shipped it — so the
    // guard is genuinely needed; typeof-checking a runtime value avoids
    // the false-positive lint while still detecting support correctly.
    const supportsIdleCallback = typeof window.requestIdleCallback === "function";

    const idleId = supportsIdleCallback
      ? window.requestIdleCallback(() => void loadConciergePanel())
      : window.setTimeout(() => void loadConciergePanel(), 2000);

    return () => {
      if (supportsIdleCallback) {
        window.cancelIdleCallback(idleId);
      } else {
        window.clearTimeout(idleId);
      }
    };
  }, []);

  // Fires on hover/focus of the launch button too — a desktop visitor
  // almost always hovers before clicking, so this warms the module
  // cache a little earlier still. Harmless to call more than once —
  // dynamic()'s loader is memoized internally.
  function handleWarmUp() {
    void loadConciergePanel();
  }

  function handleOpen() {
    if (hasOpenedOnce) {
      setOpen(true);
      return;
    }
    // First open: mount the panel in its closed state, then flip it
    // open on the next frame so the slide-in transition has somewhere
    // to animate from, instead of appearing already-open. This RAF is
    // scoped to this one action only — it must NOT be a useEffect keyed
    // off `open`/`hasOpenedOnce`, or it re-fires (and reopens the panel)
    // every time the panel is later closed.
    setHasOpenedOnce(true);
    requestAnimationFrame(() => setOpen(true));
  }

  function handleClose() {
    setOpen(false);
  }

  return (
    <>
      <ConciergeButton open={open} onOpen={handleOpen} onWarmUp={handleWarmUp} />
      {hasOpenedOnce ? (
        <ConciergePanelLazy
          open={open}
          onClose={handleClose}
          welcomeMessage={welcomeMessage}
          starterPrompts={starterPrompts}
        />
      ) : null}
    </>
  );
}