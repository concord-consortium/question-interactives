import { RJSFSchema } from "@rjsf/utils";
import { parsePrefixedParams, applyUrlDefaults, applyUrlCustoms } from "./url-prefix-params";

// A minimal schema matching the CODAP authoring form structure
const testSchema: RJSFSchema = {
  type: "object",
  properties: {
    sourceUrl: { type: "string" },
    enableFullscreen: { type: "boolean" },
    removeToolbarsAndGrid: { type: "boolean" },
    lockComponents: { type: "boolean" },
    advancedOptions: {
      type: "object",
      properties: {
        enableDi: { type: "boolean" },
        guideIndexValue: { type: "integer" },
        scaleFactor: { type: "number" },
        customParamsValue: { type: "string" }
      }
    }
  }
};

const baseInitialData = {
  sourceUrl: "",
  enableFullscreen: true,
  removeToolbarsAndGrid: false,
  lockComponents: false,
  advancedOptions: {
    enableDi: false,
    guideIndexValue: 0,
    scaleFactor: 1.0,
    enableCustomParams: false,
    customParamsValue: ""
  }
};

describe("parsePrefixedParams", () => {
  it("extracts default: and custom: params from a query string", () => {
    const result = parsePrefixedParams(
      "?wrappedInteractive=https://example.com&default:removeToolbarsAndGrid=true&custom:foo=bar"
    );
    expect(result).toEqual({
      defaults: { removeToolbarsAndGrid: "true" },
      customs: { foo: "bar" }
    });
  });

  it("handles multiple default: and custom: params", () => {
    const result = parsePrefixedParams(
      "?default:removeToolbarsAndGrid=true&default:lockComponents=true&custom:foo=bar&custom:baz=qux"
    );
    expect(result.defaults).toEqual({
      removeToolbarsAndGrid: "true",
      lockComponents: "true"
    });
    expect(result.customs).toEqual({ foo: "bar", baz: "qux" });
  });

  it("returns empty records when no prefixed params exist", () => {
    const result = parsePrefixedParams("?wrappedInteractive=https://example.com&authoring=codap");
    expect(result).toEqual({ defaults: {}, customs: {} });
  });

  it("ignores params with empty key after prefix", () => {
    const result = parsePrefixedParams("?default:=value&custom:=value");
    expect(result).toEqual({ defaults: {}, customs: {} });
  });

  it("handles empty string input", () => {
    const result = parsePrefixedParams("");
    expect(result).toEqual({ defaults: {}, customs: {} });
  });

  it("decodes URL-encoded values", () => {
    const result = parsePrefixedParams("?default:sourceUrl=https%3A%2F%2Fexample.com%2Fpath");
    expect(result.defaults.sourceUrl).toBe("https://example.com/path");
  });

  it("handles dot-notation field paths", () => {
    const result = parsePrefixedParams("?default:advancedOptions.guideIndexValue=3");
    expect(result.defaults).toEqual({ "advancedOptions.guideIndexValue": "3" });
  });

  it("handles empty values", () => {
    const result = parsePrefixedParams("?default:sourceUrl=");
    expect(result.defaults).toEqual({ sourceUrl: "" });
  });
});

