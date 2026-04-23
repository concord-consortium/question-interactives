import React from "react";
import { render } from "@testing-library/react";
import validator from "@rjsf/validator-ajv8";
import { useAuthoredState, useInitMessage } from "@concord-consortium/lara-interactive-api";
import { App, baseAuthoringProps } from "./app";
import { getUiSchema } from "./authoring";
import { DemoAuthoredState } from "./types";

jest.unmock("react-jsonschema-form");
jest.mock("@concord-consortium/lara-interactive-api");

const useInitMessageMock = useInitMessage as jest.Mock;
const useAuthoredStateMock = useAuthoredState as jest.Mock;

describe("Live graph app", () => {
  beforeEach(() => {
    useInitMessageMock.mockReturnValue({
      version: 1,
      mode: "authoring",
      authoredState: DemoAuthoredState
    });
    useAuthoredStateMock.mockReturnValue({ authoredState: DemoAuthoredState });
  });

  it("renders in authoring mode", () => {
    const { container } = render(<App />);
    expect(container).toBeDefined();
  });
});

describe("baseAuthoringProps schema", () => {
  const { schema, uiSchema } = baseAuthoringProps;

  it("declares dataSourceInteractive as required at the top level", () => {
    expect(schema.required).toContain("dataSourceInteractive");
  });

  it("declares the yAxisRangeMode default as 'auto'", () => {
    expect((schema.properties?.yAxisRangeMode as any)?.default).toBe("auto");
  });

  it("declares the columnFilteringMode default as 'all'", () => {
    expect((schema.properties?.columnFilteringMode as any)?.default).toBe("all");
  });

  it("lists all fields in ui:order with conditional fields positioned after their parent", () => {
    expect((uiSchema as any)["ui:order"]).toEqual([
      "dataSourceInteractive",
      "chartTitle",
      "chartTitlePosition",
      "xAxisColumn",
      "xAxisLabel",
      "xAxisMax",
      "yAxisLabel",
      "yAxisRangeMode",
      "yMin",
      "yMax",
      "columnDisplayNames",
      "columnFilteringMode",
      "allowList",
      "ignoreList",
      "chartHeight",
      "noDataMessage",
      "noSourceMessage",
      "*"
    ]);
  });

  it("hides the version field in the uiSchema", () => {
    expect((uiSchema as any).version["ui:widget"]).toBe("hidden");
  });

  it("reports dataSourceInteractive as missing at the schema level for empty form data", () => {
    const result = validator.validateFormData({ version: 1 }, schema as any);
    const missingProperties = result.errors
      .filter((e: any) => e.name === "required")
      .map((e: any) => e.params?.missingProperty);
    expect(missingProperties).toContain("dataSourceInteractive");
  });

  it("conditionally disables allowList/ignoreList fields based on columnFilteringMode (via authoring uiSchema)", () => {
    // The conditional behavior is handled via ui:disabled in authoring.tsx
    // rather than JSON Schema dependencies — fields are always visible but
    // disabled when their parent mode is not active (per spec: "conditional
    // fields always visible, disabled when not applicable").
    expect(uiSchema.allowList).toBeDefined();
    expect(uiSchema.ignoreList).toBeDefined();
  });
});

describe("getUiSchema — conditional field disabling", () => {
  it("disables yMin and yMax when yAxisRangeMode is not fixed", () => {
    const ui = getUiSchema({ ...DemoAuthoredState, yAxisRangeMode: "auto" });
    expect(ui.yMin["ui:disabled"]).toBe(true);
    expect(ui.yMax["ui:disabled"]).toBe(true);
  });

  it("enables yMin and yMax when yAxisRangeMode is fixed", () => {
    const ui = getUiSchema({ ...DemoAuthoredState, yAxisRangeMode: "fixed" });
    expect(ui.yMin["ui:disabled"]).toBe(false);
    expect(ui.yMax["ui:disabled"]).toBe(false);
  });

  it("disables allowList when columnFilteringMode is not allow", () => {
    const ui = getUiSchema({ ...DemoAuthoredState, columnFilteringMode: "all" });
    expect(ui.allowList["ui:disabled"]).toBe(true);
  });

  it("enables allowList when columnFilteringMode is allow", () => {
    const ui = getUiSchema({ ...DemoAuthoredState, columnFilteringMode: "allow" });
    expect(ui.allowList["ui:disabled"]).toBe(false);
  });

  it("disables ignoreList when columnFilteringMode is not ignore", () => {
    const ui = getUiSchema({ ...DemoAuthoredState, columnFilteringMode: "all" });
    expect(ui.ignoreList["ui:disabled"]).toBe(true);
  });

  it("enables ignoreList when columnFilteringMode is ignore", () => {
    const ui = getUiSchema({ ...DemoAuthoredState, columnFilteringMode: "ignore" });
    expect(ui.ignoreList["ui:disabled"]).toBe(false);
  });

  it("disables all conditional fields when authoredState is null", () => {
    const ui = getUiSchema(null);
    expect(ui.yMin["ui:disabled"]).toBe(true);
    expect(ui.yMax["ui:disabled"]).toBe(true);
    expect(ui.allowList["ui:disabled"]).toBe(true);
    expect(ui.ignoreList["ui:disabled"]).toBe(true);
  });
});
