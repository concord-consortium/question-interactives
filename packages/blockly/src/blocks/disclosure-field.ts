import { FieldImage, utils } from "blockly/core";

export const DISCLOSURE_LABEL_COLLAPSED = "Show child blocks";
export const DISCLOSURE_LABEL_EXPANDED = "Hide child blocks";

export const PLUS_ICON = "data:image/svg+xml;utf8," +
  "<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16'>" +
  "<text fill='white' x='8' y='12' text-anchor='middle' font-size='14'>+</text></svg>";

export const MINUS_ICON = "data:image/svg+xml;utf8," +
  "<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16'>" +
  "<text fill='white' x='8' y='12' text-anchor='middle' font-size='14'>−</text></svg>";

/**
 * The +/- toggle that opens a custom block's child-block area.
 *
 * FieldImage announces its alt text verbatim, so the old `"+/-"` alt read out as
 * "plus slash minus, button", and whether the block was open or closed was invisible.
 *
 * The field owns its whole presentation: `setExpanded` swaps the icon image, the accessible
 * name, and the aria state together, so callers can't set one and forget another (the icon
 * image and the accessible name used to be set by separate call sites, and the restore path
 * set only the image -- announcing the inverse of the block's real state).
 *
 * aria-expanded is applied by overriding `recomputeAriaContext` (public API) rather than by
 * setting the attribute from the click handler, for two reasons:
 * - `FieldImage.setAlt()` never touches ARIA -- it only updates `altText` and the SVG `alt`
 *   attribute. The accessible name only reaches the DOM via `recomputeAriaContext()`, which is
 *   the only place that calls `setState(el, LABEL, getAriaValue())`.
 * - On the restore path the field's DOM is newly created, and `initView()` -> `recomputeAriaContext()`
 *   is the only hook that stamps it. An attribute set from the click handler would never have
 *   existed on the re-created element.
 */
export class DisclosureField extends FieldImage {
  private expanded = false;

  isExpanded(): boolean {
    return this.expanded;
  }

  setExpanded(expanded: boolean) {
    this.expanded = expanded;
    this.setValue(expanded ? MINUS_ICON : PLUS_ICON);
    this.setAlt(expanded ? DISCLOSURE_LABEL_EXPANDED : DISCLOSURE_LABEL_COLLAPSED);
    this.recomputeAriaContext();
  }

  /**
   * Keep the toggle out of the *block-level* label, exactly as `DecorativeIcon` does.
   *
   * `FieldImage.computeAriaLabel()` folds the alt text into the label Blockly composes for the
   * whole block, so a report block read out as "…, image: Hide child blocks" — advertising a
   * control that a read-only workspace does not let the reader operate.
   *
   * This costs the toggle nothing: its own accessible name is published from
   * `recomputeAriaContext()` via `getAriaValue()` (the alt text), which is a separate path.
   * Focus the toggle in an editable workspace and it still says "Show/Hide child blocks".
   */
  override computeAriaLabel(): string {
    return "";
  }

  override recomputeAriaContext(): boolean {
    // Per Blockly's contract, a false return means this element is hidden from the accessibility
    // tree (flyout blocks) or has no accessible role (read-only workspaces, e.g. the report view).
    // Neither may carry aria-expanded, so stop where Blockly's own subclasses stop.
    if (!super.recomputeAriaContext()) return false;

    utils.aria.setState(this.getFocusableElement(), utils.aria.State.EXPANDED, this.expanded);
    return true;
  }
}
