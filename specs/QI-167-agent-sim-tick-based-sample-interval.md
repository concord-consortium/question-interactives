# Tick-Based Sample Interval in Agent-Simulation Authoring (QI-167)

**Jira**: https://concord-consortium.atlassian.net/browse/QI-167

**Status**: **Closed**

## Overview

Add a tick-based option to the agent-simulation's sample-interval throttle so authors can record one row every N simulation ticks instead of every N milliseconds of wall-clock time.

QI-165 shipped a wall-clock sample-interval control that lets authors thin out the recorded data for an agent-simulation. A user asked for the same throttle in units of simulation ticks. That formulation is useful for analyses where the sim's internal "time" (tick number) is the meaningful unit rather than wall-clock elapsed time — for example, when sim speed varies, or when comparing recordings from runs at different speeds.

## Requirements

### Authoring API

Two new authoring fields replace today's single optional `sampleIntervalMs`:

- `sampleIntervalUnit` — enum `"none" | "ms" | "ticks"`, default `"none"`. Dropdown title: **"Throttle samples by"**. Enum labels:
  - `"none"` → **"No throttling"**
  - `"ms"` → **"Every N milliseconds"**
  - `"ticks"` → **"Every N simulation ticks"**
- `sampleInterval` — `type: "integer", minimum: 1`. Title: **"Interval"**. Single value field; its meaning depends on `sampleIntervalUnit`. Always visible in the form (no conditional show/hide — the authoring iframe doesn't resize on form-height changes, so always-visible avoids cropping/blank-gap artifacts). When `sampleIntervalUnit === "none"`, the value is ignored at runtime and stripped on save. Carries `ui:help` text warning authors the value is reinterpreted on unit change.

The legacy `sampleIntervalMs` field is **removed from the schema and from `IAuthoredState`**. Existing deployed activities are converted to the new shape by `migrateAuthoredState` on every read, so neither the form nor the runtime ever sees the legacy field.

`preprocessFormData` is added to `baseAuthoringProps`: when the form emits a change and `sampleIntervalUnit` is `"none"` (or absent), `sampleInterval` is stripped from authored state. `BaseAuthoring` wires `preprocessFormData` through on every form change, so the strip happens immediately.

No custom `Authoring.tsx` is required — agent-simulation continues to use `BaseQuestionApp` with `baseAuthoringProps`.

`maxSamples` (the per-recording cap, also from QI-165) is unchanged — a top-level optional field independent of the unit choice.

### Runtime sampling

- The `afterTick` callback gains a tick-throttling branch alongside the existing wall-clock branch. Branch selection reads `sampleIntervalUnitRef.current` directly — legacy shapes are migrated upstream.
- New ref `lastSampleTickRef: useRef<number | null>(null)`, mirroring `lastSampleAtRef`. Reset to `null` in the same places `lastSampleAtRef` is reset (sim (re)create).
- `sampleIntervalMsRef` is replaced by `sampleIntervalRef: useRef<number | undefined>` and `sampleIntervalUnitRef: useRef<"none" | "ms" | "ticks">`. `sampleIntervalUnitRef` mirrors `authoredState.sampleIntervalUnit ?? "none"` (the `?? "none"` defaults the migrated-V1 `undefined` case). Both refs are kept in sync on every render so authoring-time changes take effect on the next tick.
- Decision logic inside `afterTick`, after `currentTick` is captured and `tick` is incremented:
  - `unit === "ms"` and `sampleInterval` set and `lastSampleAtRef !== null` and `Date.now() - lastSampleAtRef < interval` → skip.
  - `unit === "ticks"` and `sampleInterval` set and `lastSampleTickRef !== null` and `currentTick - lastSampleTickRef < interval` → skip.
  - `unit === "none"` (or `sampleInterval` undefined) → no throttle.
- On a kept sample: update both `lastSampleAtRef` and `lastSampleTickRef` unconditionally, so a runtime change of unit during a run doesn't replay history.
- **Worked example (tick mode)**: with `sampleIntervalUnit = "ticks"` and `sampleInterval = 5`, the kept ticks are `0, 5, 10, 15, …` — the first raw tick is always sampled (because `lastSampleTickRef` starts `null`), then every 5th raw tick after that.
- **First-tick rule**: the first `afterTick` after a sim (re)create is always sampled, because both `lastSampleAtRef` and `lastSampleTickRef` start `null`.
- **Pause/resume**: pause and resume do not reset `lastSampleAtRef` or `lastSampleTickRef` — matching QI-165's existing pause semantics (no scope change for QI-167).

### maxSamples interaction

- The existing `maxSamples` auto-stop fires after the Nth **kept** sample, regardless of which unit (or none) gated sampling. The cap counts rows pushed into `tickDataRef.current`, not raw ticks.
- The "release the auto-stop guard after the deferred pause" regression behavior (QI-165) continues to hold in tick-unit mode.

### Backward compatibility

The legacy `sampleIntervalMs` field is replaced by the `{ sampleIntervalUnit, sampleInterval }` pair via a `migrateAuthoredState` function, following the established pattern in carousel, labbook, and scaffolded-question. `BaseQuestionApp` already supports a `migrateAuthoredState` prop; the migration is applied transparently on every read.

**Content-schema version bump**: `version` goes from `1` to `2`. The migration triggers on `version === 1`.

**Migration** (`state-migrations.ts` defines `migrateAuthoredState`; `types.ts` gains an `IAuthoredStateV1` interface alongside `IAuthoredState`):

- If `version === 1`:
  - If `sampleIntervalMs` is a positive number → `{ ...rest, version: 2, sampleIntervalUnit: "ms", sampleInterval: Math.ceil(sampleIntervalMs) }`, dropping `sampleIntervalMs`. `Math.ceil` matches the pre-migration runtime's implicit rounding and never shortens the effective interval.
  - Else → `{ ...rest, version: 2 }`, no sample-interval fields set. Also drops any stray non-positive `sampleIntervalMs`.
- Else (`version === 2`) → return as-is.

The migration is read-only — it does not call `setAuthoredState` on mount. The persisted JSON stays in legacy shape until the author actively saves, at which point RJSF persists the migrated shape the form was already showing.

`IAuthoredState` carries only the new fields (`sampleIntervalUnit?`, `sampleInterval?`) and `version: 2`. `sampleIntervalMs` lives only on `IAuthoredStateV1` and is consumed by the migration.

### Validation & error states

- `sampleInterval` must be a positive integer ≥ 1, enforced by the RJSF schema (`type: "integer", minimum: 1`). No runtime guard against decimals or zero.
- Fractional legacy `sampleIntervalMs` values are normalized to integers by `migrateAuthoredState` via `Math.ceil`.
- If `sampleIntervalUnit !== "none"` but `sampleInterval` is missing (author selected a unit but cleared the value), the runtime falls back to no throttling — the same defensive behavior as QI-165's ms branch when `sampleIntervalMs` was undefined. The schema deliberately does not enforce required-when-unit-set, because `BaseAuthoring` live-saves on every `onChange` with no submit gate, so conditional `required` could only paint an advisory AJV error — it could not block the incomplete state from saving. The runtime no-op fallback is the accepted response and is locked in by a runtime test.
- If an author selects "No throttling" and leaves `0`/negative in the Interval field, AJV displays an inline `minimum: 1` error. This does not block saving; `preprocessFormData` strips the value before the runtime sees it. A minor cosmetic artifact identical to QI-165's `sampleIntervalMs` behavior, accepted as-is.

### Tests

- New unit tests in `agent-simulation.test.tsx` for tick mode: every-Nth-tick sampling with correct tick stamping; first-tick rule; tick-mode `maxSamples` auto-stop + the QI-165 deferred-pause guard release; tick-mode throttle in free-play (`simulation-tick`) mode; mid-run ms→ticks unit change uses an up-to-date `lastSampleTickRef`; runtime fallback when `sampleInterval` is undefined with `sampleIntervalUnit: "ticks"`.
- `preprocessFormData` unit tests in a new `authoring-utils.test.ts`: strip on `"none"`, preserve on `"ms"`/`"ticks"`, idempotent when already absent, strip on absent unit (defensive `?? "none"` coverage).
- Migration tests in a new `state-migrations.test.ts`: positive `sampleIntervalMs` → ms unit; no `sampleIntervalMs` → no sample-interval fields; fractional `100.4` → `101` (`Math.ceil`); non-positive → no sample-interval fields; `version: 2` returned unchanged.
- Existing ms-throttle tests migrated to the new field shape (and `version: 2`); assertions unchanged. Existing `maxSamples` tests continue to pass unchanged.

## Technical Notes

### Files affected

- `packages/agent-simulation/src/components/types.ts` — replace `sampleIntervalMs?: number` with `sampleIntervalUnit?` + `sampleInterval?` in `IAuthoredState`; add `IAuthoredStateV1` (legacy shape, `version: 1`); tighten `IAuthoredState.version` to the literal `2`; bump `version` literals in `DefaultAuthoredState` and `DemoAuthoredState` from `1` to `2`; update the `Omit<...>` exclusion list.
- **New** `packages/agent-simulation/src/components/state-migrations.ts` — `migrateAuthoredState`. Pattern parallels carousel/labbook/scaffolded-question.
- **New** `packages/agent-simulation/src/components/state-migrations.test.ts` — migration unit tests.
- **New** `packages/agent-simulation/src/components/authoring-utils.ts` — `preprocessFormData`, free of React/runtime imports so its test stays dependency-light.
- **New** `packages/agent-simulation/src/components/authoring-utils.test.ts` — `preprocessFormData` unit tests.
- `packages/agent-simulation/src/components/app.tsx` — replace the `sampleIntervalMs` schema entry with `sampleIntervalUnit` (dropdown) + `sampleInterval` (integer); bump the `version` schema default to `2`; add `preprocessFormData` to `baseAuthoringProps`; pass `migrateAuthoredState` to `BaseQuestionApp`.
- `packages/agent-simulation/src/components/agent-simulation.tsx` — replace `sampleIntervalMsRef` with `sampleIntervalRef` + `sampleIntervalUnitRef`; add `lastSampleTickRef`; update the throttle branch in `afterTick`.
- `packages/agent-simulation/src/components/agent-simulation.test.tsx` — migrate existing ms tests to the new shape; add tick-mode tests.

### Reference patterns

- **State migration**: `packages/carousel/src/components/state-migrations.ts` and its test — defines `IAuthoredStateV1`, branches on `version === 1`, returns a new object with bumped `version` and reshaped fields; wired in via the `migrateAuthoredState` prop on `BaseQuestionApp`. labbook and scaffolded-question follow the same pattern.
- **Ref-mirrors-prop pattern**: the existing `sampleIntervalMsRef` / `maxSamplesRef` setup in `agent-simulation.tsx`.

### Non-changes (explicit)

- The `tick` column emitted in every sample row is unchanged in name, position, or meaning. Downstream consumers (live-graph, simulation-tick-data table export) continue to read it the same way.
- The `recording-started` / `simulation-started` column-schema publish is unchanged — the column list still leads with `tick` regardless of unit.
- `DemoAuthoredState` does not set `sampleIntervalUnit` / `sampleInterval` (stays at the default "no throttling"); its `version` literal is bumped to `2`.
- `package.json` versions are unchanged (managed by the external release process).

## Out of Scope

- Adding any third unit (e.g., "simulated seconds").
- Allowing both ms and tick throttles simultaneously — the single value field carries one number; the dropdown enforces "one unit".
- Changing or extending the `maxSamples` cap semantics.
- Changing the on-disk shape of saved tick-data rows (`tick` plus globals).
- Migrating any already-saved student `interactiveState` — it doesn't carry `sampleIntervalMs` (it's authoring config), so no data migration is needed.
- A UI affordance to preview the projected sample count for the configured unit/value.

