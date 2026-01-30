import { codapSchema, codapUiSchema, codapInitialData } from "./codap-schema";

describe("codapSchema", () => {
  it("is an object type schema", () => {
    expect(codapSchema.type).toBe("object");
  });

  it("defines all expected top-level properties", () => {
    const props = codapSchema.properties as Record<string, any>;
    expect(props.codapSourceDocumentUrl).toBeDefined();
    expect(props.displayFullscreenButton).toBeDefined();
    expect(props.displayDataVisibilityToggles).toBeDefined();
    expect(props.displayAllComponentsAlways).toBeDefined();
    expect(props.removeToolbarsAndGrid).toBeDefined();
    expect(props.lockComponents).toBeDefined();
    expect(props.advancedOptions).toBeDefined();
  });

  it("defines advancedOptions as an object with nested properties", () => {
    const advanced = (codapSchema.properties as any).advancedOptions;
    expect(advanced.type).toBe("object");
    expect(advanced.properties.enableDi).toBeDefined();
    expect(advanced.properties.diPluginUrl).toBeDefined();
    expect(advanced.properties.enableDiOverride).toBeDefined();
    expect(advanced.properties.enableGuideIndex).toBeDefined();
    expect(advanced.properties.guideIndexValue).toBeDefined();
    expect(advanced.properties.enableCustomParams).toBeDefined();
    expect(advanced.properties.customParamsValue).toBeDefined();
    expect(advanced.properties.generatedUrl).toBeDefined();
    expect(advanced.properties.passthroughParamsDisplay).toBeDefined();
  });

  it("marks generatedUrl as readOnly", () => {
    const generatedUrl = (codapSchema.properties as any).advancedOptions.properties.generatedUrl;
    expect(generatedUrl.readOnly).toBe(true);
  });

  it("sets guideIndexValue type to integer with minimum 0", () => {
    const guideIndex = (codapSchema.properties as any).advancedOptions.properties.guideIndexValue;
    expect(guideIndex.type).toBe("integer");
    expect(guideIndex.minimum).toBe(0);
  });
});

describe("codapUiSchema", () => {
  it("defines codapSourceDocumentUrl as a textarea", () => {
    expect(codapUiSchema.codapSourceDocumentUrl["ui:widget"]).toBe("textarea");
  });

  it("defines field ordering via ui:order", () => {
    expect(codapUiSchema["ui:order"]).toBeDefined();
    expect(codapUiSchema["ui:order"]).toContain("codapSourceDocumentUrl");
    expect(codapUiSchema["ui:order"]).toContain("advancedOptions");
  });

  it("sets advancedOptions as collapsible and initially collapsed", () => {
    const options = (codapUiSchema.advancedOptions as any)["ui:options"];
    expect(options.collapsible).toBe(true);
    expect(options.collapsed).toBe(true);
  });

  it("defines ui:order within advancedOptions", () => {
    const order = (codapUiSchema.advancedOptions as any)["ui:order"];
    expect(order).toBeDefined();
    expect(order).toContain("enableDi");
    expect(order).toContain("generatedUrl");
  });
});

describe("codapInitialData", () => {
  it("has empty codapSourceDocumentUrl", () => {
    expect(codapInitialData.codapSourceDocumentUrl).toBe("");
  });

  it("defaults displayFullscreenButton to true", () => {
    expect(codapInitialData.displayFullscreenButton).toBe(true);
  });

  it("defaults all other checkboxes to false", () => {
    expect(codapInitialData.displayDataVisibilityToggles).toBe(false);
    expect(codapInitialData.displayAllComponentsAlways).toBe(false);
    expect(codapInitialData.removeToolbarsAndGrid).toBe(false);
    expect(codapInitialData.lockComponents).toBe(false);
  });

  it("defaults advanced options to disabled", () => {
    expect(codapInitialData.advancedOptions.enableDi).toBe(false);
    expect(codapInitialData.advancedOptions.enableDiOverride).toBe(false);
    expect(codapInitialData.advancedOptions.enableGuideIndex).toBe(false);
    expect(codapInitialData.advancedOptions.enableCustomParams).toBe(false);
  });

  it("defaults guideIndexValue to 0", () => {
    expect(codapInitialData.advancedOptions.guideIndexValue).toBe(0);
  });

  it("defaults generatedUrl to empty string", () => {
    expect(codapInitialData.advancedOptions.generatedUrl).toBe("");
  });
});
