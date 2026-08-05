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
 *
 * Two reliability fixes over a naive implementation:
 *  1. Anything already in (or near) the viewport on mount shows immediately
 *     instead of waiting for a scroll event to fire the observer.
 *  2. The observer triggers slightly BEFORE the element is fully in view
 *     (positive rootMargin, low threshold), so content is never scrolled
 *     into visual range while still sitting at opacity-0.
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

    const node = ref.current;
    if (!node) return;

    // If the element is already in (or close to) the viewport the moment
    // this mounts — e.g. a short page, a fast initial scroll position, or
    // a section that just happens to render above the fold — show it
    // immediately rather than waiting on the observer's first callback.
    const rect = node.getBoundingClientRect();
    const alreadyInView = rect.top < window.innerHeight * 1.1 && rect.bottom > 0;
    if (alreadyInView) {
      setVisible(true);
      return;
    }

    setMotionEnabled(true);

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      // threshold 0 + positive rootMargin: fire as soon as the element is
      // within ~120px of entering the viewport, not once it's already
      // partially scrolled into view.
      { threshold: 0, rootMargin: "0px 0px 120px 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const Tag = as;

  return (
    <Tag
      ref={ref as never}
      className={`${motionEnabled ? "transition-all duration-700 ease-editorial" : ""} ${
        visible ? visibleStateByVariant[variant] : hiddenStateByVariant[variant]
      } ${className}`}
      style={motionEnabled ? { transitionDelay: `${delayMs}ms` } : undefined}
    >
      {children}
    </Tag>
  );
}