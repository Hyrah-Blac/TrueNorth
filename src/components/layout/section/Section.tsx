import type { ReactNode, CSSProperties } from "react";
import { Container } from "../container/Container";
import { Reveal } from "@/components/shared/Reveal";

interface SectionProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  tone?: "white" | "slate" | "navy" | "graphite";
  size?: "default" | "slim";
  id?: string;
}

// Four tones give the homepage real alternation — deep navy, a slightly
// lighter graphite step, warm off-white, and a muted slate — rather than
// bouncing between only two backgrounds.
const toneStyles: Record<NonNullable<SectionProps["tone"]>, string> = {
  white: "bg-white",
  slate: "bg-slate-50",
  navy: "bg-navy-950 text-white",
  graphite: "bg-navy-900 text-white",
};

// "slim" is for short text-band sections (a heading + a line or two of
// copy, no grid of content below) — the default vertical rhythm is
// built for sections with real content beneath the heading and looks
// bloated on a band that's just text.
const sizeStyles: Record<NonNullable<SectionProps["size"]>, string> = {
  default: "py-16 lg:py-24",
  slim: "py-10 lg:py-14",
};

export function Section({
  children,
  className = "",
  style,
  tone = "white",
  size = "default",
  id,
}: SectionProps) {
  return (
    <section id={id} style={style} className={`${sizeStyles[size]} ${toneStyles[tone]} ${className}`}>
      <Container>
        <Reveal variant="fade-up">{children}</Reveal>
      </Container>
    </section>
  );
}

/**
 * A plain white breathing gap between two sections. Use this between any
 * two adjacent <Section>s (regardless of their tones) so one block never
 * runs directly into the next — mirrors the clean separation in the
 * reference layout rather than letting slate/navy tones touch edge-to-edge.
 */
export function SectionGap({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const heights: Record<typeof size, string> = {
    sm: "h-10 md:h-16",
    md: "h-16 md:h-24",
    lg: "h-24 md:h-32",
  };
  return <div className={`w-full bg-white ${heights[size]}`} aria-hidden="true" />;
}

/**
 * Site-wide section heading. Bold, uppercase, geometric-display style —
 * matches the reference brand treatment. Eyebrow labels were dropped
 * globally in favor of this single, larger headline; the `eyebrow` prop
 * is kept (unused) so existing call sites that still pass it don't break
 * the build — remove it from callers when convenient.
 */
export function SectionHeading({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- kept so existing callers passing `eyebrow` don't break; intentionally unused
  eyebrow: _eyebrow,
  title,
  description,
  align = "left",
  tone = "dark",
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  tone?: "dark" | "light";
}) {
  return (
    <div className={`max-w-2xl ${align === "center" ? "mx-auto text-center" : ""}`}>
      <h2
        className={`font-display text-xl font-extrabold uppercase leading-[1.15] tracking-tight sm:text-2xl lg:text-3xl ${
          tone === "light" ? "text-white" : "text-navy-900"
        }`}
      >
        {title}
      </h2>
      {description ? (
        <p
          className={`mt-4 font-body text-xs leading-relaxed lg:text-sm ${
            tone === "light" ? "text-slate-200" : "text-slate-600"
          }`}
        >
          {description}
        </p>
      ) : null}
    </div>
  );
}

/** The signature horizon-line divider — a thin gradient rule with a small accent marker. */
export function HorizonDivider({ className = "" }: { className?: string }) {
  return <div className={`horizon-divider ${className}`} aria-hidden="true" />;
}