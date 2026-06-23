const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "textarea:not([disabled])",
  "select:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

const isVisible = (el: HTMLElement): boolean => {
  // visibility inherits, so the element's own computed value already accounts for ancestors.
  if (window.getComputedStyle(el).visibility === "hidden") return false;
  // display:none does NOT inherit, so an ancestor with display:none (or the hidden
  // attribute) removes the whole subtree from the tab order — walk up to catch it.
  let node: HTMLElement | null = el;
  while (node) {
    if (node.hidden) return false;
    if (window.getComputedStyle(node).display === "none") return false;
    node = node.parentElement;
  }
  return true;
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
