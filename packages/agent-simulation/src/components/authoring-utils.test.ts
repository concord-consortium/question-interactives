import { IAuthoredState } from "./types";
import { preprocessFormData } from "./authoring-utils";

describe("agent-simulation preprocessFormData", () => {
  const base: IAuthoredState = {
    version: 2,
    questionType: "iframe_interactive",
    code: "",
    gridHeight: 450,
    gridStep: 15,
    gridWidth: 450,
    maxRecordingTime: 90,
  };

  it("strips sampleInterval when unit is 'none' and preserves all other fields", () => {
    const result = preprocessFormData({
      ...base,
      sampleIntervalUnit: "none",
      sampleInterval: 500,
    });
    expect(result).toEqual({ ...base, sampleIntervalUnit: "none" });
    expect("sampleInterval" in result).toBe(false);
  });

  it("preserves sampleInterval and all other fields when unit is 'ms'", () => {
    const result = preprocessFormData({
      ...base,
      sampleIntervalUnit: "ms",
      sampleInterval: 500,
    });
    expect(result).toEqual({ ...base, sampleIntervalUnit: "ms", sampleInterval: 500 });
  });

  it("preserves sampleInterval and all other fields when unit is 'ticks'", () => {
    const result = preprocessFormData({
      ...base,
      sampleIntervalUnit: "ticks",
      sampleInterval: 5,
    });
    expect(result).toEqual({ ...base, sampleIntervalUnit: "ticks", sampleInterval: 5 });
  });

  it("is idempotent when unit is 'none' and sampleInterval is already absent", () => {
    const input = { ...base, sampleIntervalUnit: "none" as const };
    const result = preprocessFormData(input);
    expect(result).toEqual(input);
    expect("sampleInterval" in result).toBe(false);
  });

  it("strips sampleInterval when sampleIntervalUnit is absent (defensive)", () => {
    // Defensive coverage of preprocessFormData's `?? "none"` branch: an absent unit
    // is treated the same as "none". RJSF's populateAllDefaults normally writes the
    // "none" default into formData, so this guards a missing unit, not a form state.
    const result = preprocessFormData({ ...base, sampleInterval: 5 });
    expect(result).toEqual(base);
    expect("sampleInterval" in result).toBe(false);
  });
});
