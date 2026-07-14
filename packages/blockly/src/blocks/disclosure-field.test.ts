import { FieldImage } from "blockly/core";

import {
  DISCLOSURE_LABEL_COLLAPSED, DISCLOSURE_LABEL_EXPANDED, DisclosureField, MINUS_ICON, PLUS_ICON
} from "./disclosure-field";

describe("DisclosureField", () => {
  let element: SVGElement;
  let field: DisclosureField;
  let superRecompute: jest.SpiedFunction<typeof FieldImage.prototype.recomputeAriaContext>;

  beforeEach(() => {
    element = document.createElementNS("http://www.w3.org/2000/svg", "g");
    field = new DisclosureField(PLUS_ICON, 16, 16, DISCLOSURE_LABEL_COLLAPSED);

    // Blockly's own ARIA pass needs a rendered field; stub it out so these tests exercise
    // only our override. Rendering Blockly under jsdom is what made QI-181 expensive.
    // block-factory.nested-override.test.ts covers the real, rendered field end to end.
    superRecompute = jest.spyOn(FieldImage.prototype, "recomputeAriaContext").mockReturnValue(true);
    jest.spyOn(field, "getFocusableElement").mockReturnValue(element);
  });

  afterEach(() => jest.restoreAllMocks());

  it("starts collapsed and says so", () => {
    field.recomputeAriaContext();

    expect(field.isExpanded()).toBe(false);
    expect(element.getAttribute("aria-expanded")).toBe("false");
  });

  it("exposes aria-expanded, the expanded name, and the minus icon when expanded", () => {
    const setAlt = jest.spyOn(field, "setAlt");

    field.setExpanded(true);

    expect(field.isExpanded()).toBe(true);
    expect(element.getAttribute("aria-expanded")).toBe("true");
    expect(setAlt).toHaveBeenCalledWith(DISCLOSURE_LABEL_EXPANDED);
    expect(field.getValue()).toBe(MINUS_ICON);
  });

  it("goes back to the collapsed name and the plus icon when closed", () => {
    const setAlt = jest.spyOn(field, "setAlt");

    field.setExpanded(true);
    field.setExpanded(false);

    expect(element.getAttribute("aria-expanded")).toBe("false");
    expect(setAlt).toHaveBeenLastCalledWith(DISCLOSURE_LABEL_COLLAPSED);
    expect(field.getValue()).toBe(PLUS_ICON);
  });

  // The whole reason this is a subclass: Blockly rewrites this element's ARIA on every
  // re-render, so aria-expanded has to be re-applied on Blockly's own lifecycle.
  it("re-applies aria-expanded after Blockly re-renders the field", () => {
    field.setExpanded(true);

    element.removeAttribute("aria-expanded");   // what a re-render does
    field.recomputeAriaContext();

    expect(element.getAttribute("aria-expanded")).toBe("true");
  });

  // A false return from super means the element is hidden (flyout blocks) or has role="none"
  // and no label (read-only workspaces, e.g. the report view). Neither may carry aria-expanded.
  it("does not stamp aria-expanded when Blockly keeps the field out of the accessibility tree", () => {
    superRecompute.mockReturnValue(false);

    field.setExpanded(true);

    expect(field.recomputeAriaContext()).toBe(false);
    expect(element.hasAttribute("aria-expanded")).toBe(false);
  });
});
