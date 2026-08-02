import { useEffect, useRef } from "react";

/**
 * Scrolls `containerRef` to the bottom whenever `dependency` changes
 * (new message, typing indicator toggling, etc). Uses smooth scroll
 * after the first paint and instant scroll on mount, so restoring a
 * persisted conversation doesn't visibly animate down the page.
 */
export function useAutoScroll<T>(dependency: T) {
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
      behavior: hasMountedRef.current && !prefersReducedMotion ? "smooth" : "auto",
    });
    hasMountedRef.current = true;
  }, [dependency]);

  return containerRef;
}
