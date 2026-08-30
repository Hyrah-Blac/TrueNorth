import { useEffect, useRef } from "react";

/**
 * Scrolls `containerRef` to the bottom whenever `dependency` changes
 * (new message, typing indicator toggling, etc). Uses smooth scroll
 * after the first paint and instant scroll on mount, so restoring a
 * persisted conversation doesn't visibly animate down the page.
 *
 * `instant`, when true, forces an immediate (non-smooth) scroll for
 * this update regardless of mount state. Pass true while a reply is
 * actively streaming: each chunk changes `dependency`, and re-firing
 * a `behavior: "smooth"` scroll dozens of times a second restarts the
 * browser's scroll animation every time, which visibly fights itself
 * and reads as stutter rather than a calm auto-follow. Structural
 * changes (a new message appearing, the typing indicator toggling)
 * still get the smooth animation.
 */
export function useAutoScroll<T>(dependency: T, instant = false) {
  const containerRef = useRef<HTMLDivElement>(null);
  const hasMountedRef = useRef(false);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    node.scrollTo({
      top: node.scrollHeight,
      // Element.scrollTo's `behavior: "smooth"` is an explicit imperative
      // animation — it is not suppressed by the project's global CSS
      // `prefers-reduced-motion` override, so it's checked here directly.
      behavior: hasMountedRef.current && !instant && !prefersReducedMotion ? "smooth" : "auto",
    });
    hasMountedRef.current = true;
  }, [dependency, instant]);

  return containerRef;
}