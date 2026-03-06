# Update Button Interactive Authoring and Runtime to Use Job System

**Jira**: https://concord-consortium.atlassian.net/browse/QI-131

**Status**: **Closed**

## Overview

Replace the button interactive's script URL authoring and runtime with the LARA job system. Authors configure a task name and optional parameters instead of a URL; the runtime calls `createJob` via the `useJobs` hook and renders job status (processing, success, failure).

## Requirements

### Runtime

- **R1**: Update the runtime (`button.tsx`) to use `useJobs()` from `@concord-consortium/lara-interactive-api` instead of the `executeScript` / `IScriptResponse` system.
- **R2**: On button click, call `createJob({ ...params, task })` where `task` comes from `authoredState.task` and `params` are parsed from `authoredState.taskParams`. The `task` property must be spread last to prevent taskParams from overriding it.
- **R3**: Render job status using `latestJob` from `useJobs()`: spinner + processing message while queued/running, success icon + message on success, error icon + message on failure.
- **R4**: The button should be disabled when no `task` is configured (replacing the current `hasScriptUrl` check).
- **R5**: The status message for missing configuration should say "No task is configured for this button." (replacing "No script URL is configured").
- **R6**: On failure or cancellation, the button should re-enable so the user can retry. A cancelled job should display no status message.

### Authored State

- **R7**: Replace `scriptUrl?: string` in `IAuthoredState` with `task?: string` for the job task name.
- **R8**: Add `taskParams?: string` to `IAuthoredState` for optional task parameters.
- **R9**: Update `DefaultAuthoredState` and `DemoAuthoredState` to use `task` instead of `scriptUrl`.

### Authoring Form

- **R10**: Update the authoring form schema to show a "Task" text field (replacing "Script URL") with title "Task", placeholder `"Example: \"success\""`, and help text `"Enter the task name provided by a developer."`.
- **R11**: Add a "Task Parameters (optional)" textarea field to the authoring form with placeholder `"Example: \"key1=value1\""` and help text `"Optional parameters as key=value pairs, one per line or single line separated by &."`.

### Cleanup

- **R12**: Remove now-unused files: `execute-script.ts`, `fake-script-handler.ts`.
- **R13**: Remove now-unused types: `IScriptResponse`, `IFakeScriptResult`.
- **R14**: Remove the `console.log({latestJob})` debug line from `button.tsx`.
- **R15**: Update `runtime.test.tsx` to use `task` instead of `scriptUrl` and remove references to `executeScript`/fake script URLs (7+ references).
- **R16**: Add unit tests for the `taskParams` parsing logic covering: query string format, newline-separated format, empty/whitespace input, and URL-decoded values.

## Technical Notes

### Task Parameters Format
The runtime parses both formats using `URLSearchParams`:
- `key1=value1&key2=value2` (query string style) — pass directly to `new URLSearchParams()`
- `key1=value1\nkey2=value2` (newline-separated) — replace newlines with `&` then pass to `new URLSearchParams()`

Both produce `{ key1: "value1", key2: "value2" }` passed as additional properties in the `createJob` request object. `URLSearchParams` handles URL-decoding automatically. Empty or whitespace-only `taskParams` produces no additional parameters (skip parsing).

### MockJobExecutor Task Configs
The `MockJobExecutor` supports tasks `"success"` and `"failure"`. The authored `task` field value must match one of these for the demo to work. Unknown tasks get an immediate failure response.

## Out of Scope

- Adding new task types to `MockJobExecutor` (separate concern)
- Validation that the authored task name matches a known task (runtime handles unknown tasks gracefully)
- Migration of existing authored states from `scriptUrl` to `task` (no production data exists yet)
- Changes to the report item component (doesn't reference scriptUrl)

