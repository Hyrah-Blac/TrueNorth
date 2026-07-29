"use client";

import { useEffect, useState } from "react";

/**
 * Used inside each route group's `template.tsx` (Navbar/Footer or the
 * dashboard shell live in that group's `layout.tsx` instead, so they stay
 * static — only this content area transitions on navigation). Uses the
 * same editorial easing/duration tokens as the Hero's entrance animation
 * (see tailwind.config.ts: ease-editorial, duration-900) so route changes
 * feel like part of the same visual language rather than a generic fade.
 * Skips the animation entirely under prefers-reduced-motion.
 *
 * IMPORTANT: once mounted, we deliberately apply NO translate class at
 * all (not even `translate-y-0`) rather than animating down to it. Any
 * transform value — including an identity translate(0,0) — makes this
 * div a containing block for `position: fixed` descendants, which
 * silently breaks full-viewport fixed elements rendered anywhere inside
 * a page (modals, lightboxes, etc): they end up confined to this div's
 * box instead of the viewport. Dropping the class entirely after the
 * entrance animation completes returns the computed transform to `none`
 * and avoids trapping them.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [motionEnabled, setMotionEnabled] = useState(true);

  useEffect(() => {
    setMotionEnabled(!window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    // Small delay so the initial (opacity-0, translated) state actually
    // paints before the transition kicks in — without this, some browsers
    // coalesce the state change and skip the animation on first mount.
    const raf = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div
      className={
        motionEnabled
          ? `transition-all duration-700 ease-editorial ${mounted ? "opacity-100" : "translate-y-2 opacity-0"}`
          : ""
      }
    >
      {children}
    </div>
  );
}