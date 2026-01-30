// Non-null assertions (!) disabled in test files to keep test code compact.
// The values are guaranteed non-null by the test setup.
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {
  parseCodapUrl,
  parseCustomParams,
  getFilteredPassthroughParams,
  formatPassthroughParamsDisplay,
  buildCodapUrl,
  parseCodapUrlToFormData
} from "./codap-url-utils";
import { codapInitialData } from "./codap-schema";

// ============================================================================
// parseCodapUrl
// ============================================================================

describe("parseCodapUrl", () => {
  it("returns empty result for empty string", () => {
    const result = parseCodapUrl("");
    expect(result).toEqual({
      baseUrl: "",
      documentId: null,
      passthroughParams: {},
      formatType: "unknown"
    });
  });

  it("parses CODAP shared hash URLs", () => {
    const url = "https://codap.concord.org/app/static/dg/en/cert/index.html#shared=https%3A%2F%2Fcfm-shared.concord.org%2Fdoc123";
    const result = parseCodapUrl(url);
    expect(result.formatType).toBe("shared-hash");
    expect(result.baseUrl).toBe("https://codap.concord.org/app/static/dg/en/cert/index.html");
    expect(result.documentId).toBe("https://cfm-shared.concord.org/doc123");
  });

  it("parses interactiveApi format with documentId", () => {
    const url = "https://codap.concord.org/app/static/dg/en/cert/index.html?interactiveApi&documentId=https%3A%2F%2Fcfm-shared.concord.org%2Fdoc123";
    const result = parseCodapUrl(url);
    expect(result.formatType).toBe("interactive-api");
    expect(result.documentId).toBe("https://cfm-shared.concord.org/doc123");
  });

  it("parses legacy url= parameter format", () => {
    const url = "https://codap.concord.org/app?url=https%3A%2F%2Fexample.com%2Fdocument";
    const result = parseCodapUrl(url);
    expect(result.formatType).toBe("interactive-api");
    expect(result.documentId).toBe("https://example.com/document");
  });

  it("prefers shared hash over documentId query param", () => {
    const url = "https://codap.concord.org/app?documentId=queryDoc#shared=hashDoc";
    const result = parseCodapUrl(url);
    expect(result.formatType).toBe("shared-hash");
    expect(result.documentId).toBe("hashDoc");
  });

  it("extracts passthrough params (non-handled params)", () => {
    const url = "https://codap.concord.org/app?interactiveApi&documentId=doc&foo=bar&baz=qux";
    const result = parseCodapUrl(url);
    expect(result.passthroughParams).toEqual({ foo: "bar", baz: "qux" });
  });

  it("filters out handled params from passthrough", () => {
    const url = "https://codap.concord.org/app?interactiveApi&embeddedMode=yes&app=is&custom=value";
    const result = parseCodapUrl(url);
    // interactiveApi, embeddedMode, and app are handled params
    expect(result.passthroughParams).toEqual({ custom: "value" });
    expect(result.passthroughParams).not.toHaveProperty("embeddedMode");
    expect(result.passthroughParams).not.toHaveProperty("app");
  });

  it("returns unknown format for URLs without doc ID", () => {
    const url = "https://codap.concord.org/app/static/dg/en/cert/index.html";
    const result = parseCodapUrl(url);
    expect(result.formatType).toBe("unknown");
    expect(result.documentId).toBeNull();
    expect(result.baseUrl).toBe("https://codap.concord.org/app/static/dg/en/cert/index.html");
  });

  it("handles malformed URLs gracefully", () => {
    const result = parseCodapUrl("not-a-url");
    expect(result.formatType).toBe("unknown");
    expect(result.baseUrl).toBe("not-a-url");
  });

  it("handles hash without shared= key", () => {
    const url = "https://codap.concord.org/app#other=value";
    const result = parseCodapUrl(url);
    expect(result.formatType).toBe("unknown");
    expect(result.documentId).toBeNull();
  });

  it("handles hash with empty shared= value", () => {
    const url = "https://codap.concord.org/app#shared=";
    const result = parseCodapUrl(url);
    expect(result.formatType).toBe("shared-hash");
    expect(result.documentId).toBeNull();
  });

  it("handles documentId with empty value", () => {
    const url = "https://codap.concord.org/app?documentId=";
    const result = parseCodapUrl(url);
    expect(result.formatType).toBe("interactive-api");
    expect(result.documentId).toBeNull();
  });

  it("handles url= param with empty value", () => {
    const url = "https://codap.concord.org/app?url=";
    const result = parseCodapUrl(url);
    expect(result.formatType).toBe("interactive-api");
    expect(result.documentId).toBeNull();
  });

  describe("iframe embed format", () => {
    it("extracts src from iframe embed string", () => {
      const input = '<iframe src="https://codap.concord.org/app?documentId=doc123" width="100%"></iframe>';
      const result = parseCodapUrl(input);
      expect(result.formatType).toBe("iframe-embed");
      expect(result.documentId).toBe("doc123");
    });

    it("handles iframe with single quotes", () => {
      const input = "<iframe src='https://codap.concord.org/app?documentId=doc123'></iframe>";
      const result = parseCodapUrl(input);
      expect(result.formatType).toBe("iframe-embed");
      expect(result.documentId).toBe("doc123");
    });

    it("falls through to unknown for iframe without src attribute", () => {
      // The code requires both <iframe and src= to detect iframe-embed format
      const input = "<iframe width='100%'></iframe>";
      const result = parseCodapUrl(input);
      expect(result.formatType).toBe("unknown");
    });
  });

  describe("full-screen wrapped format", () => {
    it("unwraps full-screen wrapped URLs", () => {
      const innerUrl = encodeURIComponent("https://codap.concord.org/app?documentId=doc123");
      const url = `https://example.com/full-screen.html?wrappedInteractive=${innerUrl}`;
      const result = parseCodapUrl(url);
      expect(result.formatType).toBe("full-screen-wrapped");
      expect(result.documentId).toBe("doc123");
    });

    it("handles missing wrappedInteractive param", () => {
      const url = "https://example.com/full-screen.html?wrappedInteractive=";
      const result = parseCodapUrl(url);
      expect(result.formatType).toBe("full-screen-wrapped");
      expect(result.baseUrl).toBe("");
    });
  });
});

