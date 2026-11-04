"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

type RevealFrom = "up" | "left" | "none";

interface RevealProps {
  children: ReactNode;
  /** Delay in seconds, used to stagger items that enter together. */
  delay?: number;
  /** Where the content travels from as it appears. "none" is a plain fade. */
  from?: RevealFrom;
  className?: string;
}

const HIDDEN: Record<RevealFrom, string> = {
  up: "translate-y-6 opacity-0",
  left: "-translate-x-6 opacity-0",
  none: "opacity-0",
};

// Fades its children in once, the first time they scroll into view.
// - Plays once (the observer disconnects after the first reveal).
// - Skips the animation entirely for people who prefer reduced motion.
// - The "reveal" class lets a <noscript> rule keep content visible if
//   JavaScript is unavailable.
export function Reveal({ children, delay = 0, from = "up", className = "" }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion || !("IntersectionObserver" in window)) {
      setShown(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}s` }}
      className={`reveal transition-[opacity,transform] duration-700 ease-out will-change-transform motion-reduce:transition-none ${
        shown ? "translate-x-0 translate-y-0 opacity-100" : HIDDEN[from]
      } ${className}`}
    >
      {children}
    </div>
  );
}