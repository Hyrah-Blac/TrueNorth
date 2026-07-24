import type { ReactNode } from "react";
import { Container } from "../container/Container";
import { Reveal } from "@/components/shared/Reveal";

interface SectionProps {
  children: ReactNode;
  className?: string;
  tone?: "white" | "slate" | "navy" | "graphite";
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

export function Section({ children, className = "", tone = "white", id }: SectionProps) {
  return (
    <section id={id} className={`py-10 lg:py-16 ${toneStyles[tone]} ${className}`}>
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

export function SectionHeading({
  eyebrow,
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
      {eyebrow ? (
        <p
          className={`spec-readout mb-4 text-xs font-medium uppercase tracking-widest2 ${
            tone === "light" ? "text-sky-400" : "text-sky-600"
          }`}
        >
          {eyebrow}
        </p>
      ) : null}
      <h2
        className={`font-editorial text-3xl font-medium leading-[1.15] tracking-tight lg:text-4xl ${
          tone === "light" ? "text-white" : "text-navy-900"
        }`}
      >
        {title}
      </h2>
      {description ? (
        <p
          className={`mt-5 font-body text-base leading-relaxed lg:text-lg ${
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