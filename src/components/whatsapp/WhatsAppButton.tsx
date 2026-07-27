"use client";

interface WhatsAppButtonProps {
  /** Live, admin-configured WhatsApp number (falls back to phone upstream if unset). */
  whatsapp: string;
}

// WhatsApp deep link needs digits only (country code + number, no spaces,
// no "+"). The number passed in is formatted for display elsewhere, so
// strip everything but digits here rather than assuming a particular format.
function getWhatsAppHref(whatsapp: string) {
  const digitsOnly = whatsapp.replace(/\D/g, "");
  return `https://wa.me/${digitsOnly}`;
}

/**
 * Fixed floating action button, bottom-right, on every page. Kept in
 * WhatsApp's own recognizable green rather than the site's blue/yellow
 * accents — for a utility icon like this, instant brand recognition
 * matters more than palette consistency. Swap the two hex values below
 * if you'd rather match the site's own colors instead.
 */
export function WhatsAppButton({ whatsapp }: WhatsAppButtonProps) {
  return (
    <a
      href={getWhatsAppHref(whatsapp)}
      target="_blank"
      rel="noreferrer noopener"
      aria-label="Chat with us on WhatsApp"
      className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_8px_24px_rgba(0,0,0,0.35)] transition-transform duration-300 ease-out hover:scale-105 hover:bg-[#20BD5C] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#25D366]"
    >
      <svg viewBox="0 0 32 32" className="h-7 w-7" fill="currentColor" aria-hidden="true">
        <path d="M16.004 3.2c-7.07 0-12.8 5.73-12.8 12.8 0 2.257.593 4.373 1.628 6.207L3.2 28.8l6.77-1.777a12.74 12.74 0 0 0 6.034 1.537h.005c7.07 0 12.8-5.73 12.8-12.8s-5.73-12.8-12.805-12.56zm0 23.253a10.4 10.4 0 0 1-5.303-1.454l-.38-.226-3.994 1.049 1.067-3.894-.248-.4a10.395 10.395 0 0 1-1.594-5.528c0-5.756 4.685-10.44 10.446-10.44 2.79 0 5.412 1.088 7.384 3.062a10.37 10.37 0 0 1 3.056 7.383c0 5.756-4.685 10.448-10.435 10.448zm5.727-7.822c-.313-.157-1.853-.914-2.14-1.02-.287-.105-.497-.157-.706.157-.209.314-.81 1.02-.994 1.229-.183.209-.366.235-.68.078-.313-.157-1.322-.487-2.518-1.554-.93-.83-1.559-1.855-1.742-2.169-.183-.314-.02-.483.138-.64.14-.14.313-.366.47-.549.157-.183.209-.314.313-.523.105-.209.052-.392-.026-.549-.078-.157-.706-1.702-.968-2.332-.255-.612-.514-.53-.706-.54a13.6 13.6 0 0 0-.601-.012c-.209 0-.549.078-.836.392-.287.314-1.098 1.073-1.098 2.618s1.124 3.036 1.281 3.245c.157.209 2.212 3.376 5.36 4.735.749.323 1.333.516 1.789.66.751.239 1.435.205 1.975.124.602-.09 1.853-.757 2.114-1.489.261-.732.261-1.36.183-1.489-.078-.13-.287-.209-.601-.366z" />
      </svg>
    </a>
  );
}