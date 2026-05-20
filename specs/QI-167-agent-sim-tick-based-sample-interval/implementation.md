# Implementation Plan: Tick-Based Sample Interval in Agent-Simulation Authoring (QI-167)

**Jira**: https://concord-consortium.atlassian.net/browse/QI-167
**Requirements Spec**: [requirements.md](requirements.md)
**Status**: **In Development**

## Implementation Plan

> **Commit note**: The steps below are a *review* decomposition, **not** four independently-buildable commits. The `IAuthoredState` shape change in the first step (removing `sampleIntervalMs`, tightening `version` to the literal `2`) ripples to consumers — `agent-simulation.tsx` and `agent-simulation.test.tsx` — that are only updated in the runtime and test steps. So the intermediate commits (after step 1, 2, or 3 alone) will not compile. Treat the four steps as one atomic compile-unit: review them step-by-step, but commit and land them together as a single PR.

### Add `state-migrations.ts` + migration tests; bump types to v2

**Summary**: Introduce the V1→V2 migration that converts legacy `sampleIntervalMs` to the new `{ sampleIntervalUnit, sampleInterval }` pair, and update `IAuthoredState` / `DefaultAuthoredState` / `DemoAuthoredState` to the V2 shape. Foundation for the schema and runtime changes that follow.