// ============================================================================
// parseCustomParams
// ============================================================================

describe("parseCustomParams", () => {
  it("parses query string format", () => {
    const result = parseCustomParams("foo=bar&baz=qux");
    expect(result).not.toBeNull();
    expect(result!.get("foo")).toBe("bar");
    expect(result!.get("baz")).toBe("qux");
  });

  it("parses newline-separated format", () => {
    const result = parseCustomParams("foo=bar\nbaz=qux");
    expect(result).not.toBeNull();
    expect(result!.get("foo")).toBe("bar");
    expect(result!.get("baz")).toBe("qux");
  });

  it("strips leading ? characters", () => {
    const result = parseCustomParams("?foo=bar");
    expect(result).not.toBeNull();
    expect(result!.get("foo")).toBe("bar");
  });

  it("returns null for empty string", () => {
    expect(parseCustomParams("")).toBeNull();
  });

  it("returns null for undefined", () => {
    expect(parseCustomParams(undefined)).toBeNull();
  });

  it("returns null for whitespace-only string", () => {
    expect(parseCustomParams("   ")).toBeNull();
  });

  it("handles consecutive ampersands", () => {
    const result = parseCustomParams("foo=bar&&baz=qux");
    expect(result).not.toBeNull();
    expect(result!.get("foo")).toBe("bar");
    expect(result!.get("baz")).toBe("qux");
  });

  it("handles windows-style newlines", () => {
    const result = parseCustomParams("foo=bar\r\nbaz=qux");
    expect(result).not.toBeNull();
    expect(result!.get("foo")).toBe("bar");
    expect(result!.get("baz")).toBe("qux");
  });
});

// ============================================================================
// getFilteredPassthroughParams
// ============================================================================

describe("getFilteredPassthroughParams", () => {
  it("returns all passthrough params when custom params are disabled", () => {
    const url = "https://codap.concord.org/app?documentId=doc&foo=bar&baz=qux";
    const result = getFilteredPassthroughParams(url, undefined, false);
    expect(result).toEqual({ foo: "bar", baz: "qux" });
  });

  it("filters out params overridden by custom params", () => {
    const url = "https://codap.concord.org/app?documentId=doc&foo=bar&baz=qux";
    const result = getFilteredPassthroughParams(url, "foo=override", true);
    expect(result).toEqual({ baz: "qux" });
    expect(result).not.toHaveProperty("foo");
  });

  it("returns empty object for undefined source URL", () => {
    expect(getFilteredPassthroughParams(undefined, undefined, false)).toEqual({});
  });

  it("returns all passthrough when custom params string is empty", () => {
    const url = "https://codap.concord.org/app?documentId=doc&foo=bar";
    const result = getFilteredPassthroughParams(url, "", true);
    expect(result).toEqual({ foo: "bar" });
  });

  it("returns empty object for URL with no passthrough params", () => {
    const url = "https://codap.concord.org/app?documentId=doc&interactiveApi";
    const result = getFilteredPassthroughParams(url, undefined, false);
    expect(result).toEqual({});
  });

  it("filters all passthrough params when all are overridden", () => {
    const url = "https://codap.concord.org/app?documentId=doc&foo=bar";
    const result = getFilteredPassthroughParams(url, "foo=override", true);
    expect(result).toEqual({});
  });
});

