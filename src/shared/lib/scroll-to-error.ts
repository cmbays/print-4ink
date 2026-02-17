/**
 * Scrolls the viewport to the first form validation error on the page.
 * Uses `requestAnimationFrame` to wait for the DOM to update after
 * state changes (e.g., setting error messages).
 *
 * Targets elements with `role="alert"` which is the pattern used by
 * our form error messages.
 */
export function scrollToFirstError() {
  // Double-rAF ensures React has committed new tab content after a tab switch
  // before we attempt to find and scroll to the error element.
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      const errorEl = document.querySelector('[role="alert"]');
      if (errorEl) {
        const prefersReducedMotion = window.matchMedia(
          "(prefers-reduced-motion: reduce)"
        ).matches;
        errorEl.scrollIntoView({
          behavior: prefersReducedMotion ? "auto" : "smooth",
          block: "center",
        });
      }
    });
  });
}
