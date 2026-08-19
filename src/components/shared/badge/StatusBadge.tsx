export type BadgeTone = "neutral" | "info" | "warning" | "success" | "danger" | "gold";

// Flat, borderless — dot + text only, no pill container or fill. This is
// the restrained pattern premium fintech/SaaS products (Mercury, Wise)
// use for status: color is reserved almost entirely for the one primary
// action on a page, so a boxed, tinted pill everywhere else reads as
// busier and less considered than just letting the dot carry the color
// and the text sit quietly next to it.
const toneStyles: Record<BadgeTone, { text: string; dot: string }> = {
  neutral: { text: "text-slate-500", dot: "bg-slate-400" },
  info: { text: "text-sky-700", dot: "bg-sky-500" },
  warning: { text: "text-gold-600", dot: "bg-gold-500" },
  success: { text: "text-green-700", dot: "bg-green-500" },
  danger: { text: "text-red-700", dot: "bg-red-500" },
  gold: { text: "text-gold-600", dot: "bg-gold-500" },
};

/**
 * Shared status indicator — the common visual base for BookingStatusBadge,
 * PaymentStatusBadge, and QuoteStatusBadge. Each of those keeps its own
 * status→tone/label mapping (domain logic); this component only owns the
 * shared look.
 */
export function StatusBadge({
  tone,
  pulse,
  children,
}: {
  tone: BadgeTone;
  /** Animates the dot — use for statuses that represent active, in-flight work. */
  pulse?: boolean;
  children: React.ReactNode;
}) {
  const styles = toneStyles[tone];

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[9px] font-medium uppercase tracking-wide transition-colors ${styles.text}`}
    >
      <span className="relative flex h-1.5 w-1.5 shrink-0">
        {pulse ? (
          <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 ${styles.dot}`} />
        ) : null}
        <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${styles.dot}`} />
      </span>
      {children}
    </span>
  );
}