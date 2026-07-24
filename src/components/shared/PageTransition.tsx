"use client";

import { useEffect, useState } from "react";

/**
 * Used inside each route group's `template.tsx` (Navbar/Footer or the
 * dashboard shell live in that group's `layout.tsx` instead, so they stay
 * static — only this content area fades on navigation). Kept quick (300ms)
 * since this fires on every click, not just hero/section reveals. Skips
 * the animation entirely under prefers-reduced-motion.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [motionEnabled, setMotionEnabled] = useState(true);

  useEffect(() => {
    setMotionEnabled(!window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    setMounted(true);
  }, []);

  return (
    <div
      className={motionEnabled ? `transition-opacity duration-300 ease-out ${mounted ? "opacity-100" : "opacity-0"}` : ""}
    >
      {children}
    </div>
  );
}
