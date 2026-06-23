const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "textarea:not([disabled])",
  "select:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

const isVisible = (el: HTMLElement): boolean => {
  if (el.hidden) return false;
  const style = window.getComputedStyle(el);
  return style.display !== "none" && style.visibility !== "hidden";
};

/**
 * Returns the focusable elements within `root` (default: the whole document),
 * in DOM order, excluding disabled and visually-hidden elements. Used to resolve
 * the first (forward) and last (reverse) focus targets for the focus protocol.
 */
export const getFocusableElements = (root: ParentNode = document): HTMLElement[] => {
  const nodes = Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
  return nodes.filter(isVisible);
};
