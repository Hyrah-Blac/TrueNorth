export type BadgeTone = "neutral" | "info" | "warning" | "success" | "danger" | "gold";

// A thin tinted border + near-white fill + colored text reads as
// considered rather than a default UI-kit pastel pill. Using opacity
// modifiers on each color's mid shade (500/600) rather than needing a
// dedicated pale shade per tone keeps this consistent even though gold
// only has 600/500/200 defined and green/red don't have a 300.
const toneStyles: Record<BadgeTone, { pill: string; dot: string }> = {
  neutral: { pill: "border border-slate-300 bg-white text-slate-600", dot: "bg-slate-400" },
  info: { pill: "border border-sky-500/30 bg-sky-500/5 text-sky-700", dot: "bg-sky-500" },
  warning: { pill: "border border-gold-500/30 bg-gold-500/5 text-gold-600", dot: "bg-gold-500" },
  success: { pill: "border border-green-500/30 bg-green-500/5 text-green-700", dot: "bg-green-500" },
  danger: { pill: "border border-red-500/30 bg-red-500/5 text-red-700", dot: "bg-red-500" },
  gold: { pill: "border border-gold-500/30 bg-gold-500/5 text-gold-600", dot: "bg-gold-500" },
};

/**
 * Shared pill badge with a leading status dot — the common visual base for
 * BookingStatusBadge, PaymentStatusBadge, and QuoteStatusBadge. Each of
 * those keeps its own status→tone/label mapping (domain logic); this
 * component only owns the shared look.
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
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-medium uppercase tracking-wide transition-colors ${styles.pill}`}
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