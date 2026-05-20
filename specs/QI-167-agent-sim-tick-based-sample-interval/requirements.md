# Tick-Based Sample Interval in Agent-Simulation Authoring (QI-167)

**Jira**: https://concord-consortium.atlassian.net/browse/QI-167
**Repo**: https://github.com/concord-consortium/question-interactives
**Implementation Spec**: [implementation.md](implementation.md)
**Status**: **In Development**

## Overview

<!-- Rewritten during Finalization -->

Add a tick-based option to the agent-simulation's sample-interval throttle so authors can record one row every N simulation ticks instead of every N milliseconds of wall-clock time.

## Project Owner Overview

<!-- Rewritten during Finalization -->

QI-165 shipped a wall-clock sample-interval control that lets authors thin out the recorded data for an agent-simulation. A user has asked for the same throttle in units of simulation ticks. That formulation is useful for analyses where the sim's internal "time" (tick number) is the meaningful unit rather than wall-clock elapsed time — for example, when sim speed varies, or when comparing recordings from runs at different speeds.

## Background

The agent-simulation interactive runs an `AV.vis(...)` simulation that fires an `afterTick` callback on every internal step ([agent-simulation.tsx:404-463](packages/agent-simulation/src/components/agent-simulation.tsx#L404-L463)). On each callback the runtime increments a local `tick` counter, then decides whether to publish/persist that tick's globals as a sample row. QI-165 added an optional `sampleIntervalMs` field to throttle samples by wall-clock elapsed time (`Date.now() - lastSampleAtRef.current < intervalMs` → skip).

The `tick` value:
- Is a local closure variable in `resetSimulationWithPreservedGlobals`, initialized to `0` on every sim (re)create ([agent-simulation.tsx:400](packages/agent-simulation/src/components/agent-simulation.tsx#L400)) and incremented on every sim step regardless of whether the row is sampled ([agent-simulation.tsx:417](packages/agent-simulation/src/components/agent-simulation.tsx#L417)). The first `afterTick` captures `currentTick = 0` before the increment.
- Is written as the first column of every saved row (`values = { tick: currentTick, ...globals.values() }`, [agent-simulation.tsx:434](packages/agent-simulation/src/components/agent-simulation.tsx#L434)).
- Is announced in the column schema for both `recording-started` and `simulation-started` publishes ([agent-simulation.tsx:568](packages/agent-simulation/src/components/agent-simulation.tsx#L568), [:742](packages/agent-simulation/src/components/agent-simulation.tsx#L742)).

So a tick-based throttle has all the data it needs — it's purely an authoring-API and `afterTick`-branch change. Existing milliseconds-based throttling and the `maxSamples` cap (also from QI-165) are not changed in semantics, only in plumbing.

## Requirements

### Authoring API

Two new authoring fields replace today's single optional `sampleIntervalMs`:

- `sampleIntervalUnit` — enum `"none" | "ms" | "ticks"`, default `"none"`. Dropdown title: **"Throttle samples by"**. Enum labels (in the UI):
  - `"none"` → **"No throttling"**
  - `"ms"` → **"Every N milliseconds"**
  - `"ticks"` → **"Every N simulation ticks"**
- `sampleInterval` — `type: "integer", minimum: 1`. Title: **"Interval"** (the unit is conveyed by the dropdown label). Single value field; its meaning depends on `sampleIntervalUnit`. Always visible in the form (no conditional show/hide — the authoring iframe doesn't resize on form-height changes, so always-visible avoids any cropping/blank-gap artifacts). When `sampleIntervalUnit === "none"`, the value is ignored at runtime and stripped on save. **`ui:help` text** warns authors the value is reinterpreted on unit change (per Q5): *"Interpreted in the unit selected above. Review this value if you change the unit — for example, 1000 means 1000 milliseconds in ms mode and 1000 simulation ticks in tick mode."* (Final wording can be tuned during implementation.)

The legacy `sampleIntervalMs` field is **removed from the schema and from `IAuthoredState`**. Existing deployed activities are converted to the new shape by `migrateAuthoredState` on every read (see [Backward compatibility](#backward-compatibility)), so neither the form nor the runtime ever sees the legacy field.

`preprocessFormData` is added to `baseAuthoringProps` so that when the form emits a change:
- If `sampleIntervalUnit` is `"none"` — or absent — `sampleInterval` is stripped from authored state. (`preprocessFormData` runs on RJSF's `formData`; under RJSF's default `populateAllDefaults` behavior the dropdown's `"none"` default is written into `formData`, so the unit is normally set explicitly. The `?? "none"` that folds an absent unit into the strip branch is a defensive guard.)

No custom `Authoring.tsx` component is required — agent-simulation continues to use `BaseQuestionApp` with `baseAuthoringProps`. `BaseAuthoring` already wires `preprocessFormData` through on every form change, so the strip happens immediately, not just on persistence.

`maxSamples` (the per-recording cap, also from QI-165) is unchanged — it remains a top-level optional field that is independent of the unit choice.

### Runtime sampling

- The `afterTick` callback in [agent-simulation.tsx:404-463](packages/agent-simulation/src/components/agent-simulation.tsx#L404-L463) gains a tick-throttling branch alongside the existing wall-clock branch. Branch selection reads `sampleIntervalUnitRef.current` directly — legacy shapes are migrated upstream by `migrateAuthoredState`, so the runtime never sees `sampleIntervalMs`.
- New ref `lastSampleTickRef: useRef<number | null>(null)`, mirroring `lastSampleAtRef`. Reset to `null` in the same places `lastSampleAtRef` is reset (sim (re)create, before the new `afterTick` closure is installed).
- Existing `sampleIntervalMsRef` is replaced by `sampleIntervalRef: useRef<number | undefined>(...)` and `sampleIntervalUnitRef: useRef<"none" | "ms" | "ticks">(...)`. `sampleIntervalUnitRef` mirrors `authoredState.sampleIntervalUnit ?? "none"` (default applied at the ref setter since the ref type is non-nullable but the source is `"none" | "ms" | "ticks" | undefined`; the `undefined` case is the migrated V1 state — `migrateAuthoredState` leaves `sampleIntervalUnit` unset when the legacy state had no `sampleIntervalMs`. A fresh-authored state instead arrives with `sampleIntervalUnit: "none"` written explicitly by RJSF's default `populateAllDefaults` behavior; the `?? "none"` handles both identically). `sampleIntervalRef` mirrors `authoredState.sampleInterval` directly (remains `number | undefined`). Both are kept in sync on every render so authoring-time changes take effect on the next tick.
- Decision logic inside `afterTick`, after `currentTick` is captured and `tick` is incremented:
  - If `sampleIntervalUnitRef.current === "ms"` and `sampleIntervalRef.current` is set and `lastSampleAtRef.current !== null` and `Date.now() - lastSampleAtRef.current < sampleIntervalRef.current` → return (skip).
  - If `sampleIntervalUnitRef.current === "ticks"` and `sampleIntervalRef.current` is set and `lastSampleTickRef.current !== null` and `currentTick - lastSampleTickRef.current < sampleIntervalRef.current` → return (skip).
  - If `sampleIntervalUnitRef.current === "none"` (or `sampleIntervalRef.current` is undefined), no throttle.
- On a kept sample: update both `lastSampleAtRef.current = Date.now()` and `lastSampleTickRef.current = currentTick` unconditionally, so a runtime change of unit during a run doesn't replay history.
- **Worked example (tick mode)**: with `sampleIntervalUnit = "ticks"` and `sampleInterval = 5`, the kept ticks are `0, 5, 10, 15, …` — the first raw tick is always sampled (because `lastSampleTickRef` starts `null`), then every 5th raw tick after that. Ticks 1–4 are skipped, tick 5 is kept, ticks 6–9 are skipped, tick 10 is kept, and so on.
- **First tick rule**: the first `afterTick` after a sim (re)create is always sampled, identical to current ms-mode behavior, because both `lastSampleAtRef` and `lastSampleTickRef` start `null`.
- **Pause/resume**: pause and resume do **not** reset `lastSampleAtRef` or `lastSampleTickRef`. The first `afterTick` after a long pause sees a large `elapsed` and is kept (in ms mode), or sees a large `currentTick - lastSampleTickRef` and is kept (in ticks mode) — one sample on resume, then the throttle re-establishes its cadence from there. This is intentional: it gives the same "immediate feedback on first tick" property as a fresh sim (re)create, and matches QI-165's existing pause semantics (no change in scope for QI-167).

### maxSamples interaction

- The existing `maxSamples` auto-stop ([agent-simulation.tsx:445-462](packages/agent-simulation/src/components/agent-simulation.tsx#L445-L462)) fires after the Nth **kept** sample, regardless of which unit (or none) gated sampling. No semantic change — the cap counts rows pushed into `tickDataRef.current`, not raw ticks. Tests confirm this.
- The "release the auto-stop guard after the deferred pause" regression behavior ([agent-simulation.test.tsx:1752](packages/agent-simulation/src/components/agent-simulation.test.tsx#L1752)) must continue to hold in tick-unit mode.

### Backward compatibility

The legacy `sampleIntervalMs` field is replaced by the new `{ sampleIntervalUnit, sampleInterval }` pair via a **`migrateAuthoredState`** function, following the established pattern in [packages/carousel/src/components/state-migrations.ts](packages/carousel/src/components/state-migrations.ts), [packages/labbook/src/components/state-migrations.ts](packages/labbook/src/components/state-migrations.ts), and [packages/scaffolded-question/src/components/state-migrations.ts](packages/scaffolded-question/src/components/state-migrations.ts). `BaseQuestionApp` already supports a `migrateAuthoredState` prop ([base-question-app.tsx:52, 63-64](packages/helpers/src/components/base-question-app.tsx#L52)); the migration is applied transparently on every read of the authored state, so neither the form nor the runtime ever sees the legacy shape.

**Content-schema version bump**: `version` goes from `1` to `2`. The migration triggers on `version === 1`, mirroring carousel's approach.

**Migration**: a new `state-migrations.ts` defines `migrateAuthoredState`, and `types.ts` gains an `IAuthoredStateV1` interface (legacy shape with `sampleIntervalMs?: number`) alongside `IAuthoredState`. Co-locating both shape interfaces in `types.ts` matches the carousel, labbook, and scaffolded-question pattern:

- If `authoredState.version === 1`:
  - If `sampleIntervalMs` is a positive number → produce `{ ...rest, version: 2, sampleIntervalUnit: "ms", sampleInterval: Math.ceil(sampleIntervalMs) }`, dropping `sampleIntervalMs`. `Math.ceil` covers the legacy `type: "number"` shape and matches the pre-migration runtime's implicit rounding (since `Date.now() - lastSampleAt` is always integer ms, the guard `elapsed < 100.4` already behaves as `elapsed < 101`). Fractional ms values are vanishingly rare; `Math.ceil` ensures the migration never shortens the effective interval. The outer `> 0` guard already excludes zero and negatives, so no separate `≥ 1` clamp is needed — `Math.ceil(positive) ≥ 1` by construction.
  - Else → produce `{ ...rest, version: 2 }`, no sample-interval fields set (defaults to no throttling). Also drops any stray `sampleIntervalMs` that isn't a positive number.
- Else (`version === 2`) → return as-is.

**Authoring form behavior on load**: the form receives the migrated state, so an existing interactive with only `sampleIntervalMs` set opens with the dropdown pre-selected to "Every N milliseconds" and the Interval field pre-filled with the (rounded) ms value. This works because `BaseQuestionApp` applies the migration before the state is handed to `BaseAuthoring`.

**Persistence**: the migration is read-only — it does not call `setAuthoredState` on mount. The persisted JSON stays in legacy shape until the author actively saves (e.g., RJSF emits an onChange because they edited any field). At that point RJSF persists the migrated shape that the form was already showing, so legacy fields are dropped in the same write. An author who opens authoring and closes without saving leaves the persisted JSON untouched — next time it loads, the migration applies again on read.

**Implications**:
- `IAuthoredState` only carries the new fields (`sampleIntervalUnit?`, `sampleInterval?`) and `version: number` (now 2). It does **not** carry `sampleIntervalMs` — that field lives only on `IAuthoredStateV1` and is consumed by the migration.
- Runtime and authoring read `sampleIntervalUnit` / `sampleInterval` directly; no inference helper.
- `preprocessFormData` only handles the "strip `sampleInterval` when unit is `none`" rule, not legacy cleanup.

The migration-input → migration-output mapping above is the acceptance-criteria contract for backward compatibility — see the corresponding bullets in [Tests](#tests) for the test enumeration.

### Validation & error states

- `sampleInterval` must be a positive integer ≥ 1. The RJSF schema enforces this via `type: "integer", minimum: 1` (per Q4). No runtime guard against decimals or zero — the schema rejects them at authoring time.
- Fractional legacy `sampleIntervalMs` values (e.g., from the QI-165 `type: "number"` schema) are normalized to integers by `migrateAuthoredState` via `Math.ceil` (preserves the effective interval — see the migration rationale). The runtime only sees the integer `sampleInterval`.
- If `sampleIntervalUnit !== "none"` but `sampleInterval` is missing (e.g., the author selected a unit but cleared the value field), the runtime falls back to no throttling — same defensive behavior as the existing ms branch when `sampleIntervalMs` was undefined. The schema deliberately does **not** enforce required-when-unit-set. A conditional-`required` rule (a `dependencies`/`oneOf` block — the idiom already used for `dataSourceInteractive` in this same schema) is feasible, but `BaseAuthoring` live-saves on every `onChange` with no submit gate ([base-authoring.tsx:54-62](packages/helpers/src/components/base-authoring.tsx#L54-L62)), so it could only ever paint an advisory inline AJV error — it could not block the incomplete state from being saved. Rather than add validation that implies a guarantee it cannot deliver, the runtime no-op fallback is the accepted response: it is graceful (no crash) and matches QI-165's behavior for an undefined `sampleIntervalMs`. The fallback is locked in by a runtime test (see [Tests](#tests)).
- RJSF's internal AJV validator runs against the schema regardless of `sampleIntervalUnit`. If an author selects "No throttling" and leaves `0` or a negative value in the Interval field, AJV will display an inline `minimum: 1` error message. This does **not** block saving — `BaseAuthoring` saves on every `onChange` ([base-authoring.tsx:54-62](packages/helpers/src/components/base-authoring.tsx#L54-L62)), and `preprocessFormData` strips the invalid value before the runtime sees it. The inline error is a minor cosmetic artifact identical to QI-165's `sampleIntervalMs` behavior (which had the same `type: "number", minimum: 1` schema) and is accepted as-is.

### Tests

- New unit tests in [agent-simulation.test.tsx](packages/agent-simulation/src/components/agent-simulation.test.tsx) mirroring the existing ms tests at lines 1632, 1654, 1693, 1752, 1792, 1826, using the new `{ sampleIntervalUnit, sampleInterval }` shape:
  - Tick-mode samples every Nth tick and stamps each sample with the correct tick number.
  - **First-tick rule**: in tick mode, the first `afterTick` after a sim (re)create is always sampled regardless of `sampleInterval` (separate from the every-Nth test so the assertion is unambiguous).
  - Tick-mode `maxSamples` auto-stop fires after the Nth kept sample, **and** the deferred-pause guard release at [agent-simulation.test.tsx:1752](packages/agent-simulation/src/components/agent-simulation.test.tsx#L1752) still holds in tick mode (regression coverage for QI-165's guard-release fix).
  - Tick-mode interval throttle applies in free-play mode (`simulation-tick`) too, not just recording mode.
  - **Mid-run unit change uses an up-to-date `lastSampleTickRef`**: after a ms→ticks switch mid-run, the tick-mode guard sees the `lastSampleTickRef` value left behind by the ms-mode kept samples (rather than an unset ref) — exercises the "update both `lastSampleAtRef` and `lastSampleTickRef` unconditionally on a kept sample" rule.
  - **Runtime fallback for missing value**: with `sampleIntervalUnit: "ticks"` and `sampleInterval: undefined`, every `afterTick` is kept — no throttle, no error. (Locks in the contract from [Validation & error states](#validation--error-states); a future refactor that drops the `sampleIntervalRef.current is set` guard would regress this silently otherwise.)
- `preprocessFormData` unit test: switching `sampleIntervalUnit` from `"ms"` or `"ticks"` to `"none"` strips `sampleInterval` from the saved state; an absent `sampleIntervalUnit` is treated the same as `"none"` and also strips `sampleInterval` — defensive coverage of the `?? "none"` branch, since RJSF's `populateAllDefaults` normally writes the unit into `formData` explicitly.
- Migration tests in a new `state-migrations.test.ts`, following the pattern of [packages/carousel/src/components/state-migrations.test.ts](packages/carousel/src/components/state-migrations.test.ts):
  - `version: 1` state with `sampleIntervalMs: 200` migrates to `version: 2`, `sampleIntervalUnit: "ms"`, `sampleInterval: 200`, no `sampleIntervalMs`.
  - `version: 1` state with no `sampleIntervalMs` (pre-QI-165 shape) migrates to `version: 2` with no sample-interval fields.
  - `version: 1` state with fractional `sampleIntervalMs: 100.4` migrates to `sampleInterval: 101` (`Math.ceil` — preserves the effective interval that the pre-migration integer-ms runtime guard would have produced; would migrate to `100` under `Math.round`, so this value discriminates between the two).
  - `version: 1` state with `sampleIntervalMs: 0` (or any non-positive number) migrates to `version: 2` with no sample-interval fields (treated as no throttling, defensively).
  - `version: 2` state is returned unchanged.
- Existing ms-throttle tests are migrated to use the new field shape (and `version: 2`); their assertions stay identical. The legacy-shape behavior is covered by the migration tests above, so the runtime tests no longer need to exercise legacy state.
- The existing `maxSamples` tests continue to pass unchanged (they don't reference the sample-interval field shape).

## Technical Notes

### Files affected (anticipated)

- [packages/agent-simulation/src/components/types.ts](packages/agent-simulation/src/components/types.ts) — replace `sampleIntervalMs?: number` with `sampleIntervalUnit?: "none" | "ms" | "ticks"` + `sampleInterval?: number` in `IAuthoredState`; add a new `IAuthoredStateV1` interface (legacy shape with `sampleIntervalMs?: number`, `version: 1`) alongside `IAuthoredState`, matching the carousel/labbook/scaffolded-question convention of co-locating shape history. `IAuthoredState` does **not** carry `sampleIntervalMs` — that field lives only on `IAuthoredStateV1` and is consumed by the migration. Update `DefaultAuthoredState` and `DemoAuthoredState` exclusion lists, and bump their `version` literals from `1` to `2` to match the new schema default.
- **New**: `packages/agent-simulation/src/components/state-migrations.ts` — defines `migrateAuthoredState(state: IAuthoredStateV1 | IAuthoredState): IAuthoredState`, importing both interfaces from `./types`. Follows the pattern of [packages/carousel/src/components/state-migrations.ts](packages/carousel/src/components/state-migrations.ts).
- **New**: `packages/agent-simulation/src/components/state-migrations.test.ts` — migration unit tests as listed under [Tests](#tests).
- **New**: `packages/agent-simulation/src/components/authoring-utils.ts` — defines `preprocessFormData` (the "strip `sampleInterval` when unit is `none`/absent" rule). Kept in its own module, free of React/runtime imports, so its test stays dependency-light.
- **New**: `packages/agent-simulation/src/components/authoring-utils.test.ts` — `preprocessFormData` unit tests as listed under [Tests](#tests).
- [packages/agent-simulation/src/components/app.tsx](packages/agent-simulation/src/components/app.tsx) — replace the existing `sampleIntervalMs` schema entry with `sampleIntervalUnit` (dropdown) and `sampleInterval` (integer). Bump the `version` schema default from `1` to `2`. Import `preprocessFormData` from the new `authoring-utils.ts` and add it to `baseAuthoringProps`. Pass `migrateAuthoredState` as a prop to `BaseQuestionApp`. No custom `Authoring.tsx` needed.
- [packages/agent-simulation/src/components/agent-simulation.tsx](packages/agent-simulation/src/components/agent-simulation.tsx) — replace `sampleIntervalMsRef` with `sampleIntervalRef` + `sampleIntervalUnitRef`. Add `lastSampleTickRef`. Update the throttle branch in `afterTick`. Read `authoredState.sampleInterval` / `authoredState.sampleIntervalUnit` directly (migration upstream guarantees the new shape).
- [packages/agent-simulation/src/components/agent-simulation.test.tsx](packages/agent-simulation/src/components/agent-simulation.test.tsx) — migrate existing ms tests to the new field shape (and `version: 2`); add tick-mode tests as listed above.

### Reference patterns

- **State migration**: [packages/carousel/src/components/state-migrations.ts](packages/carousel/src/components/state-migrations.ts) and its test. Defines `IAuthoredStateV1`, branches on `version === 1`, returns a new object with bumped `version` and reshaped fields. Wired in via `migrateAuthoredState` prop on `BaseQuestionApp` ([base-question-app.tsx:52, 63-64](packages/helpers/src/components/base-question-app.tsx#L52)). [labbook](packages/labbook/src/components/state-migrations.ts) and [scaffolded-question](packages/scaffolded-question/src/components/state-migrations.ts) follow the same pattern.
- **Conditional-field authoring** (pattern reviewed but not adopted): [packages/live-graph/src/components/authoring-config.ts:73-168](packages/live-graph/src/components/authoring-config.ts#L73-L168) and [packages/live-graph/src/components/authoring.tsx](packages/live-graph/src/components/authoring.tsx). Live-graph uses dropdown + multiple conditional value fields with a dynamic `getUiSchema` to grey out inactive ones, and `preprocessFormData` to strip them on every change. QI-167 doesn't need this because the two-field design has a single value field whose meaning depends on the dropdown.
- **Ref-mirrors-prop pattern**: see `sampleIntervalMsRef` / `maxSamplesRef` setup at [agent-simulation.tsx:147-150](packages/agent-simulation/src/components/agent-simulation.tsx#L147-L150). The new refs follow the same shape.

### Non-changes (explicit)

- The `tick` column emitted in every sample row is unchanged in name, position, or meaning. Downstream consumers (live-graph, simulation-tick-data table export) continue to read it the same way.
- The `recording-started` / `simulation-started` column-schema publish at [agent-simulation.tsx:568](packages/agent-simulation/src/components/agent-simulation.tsx#L568) and [:742](packages/agent-simulation/src/components/agent-simulation.tsx#L742) is unchanged — the column list still leads with `tick` regardless of unit.
- `DemoAuthoredState` does not set `sampleIntervalUnit` / `sampleInterval` (stays at the default "no throttling"), preserving the existing demo behavior. Its `version` literal is bumped to `2` to match the new schema default.
- `package.json` versions are unchanged (managed by the external release process).

## Out of Scope

- Adding any third unit (e.g., "simulated seconds" if the sim exposes a sim-time concept).
- Allowing both ms and tick throttles simultaneously (the single value field carries one number; the dropdown enforces "one unit"). If both modes are wanted in the same recording, that's a separate ticket.
- Changing or extending the `maxSamples` cap semantics.
- Changing the on-disk shape of saved tick-data rows (`tick` plus globals).
- Migrating any already-saved student `interactiveState` — interactiveState doesn't carry `sampleIntervalMs` (it's authoring config), so no data migration is needed.
- UI affordance to preview the projected sample count given the configured unit/value (could be a follow-up if authors find the tick-vs-ms trade-off hard to reason about).

## Open Questions

<!-- Requirements-focused only. Implementation-detail questions go in implementation.md. -->

### RESOLVED: Should the dropdown labels read "None / Milliseconds / Ticks" or something else?
**Context**: The dropdown is the new authoring affordance and its labels are what authors will see. Live-graph uses "All columns / Allow list / Ignore list" — natural-language phrases, not type names. The Jira ticket uses "None / Milliseconds / Ticks" informally.
**Options considered**:
- A) "None", "Milliseconds", "Ticks" — direct, matches the ticket text.
- B) "No throttling", "Every N milliseconds", "Every N simulation ticks" — more descriptive, makes it clearer what the value field means.
- C) Something else.

**Decision**: **B** — dropdown labels read `No throttling` / `Every N milliseconds` / `Every N simulation ticks`. The dropdown choice itself reads like a sentence, so the value field can just be titled `N` (or simply `Interval`) without needing to repeat the unit. Matches live-graph's natural-language style and self-documents the meaning of the value field.

### RESOLVED: Should the unit dropdown be re-titled to something more descriptive than "Sample Interval Unit"?
**Context**: With the unit selector added, the existing "Sample Interval (ms, optional)" title needs to be revised. Options range from terse to verbose.
**Options considered**:
- A) Dropdown "Sample Interval" + value field titled by unit ("Interval (ms)" or "Interval (ticks)") — concise, but the dropdown label is overloaded.
- B) Dropdown "Sample Interval Unit" + value field "Sample Interval Value" — explicit but verbose.
- C) Dropdown "Throttle samples by" + value field "Interval" — phrased as a question/answer pair.
- D) Dropdown "Sample interval" + value field "Interval value" — terse alternative pairing with the Q1 enum labels.

**Decision**: **C** — dropdown titled `Throttle samples by`, value field titled `Interval`. With Q1's natural-language enum labels this reads as a self-explanatory sentence top-to-bottom: *"Throttle samples by → Every N simulation ticks → Interval: 5"*. Dropdown label clearly signals "this is a choice about how throttling works"; value field stays terse.

### RESOLVED (re-opened): How should the inactive value field be presented while the author has the other unit selected? (Originally: hide vs. cache vs. defer-to-RJSF)
**Context**: Initially resolved with "defer to RJSF's `dependencies`-hidden default", on the assumption that live-graph's column-filtering UI uses JSON-Schema `dependencies` to hide the inactive list field. Comparison with the actual live-graph code shows it does not — see [live-graph/src/components/authoring-config.ts:80-87](packages/live-graph/src/components/authoring-config.ts#L80-L87) (both fields are always top-level optional, no `dependencies`) and [live-graph/src/components/authoring.tsx:16-38](packages/live-graph/src/components/authoring.tsx#L16-L38) (a dynamic `getUiSchema` sets `ui:disabled` on the inactive field based on current `authoredState`). `preprocessFormData` is called from `handleChange` on every change ([authoring.tsx:54-63](packages/live-graph/src/components/authoring.tsx#L54-L63)), so the inactive field's value is also stripped as soon as the dropdown switches — not just on save. Agent-simulation currently uses `BaseQuestionApp` with static `baseAuthoringProps` and no custom `Authoring` component.
**Options considered**:
- A) **Faithful live-graph copy**: introduce a custom `Authoring.tsx` component for agent-simulation (mirror of live-graph's 80-line file), with a dynamic `getUiSchema` that sets `ui:disabled` on the inactive ms/ticks field. `preprocessFormData` strips inactive value on every change. **~80 new lines + ~16 changed** (new authoring.tsx ~70 lines; app.tsx swap ~12 changed + preprocessFormData ~10 new; types.ts ~4 changed). Both fields are always visible; the inactive one is greyed out.
- B) **Static-schema, strip-on-change**: keep using `BaseQuestionApp`. Both fields are always visible and editable. Add only `preprocessFormData` to existing `baseAuthoringProps` (already wired through `BaseAuthoring` on every change) — strips the inactive field the moment the dropdown changes, even though the input box stays visible and enabled. **~10 new lines**. UX hazard: author can type into a field that gets silently cleared if it doesn't match the dropdown.
- C) **JSON-Schema `dependencies` to hide**: use `dependencies` to make `sampleIntervalMs` only appear when unit is "ms" and `sampleIntervalTicks` only when "ticks". Hidden field's data preserved or stripped per RJSF default (needs verification). **~25 new lines** (`dependencies` block + `preprocessFormData` for save-time cleanup). Diverges from live-graph but uses standard JSON-Schema features.
- D) **Hybrid**: introduce custom `Authoring.tsx` (A) but use `"ui:widget": "hidden"` conditional via `getUiSchema` instead of `ui:disabled`, so the inactive field is fully hidden rather than greyed. Same code cost as A.

**Estimates above cover only the Q3 wiring**; the runtime `afterTick` branch, new refs, schema field additions for the dropdown + ticks field, and new tests are needed regardless of choice.

**Decision**: **Reframed — switch to a two-field design that makes the question moot.** Instead of three fields (`sampleIntervalUnit` + `sampleIntervalMs` + `sampleIntervalTicks`), use **two**: `sampleIntervalUnit` (dropdown) and a single `sampleInterval` (integer) whose interpretation depends on the dropdown. No "inactive field" exists, so there's nothing to hide, disable, or strip-on-change. Static schema, no custom Authoring component required. The legacy `sampleIntervalMs` field is converted to the new shape on every read via `migrateAuthoredState` (see the **Backward compatibility** section below), so neither the form nor the runtime sees the legacy field. This decision was made after weighing options A vs B vs C/D, all of which were artifacts of the three-field design. See [Q5](#open-when-the-author-changes-the-unit-dropdown-should-the-interval-value-be-cleared-or-carried-over) below for a follow-up question this design surfaces (cross-unit value carryover).

### RESOLVED: What schema type for the value field?
**Context**: Originally asked about `sampleIntervalTicks` specifically. Reframed for the two-field design (Q3 resolution): the single `sampleInterval` field must accept both ms and tick values. Ticks are inherently integer; ms could in principle be fractional but sub-ms intervals are meaningless (`Date.now()` resolution is integer ms anyway).
**Options considered**:
- A) `type: "integer", minimum: 1` — schema rejects decimals at authoring time for both units; cleanest contract.
- B) `type: "number", minimum: 1` — accepts decimals; runtime tolerates fractions for ms via implicit truncation in `<` comparison, but accepts meaningless decimals for ticks.
- C) `type: "integer", minimum: 1` plus a runtime `Math.max(1, Math.floor(value))` guard as belt-and-suspenders.

**Decision**: **A** — `type: "integer", minimum: 1`. The single value field is integer for both units. ms gets slightly stricter than today's `sampleIntervalMs` (which was `type: "number"`); this is a minor improvement, not a regression — sub-ms intervals were never meaningful. Fractional legacy `sampleIntervalMs` values (vanishingly rare under the prior `type: "number"` schema) are normalized to integers by `migrateAuthoredState` via `Math.ceil` before the runtime ever reads them. `Math.ceil` (rather than `Math.round`) matches the pre-migration runtime's implicit rounding — `Date.now()` returns integer ms, so the existing `elapsed < sampleIntervalMs` guard already behaved as if any fractional ms were rounded up.

### RESOLVED: When the author changes the unit dropdown, should the interval value be cleared or carried over?
**Context**: Surfaced by the Q3 two-field-design resolution. There is now one `sampleInterval` field whose meaning changes with the dropdown. If an author has `1000 ms` set and switches the dropdown to "Every N simulation ticks", the field still holds `1000` — but `1000 ticks` is wildly different from `1000 ms` (likely hundreds of seconds of sim time). What should happen?

Implementation constraint discovered during analysis: `BaseAuthoring`'s `preprocessFormData` signature is `(data) => data` ([base-authoring.tsx:20, 56-57](packages/helpers/src/components/base-authoring.tsx#L20)) and only sees the new form data, not the previous. So a pure `preprocessFormData` rule cannot detect "the unit just changed" without either extending the shared helper's signature or introducing a custom Authoring component.

**Options considered**:
- A1) **Extend `preprocessFormData` signature** in `BaseAuthoring` to `(data, prevData) => data`. ~2-line change to the shared helper, backward-compatible with the 5 existing callers (drag-and-drop, fill-in-the-blank, live-graph, multiple-choice, multiple-choice-alerts) since they ignore the extra arg. Agent-simulation compares units in its `preprocessFormData` and clears `sampleInterval` if they differ.
- A2) **Custom `Authoring.tsx` for agent-simulation** with full `onChange` control to implement clear-on-unit-change inline. ~80 new LoC.
- B) **Carry the value over unchanged** — author trusted to notice and edit. Zero implementation cost; footgun remains.
- C) **Carry with `ui:help` warning** — non-conditional help text on the value field reminding authors that the value's meaning depends on the dropdown.

**Decision**: **B + documentation** — carry the value across unit changes, and add static `ui:help` text on the `sampleInterval` field that warns authors the value is interpreted in the unit selected above. Suggested help text (final wording can be tuned during implementation):

> "Interpreted in the unit selected above. Review this value if you change the unit — for example, a value of 1000 means 1000 milliseconds in ms mode and 1000 simulation ticks in tick mode."

Rationale: clearing would be the safer behavior but requires either modifying a shared helper (A1) or building a custom Authoring component (A2). For a polish detail an author will rarely hit, neither is worth the cost. Static help text mitigates the footgun without any new wiring. The unit-dropdown's natural-language labels ("Every N milliseconds", "Every N simulation ticks") already do some of the work of conveying that the value's meaning depends on the unit.

## Self-Review

<!-- Multi-role self-review of the requirements spec. Process each OPEN entry one at a time. -->

### Senior Engineer

#### RESOLVED: [HIGH] "Authoring form behavior on load" has no mechanism in the chosen design
Resolved by **adopting the `migrateAuthoredState` pattern** used in carousel, labbook, and scaffolded-question. `BaseQuestionApp` already supports a `migrateAuthoredState` prop ([base-question-app.tsx:52, 63-64](packages/helpers/src/components/base-question-app.tsx#L52)); the migration is applied transparently on every read of the authored state, so the form receives the new shape and populates the dropdown + Interval field correctly without any custom Authoring component or on-mount mutation. Schema `version` bumps from `1` to `2`, mirroring carousel's approach. See the rewritten [Backward compatibility](#backward-compatibility) section for the migration semantics, including the read-only persistence behavior (legacy JSON stays untouched until the author saves).

---

#### RESOLVED: [MEDIUM] `IAuthoredState` keeps `sampleIntervalMs` while the RJSF schema drops it
Resolved as a side effect of S1's resolution. With `migrateAuthoredState` in place, `IAuthoredState` no longer needs to carry the legacy field — `sampleIntervalMs` lives only on the new `IAuthoredStateV1` interface in `types.ts`, which is the migration function's input type. The TS/schema asymmetry is eliminated: every consumer (runtime, authoring, tests) reads the post-migration `IAuthoredState` shape, which contains only the new fields.

---

#### RESOLVED: [LOW] "Every N ticks" semantics aren't pinned down with an example
Added a worked-example bullet to the Runtime Sampling section's decision-logic list ("with `sampleIntervalUnit = "ticks"` and `sampleInterval = 5`, kept ticks are `0, 5, 10, 15, …`"). Sits just above the First-tick-rule bullet for context continuity.

---

#### RESOLVED: [MEDIUM] Spec claimed the form enforces required-when-unit-set, but the chosen flat schema doesn't
The Validation & error states section originally read "the form should normally prevent this state (the value field is required when unit ≠ "none")" — but with no `dependencies` block (deliberately avoided per Q3), the schema can't enforce that. Updated the wording to make the runtime fallback's role as the only safeguard explicit, and to note why `dependencies` wasn't reintroduced. No behavior change.

---

### QA Engineer

#### RESOLVED: [MEDIUM] Test list has gaps
Added four explicit bullets to the Tests subsection: first-tick-rule in tick mode (split out as its own test), `maxSamples` + tick mode + the QI-165 deferred-pause guard release, mid-run unit change doesn't replay history, and the `preprocessFormData` "strip on `none`" assertion. The "legacy strip on save" bullet from the original finding is dropped — that responsibility now belongs to `migrateAuthoredState` and is covered by the migration test list (added in the S1 resolution).

---

#### RESOLVED: [LOW] Backward-compat behaviors would be easier to test if restated as Given/When/Then
S1's rewrite of the Backward Compatibility section reframed the contract as a bulleted input/output mapping for `migrateAuthoredState`, with a parallel bullet list under Tests that enumerates each input shape as a separate test. Added a short cross-reference at the end of the Implications block pointing the reader at the test list as the acceptance-criteria enumeration. A separate Given/When/Then table would duplicate the migration test bullets without adding new information.

---

#### RESOLVED: [LOW] No test for the "unit set, value missing" runtime fallback
The Validation & error states section now identifies the runtime fallback as the only safeguard for the empty-value-with-unit-set edge case (see the Senior Engineer [MEDIUM] resolution above). Added a Tests bullet asserting that `sampleIntervalUnit: "ticks"` with undefined `sampleInterval` keeps every tick — locks the contract against a silent regression if the `sampleIntervalRef.current is set` guard is ever dropped.

---

### Product Manager

#### RESOLVED: [MEDIUM] Two-field redesign is a larger authoring change than the Jira ticket implies
Not a concern — the QI-167 ticket description was updated 2026-05-19 (during the spec interview) to reflect the two-field design. The current ticket text leads with an info panel pointing back at this spec and describing the field set as `sampleIntervalUnit` + a single `sampleInterval`. Stakeholder alignment is captured in the ticket itself.

---

#### RESOLVED: [LOW] No estimate of how many existing activities are affected
Not a concern. The `sampleIntervalMs` field has only been used in a couple of test activities since QI-165 shipped, so the migration is effectively a no-op for the deployed activity population. And `migrateAuthoredState` is the codebase-standard pattern (already wired through `BaseQuestionApp`), so including it costs less than skipping would. No Background note needed.

---

### Education Material Developer

#### RESOLVED: [MEDIUM] Dropdown has no "when do I pick ticks vs ms" guidance
Not adding `ui:help` to the unit dropdown. The natural-language enum labels ("No throttling" / "Every N milliseconds" / "Every N simulation ticks") already convey the distinction at the level the author needs, and the audience for agent-simulation authoring is expected to understand the ms-vs-tick trade-off without in-UI explanation. The existing help text on the value field (which warns about cross-unit value reinterpretation) covers the only ambiguity that can cause silent author error.

---

#### RESOLVED: [LOW] `DemoAuthoredState` not addressed
Added a Non-changes bullet stating that `DemoAuthoredState` stays unset for `sampleIntervalUnit` / `sampleInterval` (default = no throttling), preserving existing demo behavior. Updated the types.ts files-affected entry to call out bumping the `version` literal in both `DefaultAuthoredState` and `DemoAuthoredState` from `1` to `2`.

---

### WCAG Accessibility Expert

#### RESOLVED: [LOW] Help-text association and integer-validation error announcement are unspecified
Not in scope for QI-167. The new `sampleIntervalUnit` dropdown and `sampleInterval` integer field use the same RJSF + Bootstrap-3 widgets that every other dropdown and integer field in agent-simulation authoring already uses (`maxRecordingTime`, `maxSamples`, `gridStep`, etc.). Whatever screen-reader behavior those fields exhibit, the new ones will inherit. If help-text association or error-state announcement turns out to be broken at the template level, that's a package- or helper-wide concern worth a dedicated ticket — not a QI-167 deliverable.

---

## External Review

<!-- Findings from an external review pass (Senior Engineer, QA Engineer, Product Manager). Process each entry one at a time. -->

### Product Manager

#### RESOLVED: [MEDIUM] Conflicting scope about simultaneous ms + tick throttling
The Overview said throttling could be *"instead of (or in addition to)"* ms, contradicting the Out-of-Scope bullet that excludes simultaneous ms+tick throttles. The chosen two-field design (single dropdown + single value field) structurally enforces "one unit at a time," so *"in addition to"* was a leftover from earlier brainstorming. Dropped the parenthetical from the Overview; Out of Scope already states the constraint explicitly.

---

### Product / Authoring UX

#### RESOLVED: [Question] Visual state of the Interval input when "No throttling" is selected
Reviewer asked whether to disable the Interval input via `ui:disabled` when `sampleIntervalUnit === "none"` to give authors a visual cue their input won't be saved. **Declined** — this re-opens Q3, which deliberately chose the two-field design specifically to avoid dynamic UI logic. A `ui:disabled` rule would require a dynamic `getUiSchema` reading the form's current state, which requires a custom `Authoring.tsx` (~70 lines, the cost of Q3 option A that was already weighed and rejected). The dropdown's natural-language label ("**No throttling**") already conveys the field's irrelevance at a glance, and the field's static `ui:help` covers the related cross-unit reinterpretation concern. Re-opening would invalidate the chosen architecture for a polish detail authors will rarely encounter.

---

### Senior Engineer

#### RESOLVED: [Subtle] Mid-run unit swapping and wall-clock resets
Reviewer flagged that pausing in ms mode, switching unit while paused, and resuming after a long pause would force "an immediate, potentially out-of-sync sample" because `lastSampleAtRef` still holds an old timestamp. Analysis: this isn't a bug — it's exactly one kept sample on resume (not a burst), and the throttle re-establishes its cadence immediately on the following tick. The shape matches the spec's existing **First-tick rule** for sim (re)create: a guaranteed sample on the first tick gives immediate visual feedback that the sim is running again. The reviewer's recommended fix (re-baseline `lastSampleAtRef` to `Date.now()` on pause→running) would change behavior to "no sample for `intervalMs` after resume," which is arguably worse UX and expands QI-167 beyond its scope (pause semantics are inherited unchanged from QI-165). Added a **Pause/resume** bullet to Runtime Sampling that documents the behavior alongside the First-tick rule, so future readers don't have to re-derive it.

---

#### RESOLVED: [Subtle] Verification of `currentTick` initial value
Reviewer asked us to verify that `AV.vis`'s internal step counter doesn't pre-advance before the first `afterTick`, which would shift the kept-tick sequence to `1, 6, 11, ...`. Inspected [agent-simulation.tsx:400-417](packages/agent-simulation/src/components/agent-simulation.tsx#L400-L417): the `tick` counter the spec references is a **local closure variable** in `resetSimulationWithPreservedGlobals`, initialized to `0` on every sim (re)create at line 400 — completely independent of anything `AV.vis` does internally. The first `afterTick` always captures `currentTick = 0`, so the kept sequence is `0, 5, 10, 15, ...` as documented. Tightened the Background section to cite `agent-simulation.tsx:400` for the initialization and explicitly state that the first `afterTick` captures `currentTick = 0`, so the worked-example sequence is now derivable from cited code.

---

#### RESOLVED: [Subtle] Explicit defaulting in `migrateAuthoredState`
Concern: the V1 fallback branch returns `{ ...rest, version: 2 }` with no `sampleIntervalUnit`, relying on downstream consumers to fill the schema default. Reviewer suggested explicitly setting `sampleIntervalUnit: "none"` in the migration. Declined the migration change — RJSF does not write schema defaults back into `formData`, so freshly-authored states where the author never touches the dropdown also arrive at runtime with `sampleIntervalUnit: undefined`. The runtime's ref setter must default `undefined → "none"` regardless of what the migration emits, and adding the explicit field to the migration would make migrated output deviate from freshly-authored output without removing any runtime defaulting. **Instead**, tightened the Runtime Sampling spec to make the `?? "none"` defaulting explicit at the ref setter, addressing the underlying concern (deterministic runtime behavior for missing fields) at the right layer.

**Correction (fourth-pass review)**: the rationale "RJSF does not write schema defaults back into `formData`" is wrong — RJSF's default `populateAllDefaults` behavior writes the dropdown's `"none"` default into `formData`, so a fresh-authored state arrives with `sampleIntervalUnit: "none"` explicit, not `undefined`. The genuine `undefined` source is the migrated V1 state. The resolution itself stands: the ref setter's `?? "none"` is the right layer for deterministic defaulting and handles the migrated-state `undefined` and the fresh-authored `"none"` identically.

---

#### RESOLVED: [Subtle] RJSF validation vs `preprocessFormData` timing
Concern: if an author selects "No throttling" but leaves `0`/negative/empty in the Interval field, RJSF's AJV validator may flash a `minimum: 1` error. Verified the RJSF wiring in [base-authoring.tsx:49-62](packages/helpers/src/components/base-authoring.tsx#L49-L62): `BaseAuthoring` saves on every `onChange` (live save, not submit-gated), so the inline AJV error does not block saving. The field is optional in our schema, so empty/undefined passes; only a literal `0`/negative would trigger the inline message. `preprocessFormData` strips the value before the runtime sees it. Identical behavior to QI-165's `sampleIntervalMs` (same `minimum: 1`, optional). Documented the behavior in the Validation & error states section rather than changing the schema — loosening `minimum: 1` would weaken the contract for the active-unit case, and conditional `dependencies` was deliberately avoided in Q3.

---

#### RESOLVED: [LOW] Fractional legacy intervals can shorten throttle
The migration originally used `Math.round`, which would silently shorten the effective interval for fractional values under 0.5 (e.g., `100.4` → `100`). Investigation showed that the pre-migration runtime guard `Date.now() - lastSampleAt < sampleIntervalMs` already behaves as `Math.ceil` (since `Date.now()` returns integer ms — `elapsed < 100.4` is true iff `elapsed <= 100`, so the first kept tick is at 101). Switched the migration to `Math.ceil`, which matches the pre-migration runtime's implicit rounding exactly and never shortens the effective interval. Updated the migration rule, the Validation & error states note, the Q4 decision text, and the migration test bullet (changed the test input from `100.5` to `100.4` so the assertion discriminates between `Math.round` and `Math.ceil`).

---

### QA Engineer

#### RESOLVED: [MEDIUM] Migration spec ignores authored states missing `version`
**Declined.** The migration triggers on `version === 1`, matching the established convention in [packages/carousel/src/components/state-migrations.ts](packages/carousel/src/components/state-migrations.ts), [packages/labbook/src/components/state-migrations.ts](packages/labbook/src/components/state-migrations.ts), and [packages/scaffolded-question/src/components/state-migrations.ts](packages/scaffolded-question/src/components/state-migrations.ts) — all use the same strict equality check. For agent-simulation specifically, `version: 1` has been part of `IAuthoredState`, `DefaultAuthoredState`, and `DemoAuthoredState` since the very first commit that introduced agent-simulation (4eb8afb, Dec 2022). RJSF persists `version: 1` as a default on every authored save, so every deployed activity has the field set. A missing-`version` state is unreachable in practice. Departing from the sibling-package pattern for an unreachable case would add an inconsistency without a corresponding safety win.

---

#### RESOLVED: [MEDIUM] Authoring schema allows unit selection without interval
**Declined the schema change; corrected the rationale.** The finding is right that selecting a throttling unit and leaving `sampleInterval` blank silently yields no throttling — a failure mode QI-165's single-field design could not express. But the suggested fix (conditional `required` via `if/then` or `dependencies`/`oneOf`) cannot deliver what it implies: `BaseAuthoring` live-saves on every `onChange` with no submit gate ([base-authoring.tsx:54-62](packages/helpers/src/components/base-authoring.tsx#L54-L62)), so conditional `required` only paints an advisory inline AJV error and never blocks the incomplete state from being saved. The runtime would still receive `sampleInterval === undefined`, so the runtime no-op fallback and its test must stay regardless — "assert validation instead of the permissive runtime behavior" conflates the authoring (RJSF/AJV) and runtime (`afterTick`) layers. The edge case also requires an author to pick a unit, leave the always-visible value field blank, not notice it, and not notice the absence of throttling; per the Product Manager self-review, `sampleIntervalMs` has been used in only a couple of activities since QI-165. Adding non-blocking validation for that path implies a guarantee the system does not provide.

**What the finding did surface correctly was a factual error in the spec**: the Validation & error states bullet claimed conditional-`required` "would need a `dependencies` block, which the Q3 resolution deliberately avoided" — but Q3 avoided `dependencies` for *hiding inactive fields* in the discarded three-field design, and the schema already carries a `dependencies` block for `dataSourceInteractive`. Rewrote that bullet to drop the inaccurate Q3 reference and to frame the runtime no-op as a deliberate, accepted choice (graceful, matches QI-165), locked in by a runtime test.
