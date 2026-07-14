import { FieldImage } from "blockly/core";

import {
  DISCLOSURE_LABEL_COLLAPSED, DISCLOSURE_LABEL_EXPANDED, DisclosureField
} from "./disclosure-field";

const ICON = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg'/>";

describe("DisclosureField", () => {
  let element: SVGElement;
  let field: DisclosureField;

  beforeEach(() => {
    element = document.createElementNS("http://www.w3.org/2000/svg", "g");
    field = new DisclosureField(ICON, 16, 16, DISCLOSURE_LABEL_COLLAPSED);

    // Blockly's own ARIA pass needs a rendered field; stub it out so these tests exercise
    // only our override. Rendering Blockly under jsdom is what made QI-181 expensive.
    jest.spyOn(FieldImage.prototype, "recomputeAriaContext").mockReturnValue(true);
    jest.spyOn(field, "getFocusableElement").mockReturnValue(element);
  });

  afterEach(() => jest.restoreAllMocks());

  it("starts collapsed and says so", () => {
    field.recomputeAriaContext();

    expect(field.isExpanded()).toBe(false);
    expect(element.getAttribute("aria-expanded")).toBe("false");
  });

  it("exposes aria-expanded when expanded", () => {
    const setAlt = jest.spyOn(field, "setAlt").mockImplementation(() => undefined);

    field.setExpanded(true);

    expect(field.isExpanded()).toBe(true);
    expect(element.getAttribute("aria-expanded")).toBe("true");
    expect(setAlt).toHaveBeenCalledWith(DISCLOSURE_LABEL_EXPANDED);
  });

  it("goes back to the collapsed name when closed", () => {
    const setAlt = jest.spyOn(field, "setAlt").mockImplementation(() => undefined);

    field.setExpanded(true);
    field.setExpanded(false);

    expect(element.getAttribute("aria-expanded")).toBe("false");
    expect(setAlt).toHaveBeenLastCalledWith(DISCLOSURE_LABEL_COLLAPSED);
  });

  // The whole reason this is a subclass: Blockly rewrites this element's ARIA on every
  // re-render, so aria-expanded has to be re-applied on Blockly's own lifecycle.
  it("re-applies aria-expanded after Blockly re-renders the field", () => {
    jest.spyOn(field, "setAlt").mockImplementation(() => undefined);
    field.setExpanded(true);

    element.removeAttribute("aria-expanded");   // what a re-render does
    field.recomputeAriaContext();

    expect(element.getAttribute("aria-expanded")).toBe("true");
  });
});
