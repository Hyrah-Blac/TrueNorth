"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { ConciergeButton } from "./ConciergeButton";

const ConciergePanelLazy = dynamic(
  () => import("./ConciergePanelWithProvider").then((mod) => mod.ConciergePanelWithProvider),
  { ssr: false }
);

interface AiConciergeProps {
  welcomeMessage: string;
  starterPrompts: string[];
}

export function AiConcierge({ welcomeMessage, starterPrompts }: AiConciergeProps) {
  const [open, setOpen] = useState(false);
  // Once true, the heavy bundle stays mounted (just visually hidden)
  // so an in-flight reply or draft message survives closing the panel.
  const [hasOpenedOnce, setHasOpenedOnce] = useState(false);

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
      <ConciergeButton open={open} onOpen={handleOpen} />
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