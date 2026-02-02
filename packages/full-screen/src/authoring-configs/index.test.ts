// Non-null assertions (!) disabled in test files to keep test code compact.
// The values are guaranteed non-null by the test setup.
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { authoringConfigs, getAuthoringConfig } from "./index";

describe("authoringConfigs", () => {
  it("contains codap config", () => {
    expect(authoringConfigs.codap).toBeDefined();
    expect(authoringConfigs.codap.type).toBe("codap");
  });

  it("contains generic config", () => {
    expect(authoringConfigs.generic).toBeDefined();
    expect(authoringConfigs.generic.type).toBe("generic");
  });
});

describe("getAuthoringConfig", () => {
  it("returns codap config for 'codap'", () => {
    const config = getAuthoringConfig("codap");
    expect(config).not.toBeNull();
    expect(config!.type).toBe("codap");
  });

  it("returns generic config for 'generic'", () => {
    const config = getAuthoringConfig("generic");
    expect(config).not.toBeNull();
    expect(config!.type).toBe("generic");
  });

  it("returns null for unknown type", () => {
    expect(getAuthoringConfig("unknown")).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(getAuthoringConfig("")).toBeNull();
  });
});
/* eslint-enable @typescript-eslint/no-non-null-assertion */
