"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { ConciergeButton } from "./ConciergeButton";

// The provider + panel (context, markdown renderer, smart cards, focus
// trap) are the bulk of the Concierge's JS. Deferring them behind
// next/dynamic with ssr:false means none of that code is fetched or
// executed until the person actually opens the assistant — only the
// small floating trigger button ships with the initial page bundle.
const ConciergePanelLazy = dynamic(
  () => import("./ConciergePanelWithProvider").then((mod) => mod.ConciergePanelWithProvider),
  { ssr: false }
);

export function AiConcierge() {
  const [open, setOpen] = useState(false);
  // Once true, the heavy bundle stays mounted (just visually hidden)
  // so an in-flight reply or draft message survives closing the panel.
  const [hasOpenedOnce, setHasOpenedOnce] = useState(false);

  // Guards the first-open animation below so it only ever fires once
  // per mount. It intentionally lives outside React state/deps: if
  // `open` were a dependency of that effect, every later close (open
  // going true -> false) would re-run the effect and its guard would
  // no longer hold, immediately scheduling setOpen(true) again on the
  // next frame — reopening the panel right after the user closed it.
  const didAutoOpenRef = useRef(false);

  function handleOpen() {
    if (hasOpenedOnce) {
      setOpen(true);
      return;
    }
    // First open: mount the panel in its closed state, then flip it open
    // on the next frame so the slide-in transition has somewhere to
    // animate from, instead of appearing already-open.
    setHasOpenedOnce(true);
  }

  useEffect(() => {
    if (!hasOpenedOnce || didAutoOpenRef.current) return;
    didAutoOpenRef.current = true;
    const frame = requestAnimationFrame(() => setOpen(true));
    return () => cancelAnimationFrame(frame);
  }, [hasOpenedOnce]);

  function handleClose() {
    setOpen(false);
  }

  return (
    <>
      <ConciergeButton open={open} onOpen={handleOpen} />
      {hasOpenedOnce ? <ConciergePanelLazy open={open} onClose={handleClose} /> : null}
    </>
  );
}