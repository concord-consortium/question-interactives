import { FieldImage } from "blockly/core";

/**
 * A `FieldImage` that is purely decorative: its picture duplicates the text label sitting right
 * next to it, so a screen reader gains nothing from it.
 *
 * An empty alt text is not enough to make such an icon silent. `FieldImage.getAriaValue()` returns
 * `altText || null`, and `Field.computeAriaLabel()` substitutes `Msg.FIELD_LABEL_EMPTY` -- the
 * lowercase word "empty" -- whenever the aria value is missing. That word then lands in the
 * block-level ARIA label ("setup, empty") and from there in our move announcements ("if, do
 * connected inside setup, empty"), where it reads as a claim that `setup` has no children.
 *
 * Returning an empty string from `computeAriaLabel()` excludes the field from the block-level
 * label. That is the documented contract of `Field.computeAriaLabel()`: "If this method returns an
 * empty string, the output will be ignored when composing the block-level ARIA label."
 *
 * This is only correct for icons that add no information. An icon a user can act on (the +/-
 * disclosure toggle) must keep its name -- see `DisclosureField`.
 */
export class DecorativeIcon extends FieldImage {
  override computeAriaLabel(): string {
    return "";
  }
}
