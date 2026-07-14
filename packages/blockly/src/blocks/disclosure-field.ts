import { FieldImage, utils } from "blockly/core";

export const DISCLOSURE_LABEL_COLLAPSED = "Show child blocks";
export const DISCLOSURE_LABEL_EXPANDED = "Hide child blocks";

/**
 * The +/- toggle that opens a custom block's child-block area.
 *
 * FieldImage announces its alt text verbatim, so the old `"+/-"` alt read out as
 * "plus slash minus, button", and whether the block was open or closed was invisible.
 *
 * aria-expanded is applied by overriding `recomputeAriaContext` (public API) rather than by
 * setting the attribute from the click handler: Blockly re-runs `recomputeAriaContext` on every
 * re-render and rewrites `role` and `aria-label` on this element, so an attribute set outside
 * that lifecycle would survive until the first re-render and then silently disappear.
 */
export class DisclosureField extends FieldImage {
  private expanded = false;

  isExpanded(): boolean {
    return this.expanded;
  }

  setExpanded(expanded: boolean) {
    this.expanded = expanded;
    this.setAlt(expanded ? DISCLOSURE_LABEL_EXPANDED : DISCLOSURE_LABEL_COLLAPSED);
    this.recomputeAriaContext();
  }

  override recomputeAriaContext(): boolean {
    const customized = super.recomputeAriaContext();
    // getFocusableElement() throws (rather than returning null) when the field hasn't been
    // rendered into a workspace yet; Blockly's own recomputeAriaContext guards the same call
    // with a try/catch, so mirror that here instead of letting construction-time calls throw.
    let element: HTMLElement | SVGElement | null = null;
    try {
      element = this.getFocusableElement();
    } catch {
      return customized;
    }
    if (element) {
      utils.aria.setState(element, utils.aria.State.EXPANDED, this.expanded);
    }
    return customized;
  }
}
