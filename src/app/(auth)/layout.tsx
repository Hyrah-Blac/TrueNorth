import { WhatsAppButton } from "@/components/whatsapp/WhatsAppButton";
import { AiConcierge } from "@/features/ai/components/AiConcierge";
import { getSiteSettings } from "@/lib/config/siteSettings";

// Route group layout for authentication pages (sign-in, sign-up).
//
// Route groups — folders wrapped in parentheses — don't affect the URL,
// so pages here still resolve to /sign-in and /sign-up. What they DO
// affect is which layout wraps them: this group intentionally has no
// Navbar/Footer, unlike (public)/layout.tsx.
//
// Each auth page (SignInForm, SignUpForm) already renders its own full-screen
// background image, logo, and card, so this layout just passes children
// straight through for chrome — it exists only to opt this route group OUT
// of the public layout's Navbar/Footer. The WhatsApp/AI concierge floating
// buttons are still site-wide utilities though (every non-admin page should
// have a way to reach a human or the concierge), so they're rendered here too.
export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSiteSettings();

  return (
    <>
      {children}
      <WhatsAppButton whatsapp={settings.whatsapp || settings.phone} />
      {settings.ai.enabled ? (
        <AiConcierge welcomeMessage={settings.ai.welcomeMessage} starterPrompts={settings.ai.starterPrompts} />
      ) : null}
    </>
  );
}