// ============================================================================
// formatPassthroughParamsDisplay
// ============================================================================

describe("formatPassthroughParamsDisplay", () => {
  it("formats params as newline-separated key=value pairs", () => {
    const result = formatPassthroughParamsDisplay({ foo: "bar", baz: "qux" });
    expect(result).toBe("foo=bar\nbaz=qux");
  });

  it("returns empty string for empty object", () => {
    expect(formatPassthroughParamsDisplay({})).toBe("");
  });

  it("handles single param", () => {
    expect(formatPassthroughParamsDisplay({ key: "value" })).toBe("key=value");
  });
});

// ============================================================================
// buildCodapUrl
// ============================================================================

describe("buildCodapUrl", () => {
  const baseData = {
    ...codapInitialData,
    codapSourceDocumentUrl: "https://codap.concord.org/app/static/dg/en/cert/index.html#shared=https%3A%2F%2Fcfm-shared.concord.org%2Fdoc123"
  };

  it("returns null for empty source URL", () => {
    expect(buildCodapUrl({ ...baseData, codapSourceDocumentUrl: "" })).toBeNull();
  });

  it("builds URL with interactiveApi parameter", () => {
    const url = buildCodapUrl(baseData);
    expect(url).not.toBeNull();
    const parsed = new URL(url!);
    expect(parsed.searchParams.has("interactiveApi")).toBe(true);
  });

  it("includes documentId from shared hash", () => {
    const url = buildCodapUrl(baseData);
    expect(url).not.toBeNull();
    const parsed = new URL(url!);
    expect(parsed.searchParams.get("documentId")).toBe("https://cfm-shared.concord.org/doc123");
  });

  it("sets app=is when displayDataVisibilityToggles is true", () => {
    const data = { ...baseData, displayDataVisibilityToggles: true };
    const url = buildCodapUrl(data);
    const parsed = new URL(url!);
    expect(parsed.searchParams.get("app")).toBe("is");
  });

  it("sets inbounds=true when displayAllComponentsAlways is true", () => {
    const data = { ...baseData, displayAllComponentsAlways: true };
    const url = buildCodapUrl(data);
    const parsed = new URL(url!);
    expect(parsed.searchParams.get("inbounds")).toBe("true");
  });

  it("sets embeddedMode=yes when removeToolbarsAndGrid is true", () => {
    const data = { ...baseData, removeToolbarsAndGrid: true };
    const url = buildCodapUrl(data);
    const parsed = new URL(url!);
    expect(parsed.searchParams.get("embeddedMode")).toBe("yes");
  });

  it("sets componentMode=yes when lockComponents is true", () => {
    const data = { ...baseData, lockComponents: true };
    const url = buildCodapUrl(data);
    const parsed = new URL(url!);
    expect(parsed.searchParams.get("componentMode")).toBe("yes");
  });

  it("does not set CODAP option params when checkboxes are false", () => {
    const url = buildCodapUrl(baseData);
    const parsed = new URL(url!);
    expect(parsed.searchParams.has("app")).toBe(false);
    expect(parsed.searchParams.has("inbounds")).toBe(false);
    expect(parsed.searchParams.has("embeddedMode")).toBe(false);
    expect(parsed.searchParams.has("componentMode")).toBe(false);
  });

  it("adds di parameter when enableDi is true", () => {
    const data = {
      ...baseData,
      advancedOptions: { ...baseData.advancedOptions, enableDi: true, diPluginUrl: "https://plugin.example.com" }
    };
    const url = buildCodapUrl(data);
    const parsed = new URL(url!);
    expect(parsed.searchParams.get("di")).toBe("https://plugin.example.com");
  });

  it("adds guideIndex parameter when enableGuideIndex is true", () => {
    const data = {
      ...baseData,
      advancedOptions: { ...baseData.advancedOptions, enableGuideIndex: true, guideIndexValue: 3 }
    };
    const url = buildCodapUrl(data);
    const parsed = new URL(url!);
    expect(parsed.searchParams.get("guideIndex")).toBe("3");
  });

  it("adds custom params when enabled", () => {
    const data = {
      ...baseData,
      advancedOptions: { ...baseData.advancedOptions, enableCustomParams: true, customParamsValue: "myParam=hello" }
    };
    const url = buildCodapUrl(data);
    const parsed = new URL(url!);
    expect(parsed.searchParams.get("myParam")).toBe("hello");
  });

  it("custom params override passthrough params", () => {
    // Source URL has foo=bar as passthrough
    const sourceUrl = "https://codap.concord.org/app?documentId=doc&foo=bar";
    const data = {
      ...baseData,
      codapSourceDocumentUrl: sourceUrl,
      advancedOptions: { ...baseData.advancedOptions, enableCustomParams: true, customParamsValue: "foo=override" }
    };
    const url = buildCodapUrl(data);
    const parsed = new URL(url!);
    expect(parsed.searchParams.get("foo")).toBe("override");
  });

  it("returns null when parsed baseUrl is empty", () => {
    // A source URL that parses to empty baseUrl (e.g., empty wrappedInteractive param in full-screen URL)
    const data = {
      ...baseData,
      codapSourceDocumentUrl: "https://example.com/full-screen.html?wrappedInteractive="
    };
    expect(buildCodapUrl(data)).toBeNull();
  });

  it("adds di-override parameter when enableDiOverride is true", () => {
    const data = {
      ...baseData,
      advancedOptions: {
        ...baseData.advancedOptions,
        enableDiOverride: true,
        diOverrideValue: "some-override"
      }
    };
    const url = buildCodapUrl(data);
    const parsed = new URL(url!);
    expect(parsed.searchParams.get("di-override")).toBe("some-override");
  });

  it("does not add custom params when enableCustomParams is false", () => {
    const data = {
      ...baseData,
      advancedOptions: {
        ...baseData.advancedOptions,
        enableCustomParams: false,
        customParamsValue: "secret=value"
      }
    };
    const url = buildCodapUrl(data);
    const parsed = new URL(url!);
    expect(parsed.searchParams.has("secret")).toBe(false);
  });

  it("includes passthrough params from source URL", () => {
    const sourceUrl = "https://codap.concord.org/app?documentId=doc&myCustom=hello";
    const data = {
      ...baseData,
      codapSourceDocumentUrl: sourceUrl
    };
    const url = buildCodapUrl(data);
    const parsed = new URL(url!);
    expect(parsed.searchParams.get("myCustom")).toBe("hello");
  });

  it("handles missing advancedOptions gracefully", () => {
    const data = {
      ...baseData,
      advancedOptions: undefined as any
    };
    // Should not throw
    const url = buildCodapUrl(data);
    expect(url).not.toBeNull();
    expect(url).toContain("interactiveApi");
  });

  it("returns null for malformed source URL instead of throwing", () => {
    const data = {
      ...baseData,
      codapSourceDocumentUrl: "not-a-valid-url"
    };
    // parseCodapUrl returns baseUrl: "not-a-valid-url" (the raw input),
    // which is not a valid URL. buildCodapUrl should catch the error and return null.
    expect(buildCodapUrl(data)).toBeNull();
  });
});

