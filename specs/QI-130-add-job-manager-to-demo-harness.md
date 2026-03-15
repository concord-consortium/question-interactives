# Add Job Manager to Demo Harness

**Jira**: https://concord-consortium.atlassian.net/browse/QI-130

**Status**: **Closed**

## Overview

Add job system host support to the question-interactives demo harness by integrating `JobManager` from `@concord-consortium/interactive-api-host` and implementing a mock `IJobExecutor` with built-in "success" and "failure" demo tasks. This enables interactives to use the real `useJobs()` API during development without requiring a backend.

## Requirements

- The demo harness must integrate `JobManager` from `@concord-consortium/interactive-api-host` to handle `createJob` and `cancelJob` messages from iframed interactives and route `jobCreated` and `jobInfo` responses back
- A mock `IJobExecutor` implementation must be created in the helpers package that:
  - Stores all job state in memory only (no localStorage, no serialization)
  - Resets completely on page reload (ephemeral)
  - Generates unique job IDs
  - Simulates job lifecycle transitions (queued → running → success/failure) with a 2000ms total delay (~500ms queued → running, ~1500ms running → final), matching the current fake script handler behavior
  - Supports the `onJobUpdate` callback pattern for status change notifications
- The mock executor must provide built-in demo tasks:
  - A **"success" task** that simulates a successful job (queued → running → success). Default messages: processingMessage = "Submitting your work…", result message = "Great! Your teacher will be notified that you have submitted your work."
  - A **"failure" task** that simulates a failed job (queued → running → failure). Default messages: processingMessage = "Checking your answers…", result message = "Sorry, you haven't finished answering all the questions. Go back and check your answers. Then return here and click this button again."
  - Unknown tasks should immediately resolve with `status: "failure"` and `result: { message: "Unknown task: <task name>" }` — no queued/running transitions
- The mock executor must support custom task parameters from the job request: `processingMessage` and `message` fields in the request override the defaults
- The `IframeRuntime` component must register the interactive with the `JobManager` when the iframe-phone connection is established and unregister it on cleanup
- The `JobManager` instance must be shared across all `IframeRuntime` instances within the same demo page (single mock executor, single routing layer)
- The helpers package must add `@concord-consortium/interactive-api-host` as a dependency. During development, `npm link` is used to connect locally-built packages from the sibling `lara` repo
- The `cancelJob` operation must clear pending `setTimeout` transitions, transition to `"cancelled"` status, and notify via `onJobUpdate`. A cancelled job must not subsequently transition to success/failure
- `getJobs()` must return all in-memory jobs regardless of context (empty on fresh page load, populated after jobs are created within the session)
- Unit tests must cover: success task lifecycle, failure task lifecycle, unknown task handling, custom message overrides, cancel clearing in-flight timeouts, `onJobUpdate` callback invocation, and `getJobs()` behavior

## Technical Notes

- The LARA job system spec (LARA-210) defines the full `IJobInfo`, `IJobExecutor`, `ICreateJobRequest`, `ICreateJobResponse`, `ICancelJobRequest`, and `IJobInfoMessage` interfaces
- `IframeRuntime` creates an `iframePhone.ParentEndpoint` and sets up message listeners — `JobManager.addInteractive()` needs access to this phone endpoint. The interactive ID defaults to `"demo-interactive"`
- The demo harness architecture uses nested iframes: root → authoring-container + runtime-container → authoring/runtime
- The `JobManager` instance and mock executor are created as a module-level singleton (matching the existing `dynamicTextProxy` pattern in `demo.tsx`)
- The mock executor's delay simulation uses `setTimeout` with `ReturnType<typeof setTimeout>` for handle type — avoids `window` reference issues in Jest/Node test environments
- Key files:
  - `packages/helpers/src/components/iframe-runtime.tsx` — primary integration point
  - `packages/helpers/src/components/demo.tsx` — demo harness orchestrator
  - `packages/button/src/components/fake-script-handler.ts` — reference for success/failure simulation behavior and messages

## Out of Scope

- Modifying the button interactive to use `useJobs()` (separate ticket — QI-131)
- Real `IJobExecutor` implementations (Firebase Functions, etc.)
- Job persistence across page reloads
- Changes to the `lara` repository itself (LARA-210 is handled separately)
- Authorization, validation, or size limits for job requests
- Custom task registration API for the mock executor
