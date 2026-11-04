"use client";

import { usePathname } from "next/navigation";
import { WhatsAppButton } from "@/components/whatsapp/WhatsAppButton";
import { AiConcierge } from "./AiConcierge";
import { isConciergeHiddenPath } from "../lib/conciergeRoutes";

interface FloatingActionsProps {
  whatsapp: string;
  aiEnabled: boolean;
  welcomeMessage: string;
  starterPrompts: string[];
}

/**
 * The floating WhatsApp + AI Concierge buttons, mounted once per layout
 * that wants them ((public), (auth), (customer)). Single source of truth
 * so every such layout behaves the same, and routes that shouldn't show
 * them (see conciergeRoutes.ts) are handled in one place.
 */
export function FloatingActions({ whatsapp, aiEnabled, welcomeMessage, starterPrompts }: FloatingActionsProps) {
  const pathname = usePathname();
  if (isConciergeHiddenPath(pathname)) return null;

  return (
    <>
      <WhatsAppButton whatsapp={whatsapp} />
      {aiEnabled ? <AiConcierge welcomeMessage={welcomeMessage} starterPrompts={starterPrompts} /> : null}
    </>
  );
}