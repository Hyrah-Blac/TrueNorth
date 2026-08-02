"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
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
    if (!hasOpenedOnce || open) return;
    const frame = requestAnimationFrame(() => setOpen(true));
    return () => cancelAnimationFrame(frame);
  }, [hasOpenedOnce, open]);

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