// ============================================================================
// parseCodapUrlToFormData
// ============================================================================

describe("parseCodapUrlToFormData", () => {
  it("extracts checkbox states from URL parameters", () => {
    const url = "https://codap.concord.org/app?embeddedMode=yes&componentMode=yes&app=is&inbounds=true&documentId=doc";
    const result = parseCodapUrlToFormData(url);
    expect(result.removeToolbarsAndGrid).toBe(true);
    expect(result.lockComponents).toBe(true);
    expect(result.displayDataVisibilityToggles).toBe(true);
    expect(result.displayAllComponentsAlways).toBe(true);
  });

  it("defaults checkboxes to false when params are absent", () => {
    const url = "https://codap.concord.org/app?documentId=doc";
    const result = parseCodapUrlToFormData(url);
    expect(result.removeToolbarsAndGrid).toBe(false);
    expect(result.lockComponents).toBe(false);
    expect(result.displayDataVisibilityToggles).toBe(false);
    expect(result.displayAllComponentsAlways).toBe(false);
  });

  it("always defaults displayFullscreenButton to true", () => {
    const result = parseCodapUrlToFormData("https://codap.concord.org/app?documentId=doc");
    expect(result.displayFullscreenButton).toBe(true);
  });

  it("preserves the original URL as codapSourceDocumentUrl", () => {
    const url = "https://codap.concord.org/app#shared=doc123";
    const result = parseCodapUrlToFormData(url);
    expect(result.codapSourceDocumentUrl).toBe(url);
  });

  it("extracts di plugin URL", () => {
    const url = "https://codap.concord.org/app?documentId=doc&di=https://plugin.example.com";
    const result = parseCodapUrlToFormData(url);
    expect(result.advancedOptions.enableDi).toBe(true);
    expect(result.advancedOptions.diPluginUrl).toBe("https://plugin.example.com");
  });

  it("extracts guideIndex value", () => {
    const url = "https://codap.concord.org/app?documentId=doc&guideIndex=5";
    const result = parseCodapUrlToFormData(url);
    expect(result.advancedOptions.enableGuideIndex).toBe(true);
    expect(result.advancedOptions.guideIndexValue).toBe(5);
  });

  it("handles iframe embed strings", () => {
    const input = '<iframe src="https://codap.concord.org/app?documentId=doc&embeddedMode=yes" width="100%"></iframe>';
    const result = parseCodapUrlToFormData(input);
    expect(result.codapSourceDocumentUrl).toBe(input);
    expect(result.removeToolbarsAndGrid).toBe(true);
  });

  it("unwraps full-screen wrapped URLs", () => {
    const innerUrl = encodeURIComponent("https://codap.concord.org/app?documentId=doc&embeddedMode=yes");
    const url = `https://example.com/full-screen.html?wrappedInteractive=${innerUrl}`;
    const result = parseCodapUrlToFormData(url);
    expect(result.removeToolbarsAndGrid).toBe(true);
  });

  it("returns safe defaults for malformed URLs", () => {
    const result = parseCodapUrlToFormData("not-a-url-at-all");
    expect(result.displayFullscreenButton).toBe(true);
    expect(result.removeToolbarsAndGrid).toBe(false);
    expect(result.lockComponents).toBe(false);
    expect(result.advancedOptions.enableDi).toBe(false);
    expect(result.advancedOptions.enableCustomParams).toBe(false);
  });

  it("extracts di-override value", () => {
    const url = "https://codap.concord.org/app?documentId=doc&di-override=test-override";
    const result = parseCodapUrlToFormData(url);
    expect(result.advancedOptions.enableDiOverride).toBe(true);
    expect(result.advancedOptions.diOverrideValue).toBe("test-override");
  });

  it("defaults di-override to disabled when not in URL", () => {
    const url = "https://codap.concord.org/app?documentId=doc";
    const result = parseCodapUrlToFormData(url);
    expect(result.advancedOptions.enableDiOverride).toBe(false);
    expect(result.advancedOptions.diOverrideValue).toBe("");
  });

  it("defaults customParams to disabled", () => {
    const url = "https://codap.concord.org/app?documentId=doc";
    const result = parseCodapUrlToFormData(url);
    expect(result.advancedOptions.enableCustomParams).toBe(false);
    expect(result.advancedOptions.customParamsValue).toBe("");
  });

  it("defaults generatedUrl to empty string", () => {
    const url = "https://codap.concord.org/app?documentId=doc";
    const result = parseCodapUrlToFormData(url);
    expect(result.advancedOptions.generatedUrl).toBe("");
  });

  it("parses guideIndex=0 correctly", () => {
    const url = "https://codap.concord.org/app?documentId=doc&guideIndex=0";
    const result = parseCodapUrlToFormData(url);
    // guideIndex=0 is truthy as a string, so enableGuideIndex should be true
    expect(result.advancedOptions.enableGuideIndex).toBe(true);
    expect(result.advancedOptions.guideIndexValue).toBe(0);
  });

  it("handles wrappedInteractive URL without full-screen in path", () => {
    // wrappedInteractive= is present but no "full-screen" in path - not unwrapped by parseCodapUrl
    // but parseCodapUrlToFormData checks for wrappedInteractive= separately
    const innerUrl = encodeURIComponent("https://codap.concord.org/app?documentId=doc");
    const url = `https://example.com/other.html?wrappedInteractive=${innerUrl}`;
    const result = parseCodapUrlToFormData(url);
    // Should still extract params from the inner URL
    expect(result.codapSourceDocumentUrl).toBe(url);
  });
});
/* eslint-enable @typescript-eslint/no-non-null-assertion */
