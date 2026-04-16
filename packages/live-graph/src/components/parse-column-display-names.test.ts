import { parseColumnDisplayNames } from "./parse-column-display-names";

describe("parseColumnDisplayNames", () => {
  it("returns an empty mapping for undefined/empty input", () => {
    expect(parseColumnDisplayNames(undefined)).toEqual({});
    expect(parseColumnDisplayNames("")).toEqual({});
  });

  it("parses newline-separated mappings", () => {
    const raw = "pred_count=Predators\nprey_count=Prey";
    expect(parseColumnDisplayNames(raw)).toEqual({
      pred_count: "Predators",
      prey_count: "Prey",
    });
  });

  it("parses ampersand-separated mappings", () => {
    expect(parseColumnDisplayNames("a=A&b=B")).toEqual({ a: "A", b: "B" });
  });

  it("handles mixed newline + ampersand separators", () => {
    const raw = "a=A\nb=B&c=C";
    expect(parseColumnDisplayNames(raw)).toEqual({ a: "A", b: "B", c: "C" });
  });

  it("decodes percent-encoded name and label", () => {
    // author wants a literal `&` in the label
    const raw = "x=A%26B";
    expect(parseColumnDisplayNames(raw)).toEqual({ x: "A&B" });
  });

  it("trims whitespace around name and label", () => {
    const raw = "  a  =  Alpha  ";
    expect(parseColumnDisplayNames(raw)).toEqual({ a: "Alpha" });
  });

  it("ignores chunks without an '=' separator", () => {
    const raw = "justname\na=Alpha";
    expect(parseColumnDisplayNames(raw)).toEqual({ a: "Alpha" });
  });

  it("decodes + as space (URLSearchParams behaviour) — authors should use %2B for literal +", () => {
    const raw = "CO2+=Carbon Dioxide";
    // URLSearchParams decodes `+` as space, so `CO2+` becomes `CO2 `
    expect(parseColumnDisplayNames(raw)).toEqual({ "CO2": "Carbon Dioxide" });
    // To preserve a literal `+`, use percent-encoding:
    const rawEncoded = "CO2%2B=Carbon Dioxide";
    expect(parseColumnDisplayNames(rawEncoded)).toEqual({ "CO2+": "Carbon Dioxide" });
  });
});
