import { IAuthoredState, IAuthoredStateV1 } from "./types";

export const migrateAuthoredState = (
  authoredState: IAuthoredStateV1 | IAuthoredState
): IAuthoredState => {
  if (authoredState.version === 1) {
    // Destructure-and-spread (rather than just spreading `authoredState`) so
    // the V1-only `sampleIntervalMs` key is actually dropped from the returned
    // object at runtime, not just made unreachable by V2's type. The function's
    // `: IAuthoredState` return annotation enforces the shape contract.
    const { sampleIntervalMs, ...rest } = authoredState;
    if (typeof sampleIntervalMs === "number" && sampleIntervalMs > 0) {
      return {
        ...rest,
        version: 2,
        sampleIntervalUnit: "ms",
        sampleInterval: Math.ceil(sampleIntervalMs)
      };
    }
    return { ...rest, version: 2 };
  }
  return authoredState;
};
