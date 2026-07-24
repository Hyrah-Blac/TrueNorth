"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

type RevealVariant = "fade-up" | "fade-in" | "blur-in";

interface RevealProps {
  children: ReactNode;
  variant?: RevealVariant;
  delayMs?: number;
  className?: string;
  as?: "div" | "section";
}

const hiddenStateByVariant: Record<RevealVariant, string> = {
  "fade-up": "opacity-0 translate-y-8",
  "fade-in": "opacity-0",
  "blur-in": "opacity-0 blur-md",
};

const visibleStateByVariant: Record<RevealVariant, string> = {
  "fade-up": "opacity-100 translate-y-0",
  "fade-in": "opacity-100",
  "blur-in": "opacity-100 blur-0",
};

/**
 * Slow, editorial scroll-reveal — never a bounce or spring, just a quiet
 * fade/slide/blur into place. Fully inert (renders children plainly, no
 * hidden state) for users who prefer reduced motion, and falls back to
 * "just visible" if IntersectionObserver isn't available.
 */
export function Reveal({ children, variant = "fade-up", delayMs = 0, className = "", as = "div" }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [motionEnabled, setMotionEnabled] = useState(false);

  useEffect(() => {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced || typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    setMotionEnabled(true);

    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -60px 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const Tag = as;

  return (
    <Tag
      ref={ref as never}
      className={`${motionEnabled ? "transition-all duration-1000 ease-editorial" : ""} ${
        visible ? visibleStateByVariant[variant] : hiddenStateByVariant[variant]
      } ${className}`}
      style={motionEnabled ? { transitionDelay: `${delayMs}ms` } : undefined}
    >
      {children}
    </Tag>
  );
}
