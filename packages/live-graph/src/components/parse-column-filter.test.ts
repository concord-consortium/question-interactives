import { parseColumnFilter } from "./parse-column-filter";

describe("parseColumnFilter", () => {
  it("returns an empty array for empty/undefined input", () => {
    expect(parseColumnFilter(undefined)).toEqual([]);
    expect(parseColumnFilter("")).toEqual([]);
    expect(parseColumnFilter("   ")).toEqual([]);
  });

  it("splits on commas", () => {
    expect(parseColumnFilter("a,b,c")).toEqual(["a", "b", "c"]);
  });

  it("preserves spaces within names (does not split on spaces)", () => {
    expect(parseColumnFilter("pred count")).toEqual(["pred count"]);
  });

  it("splits on newlines", () => {
    expect(parseColumnFilter("a\nb\nc")).toEqual(["a", "b", "c"]);
  });

  it("handles mixed commas and newlines and collapses consecutive ones", () => {
    expect(parseColumnFilter("a,b\n,c,, d")).toEqual(["a", "b", "c", "d"]);
  });

  it("ignores trailing separators", () => {
    expect(parseColumnFilter("a, b, c,,,")).toEqual(["a", "b", "c"]);
  });

  it("trims each token", () => {
    expect(parseColumnFilter("  a ,   b   ")).toEqual(["a", "b"]);
  });

  it("handles Windows-style \\r\\n line endings", () => {
    expect(parseColumnFilter("a\r\nb\r\nc")).toEqual(["a", "b", "c"]);
  });
});
