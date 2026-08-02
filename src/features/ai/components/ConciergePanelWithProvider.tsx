"use client";

import { ConciergeProvider } from "../context/ConciergeContext";
import { ConciergePanel } from "./ConciergePanel";

export function ConciergePanelWithProvider({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <ConciergeProvider>
      <ConciergePanel open={open} onClose={onClose} />
    </ConciergeProvider>
  );
}