**Files affected**:
- [packages/agent-simulation/src/components/types.ts](packages/agent-simulation/src/components/types.ts) — replace `sampleIntervalMs?: number` with the two new fields; **tighten `IAuthoredState.version` from `number` to the literal `2`** (matches carousel/labbook/scaffolded-question and is what makes the migration's `version === 1` discriminated narrowing work — see Step 1's `types.ts` source block for rationale); bump the `version` literal in `DefaultAuthoredState` and `DemoAuthoredState` from `1` to `2`; update the `Omit<...>` exclusion list in `DefaultAuthoredState`.
- **New** [packages/agent-simulation/src/components/state-migrations.ts](packages/agent-simulation/src/components/state-migrations.ts) — `migrateAuthoredState` (imports `IAuthoredStateV1` from `./types`). Pattern parallels [packages/carousel/src/components/state-migrations.ts](packages/carousel/src/components/state-migrations.ts).
- **New** [packages/agent-simulation/src/components/state-migrations.test.ts](packages/agent-simulation/src/components/state-migrations.test.ts) — five tests per the [Tests](requirements.md#tests) bullet list: positive int, missing field, fractional 100.4 → 101, non-positive, version 2 unchanged.

**Estimated diff size**: ~140 lines (state-migrations.ts ~15, state-migrations.test.ts ~95, types.ts ~25 changed).

#### `state-migrations.ts` (full file)

```ts
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
```

#### `types.ts` (before → after)

Before:
```ts
export interface IAuthoredState extends IAuthoringInteractiveMetadata {
  // …
  version: number;
  maxRecordingTime: number;
  sampleIntervalMs?: number;
  maxSamples?: number;
}

export const DefaultAuthoredState: Omit<Required<IAuthoredState>,
  "questionSubType"|"required"|"prompt"|"sampleIntervalMs"|"maxSamples"> = {
  // …
  version: 1,
  maxRecordingTime: defaultMaxRecordingTime,
};

export const DemoAuthoredState: IAuthoredState = {
  // …
  version: 1,
  maxRecordingTime: defaultMaxRecordingTime,
};
```

After:
```ts
export interface IAuthoredStateV1 extends IAuthoringInteractiveMetadata {
  version: 1;
  code: string;
  dataSourceInteractive?: string;
  gridHeight: number;
  gridStep: number;
  gridWidth: number;
  hint?: string;
  maxRecordingTime: number;
  sampleIntervalMs?: number;
  maxSamples?: number;
}

export interface IAuthoredState extends IAuthoringInteractiveMetadata {
  // …
  // `version: 2` (literal, not `number`) is what enables `version === 1` to
  // narrow the `IAuthoredStateV1 | IAuthoredState` union down to V1 inside
  // the migration's branch — which is what makes the V1-only
  // `sampleIntervalMs` destructure typecheck. Matches carousel/labbook/
  // scaffolded-question.
  version: 2;
  maxRecordingTime: number;
  sampleIntervalUnit?: "none" | "ms" | "ticks";
  sampleInterval?: number;
  maxSamples?: number;
}

export const DefaultAuthoredState: Omit<Required<IAuthoredState>,
  "questionSubType"|"required"|"prompt"|"sampleIntervalUnit"|"sampleInterval"|"maxSamples"> = {
  // …
  version: 2,
  maxRecordingTime: defaultMaxRecordingTime,
};

export const DemoAuthoredState: IAuthoredState = {
  // …
  version: 2,
  maxRecordingTime: defaultMaxRecordingTime,
};
```

#### `state-migrations.test.ts` (full file)

```ts
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
```

---

### Update authoring schema + wire migration + `preprocessFormData`

**Summary**: Update the RJSF schema in `app.tsx` to replace the single `sampleIntervalMs` field with a `sampleIntervalUnit` dropdown + `sampleInterval` integer field, add `preprocessFormData` to strip `sampleInterval` when unit is `"none"`, and pass `migrateAuthoredState` through to `BaseQuestionApp`. Bump schema `version` default from `1` to `2`. No custom `Authoring.tsx` is introduced.

**Files affected**:
- [packages/agent-simulation/src/components/app.tsx](packages/agent-simulation/src/components/app.tsx)
- **New** `packages/agent-simulation/src/components/authoring-utils.ts` — houses `preprocessFormData` (imports only `./types`, no React/runtime imports, so its Step 4 unit test stays dependency-light).

**Estimated diff size**: ~50 lines changed/added (app.tsx ~40; authoring-utils.ts ~10 new).

#### Schema changes

In `baseAuthoringProps.schema.properties`, bump the `version.default`:
```ts
version: {
  type: "number",
  default: 2
},
```

Replace the existing `sampleIntervalMs` property:
```ts
// REMOVE
sampleIntervalMs: {
  title: "Sample Interval (ms, optional)",
  type: "number",
  minimum: 1
},
```

With:
```ts
sampleIntervalUnit: {
  title: "Throttle samples by",
  type: "string",
  enum: ["none", "ms", "ticks"],
  enumNames: [
    "No throttling",
    "Every N milliseconds",
    "Every N simulation ticks"
  ],
  default: "none"
},
sampleInterval: {
  title: "Interval",
  type: "integer",
  minimum: 1
},
```

In `uiSchema`, remove the `sampleIntervalMs` entry and add:
```ts
sampleInterval: {
  "ui:widget": "updown",
  "ui:help": "Interpreted in the unit selected above. Review this value if you change the unit — for example, 1000 means 1000 milliseconds in ms mode and 1000 simulation ticks in tick mode."
},
```

#### `preprocessFormData` + `migrateAuthoredState` wiring

**New file** `authoring-utils.ts` defines `preprocessFormData`. It lives outside `app.tsx` so its Step 4 unit test imports only `./authoring-utils` + `./types` and never pulls in the React/runtime module graph (`app.tsx` → `runtime.tsx` → `agent-simulation.tsx` → `../models/agent-simulation`):
```ts
import { IAuthoredState } from "./types";

export const preprocessFormData = (data: IAuthoredState): IAuthoredState => {
  // `?? "none"` treats an absent sampleIntervalUnit the same as "none" — a defensive
  // guard. RJSF's default populateAllDefaults behavior writes the dropdown's "none"
  // default into formData, so the unit is normally set explicitly.
  if ((data.sampleIntervalUnit ?? "none") === "none" && data.sampleInterval !== undefined) {
    const { sampleInterval, ...rest } = data;
    return rest;
  }
  return data;
};
```

In `app.tsx`, add top-level imports and reference `preprocessFormData` by name from `baseAuthoringProps`:
```ts
import { migrateAuthoredState } from "./state-migrations";
import { preprocessFormData } from "./authoring-utils";
```
```ts
const baseAuthoringProps = {
  // …schema, uiSchema…
  preprocessFormData,
};
```

Pass `migrateAuthoredState` to `BaseQuestionApp` (mirroring carousel / labbook):
```tsx
export const App = () => (
  <BaseQuestionApp<IAuthoredState, IInteractiveState>
    Runtime={Runtime}
    baseAuthoringProps={baseAuthoringProps}
    isAnswered={isAnswered}
    linkedInteractiveProps={[{ label: "dataSourceInteractive" }]}
    migrateAuthoredState={migrateAuthoredState}
  />
);
```

> **Test coverage note**: the `migrateAuthoredState` prop wiring is verified by review of this diff, not by an automated test — consistent with carousel / labbook / scaffolded-question, which likewise test `migrateAuthoredState` only as a pure function. An `app.tsx`-level test would pull in the runtime module graph (the coupling the `authoring-utils.ts` extraction was designed to avoid). If this prop is omitted, legacy `version: 1` activities silently stop migrating and the runtime never throttles them; reviewers should confirm the line is present.

---

### Runtime sampling: new refs + tick-mode branch in `afterTick`

**Summary**: Replace `sampleIntervalMsRef` with `sampleIntervalRef` + `sampleIntervalUnitRef`, add `lastSampleTickRef`, and update the throttle branch in `afterTick` to switch on the unit. The migration in Step 1 guarantees the runtime never sees the legacy field, so reads are direct (no inference helper).

**Files affected**:
- [packages/agent-simulation/src/components/agent-simulation.tsx](packages/agent-simulation/src/components/agent-simulation.tsx)

**Estimated diff size**: ~35 lines changed.

#### Destructure new fields ([line 71](packages/agent-simulation/src/components/agent-simulation.tsx#L71))

Before:
```ts
const { code, gridHeight, gridStep, gridWidth, maxRecordingTime, sampleIntervalMs, maxSamples } = authoredState;
```

After:
```ts
const { code, gridHeight, gridStep, gridWidth, maxRecordingTime, sampleIntervalUnit, sampleInterval, maxSamples } = authoredState;
```

#### Replace refs ([lines 144-150](packages/agent-simulation/src/components/agent-simulation.tsx#L144-L150))

Before:
```ts
const lastSampleAtRef = useRef<number | null>(null);
// …
const sampleIntervalMsRef = useRef<number | undefined>(sampleIntervalMs);
sampleIntervalMsRef.current = sampleIntervalMs;
const maxSamplesRef = useRef<number | undefined>(maxSamples);
maxSamplesRef.current = maxSamples;
```

After:
```ts
// Wall-clock timestamp of the most recent kept sample. null = no sample yet.
const lastSampleAtRef = useRef<number | null>(null);
// Sim-tick number of the most recent kept sample. null = no sample yet.
const lastSampleTickRef = useRef<number | null>(null);
// …
// Mirrors authoredState fields for use inside afterTick. `?? "none"` defaults a
// missing unit — the migrated V1 state with no sampleIntervalMs arrives with
// sampleIntervalUnit unset. (Fresh-authored states arrive with "none" explicit.)
const sampleIntervalUnitRef = useRef<"none" | "ms" | "ticks">(sampleIntervalUnit ?? "none");
sampleIntervalUnitRef.current = sampleIntervalUnit ?? "none";
const sampleIntervalRef = useRef<number | undefined>(sampleInterval);
sampleIntervalRef.current = sampleInterval;
const maxSamplesRef = useRef<number | undefined>(maxSamples);
maxSamplesRef.current = maxSamples;
```

#### Reset `lastSampleTickRef` on sim (re)create ([lines 400-403](packages/agent-simulation/src/components/agent-simulation.tsx#L400-L403))

Before:
```ts
let tick = 0;
tickDataRef.current = [];
lastSampleAtRef.current = null;
maxSamplesAutoStoppedRef.current = false;
```

After:
```ts
let tick = 0;
tickDataRef.current = [];
lastSampleAtRef.current = null;
lastSampleTickRef.current = null;
maxSamplesAutoStoppedRef.current = false;
```

#### Update `afterTick` throttle branch ([lines 419-432](packages/agent-simulation/src/components/agent-simulation.tsx#L419-L432))

Before:
```ts
// Throttle samples by wall-clock interval when sampleIntervalMs is set.
// The first tick after a sim (re)create is always sampled because
// lastSampleAtRef starts null. `tick` keeps counting every simulation
// step so downstream consumers can read sim-time from the sample.
const intervalMs = sampleIntervalMsRef.current;
const now = Date.now();
if (
  intervalMs !== undefined &&
  lastSampleAtRef.current !== null &&
  now - lastSampleAtRef.current < intervalMs
) {
  return;
}
lastSampleAtRef.current = now;
```

After:
```ts
// Throttle samples by the configured unit: wall-clock ms or sim ticks.
// The first tick after a sim (re)create is always sampled because both
// lastSampleAtRef and lastSampleTickRef start null. `tick` keeps counting
// every simulation step so downstream consumers can read sim-time.
const unit = sampleIntervalUnitRef.current;
const interval = sampleIntervalRef.current;
const now = Date.now();
if (
  unit === "ms" &&
  interval !== undefined &&
  lastSampleAtRef.current !== null &&
  now - lastSampleAtRef.current < interval
) {
  return;
}
if (
  unit === "ticks" &&
  interval !== undefined &&
  lastSampleTickRef.current !== null &&
  currentTick - lastSampleTickRef.current < interval
) {
  return;
}
// On a kept sample, update both refs unconditionally so a mid-run unit change
// doesn't replay history.
lastSampleAtRef.current = now;
lastSampleTickRef.current = currentTick;
```

---

### Test migration + new tick-mode and `preprocessFormData` tests

**Summary**: Migrate the existing six sample-interval / maxSamples tests to the V2 shape (assertions unchanged), add tick-mode parallel tests + new contract tests called out in the requirements, and add a focused `preprocessFormData` unit test in a new `authoring-utils.test.ts`.

**Files affected**:
- [packages/agent-simulation/src/components/agent-simulation.test.tsx](packages/agent-simulation/src/components/agent-simulation.test.tsx) — migrate existing tests, add tick-mode tests.
- **New** `packages/agent-simulation/src/components/authoring-utils.test.ts` — small file housing the `preprocessFormData` unit test. It imports only `./authoring-utils` + `./types`, so it never pulls in the React/runtime module graph and needs none of the file-local `jest.mock`s that `agent-simulation.test.tsx` relies on (e.g. `jest.mock("../models/agent-simulation", …)` at [agent-simulation.test.tsx:39](packages/agent-simulation/src/components/agent-simulation.test.tsx#L39)).

**Estimated diff size**: ~380 lines added/changed in `agent-simulation.test.tsx`; ~45 lines for the new `authoring-utils.test.ts` (5 tests).

#### Migrate existing ms-throttle tests in `agent-simulation.test.tsx`

`defaultAuthoredState` literal at [line 82](packages/agent-simulation/src/components/agent-simulation.test.tsx#L82) bumps `version: 1` → `version: 2`. (Other `version: 1` fixtures in this file at lines 93, 100, 388, 745 are `IInteractiveState` / `ObjectStorageConfig` — unchanged.)

Existing test field shapes ([lines 1658](packages/agent-simulation/src/components/agent-simulation.test.tsx#L1658), [1830](packages/agent-simulation/src/components/agent-simulation.test.tsx#L1830)):
```ts
const authored: IAuthoredState = { ...defaultAuthoredState, sampleIntervalMs: 500 };
```
become:
```ts
const authored: IAuthoredState = { ...defaultAuthoredState, sampleIntervalUnit: "ms", sampleInterval: 500 };
```
Assertions stay identical. Test names stay identical **except** the two that embed the now-removed `sampleIntervalMs` field name, which are renamed so a grep for `sampleIntervalMs` no longer lands on tests for a field that no longer exists:

- [line 1632](packages/agent-simulation/src/components/agent-simulation.test.tsx#L1632): `"samples every tick when sampleIntervalMs and maxSamples are unset (default behavior)"` → `"samples every tick when sampleIntervalUnit and maxSamples are unset (default behavior)"` (this test uses `defaultAuthoredState`, which sets neither field — so "unset" is accurate; the runtime ref defaults the missing unit to `"none"`)
- [line 1654](packages/agent-simulation/src/components/agent-simulation.test.tsx#L1654): `"throttles samples per sampleIntervalMs and stamps each sample with its sim-tick number"` → `"throttles samples per sampleInterval in ms mode and stamps each sample with its sim-tick number"` (the `in ms mode` qualifier also disambiguates it from the parallel tick-mode test #1 below).

#### New tick-mode tests (parallel structure to existing ms tests)

Each test follows the same render / `getLatestAfterTick()` / `act()` pattern as the ms tests. The sketches below intentionally show only the distinguishing setup and assertion lines — the surrounding harness (render call, `act` wrapping, `recordingChannelRef.publish` spy, deferred-pause flush via `await act(async () => { await new Promise(resolve => setTimeout(resolve, 30)); })`) is copied verbatim from the cited ms test at each test's referenced line number. The sample-interval `describe` block runs on **real timers** — the deferred `setTimeout(0)` auto-stop pause is flushed with the real-timer wait shown above (as the ms `maxSamples` tests do at [lines 1726](packages/agent-simulation/src/components/agent-simulation.test.tsx#L1726) and [1781](packages/agent-simulation/src/components/agent-simulation.test.tsx#L1781)), **not** `jest.runAllTimers()`, which would no-op here. If an existing ms test doesn't already exercise a needed harness piece (e.g. `Date.now` mocking is unnecessary in tick mode), drop it.

1. **Throttles samples per N ticks and stamps each sample with its sim-tick number** — parallels the ms test at [line 1654](packages/agent-simulation/src/components/agent-simulation.test.tsx#L1654). With `sampleIntervalUnit: "ticks", sampleInterval: 5`, fire 11 ticks, assert published tick values are `[0, 5, 10]`. No `Date.now` mocking — wall-clock is irrelevant in tick mode.

2. **First-tick rule (separate test for unambiguous assertion)** — with `sampleIntervalUnit: "ticks", sampleInterval: 5`, fire 1 tick, assert exactly 1 sample published with `tick: 0`. (Locks in the contract that the first `afterTick` after sim (re)create is always sampled regardless of `sampleInterval`.)

3. **Tick-mode `maxSamples` auto-stop fires after the Nth kept sample, and the deferred-pause guard release at [line 1752](packages/agent-simulation/src/components/agent-simulation.test.tsx#L1752) still holds** — with `sampleIntervalUnit: "ticks", sampleInterval: 3, maxSamples: 2`, enter recording mode and fire 4 `afterTick()` calls (raw ticks 0–3): samples are kept at tick 0 and tick 3, so the cap of 2 is reached on the tick-3 kept sample — 2 *kept* rows out of 4 raw ticks, which is what proves the cap counts rows pushed to `tickDataRef`, not raw ticks. The cap-hit queues the auto-stop via `setTimeout(0)`. Flush the deferred pause with `await act(async () => { await new Promise(resolve => setTimeout(resolve, 30)); })` (the real-timer flush the sibling ms tests use at [line 1726](packages/agent-simulation/src/components/agent-simulation.test.tsx#L1726) / [:1781](packages/agent-simulation/src/components/agent-simulation.test.tsx#L1781) — see the third-pass Self-Review Issue 4), which runs `handlePlayPause`, releases `maxSamplesAutoStoppedRef`, and completes `save()`. Then `mockPublish.mockClear()` and fire 3 more `afterTick()` calls (raw ticks 4, 5, 6 — the `tick` closure is still at 4, since no tick incremented it after tick 3): ticks 4 and 5 are *processed* (guard released) but tick-throttle-skipped (`4-3=1`, `5-3=2`, both `< 3`), and tick 6 is kept and published (`6-3=3`). Net assertions: `pause` called once; the saved recording (`mockAdd`) holds exactly 2 rows (ticks 0 and 3); after the clear, exactly one publish with `values.tick === 6` — which simultaneously proves the guard was released (ticks 4–6 reached the throttle instead of early-returning) and that the throttle resumed its cadence. The blocked-gap-tick check from the prior wording is dropped: it duplicates the cap-exactness coverage already in the ms test at [line 1693](packages/agent-simulation/src/components/agent-simulation.test.tsx#L1693) and was the source of the "fire 4 ticks" / "tick 4 blocked" count contradiction.

4. **Tick-mode throttle applies in free-play (`simulation-tick`) too** — parallels the ms free-play test at [line 1826](packages/agent-simulation/src/components/agent-simulation.test.tsx#L1826). With `sampleIntervalUnit: "ticks", sampleInterval: 3`, don't enter recording mode, fire 7 ticks, assert published topic is `simulation-tick` and published `tick` values are `[0, 3, 6]`.

5. **Mid-run unit change uses an up-to-date `lastSampleTickRef`** — exercises the "update both refs unconditionally on a kept sample" rule from Step 3. Render with `sampleIntervalUnit: "ms", sampleInterval: 100`, capturing `rerender` from React Testing Library's `render()` return value (unlike the other tick-mode tests, which call `render(...)` without capturing it — this is the one harness piece test #5 cannot copy from an existing ms test). Under a `Date.now` mock advanced by ≥100 ms before each tick, fire exactly 3 ticks (0, 1, 2) — all kept, so `lastSampleTickRef.current` ends at `2` and the closure's `tick` counter is at `3`. Re-render via `rerender(...)` with a new `<AgentSimulationComponent>` whose `authoredState` has `sampleIntervalUnit: "ticks", sampleInterval: 2`. Fire one tick (`currentTick = 3`) and assert it is *skipped* (no new publish): `3 - 2 = 1 < 2`. The skip is the proof — had the ms run left `lastSampleTickRef` at `null`, the tick-mode guard's `lastSampleTickRef.current !== null` clause would be false and the tick would be *kept* instead. **The rerender must not rebuild the sim** — it changes only sample-interval fields, and `resetSimulationWithPreservedGlobals`'s `useCallback` deps ([agent-simulation.tsx:474](packages/agent-simulation/src/components/agent-simulation.tsx#L474)) contain no sample-interval field, so the rebuild effect doesn't re-fire and the throttle refs survive. Add a one-line comment in the test stating this, so a future change to those deps doesn't silently invalidate the test's premise. **Coverage scope**: the "update both refs unconditionally" rule has two beneficiaries — an ms→ticks switch (relies on `lastSampleTickRef` being left fresh) and a ticks→ms switch (relies on `lastSampleAtRef` being left fresh). This test directly exercises the ms→ticks direction; the ticks→ms direction is the immediately-adjacent line in the same `lastSampleAtRef.current = now; lastSampleTickRef.current = currentTick;` statement pair, so a regression that conditionalized either update on the unit is caught by this test's premise. A separate ticks→ms test is therefore deliberately omitted (it would add a near-duplicate harness to defend an already-adjacent line).

6. **Runtime fallback when `sampleInterval` is undefined with `sampleIntervalUnit: "ticks"`** — with `sampleIntervalUnit: "ticks"` and `sampleInterval` left unset, fire 4 ticks, assert all 4 publish. (Locks in the `interval !== undefined` guard in `afterTick`; a future refactor that drops it would regress this silently.)

#### New `authoring-utils.test.ts`

```ts
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
```

## Open Questions

<!-- Implementation-focused questions only. None at this time. -->

## Self-Review

<!-- Multi-role self-review of the implementation spec. Process each OPEN entry one at a time. -->

### Senior Engineer

#### RESOLVED: [MEDIUM] `IAuthoredStateV1` is defined in `state-migrations.ts` instead of `types.ts`
Moved `IAuthoredStateV1` into `types.ts` to match the carousel/labbook/scaffolded-question pattern. `state-migrations.ts` now imports both interfaces from `./types` and shrinks to just the migration function (~15 lines instead of ~25). The `types.ts` files-affected entry in both `requirements.md` and `implementation.md` now lists the new interface explicitly, and the V1-shape requirements-bullet was updated to mention the co-location decision.

---

#### RESOLVED: [MEDIUM] Step 4 contradicts Step 2 about where `preprocessFormData` lives
Folded the named-export decision into Step 2: `preprocessFormData` is now defined as a top-level `export const` from the start and referenced by name inside `baseAuthoringProps`. Step 4's redundant "Step 2's `app.tsx` needs a minor adjustment" trailing block was removed, and the obsolete "small refactor in Step 2" comment inside the test-file source block was dropped. Step 2 and Step 4 are now independently coherent commits.

---

#### RESOLVED: [MEDIUM] TypeScript narrowing on the migration union is incomplete
On re-examination the typing is fine: the function's `: IAuthoredState` return annotation enforces the shape contract at the boundary, achieving the same safety carousel gets from the inline `const newState: IAuthoredState = ...` annotation. The narrowing observation is correct (`1 extends number` blocks TS from reducing the union to `IAuthoredStateV1` inside the branch), but the consequence is cosmetic — the spread expression still has to match `IAuthoredState` at the return site. What was actually worth addressing was the *intent* of the destructure: it exists to drop `sampleIntervalMs` from the runtime object, not just from the type. Added an inline comment to the spec's `state-migrations.ts` source block explaining this, so a future reader doesn't refactor the destructure away in favor of a plain spread.

**Correction (second-pass review)**: this conclusion was wrong. The destructure `const { sampleIntervalMs, ...rest } = authoredState` fails to typecheck under the broader `version: number` typing because `sampleIntervalMs` is not declared on `IAuthoredState`. Resolved in the second-pass HIGH entry below by tightening `IAuthoredState.version` to the literal `2`, which is what carousel/labbook/scaffolded-question already do.

---

#### RESOLVED: [LOW] `Math.max(1, Math.ceil(sampleIntervalMs))` clamp is dead code
Dropped the `Math.max(1, ...)` wrapper from the migration. The `> 0` guard already excludes zero and negatives, and `Math.ceil(positive) ≥ 1` by construction. Updated the source block in `implementation.md` Step 1 and the matching migration-rule bullet in `requirements.md`'s Backward compatibility section. The `100.4 → 101` test still discriminates between `Math.round` and `Math.ceil`, so test coverage is unchanged.

---

#### RESOLVED: [LOW] Step 3's new ref comment is heavier than the surrounding pattern
Tightened the inline comment for `sampleIntervalUnitRef` from four lines to three, matching the sibling-ref pattern. The shorter form still references both source paths (fresh-authored RJSF defaults + migrated V1 states) so the rationale is recoverable without consulting the spec.

---

#### RESOLVED: [LOW] `app.test.tsx` fixture doesn't guard against mangling of other fields
Tightened all three `preprocessFormData` tests to use `toEqual` against a full expected object (`{ ...base, ...modifications }`) instead of probing just `sampleInterval`/`sampleIntervalUnit`. A regression that drops or mutates unrelated fields (`code`, `gridHeight`, `version`, etc.) now fails the test. The `"sampleInterval" in result` assertion stays as a separate check in the strip case (since `toEqual` ignores missing-vs-undefined distinctions).

---

#### RESOLVED: [HIGH] Migration's `version === 1` narrowing assumes `IAuthoredState.version` is a literal, but the spec keeps it as `number`
Tightened `IAuthoredState.version` from `number` to the literal `2` in Step 1's `types.ts` "After" block, matching carousel/labbook/scaffolded-question. This is what enables the `version === 1` discriminated narrowing in `migrateAuthoredState` (and the V1-only `sampleIntervalMs` destructure that depends on that narrowing) to typecheck. `DefaultAuthoredState` and `DemoAuthoredState` were already at literal `version: 2` in the spec, so only the interface needed the change. Added an inline comment in the `types.ts` source block recording the rationale, called out the tightening in the Step 1 Files-affected line, and amended the original "[MEDIUM] TypeScript narrowing on the migration union is incomplete" RESOLVED entry above with a Correction note pointing forward to this fix (so the audit trail stays coherent).

---

### QA Engineer

#### RESOLVED: [MEDIUM] Test #5 description ("doesn't replay history") doesn't match its assertion
Renamed the test from "Mid-run unit change does not replay history" to "Mid-run unit change uses an up-to-date `lastSampleTickRef`" — the new name describes the invariant being exercised (Step 3's "update both refs unconditionally on a kept sample" rule) and aligns with the assertion (first post-switch tick is skipped). No split: the runtime has no mechanism that *could* replay history, so a separate "no burst" test would defend against an imaginary regression. Updated the parallel bullet in `requirements.md`'s Tests section to match.

---

#### RESOLVED: [MEDIUM] Missing `preprocessFormData` idempotency test for `unit: "none"` with no interval value
Added a fourth `app.test.tsx` test covering the fresh-authored steady state (`unit=none + interval=undefined`). Uses `toEqual(input)` for shape equality plus `"sampleInterval" in result` to catch the regression where someone writes `{ ...data, sampleInterval: undefined }` (which `toEqual` would otherwise accept). The new test locks in the `data.sampleInterval !== undefined` guard against silent regression.

---

#### RESOLVED: [LOW] Runtime tests are sketched, not shown in full, while migration tests are shown in full
Took the lightweight-clarification path rather than expanding the sketches to full code (which would have added ~250 lines of largely-duplicated ms-test boilerplate to the spec). Replaced the lead paragraph of Step 4's "New tick-mode tests" subsection to make the copy-the-harness expectation explicit, name the harness pieces (`act` wrapping, `recordingChannelRef.publish` spy, deferred-pause flush via `jest.runAllTimers()`), and call out the tick-mode-specific simplification that's allowed (drop `Date.now` mocking). The migration tests stay in full because they're a new test file with no existing harness to copy.

**Correction (third-pass review)**: the `jest.runAllTimers()` named here was wrong — the sample-interval `describe` block runs on real timers. The lead paragraph was corrected to the real-timer flush (`await act(async () => { await new Promise(resolve => setTimeout(resolve, 30)); })`) in third-pass Issue 4.

---

#### RESOLVED: [MEDIUM] Test #3 (tick-mode maxSamples) tick count and "kept" description don't match cap semantics
Rewrote test #3's setup in Step 4. The prior wording (*"fire 7 ticks (kept at 0, 3, 6 → cap-hit on the second kept sample)"*) contradicted the assertion of exactly 2 saved rows — once the cap hits on tick 3, the `maxSamplesAutoStoppedRef` guard blocks all subsequent `afterTick` publishes until the deferred-pause flushes, so tick 6 is never kept. New wording fires 4 ticks (kept at 0 and 3, cap hit on tick 3, tick 4 blocked by the guard), flushes `jest.runAllTimers()`, then fires one more `afterTick` and asserts it publishes (guard released). Net assertions and cross-reference to the QI-165 regression line are unchanged; the setup is now consistent with the cap semantics and stops firing ticks that the assertions can't observe.

**Correction (third-pass review)**: this rewrite still had three defects — a `fire 4 ticks` / `tick 4 blocked` count contradiction, a single post-flush `afterTick` that the tick throttle would skip rather than publish, and the wrong `jest.runAllTimers()` flush. Superseded by the test #3 rewrite in third-pass Issue 3 (4 calls, real-timer flush, 3 post-flush calls asserting the publish at `tick: 6`).

---

## Self-Review (Second Pass)

<!-- Second-pass multi-role review of the post-resolution implementation spec. -->

### Senior Engineer

#### RESOLVED: [LOW] `deepmerge` is not a dep of `packages/agent-simulation/` — `state-migrations.test.ts` would not compile
Confirmed `deepmerge` is declared only in `packages/carousel/package.json` and `packages/helpers/package.json`, and nothing under `packages/agent-simulation/src` imports it today — so the Step 1 test file's `import deepmerge from "deepmerge"` would fail to compile. Dropped the import and changed the "returns a V2 state unchanged" test's clone from `deepmerge({}, v2)` to `JSON.parse(JSON.stringify(v2))`. The clone's only job is to hold an unmutated snapshot for the `toEqual` comparison; a JSON round-trip handles the plain-object fixture and adds no dependency or Node-version assumption.

---

### QA Engineer

#### RESOLVED: [MEDIUM] Two existing test names contain `sampleIntervalMs` and the spec didn't say to rename them
Step 4's blanket *"Test names and assertions stay identical."* was correct for assertions and for `maxSamples`-only tests, but two existing tests embed the now-removed `sampleIntervalMs` field name in their `it(...)` description ([line 1632](packages/agent-simulation/src/components/agent-simulation.test.tsx#L1632) and [line 1654](packages/agent-simulation/src/components/agent-simulation.test.tsx#L1654)). Replaced the flat sentence in Step 4's "Migrate existing ms-throttle tests" subsection with an explicit rename list: L1632 → `"…when sampleIntervalUnit and maxSamples are unset…"`, L1654 → `"throttles samples per sampleInterval in ms mode…"` (the `in ms mode` qualifier also disambiguates it from the parallel tick-mode test #1). Assertions still stay identical.

---

#### RESOLVED: [MEDIUM] Test #5 had two implicit premises that could silently invalidate it later
Test #5 ("Mid-run unit change uses an up-to-date `lastSampleTickRef`") depended on (1) the "a few ticks" count being deterministic and (2) the mid-run rerender not rebuilding the sim — premise 2 because a rebuild would reset `lastSampleTickRef.current` to `null` at [agent-simulation.tsx:402-403](packages/agent-simulation/src/components/agent-simulation.tsx#L402-L403) and make the assertion pass/fail for the opposite reason from the one being defended. Verified premise 2 holds today: `resetSimulationWithPreservedGlobals`'s `useCallback` deps ([agent-simulation.tsx:474](packages/agent-simulation/src/components/agent-simulation.tsx#L474)) are `[blocklyCode, code, gridHeight, gridStep, gridWidth, resetCount]` — no sample-interval field — so the rebuild effect doesn't re-fire on an authoring-only rerender. Rewrote test #5's sketch in Step 4 to pin the ms phase to exactly 3 ticks (0, 1, 2 → `lastSampleTickRef.current === 2`), state the post-switch math (`3 - 2 = 1 < 2` → skipped), explain why the skip is the proof, and require a one-line comment in the test recording that the rerender must not rebuild the sim — so a future change to those `useCallback` deps doesn't silently invalidate the premise.

---

### Performance Engineer

#### RESOLVED: [LOW] `Date.now()` is called on every `afterTick` — declined, not worth the readability cost
Observation is accurate: Step 3's `const now = Date.now()` runs unconditionally before both throttle branches, so in tick mode with a large `sampleInterval` most ticks pay for a `Date.now()` whose value is only consumed when a sample is kept. Declined the optimization: (1) `Date.now()` is a single-digit-nanosecond call, unmeasurable against the per-tick `globals.values()` spread and publish already on the hot path; (2) deferring it would make the two throttle branches asymmetric (one reads `now` before its guard, one after) — the parallel ms/ticks branch structure was a deliberate choice in the first review pass, and QI-165's ms branch already computed `now` up front, so keeping that shape minimizes the diff; (3) `now` is needed on every *kept* sample regardless of unit (to keep `lastSampleAtRef` fresh for cross-unit switches), so the call can only be conditionally deferred, never eliminated. No spec change.

---

### TypeScript / Migration-Schema Specialist

#### RESOLVED: [LOW] No precedent established for multi-step migration shape — declined as speculative
The finding suggested anticipating a future V3 migration with a forward-looking note or TODO comment. Declined: (1) a V3 is not planned — the spec's Out of Scope explicitly excludes adding a third unit, and there is no other pending agent-simulation schema change; (2) carousel/labbook/scaffolded-question — the three siblings this spec deliberately aligned to (see the first-pass HIGH resolution) — carry no such forward-looking note, so adding one here would *diverge* from the pattern we just aligned to; (3) a TODO for a hypothetical migration is exactly the kind of speculative scaffolding that rots. When a real V3 lands, the V1→V2 migration is itself the precedent to extend. No spec change.

---

### QA Engineer (re-review)

#### RESOLVED: [LOW] Renamed L1632 test described the field as `'none'` when it is actually unset
The issue-2 resolution's proposed L1632 rename read `"…when sampleIntervalUnit is 'none'…"`, but that test uses `defaultAuthoredState`, which sets neither sample-interval field — so `sampleIntervalUnit` is `undefined` at the prop level (the runtime ref defaults it to `"none"`). Corrected the rename target to `"samples every tick when sampleIntervalUnit and maxSamples are unset (default behavior)"`, which is accurate and a clean 1:1 swap of the dead field name in the original phrasing. Updated both the Step 4 rename list and the issue-2 RESOLVED note.

---

## Self-Review (Third Pass)

<!-- Third-pass multi-role review of the post-resolution implementation spec, grounded against the actual source (types.ts, app.tsx, agent-simulation.tsx, agent-simulation.test.tsx, carousel/state-migrations.ts, base-question-app.tsx, base-authoring.tsx). -->

### Senior Engineer

#### RESOLVED: [MEDIUM] New `app.test.tsx` will transitively load the real `../models/agent-simulation`
Resolved via **option (a)** — `preprocessFormData` is extracted into a new standalone module `authoring-utils.ts` (imports only `./types`, no React/runtime imports). `app.tsx` imports it from `./authoring-utils`; its unit test is now `authoring-utils.test.ts`, importing only `./authoring-utils` + `./types`, so it never pulls in the `app.tsx` → `runtime.tsx` → `agent-simulation.tsx` → `../models/agent-simulation` graph and needs none of `agent-simulation.test.tsx`'s file-local `jest.mock`s. Updated Step 2 (new `authoring-utils.ts` file + `preprocessFormData` source block + Files-affected + diff estimate), Step 4 (renamed `app.test.tsx` → `authoring-utils.test.ts`, changed its import from `./app` to `./authoring-utils`, dropped the "co-locating with `app.tsx`" rationale, updated Files-affected + diff estimate). Option (b) was rejected because duplicating the runtime mock setup into a pure-function unit test reintroduces the coupling option (a) removes.

---

#### RESOLVED: [MEDIUM] `preprocessFormData` misses the untouched-dropdown (`sampleIntervalUnit: undefined`) case
Resolved by treating an absent `sampleIntervalUnit` the same as `"none"`. Step 2's `preprocessFormData` source block now guards on `(data.sampleIntervalUnit ?? "none") === "none"` (with an inline comment explaining that RJSF leaves an untouched dropdown `undefined`), so a stray `sampleInterval` typed before the dropdown is touched is stripped on save rather than persisted. The requirements.md `preprocessFormData` bullet was updated to state the absent-unit case explicitly, removing the internal inconsistency with the spec's "RJSF does not write schema defaults back into `formData`" model. A test for this case is covered by Issue 5 below.

**Correction (fourth-pass review)**: this entry's premise — that RJSF leaves an untouched dropdown `undefined` — is wrong (see the fourth-pass RJSF / Authoring-Forms Specialist entry). RJSF's default `populateAllDefaults` behavior writes the dropdown's `"none"` default into `formData`. The `(data.sampleIntervalUnit ?? "none") === "none"` guard still stands as a defensive default; it is simply not exercised by the form in practice.

---

### QA Engineer

#### RESOLVED: [HIGH] Test #3's post-flush publish assertion is gated by the tick throttle, and the tick count is internally inconsistent
Rewrote Step 4 test #3's setup. It keeps `sampleInterval: 3` (so kept ticks `0, 3` ≠ raw ticks `0,1,2,3`, genuinely proving the cap counts kept rows not raw ticks) and fixes both defects: (1) **post-flush publish** — after the flush, 3 `afterTick()` calls are fired (raw ticks 4, 5, 6); ticks 4 and 5 are processed but tick-throttle-skipped (`4-3=1`, `5-3=2`), and tick 6 publishes (`6-3=3`), so the assertion targets one publish with `values.tick === 6` instead of an impossible single-tick publish; (2) **count consistency** — the contradictory "fire 4 ticks / tick 4 blocked" step is dropped (the blocked-gap-tick coverage already exists, unit-agnostically, in the ms test at [line 1693](packages/agent-simulation/src/components/agent-simulation.test.tsx#L1693)), so the fired-tick counts now match the prose exactly: 4 calls, flush, 3 calls. The flush mechanism was also corrected from `jest.runAllTimers()` to the real-timer flush — see Issue 4 below, which covers the remaining occurrence in the Step 4 lead paragraph.

---

#### RESOLVED: [MEDIUM] Spec prescribes `jest.runAllTimers()` but the sample-interval tests run on real timers
The sample-interval `describe` block in `agent-simulation.test.tsx` runs on **real timers** — the existing `maxSamples` tests flush the `setTimeout(0)` deferred auto-stop pause with `await act(async () => { await new Promise(resolve => setTimeout(resolve, 30)); })` ([agent-simulation.test.tsx:1726](packages/agent-simulation/src/components/agent-simulation.test.tsx#L1726), [:1781](packages/agent-simulation/src/components/agent-simulation.test.tsx#L1781)); `jest.useFakeTimers()` is used only by an unrelated block (lines 1058–1087, restored with `jest.useRealTimers()`), so `jest.runAllTimers()` would no-op and never flush the pause. **Scope correction**: a grep confirmed requirements.md never mentions `jest.runAllTimers()` — the issue body overstated that. The only live spec occurrence was the Step 4 "New tick-mode tests" lead paragraph (test #3's occurrence was already fixed in Issue 3). Resolved by changing the lead paragraph's named flush mechanism to the real-timer wait and adding an explicit note that the block runs on real timers and `jest.runAllTimers()` would no-op. The two pass-2 RESOLVED entries that cite `jest.runAllTimers()` as decision-log history each carry a one-line "Correction (third-pass review)" pointer rather than being rewritten.

---

#### RESOLVED: [LOW] No `preprocessFormData` test for the `sampleIntervalUnit: undefined` case
Resolved alongside Issue 2 (S2). Added a fifth test to the Step 4 `authoring-utils.test.ts` block — `preprocessFormData({ ...base, sampleInterval: 5 })` with `sampleIntervalUnit` absent, asserting `sampleInterval` is stripped — which locks in the absent-unit branch of the `(data.sampleIntervalUnit ?? "none") === "none"` guard against silent regression. The requirements.md `preprocessFormData` Tests bullet now names the absent-unit case alongside the `"ms"`/`"ticks"` → `"none"` case, and the Step 4 diff estimate for the test file was bumped to ~45 lines (5 tests).

---

### React Hooks Specialist

_No issues found this pass._ The ref-mirrors-prop wiring for `sampleIntervalUnitRef` / `sampleIntervalRef` / `lastSampleTickRef` follows the established `sampleIntervalMsRef` pattern ([agent-simulation.tsx:144-150](packages/agent-simulation/src/components/agent-simulation.tsx#L144-L150)); `afterTick` reads refs rather than captured values, so authoring-time and mid-run changes propagate; the sim-rebuild boundary (`lastSampleTickRef` reset, `useCallback` deps) was verified in the second-pass QA review.

---

### TypeScript / Migration-Schema Specialist

_No issues found this pass._ The `version: 1`-literal discriminated narrowing, the destructure-and-spread drop of `sampleIntervalMs`, and the `Omit<Required<IAuthoredState>, …>` exclusion list all typecheck against the actual `types.ts` and the carousel reference; `enumNames` matches the existing `dataSourceInteractive` schema entry ([app.tsx:74](packages/agent-simulation/src/components/app.tsx#L74)); prior passes resolved the literal-`version` and `deepmerge` issues.

---

### Re-review (post-resolution)

Re-running the review against the updated spec surfaced two doc-consistency gaps left by the Issue 1 (`authoring-utils.ts`) extraction; no new design issues.

#### RESOLVED: [LOW] Stale `app.test.tsx` reference in the Step 4 Summary
The Step 4 **Summary** line still named the test file `app.test.tsx` after Issue 1 renamed it to `authoring-utils.test.ts`. Corrected. (The two `app.test.tsx` mentions in the pass-1 RESOLVED Self-Review entries are left as decision-log history — the filename changed but the substance stands, and the Issue 1 entry records the rename.)

#### RESOLVED: [LOW] requirements.md "Files affected (anticipated)" not updated for the `authoring-utils.ts` extraction
The requirements.md Technical Notes file list named `state-migrations.ts` / `state-migrations.test.ts` as new files but not `authoring-utils.ts` / `authoring-utils.test.ts`, and its `app.tsx` bullet read as if `preprocessFormData` were defined in `app.tsx`. Added the two `**New**` bullets and reworded the `app.tsx` bullet to "import `preprocessFormData` from the new `authoring-utils.ts`".

---

## Self-Review (Fourth Pass)

<!-- Fourth-pass multi-role review of the implementation spec, grounded against the actual source (types.ts, app.tsx, agent-simulation.tsx, agent-simulation.test.tsx, carousel/state-migrations.ts + types.ts, base-question-app.tsx, base-authoring.tsx; RJSF is @rjsf/core ^5.9.0). -->

### Senior Engineer

#### RESOLVED: [MEDIUM] The four implementation steps are not individually compilable
The first step's `IAuthoredState` shape change (removing `sampleIntervalMs`, tightening `version` to the literal `2`) breaks its consumers — [agent-simulation.tsx:71](packages/agent-simulation/src/components/agent-simulation.tsx#L71) (`sampleIntervalMs` destructure), [agent-simulation.tsx:147-148](packages/agent-simulation/src/components/agent-simulation.tsx#L147-L148) (ref init), and [agent-simulation.test.tsx:82-83](packages/agent-simulation/src/components/agent-simulation.test.tsx#L82-L83) / [:1658](packages/agent-simulation/src/components/agent-simulation.test.tsx#L1658) / [:1830](packages/agent-simulation/src/components/agent-simulation.test.tsx#L1830) (the `version: 1` fixture + two `sampleIntervalMs` literals) — which are only fixed in the runtime and test steps. So commits after step 1, 2, or 3 alone do not compile, contradicting the spec's "discrete commit" / "independently reviewable unit" framing. Resolved by adding a **Commit note** at the top of the Implementation Plan stating the four steps are one atomic compile-unit: reviewed step-by-step, but committed and landed together as a single PR. Restructuring into individually-compilable commits was rejected — a type-shape change necessarily moves with all its consumers, so a buildable split would merge the cleanest conceptual boundaries (migration vs. runtime vs. authoring vs. tests) into one large commit purely to satisfy the compiler, for a ~650-line feature that lands as one PR regardless.

---

### RJSF / Authoring-Forms Specialist

#### RESOLVED: [MEDIUM] The spec contradicted itself on whether RJSF writes schema defaults back into `formData`
The spec made opposite load-bearing claims about RJSF default behavior. **Claim X** ("RJSF does not write the schema default back into `formData`") justified the `sampleIntervalUnit`-absent handling in the requirements.md `preprocessFormData` bullet, the Runtime-sampling ref-setter bullet, and the implementation.md Step 2/Step 3 comments + `authoring-utils.test.ts` test #5. **Claim Y** (the requirements.md QA-declined entry: "RJSF persists `version: 1` as a default on every authored save") justified the migration's strict `version === 1` trigger. But `version` and `sampleIntervalUnit` are both top-level scalar schema properties with a `default`, and RJSF (`@rjsf/core ^5.9.0`, `BaseAuthoring` sets no `experimental_defaultFormStateBehavior` so the default `populateAllDefaults` applies) treats them identically — it cannot persist one default and not the other.

Resolved in favor of **Claim Y** (consistent with real deployed activities carrying `version` in their saved JSON): RJSF v5 with `populateAllDefaults` writes top-level defaults into the `onChange` `formData`. Reworded the ~4 Claim-X occurrences (requirements.md `preprocessFormData` bullet + ref-setter bullet + `preprocessFormData` Tests bullet; implementation.md Step 2 comment, Step 3 comment, `authoring-utils.test.ts` test #5) to frame the `?? "none"` / absent-unit handling as a **defensive default whose live `undefined` source is the migrated V1 state** — `migrateAuthoredState` returns `{ ...rest, version: 2 }` with no `sampleIntervalUnit` for a legacy state lacking `sampleIntervalMs`, so migrated states genuinely arrive with the unit unset; fresh-authored states arrive with `sampleIntervalUnit: "none"` written explicitly by RJSF. Renamed test #5 from "(untouched dropdown)" to "(defensive)". This is documentation-only — no code or test logic changes; both `preprocessFormData`'s `(unit ?? "none") === "none"` guard and the runtime ref setter's `?? "none"` already collapse `undefined` and `"none"` to the same branch, and the runtime `?? "none"` was already independently load-bearing for migrated states. Added "Correction (fourth-pass review)" notes to the two decision-log entries that cited Claim X (requirements.md External Review Senior Engineer "Explicit defaulting in `migrateAuthoredState`"; implementation.md Third-Pass S2 entry).

---

### QA Engineer

#### RESOLVED: [LOW] No test exercises the `migrateAuthoredState` → `BaseQuestionApp` wiring
`migrateAuthoredState` is covered thoroughly as a pure function (`state-migrations.test.ts`) and the runtime is tested with pre-shaped `version: 2` fixtures, but nothing verifies the `migrateAuthoredState={migrateAuthoredState}` prop on `<BaseQuestionApp>` in `app.tsx` — the one line that activates migration ([base-question-app.tsx:63-64](packages/helpers/src/components/base-question-app.tsx#L63-L64)). If omitted, every legacy `version: 1` activity silently stops migrating (the runtime reads `sampleIntervalUnit` / `sampleInterval` as `undefined` and never throttles) with no failing test. Resolved by **accepting the gap with a documented note** rather than adding a test: the three sibling packages this spec aligns to (carousel / labbook / scaffolded-question) likewise verify this wiring only by review, and an `app.tsx`-level test would re-incur the runtime module-graph coupling that the Third-Pass `authoring-utils.ts` extraction was designed to remove. Added a "Test coverage note" to Step 2 stating the prop wiring is review/manual-verified and that reviewers should confirm the line is present.

---

## Self-Review (Fifth Pass)

<!-- Fifth-pass multi-role review of the implementation spec, grounded against the actual source (types.ts, app.tsx, agent-simulation.tsx, agent-simulation.test.tsx, carousel/state-migrations.ts + types.ts, base-question-app.tsx, base-authoring.tsx). -->

### Senior Engineer

#### RESOLVED: [MEDIUM] Step 3's `afterTick` Before/After didn't address the explanatory comment in its own cited range
Step 3 cited lines 419–432 but its "Before" code block began at line 423 (`const intervalMs = sampleIntervalMsRef.current;`), omitting the 419–422 explanatory comment inside the cited range. That comment named `sampleIntervalMs` (a field this spec deletes) and described only wall-clock throttling, so a literal implementation would have shipped a stale comment referencing a removed symbol. Extended Step 3's Before/After blocks to include lines 419–422: the Before block now shows the existing 4-line comment, and the After block replaces it with a comment covering both ms and tick modes ("Throttle samples by the configured unit: wall-clock ms or sim ticks…") that no longer names `sampleIntervalMs` and notes both `lastSampleAtRef` and `lastSampleTickRef` start `null`. Final wording can be tuned during implementation.

---

#### RESOLVED: [LOW] Migration introduces per-render `authoredState` object churn into the runtime — declined, verified benign
Before QI-167 agent-simulation has no `migrateAuthoredState`, so its runtime receives a stable `authoredState` reference; after QI-167 `BaseQuestionApp` ([base-question-app.tsx:63-64](packages/helpers/src/components/base-question-app.tsx#L63-L64)) calls `migrateAuthoredState` on every render and returns a fresh object every render for legacy `version: 1` activities. Verified benign: the only runtime consumer of `authoredState` is the primitive destructure at [agent-simulation.tsx:71](packages/agent-simulation/src/components/agent-simulation.tsx#L71), and the sim-rebuild effect ([agent-simulation.tsx:477-483](packages/agent-simulation/src/components/agent-simulation.tsx#L477-L483)) keys on `[resetSimulationWithPreservedGlobals, newRecordingCount]` — a `useCallback` over primitives only — so a new object reference with identical field values re-triggers nothing. Declined adding a spec note: this behavior is identical to the carousel/labbook/scaffolded-question migration pattern this spec deliberately aligns to, none of which carry such a note, so adding one here would diverge from that pattern (same reasoning as the pass-2 TypeScript specialist's declined "anticipate V3" note). No spec change.

---

### QA Engineer

#### RESOLVED: [LOW] No test for the symmetric ticks→ms mid-run switch
Test #5 exercises an ms→ticks switch (proving `lastSampleTickRef` is left fresh by ms-mode kept samples); no test exercised the symmetric ticks→ms switch, which relies on `lastSampleAtRef.current = now` running unconditionally on every kept sample regardless of unit. Declined adding a dedicated ticks→ms test — it would add a near-duplicate harness to defend a single line that is immediately adjacent to code test #5 already exercises. Instead tightened test #5's Step 4 sketch with a **Coverage scope** sentence: it names both beneficiaries of the "update both refs unconditionally" rule (ms→ticks via `lastSampleTickRef`, ticks→ms via `lastSampleAtRef`), notes the ticks→ms line is the adjacent statement in the same pair, and records that a regression conditionalizing either update is caught by this test's premise — so the omission of a separate test is a documented, deliberate scoping decision.

---

#### RESOLVED: [LOW] Test #5's `rerender` mechanic was not covered by the "copy the ms-test harness" instruction
Step 4's "New tick-mode tests" lead paragraph says each test's harness is "copied verbatim from the cited ms test," but test #5 is the only test that performs a mid-run re-render, cites no parallel ms test, and no existing ms test re-renders — so the rerender mechanic is not copyable. Tightened test #5's Step 4 sketch to state explicitly that it captures `rerender` from React Testing Library's `render()` return value (noting the other tick-mode tests call `render(...)` without capturing it) and re-renders via `rerender(...)` with a new `<AgentSimulationComponent>` whose `authoredState` carries the switched unit — the one harness piece test #5 cannot copy from an existing ms test.

---
