export function StatCard({
  label,
  value,
  hint,
  icon: _icon,
}: {
  label: string;
  value: string;
  hint?: string;
  /** @deprecated icons removed — pass anything, it is ignored */
  icon?: unknown;
}) {
  return (
    <div
      className="group relative overflow-hidden rounded-2xl bg-white p-5"
      style={{
        border: "1px solid rgba(0,0,0,0.06)",
        boxShadow: "0 1px 3px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.8)",
      }}
    >
      {/* Blue accent stripe on hover — original behaviour */}
      <div
        className="absolute left-0 top-0 h-full w-0.5 rounded-l-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: "linear-gradient(180deg, rgb(43 91 191) 0%, transparent 100%)" }}
        aria-hidden="true"
      />

      {/* Label */}
      <p
        className="text-[9px] font-medium uppercase tracking-[0.16em] text-slate-400"
        style={{ fontFamily: "var(--font-data, ui-monospace, monospace)" }}
      >
        {label}
      </p>

      {/* Value */}
      <p
        className="mt-3 text-2xl font-light leading-none tracking-tight text-slate-800"
        style={{ fontFamily: "var(--font-editorial, system-ui, sans-serif)" }}
      >
        {value}
      </p>

      {hint ? (
        <p
          className="mt-1.5 text-[9px] uppercase tracking-[0.14em] text-slate-300"
          style={{ fontFamily: "var(--font-data, ui-monospace, monospace)" }}
        >
          {hint}
        </p>
      ) : null}
    </div>
  );
}