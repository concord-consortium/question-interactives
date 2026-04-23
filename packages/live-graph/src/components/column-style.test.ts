import { columnStyle } from "./column-style";

describe("columnStyle", () => {
  it("is deterministic", () => {
    expect(columnStyle(0)).toEqual(columnStyle(0));
    expect(columnStyle(5)).toEqual(columnStyle(5));
  });

  it("produces distinct colors for the first 10 positions", () => {
    const colors = Array.from({ length: 10 }, (_, i) => columnStyle(i).color);
    expect(new Set(colors).size).toBe(10);
  });

  it("produces distinct dash styles for the first 10 positions", () => {
    const dashes = Array.from({ length: 10 }, (_, i) => JSON.stringify(columnStyle(i).borderDash));
    expect(new Set(dashes).size).toBe(10);
  });

  it("returns solid (empty array) for the first position", () => {
    expect(columnStyle(0).borderDash).toEqual([]);
  });

  it("wraps palette past the end without throwing", () => {
    expect(() => columnStyle(100)).not.toThrow();
  });

  it("falls back to valid style for invalid indices", () => {
    expect(typeof columnStyle(-1).color).toBe("string");
    expect(Array.isArray(columnStyle(-1).borderDash)).toBe(true);
    expect(typeof columnStyle(NaN).color).toBe("string");
    expect(Array.isArray(columnStyle(NaN).borderDash)).toBe(true);
  });
});
