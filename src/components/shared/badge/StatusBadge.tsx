export type BadgeTone = "neutral" | "info" | "warning" | "success" | "danger" | "gold";

const toneStyles: Record<BadgeTone, { pill: string; dot: string }> = {
  neutral: { pill: "bg-slate-100 text-slate-600", dot: "bg-slate-400" },
  info: { pill: "bg-sky-100 text-sky-700", dot: "bg-sky-500" },
  warning: { pill: "bg-gold-200 text-gold-600", dot: "bg-gold-500" },
  success: { pill: "bg-green-100 text-green-700", dot: "bg-green-500" },
  danger: { pill: "bg-red-100 text-red-700", dot: "bg-red-500" },
  gold: { pill: "bg-gold-200 text-gold-600", dot: "bg-gold-500" },
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
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium uppercase tracking-wide transition-colors ${styles.pill}`}
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
