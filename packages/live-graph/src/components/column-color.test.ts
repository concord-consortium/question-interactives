import { columnColor } from "./column-color";

describe("columnColor", () => {
  it("is deterministic", () => {
    expect(columnColor(0)).toBe(columnColor(0));
    expect(columnColor(5)).toBe(columnColor(5));
  });

  it("produces distinct colors for the first 10 positions", () => {
    const colors = Array.from({ length: 10 }, (_, i) => columnColor(i));
    expect(new Set(colors).size).toBe(10);
  });

  it("wraps palette past the end without throwing", () => {
    expect(() => columnColor(100)).not.toThrow();
  });

  it("falls back to a valid color for invalid indices", () => {
    expect(typeof columnColor(-1)).toBe("string");
    expect(typeof columnColor(NaN)).toBe("string");
  });
});
