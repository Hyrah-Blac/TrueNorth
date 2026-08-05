"use client";

import { ConciergeProvider } from "../context/ConciergeContext";
import { ConciergePanel } from "./ConciergePanel";

interface ConciergePanelWithProviderProps {
  open: boolean;
  onClose: () => void;
  welcomeMessage: string;
  starterPrompts: string[];
}

export function ConciergePanelWithProvider({
  open,
  onClose,
  welcomeMessage,
  starterPrompts,
}: ConciergePanelWithProviderProps) {
  return (
    <ConciergeProvider>
      <ConciergePanel open={open} onClose={onClose} welcomeMessage={welcomeMessage} starterPrompts={starterPrompts} />
    </ConciergeProvider>
  );
}