describe("applyUrlDefaults", () => {
  it("overrides initial data for boolean fields with 'true'", () => {
    const result = applyUrlDefaults(
      baseInitialData,
      { removeToolbarsAndGrid: "true" },
      testSchema
    );
    expect(result.removeToolbarsAndGrid).toBe(true);
  });

  it("overrides initial data for boolean fields with '1'", () => {
    const result = applyUrlDefaults(
      baseInitialData,
      { removeToolbarsAndGrid: "1" },
      testSchema
    );
    expect(result.removeToolbarsAndGrid).toBe(true);
  });

  it("coerces non-true boolean values to false", () => {
    const result = applyUrlDefaults(
      { ...baseInitialData, enableFullscreen: true },
      { enableFullscreen: "false" },
      testSchema
    );
    expect(result.enableFullscreen).toBe(false);
  });

  it("coerces integer fields from string", () => {
    const result = applyUrlDefaults(
      baseInitialData,
      { "advancedOptions.guideIndexValue": "5" },
      testSchema
    );
    expect(result.advancedOptions.guideIndexValue).toBe(5);
  });

  it("coerces number fields from string", () => {
    const result = applyUrlDefaults(
      baseInitialData,
      { "advancedOptions.scaleFactor": "2.5" },
      testSchema
    );
    expect(result.advancedOptions.scaleFactor).toBe(2.5);
  });

  it("sets string fields as-is", () => {
    const result = applyUrlDefaults(
      baseInitialData,
      { sourceUrl: "https://example.com" },
      testSchema
    );
    expect(result.sourceUrl).toBe("https://example.com");
  });

  it("sets empty string for empty value on string fields", () => {
    const result = applyUrlDefaults(
      baseInitialData,
      { sourceUrl: "" },
      testSchema
    );
    expect(result.sourceUrl).toBe("");
  });

  it("handles nested field paths with dot notation", () => {
    const result = applyUrlDefaults(
      baseInitialData,
      { "advancedOptions.enableDi": "true" },
      testSchema
    );
    expect(result.advancedOptions.enableDi).toBe(true);
    // other nested fields remain unchanged
    expect(result.advancedOptions.guideIndexValue).toBe(0);
  });

  it("warns and ignores invalid field paths", () => {
    const consoleSpy = jest.spyOn(console, "warn").mockImplementation();

    const result = applyUrlDefaults(
      baseInitialData,
      { nonExistentField: "value" },
      testSchema
    );
    expect(result).toEqual(baseInitialData);
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("nonExistentField")
    );

    consoleSpy.mockRestore();
  });

  it("warns and ignores un-coercible integer values", () => {
    const consoleSpy = jest.spyOn(console, "warn").mockImplementation();

    const result = applyUrlDefaults(
      baseInitialData,
      { "advancedOptions.guideIndexValue": "abc" },
      testSchema
    );
    expect(result.advancedOptions.guideIndexValue).toBe(0); // unchanged
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("cannot coerce")
    );

    consoleSpy.mockRestore();
  });

  it("warns and ignores un-coercible number values", () => {
    const consoleSpy = jest.spyOn(console, "warn").mockImplementation();

    const result = applyUrlDefaults(
      baseInitialData,
      { "advancedOptions.scaleFactor": "not-a-number" },
      testSchema
    );
    expect(result.advancedOptions.scaleFactor).toBe(1.0); // unchanged
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("cannot coerce")
    );

    consoleSpy.mockRestore();
  });

  it("applies multiple defaults at once", () => {
    const result = applyUrlDefaults(
      baseInitialData,
      {
        removeToolbarsAndGrid: "true",
        lockComponents: "true",
        "advancedOptions.enableDi": "1"
      },
      testSchema
    );
    expect(result.removeToolbarsAndGrid).toBe(true);
    expect(result.lockComponents).toBe(true);
    expect(result.advancedOptions.enableDi).toBe(true);
  });

  it("does not mutate the original data", () => {
    const original = { ...baseInitialData, advancedOptions: { ...baseInitialData.advancedOptions } };
    applyUrlDefaults(original, { removeToolbarsAndGrid: "true" }, testSchema);
    expect(original.removeToolbarsAndGrid).toBe(false);
  });
});

describe("applyUrlCustoms", () => {
  it("appends custom params and enables the checkbox", () => {
    const result = applyUrlCustoms(baseInitialData, { foo: "bar" });
    expect(result.advancedOptions.enableCustomParams).toBe(true);
    expect(result.advancedOptions.customParamsValue).toBe("foo=bar");
  });

  it("joins multiple customs with newlines", () => {
    const result = applyUrlCustoms(baseInitialData, { foo: "bar", baz: "qux" });
    expect(result.advancedOptions.enableCustomParams).toBe(true);
    expect(result.advancedOptions.customParamsValue).toBe("foo=bar\nbaz=qux");
  });

  it("returns original data when customs is empty", () => {
    const result = applyUrlCustoms(baseInitialData, {});
    expect(result).toBe(baseInitialData); // same reference
  });

  it("returns original data when advancedOptions is missing", () => {
    const dataWithoutAdvanced = { sourceUrl: "", enableFullscreen: true };
    const result = applyUrlCustoms(dataWithoutAdvanced, { foo: "bar" });
    expect(result).toBe(dataWithoutAdvanced); // same reference
  });

  it("appends to existing customParamsValue", () => {
    const dataWithExisting = {
      ...baseInitialData,
      advancedOptions: {
        ...baseInitialData.advancedOptions,
        customParamsValue: "existing=value"
      }
    };
    const result = applyUrlCustoms(dataWithExisting, { foo: "bar" });
    expect(result.advancedOptions.customParamsValue).toBe("existing=value\nfoo=bar");
  });

  it("does not add customs whose keys already exist in customParamsValue", () => {
    const dataWithExisting = {
      ...baseInitialData,
      advancedOptions: {
        ...baseInitialData.advancedOptions,
        customParamsValue: "foo=existing"
      }
    };
    const result = applyUrlCustoms(dataWithExisting, { foo: "new", bar: "added" });
    expect(result.advancedOptions.customParamsValue).toBe("foo=existing\nbar=added");
  });

  it("handles newline-separated existing params when deduplicating", () => {
    const dataWithExisting = {
      ...baseInitialData,
      advancedOptions: {
        ...baseInitialData.advancedOptions,
        customParamsValue: "foo=1\nbar=2"
      }
    };
    const result = applyUrlCustoms(dataWithExisting, { foo: "new", baz: "3" });
    expect(result.advancedOptions.customParamsValue).toBe("foo=1\nbar=2\nbaz=3");
  });

  it("does not mutate the original data", () => {
    const original = { ...baseInitialData, advancedOptions: { ...baseInitialData.advancedOptions } };
    applyUrlCustoms(original, { foo: "bar" });
    expect(original.advancedOptions.enableCustomParams).toBe(false);
    expect(original.advancedOptions.customParamsValue).toBe("");
  });
});
