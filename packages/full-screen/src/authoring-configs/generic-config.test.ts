// Non-null assertions (!) disabled in test files to keep test code compact.
// The values are guaranteed non-null by the test setup.
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { genericAuthoringConfig } from "./generic-config";

describe("genericAuthoringConfig", () => {
  it("has type 'generic'", () => {
    expect(genericAuthoringConfig.type).toBe("generic");
  });

  it("has a schema with sourceUrl and enableFullscreen fields", () => {
    const props = genericAuthoringConfig.schema.properties as Record<string, any>;
    expect(props.sourceUrl).toBeDefined();
    expect(props.sourceUrl.type).toBe("string");
    expect(props.enableFullscreen).toBeDefined();
    expect(props.enableFullscreen.type).toBe("boolean");
  });

  it("has initialData with empty sourceUrl and enableFullscreen true", () => {
    expect(genericAuthoringConfig.initialData).toEqual({
      sourceUrl: "",
      enableFullscreen: true
    });
  });

  describe("buildUrl", () => {
    it("returns sourceUrl directly", () => {
      const url = genericAuthoringConfig.buildUrl!({ sourceUrl: "https://example.com", enableFullscreen: true });
      expect(url).toBe("https://example.com");
    });

    it("returns null for empty sourceUrl", () => {
      const url = genericAuthoringConfig.buildUrl!({ sourceUrl: "", enableFullscreen: true });
      expect(url).toBeNull();
    });
  });

  describe("getDisableFullscreen", () => {
    it("returns false when enableFullscreen is true", () => {
      expect(genericAuthoringConfig.getDisableFullscreen!({ sourceUrl: "", enableFullscreen: true })).toBe(false);
    });

    it("returns true when enableFullscreen is false", () => {
      expect(genericAuthoringConfig.getDisableFullscreen!({ sourceUrl: "", enableFullscreen: false })).toBe(true);
    });
  });
});
/* eslint-enable @typescript-eslint/no-non-null-assertion */
