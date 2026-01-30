// Non-null assertions (!) disabled in test files to keep test code compact.
// The values are guaranteed non-null by the test setup.
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { codapAuthoringConfig } from "./codap-config";
import { codapInitialData } from "./codap-schema";
import { ICodapAuthoringData, IAuthoredState } from "../components/types";

describe("codapAuthoringConfig", () => {
  it("has type 'codap'", () => {
    expect(codapAuthoringConfig.type).toBe("codap");
  });

  it("has schema, uiSchema, and initialData", () => {
    expect(codapAuthoringConfig.schema).toBeDefined();
    expect(codapAuthoringConfig.uiSchema).toBeDefined();
    expect(codapAuthoringConfig.initialData).toBeDefined();
  });

  describe("computeUiSchema", () => {
    const baseUiSchema = codapAuthoringConfig.uiSchema!;

    it("disables lockComponents when removeToolbarsAndGrid is false", () => {
      const formData = { ...codapInitialData, removeToolbarsAndGrid: false };
      const result = codapAuthoringConfig.computeUiSchema!(formData, baseUiSchema);
      expect((result.lockComponents as any)["ui:disabled"]).toBe(true);
    });

    it("enables lockComponents when removeToolbarsAndGrid is true", () => {
      const formData = { ...codapInitialData, removeToolbarsAndGrid: true };
      const result = codapAuthoringConfig.computeUiSchema!(formData, baseUiSchema);
      expect((result.lockComponents as any)["ui:disabled"]).toBe(false);
    });

    it("disables diPluginUrl when enableDi is false", () => {
      const formData = { ...codapInitialData };
      const result = codapAuthoringConfig.computeUiSchema!(formData, baseUiSchema);
      expect((result.advancedOptions as any).diPluginUrl["ui:disabled"]).toBe(true);
    });

    it("enables diPluginUrl when enableDi is true", () => {
      const formData = {
        ...codapInitialData,
        advancedOptions: { ...codapInitialData.advancedOptions, enableDi: true }
      };
      const result = codapAuthoringConfig.computeUiSchema!(formData, baseUiSchema);
      expect((result.advancedOptions as any).diPluginUrl["ui:disabled"]).toBe(false);
    });

    it("disables guideIndexValue when enableGuideIndex is false", () => {
      const formData = { ...codapInitialData };
      const result = codapAuthoringConfig.computeUiSchema!(formData, baseUiSchema);
      expect((result.advancedOptions as any).guideIndexValue["ui:disabled"]).toBe(true);
    });

    it("enables guideIndexValue when enableGuideIndex is true", () => {
      const formData = {
        ...codapInitialData,
        advancedOptions: { ...codapInitialData.advancedOptions, enableGuideIndex: true }
      };
      const result = codapAuthoringConfig.computeUiSchema!(formData, baseUiSchema);
      expect((result.advancedOptions as any).guideIndexValue["ui:disabled"]).toBe(false);
    });

    it("disables customParamsValue when enableCustomParams is false", () => {
      const formData = { ...codapInitialData };
      const result = codapAuthoringConfig.computeUiSchema!(formData, baseUiSchema);
      expect((result.advancedOptions as any).customParamsValue["ui:disabled"]).toBe(true);
    });

    it("enables customParamsValue when enableCustomParams is true", () => {
      const formData = {
        ...codapInitialData,
        advancedOptions: { ...codapInitialData.advancedOptions, enableCustomParams: true }
      };
      const result = codapAuthoringConfig.computeUiSchema!(formData, baseUiSchema);
      expect((result.advancedOptions as any).customParamsValue["ui:disabled"]).toBe(false);
    });

    it("disables enableDiOverride when enableDi is false", () => {
      const formData = { ...codapInitialData };
      const result = codapAuthoringConfig.computeUiSchema!(formData, baseUiSchema);
      expect((result.advancedOptions as any).enableDiOverride["ui:disabled"]).toBe(true);
    });

    it("enables enableDiOverride when enableDi is true", () => {
      const formData = {
        ...codapInitialData,
        advancedOptions: { ...codapInitialData.advancedOptions, enableDi: true }
      };
      const result = codapAuthoringConfig.computeUiSchema!(formData, baseUiSchema);
      expect((result.advancedOptions as any).enableDiOverride["ui:disabled"]).toBe(false);
    });

    it("disables diOverrideValue when enableDiOverride is false", () => {
      const formData = { ...codapInitialData };
      const result = codapAuthoringConfig.computeUiSchema!(formData, baseUiSchema);
      expect((result.advancedOptions as any).diOverrideValue["ui:disabled"]).toBe(true);
    });

    it("enables diOverrideValue when enableDiOverride is true", () => {
      const formData = {
        ...codapInitialData,
        advancedOptions: { ...codapInitialData.advancedOptions, enableDiOverride: true }
      };
      const result = codapAuthoringConfig.computeUiSchema!(formData, baseUiSchema);
      expect((result.advancedOptions as any).diOverrideValue["ui:disabled"]).toBe(false);
    });

    it("handles missing advancedOptions gracefully", () => {
      const formData = { ...codapInitialData, advancedOptions: undefined as any };
      const result = codapAuthoringConfig.computeUiSchema!(formData, baseUiSchema);
      expect(result).toBeDefined();
    });

    it("hides passthroughParamsDisplay when source URL has no passthrough params", () => {
      const formData = { ...codapInitialData, codapSourceDocumentUrl: "" };
      const result = codapAuthoringConfig.computeUiSchema!(formData, baseUiSchema);
      expect((result.advancedOptions as any).passthroughParamsDisplay["ui:widget"]).toBe("hidden");
    });

    it("shows passthroughParamsDisplay when source URL has passthrough params", () => {
      const formData = {
        ...codapInitialData,
        codapSourceDocumentUrl: "https://codap.concord.org/app?documentId=doc&custom=value"
      };
      const result = codapAuthoringConfig.computeUiSchema!(formData, baseUiSchema);
      expect((result.advancedOptions as any).passthroughParamsDisplay["ui:widget"]).toBe("textarea");
    });
  });

  describe("getDisableFullscreen", () => {
    it("returns false when displayFullscreenButton is true", () => {
      const formData = { ...codapInitialData, displayFullscreenButton: true };
      expect(codapAuthoringConfig.getDisableFullscreen!(formData)).toBe(false);
    });

    it("returns true when displayFullscreenButton is false", () => {
      const formData = { ...codapInitialData, displayFullscreenButton: false };
      expect(codapAuthoringConfig.getDisableFullscreen!(formData)).toBe(true);
    });
  });

  describe("validateFormData", () => {
    it("returns empty result for valid CODAP URL", () => {
      const formData = { ...codapInitialData, codapSourceDocumentUrl: "https://codap.concord.org/app" };
      const result = codapAuthoringConfig.validateFormData!(formData);
      expect(Object.keys(result)).toHaveLength(0);
    });

    it("returns error for invalid URL", () => {
      const formData = { ...codapInitialData, codapSourceDocumentUrl: "not-a-url" };
      const result = codapAuthoringConfig.validateFormData!(formData);
      expect(result.codapSourceDocumentUrl).toBeDefined();
      expect(result.codapSourceDocumentUrl.severity).toBe("error");
    });

    it("returns warning for non-CODAP URL", () => {
      const formData = { ...codapInitialData, codapSourceDocumentUrl: "https://example.com/page" };
      const result = codapAuthoringConfig.validateFormData!(formData);
      expect(result.codapSourceDocumentUrl).toBeDefined();
      expect(result.codapSourceDocumentUrl.severity).toBe("warning");
    });

    it("returns no URL validation when source URL is empty", () => {
      const formData = { ...codapInitialData, codapSourceDocumentUrl: "" };
      const result = codapAuthoringConfig.validateFormData!(formData);
      expect(result.codapSourceDocumentUrl).toBeUndefined();
    });

    it("validates custom params format when enabled", () => {
      const formData: ICodapAuthoringData = {
        ...codapInitialData,
        advancedOptions: {
          ...codapInitialData.advancedOptions,
          enableCustomParams: true,
          customParamsValue: "invalid-no-equals"
        }
      };
      const result = codapAuthoringConfig.validateFormData!(formData);
      expect(result["advancedOptions.customParamsValue"]).toBeDefined();
      expect(result["advancedOptions.customParamsValue"].severity).toBe("warning");
    });

    it("accepts valid custom params format", () => {
      const formData: ICodapAuthoringData = {
        ...codapInitialData,
        advancedOptions: {
          ...codapInitialData.advancedOptions,
          enableCustomParams: true,
          customParamsValue: "foo=bar\nbaz=qux"
        }
      };
      const result = codapAuthoringConfig.validateFormData!(formData);
      expect(result["advancedOptions.customParamsValue"]).toBeUndefined();
    });

    it("does not validate custom params when disabled", () => {
      const formData: ICodapAuthoringData = {
        ...codapInitialData,
        advancedOptions: {
          ...codapInitialData.advancedOptions,
          enableCustomParams: false,
          customParamsValue: "invalid-no-equals"
        }
      };
      const result = codapAuthoringConfig.validateFormData!(formData);
      expect(result["advancedOptions.customParamsValue"]).toBeUndefined();
    });

    it("warns for custom params with empty key (=value)", () => {
      const formData: ICodapAuthoringData = {
        ...codapInitialData,
        advancedOptions: {
          ...codapInitialData.advancedOptions,
          enableCustomParams: true,
          customParamsValue: "=value"
        }
      };
      const result = codapAuthoringConfig.validateFormData!(formData);
      expect(result["advancedOptions.customParamsValue"]).toBeDefined();
      expect(result["advancedOptions.customParamsValue"].severity).toBe("warning");
    });

    it("does not validate custom params when customParamsValue is empty", () => {
      const formData: ICodapAuthoringData = {
        ...codapInitialData,
        advancedOptions: {
          ...codapInitialData.advancedOptions,
          enableCustomParams: true,
          customParamsValue: ""
        }
      };
      const result = codapAuthoringConfig.validateFormData!(formData);
      expect(result["advancedOptions.customParamsValue"]).toBeUndefined();
    });

    it("does not flag iframe embed as invalid URL", () => {
      const formData = {
        ...codapInitialData,
        codapSourceDocumentUrl: '<iframe src="https://codap.concord.org/app?documentId=doc"></iframe>'
      };
      const result = codapAuthoringConfig.validateFormData!(formData);
      // Should not have an error or warning on the URL field — iframe embeds are valid input
      expect(result.codapSourceDocumentUrl).toBeUndefined();
    });

    it("handles missing advancedOptions in validation", () => {
      const formData = { ...codapInitialData, advancedOptions: undefined as any };
      // Should not throw
      const result = codapAuthoringConfig.validateFormData!(formData);
      expect(result).toBeDefined();
    });
  });

  describe("computeFormData", () => {
    const authoredState: IAuthoredState = {
      version: 1,
      questionType: "iframe_interactive"
    };

    it("sets generatedUrl from buildUrl result", () => {
      const formData: ICodapAuthoringData = {
        ...codapInitialData,
        codapSourceDocumentUrl: "https://codap.concord.org/app#shared=doc123"
      };
      const result = codapAuthoringConfig.computeFormData!(formData, authoredState);
      expect(result.advancedOptions.generatedUrl).toContain("codap.concord.org");
      expect(result.advancedOptions.generatedUrl).toContain("interactiveApi");
    });

    it("sets empty generatedUrl when source URL is empty", () => {
      const result = codapAuthoringConfig.computeFormData!(codapInitialData, authoredState);
      expect(result.advancedOptions.generatedUrl).toBe("");
    });

    it("shows passthrough params in display field", () => {
      const formData: ICodapAuthoringData = {
        ...codapInitialData,
        codapSourceDocumentUrl: "https://codap.concord.org/app?documentId=doc&foo=bar"
      };
      const result = codapAuthoringConfig.computeFormData!(formData, authoredState);
      expect((result.advancedOptions as any).passthroughParamsDisplay).toBe("foo=bar");
    });

    it("shows override message when all passthrough params are overridden by custom params", () => {
      const formData: ICodapAuthoringData = {
        ...codapInitialData,
        codapSourceDocumentUrl: "https://codap.concord.org/app?documentId=doc&foo=bar",
        advancedOptions: {
          ...codapInitialData.advancedOptions,
          enableCustomParams: true,
          customParamsValue: "foo=override"
        }
      };
      const result = codapAuthoringConfig.computeFormData!(formData, authoredState);
      expect((result.advancedOptions as any).passthroughParamsDisplay).toContain("overridden");
    });

    it("shows empty passthroughParamsDisplay when no passthrough params exist", () => {
      const formData: ICodapAuthoringData = {
        ...codapInitialData,
        codapSourceDocumentUrl: "https://codap.concord.org/app?documentId=doc"
      };
      const result = codapAuthoringConfig.computeFormData!(formData, authoredState);
      expect((result.advancedOptions as any).passthroughParamsDisplay).toBe("");
    });

    it("shows partial passthrough params when only some are overridden", () => {
      const formData: ICodapAuthoringData = {
        ...codapInitialData,
        codapSourceDocumentUrl: "https://codap.concord.org/app?documentId=doc&foo=bar&baz=qux",
        advancedOptions: {
          ...codapInitialData.advancedOptions,
          enableCustomParams: true,
          customParamsValue: "foo=override"
        }
      };
      const result = codapAuthoringConfig.computeFormData!(formData, authoredState);
      // baz=qux should still show since only foo is overridden
      expect((result.advancedOptions as any).passthroughParamsDisplay).toBe("baz=qux");
    });
  });

  describe("mergeWithParsedUrl", () => {
    const merge = codapAuthoringConfig.mergeWithParsedUrl!;

    // Helper: create current data with specific overrides
    const makeCurrentData = (overrides: Partial<ICodapAuthoringData> = {}): ICodapAuthoringData => ({
      ...codapInitialData,
      displayFullscreenButton: false, // non-default to verify preservation
      advancedOptions: {
        ...codapInitialData.advancedOptions,
        enableDi: true,
        diPluginUrl: "https://my-plugin.com",
        enableCustomParams: true,
        customParamsValue: "foo=bar",
      },
      ...overrides
    });

    // Helper: simulate parseCodapUrlToFormData output for a plain URL (no special params)
    const makeParsedData = (overrides: Partial<ICodapAuthoringData> = {}): ICodapAuthoringData => ({
      ...codapInitialData,
      codapSourceDocumentUrl: "https://codap.concord.org/app?documentId=newDoc",
      displayFullscreenButton: true, // parseCodapUrlToFormData always returns true
      advancedOptions: {
        ...codapInitialData.advancedOptions,
        // All enable* fields false = "not present in URL"
      },
      ...overrides
    });

    it("preserves displayFullscreenButton from current data", () => {
      const result = merge(makeCurrentData(), makeParsedData());
      expect(result.displayFullscreenButton).toBe(false);
    });

    it("preserves enableCustomParams from current data", () => {
      const result = merge(makeCurrentData(), makeParsedData());
      expect(result.advancedOptions.enableCustomParams).toBe(true);
    });

    it("preserves customParamsValue from current data", () => {
      const result = merge(makeCurrentData(), makeParsedData());
      expect(result.advancedOptions.customParamsValue).toBe("foo=bar");
    });

    it("preserves enableDi/diPluginUrl when URL lacks ?di= param", () => {
      const result = merge(makeCurrentData(), makeParsedData());
      expect(result.advancedOptions.enableDi).toBe(true);
      expect(result.advancedOptions.diPluginUrl).toBe("https://my-plugin.com");
    });

    it("uses parsed enableDi/diPluginUrl when URL has ?di= param", () => {
      const parsed = makeParsedData({
        advancedOptions: {
          ...codapInitialData.advancedOptions,
          enableDi: true,
          diPluginUrl: "https://url-plugin.com",
        }
      });
      const result = merge(makeCurrentData(), parsed);
      expect(result.advancedOptions.enableDi).toBe(true);
      expect(result.advancedOptions.diPluginUrl).toBe("https://url-plugin.com");
    });

    it("preserves enableDiOverride/diOverrideValue when URL lacks ?di-override= param", () => {
      const current = makeCurrentData({
        advancedOptions: {
          ...codapInitialData.advancedOptions,
          enableDiOverride: true,
          diOverrideValue: "my-override",
        }
      });
      const result = merge(current, makeParsedData());
      expect(result.advancedOptions.enableDiOverride).toBe(true);
      expect(result.advancedOptions.diOverrideValue).toBe("my-override");
    });

    it("uses parsed enableDiOverride/diOverrideValue when URL has ?di-override= param", () => {
      const parsed = makeParsedData({
        advancedOptions: {
          ...codapInitialData.advancedOptions,
          enableDiOverride: true,
          diOverrideValue: "url-override",
        }
      });
      const result = merge(makeCurrentData(), parsed);
      expect(result.advancedOptions.enableDiOverride).toBe(true);
      expect(result.advancedOptions.diOverrideValue).toBe("url-override");
    });

    it("preserves enableGuideIndex/guideIndexValue when URL lacks ?guideIndex= param", () => {
      const current = makeCurrentData({
        advancedOptions: {
          ...codapInitialData.advancedOptions,
          enableGuideIndex: true,
          guideIndexValue: 3,
        }
      });
      const result = merge(current, makeParsedData());
      expect(result.advancedOptions.enableGuideIndex).toBe(true);
      expect(result.advancedOptions.guideIndexValue).toBe(3);
    });

    it("uses parsed enableGuideIndex/guideIndexValue when URL has ?guideIndex= param", () => {
      const parsed = makeParsedData({
        advancedOptions: {
          ...codapInitialData.advancedOptions,
          enableGuideIndex: true,
          guideIndexValue: 5,
        }
      });
      const result = merge(makeCurrentData(), parsed);
      expect(result.advancedOptions.enableGuideIndex).toBe(true);
      expect(result.advancedOptions.guideIndexValue).toBe(5);
    });

    it("takes URL-derivable fields from parsed data", () => {
      const parsed = makeParsedData({
        removeToolbarsAndGrid: true,
        lockComponents: true,
        displayDataVisibilityToggles: true,
      });
      const result = merge(makeCurrentData(), parsed);
      expect(result.removeToolbarsAndGrid).toBe(true);
      expect(result.lockComponents).toBe(true);
      expect(result.displayDataVisibilityToggles).toBe(true);
    });

    it("takes codapSourceDocumentUrl from parsed data", () => {
      const result = merge(makeCurrentData(), makeParsedData());
      expect(result.codapSourceDocumentUrl).toBe("https://codap.concord.org/app?documentId=newDoc");
    });

    it("handles missing advancedOptions in current data gracefully", () => {
      const current = { ...codapInitialData, advancedOptions: undefined as any };
      const result = merge(current, makeParsedData());
      expect(result.advancedOptions.enableCustomParams).toBe(false);
      expect(result.advancedOptions.customParamsValue).toBe("");
    });
  });

  describe("parseUrlToFormData", () => {
    it("delegates to parseCodapUrlToFormData", () => {
      const url = "https://codap.concord.org/app?documentId=doc&embeddedMode=yes";
      const result = codapAuthoringConfig.parseUrlToFormData!(url);
      expect(result.removeToolbarsAndGrid).toBe(true);
      expect(result.codapSourceDocumentUrl).toBe(url);
    });
  });

  describe("buildUrl", () => {
    it("delegates to buildCodapUrl", () => {
      const formData: ICodapAuthoringData = {
        ...codapInitialData,
        codapSourceDocumentUrl: "https://codap.concord.org/app#shared=doc123"
      };
      const result = codapAuthoringConfig.buildUrl!(formData);
      expect(result).toContain("interactiveApi");
    });
  });
});
/* eslint-enable @typescript-eslint/no-non-null-assertion */
