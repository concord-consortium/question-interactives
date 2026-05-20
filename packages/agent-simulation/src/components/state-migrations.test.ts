import { migrateAuthoredState } from "./state-migrations";
import { IAuthoredState, IAuthoredStateV1 } from "./types";

describe("agent-simulation authored state migration", () => {
  const v1Base: IAuthoredStateV1 = {
    version: 1,
    questionType: "iframe_interactive",
    code: "",
    gridHeight: 450,
    gridStep: 15,
    gridWidth: 450,
    maxRecordingTime: 90,
  };

  it("converts V1 with a positive sampleIntervalMs to V2 with ms unit", () => {
    const result = migrateAuthoredState({ ...v1Base, sampleIntervalMs: 200 });
    expect(result).toEqual({
      ...v1Base,
      version: 2,
      sampleIntervalUnit: "ms",
      sampleInterval: 200,
    });
    expect("sampleIntervalMs" in result).toBe(false);
  });

  it("converts V1 with no sampleIntervalMs to V2 with no sample-interval fields", () => {
    const result = migrateAuthoredState({ ...v1Base });
    expect(result).toEqual({ ...v1Base, version: 2 });
    expect("sampleIntervalUnit" in result).toBe(false);
    expect("sampleInterval" in result).toBe(false);
  });

  it("rounds a fractional sampleIntervalMs up via Math.ceil (100.4 → 101)", () => {
    // 100.4 discriminates between Math.round (→100) and Math.ceil (→101).
    // Math.ceil matches the pre-migration runtime guard's implicit rounding.
    const result = migrateAuthoredState({ ...v1Base, sampleIntervalMs: 100.4 });
    expect(result.sampleInterval).toBe(101);
    expect(result.sampleIntervalUnit).toBe("ms");
  });

  it("treats a non-positive sampleIntervalMs as no throttling", () => {
    const result = migrateAuthoredState({ ...v1Base, sampleIntervalMs: 0 });
    expect(result).toEqual({ ...v1Base, version: 2 });
    expect("sampleIntervalUnit" in result).toBe(false);
    expect("sampleInterval" in result).toBe(false);
  });

  it("returns a V2 state unchanged", () => {
    const v2: IAuthoredState = {
      ...v1Base,
      version: 2,
      sampleIntervalUnit: "ticks",
      sampleInterval: 5,
    };
    const copy = JSON.parse(JSON.stringify(v2));
    expect(migrateAuthoredState(v2)).toEqual(copy);
  });
});
