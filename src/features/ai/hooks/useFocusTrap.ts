import { useEffect, useRef, type RefObject } from "react";

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Traps Tab/Shift+Tab within `containerRef` while `active`, moves focus
 * into the panel on activation, restores it to the trigger on
 * deactivation, and calls `onEscape` for the Escape key. Mirrors the
 * proven pattern in components/shared/modals/Modal.tsx so the Concierge
 * panel behaves identically to every other overlay in the app.
 *
 * `onEscape` is read via a ref rather than being a dependency of the
 * main effect. Callers often pass an inline arrow function that gets a
 * new identity on every render; depending on it directly would tear
 * down and re-run this effect on every parent re-render (e.g. every
 * keystroke), which re-focuses the first focusable element each time
 * and can steal focus away from whatever the user just interacted
 * with (including the close button). Reading through a ref keeps the
 * trap's setup/teardown tied only to `active` actually changing.
 */
export function useFocusTrap(
  containerRef: RefObject<HTMLElement | null>,
  active: boolean,
  onEscape: () => void
) {
  const onEscapeRef = useRef(onEscape);
  useEffect(() => {
    onEscapeRef.current = onEscape;
  }, [onEscape]);

  useEffect(() => {
    if (!active) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const node = containerRef.current;
    const focusables = node?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
    (focusables?.[0] ?? node)?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onEscapeRef.current();
        return;
      }

      if (event.key !== "Tab" || !node) return;

      const focusable = Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    // Intentionally NOT locking document.body.style.overflow here — the
    // page behind the panel should stay scrollable while it's open.

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previouslyFocused?.focus();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, containerRef]);
}