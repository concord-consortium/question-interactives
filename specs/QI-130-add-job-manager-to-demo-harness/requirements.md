# Add Job Manager to Demo Harness

**Jira**: https://concord-consortium.atlassian.net/browse/QI-130
**Repo**: https://github.com/concord-consortium/question-interactives
**Implementation Spec**: [implementation.md](implementation.md)
**Status**: **Ready for Implementation**

## Overview

Add job system host support to the question-interactives demo harness by integrating `JobManager` from `@concord-consortium/interactive-api-host` and implementing a mock `IJobExecutor` with built-in "success" and "failure" demo tasks. This enables interactives to use the real `useJobs()` API during development without requiring a backend.

## Project Owner Overview

The LARA interactive API is gaining a job system (LARA-210) that lets interactives request background operations from their host environment. The first use case is the button interactive, which needs to kick off a job when clicked and update its UI as the job progresses through queued → running → success/failure states.

This ticket provides the host-side infrastructure in the demo harness so developers can build and test job-aware interactives locally. A mock executor simulates job lifecycle transitions with configurable messages and a 2-second delay, matching the existing fake script system's behavior. The mock is ephemeral (in-memory only, resets on page reload) and requires no backend. Once this is in place, the button interactive will be updated in a follow-up ticket to use `useJobs()` instead of the current fake script URL system.

## Background

The LARA interactive API (`@concord-consortium/lara-interactive-api`) provides a postMessage-based communication layer between iframed educational interactives and their host environment. A new **job system** is being added to this API (LARA-210), enabling interactives to create named background jobs, cancel them, and receive real-time status updates through their lifecycle (queued → running → success/failure/cancelled).

The job system introduces three key components:

1. **Client-side API** (in `lara-interactive-api`): `createJob()`, `cancelJob()`, `getJobs()`, listener functions, and a `useJobs()` React hook
2. **Host-side `JobManager` class** (in `interactive-api-host`): A thin message routing layer that registers interactives, delegates job operations to a pluggable `IJobExecutor`, and routes status updates back to the originating interactive
3. **`IJobExecutor` interface**: A pluggable backend that the consuming application provides — Firebase Functions in the Activity Player, a mock executor in the QI demo harness

The question-interactives repo has a **demo harness** system in the `helpers` package (`packages/helpers/src/components/`) that provides a standalone development environment for interactives. The demo harness uses `IframeRuntime` to set up `iframe-phone` ParentEndpoint communication with iframed interactives, handling messages like `interactiveState`, `height`, `hint`, `log`, `showModal`, `customMessage`, and `getAttachmentUrl`.

The **button interactive** (`packages/button/src/`) currently uses a fake script execution system: `executeScript()` delegates to `executeFakeScript()` which simulates two-phase job behavior (queued → success/failure) with a 2-second delay. The button's authored state includes a `scriptUrl` field pointing to URLs like `https://example.com/success` or `https://example.com/failure`. The fake script handler supports custom messages via URL query parameters.

This ticket adds job system host support to the demo harness so that the button interactive (and future interactives) can use the real `useJobs()` API during development. Since LARA-210 is being developed in the sibling `lara` repo, `npm link` is used to link the built `interactive-api-host` package into the demo system.

## Requirements

- The demo harness must integrate `JobManager` from `@concord-consortium/interactive-api-host` to handle `createJob` and `cancelJob` messages from iframed interactives and route `jobCreated` and `jobInfo` responses back
- A mock `IJobExecutor` implementation must be created in the helpers package that:
  - Stores all job state in memory only (no localStorage, no serialization)
  - Resets completely on page reload (ephemeral)
  - Generates unique job IDs
  - Simulates job lifecycle transitions (queued → running → success/failure) with a 2000ms total delay (~500ms queued → running, ~1500ms running → final), matching the current fake script handler behavior
  - Supports the `onJobUpdate` callback pattern for status change notifications
- The mock executor must provide built-in demo tasks:
  - A **"success" task** that simulates a successful job (queued → running → success), analogous to `https://example.com/success` in the current fake script system. Default messages: processingMessage = "Submitting your work…", result message = "Great! Your teacher will be notified that you have submitted your work."
  - A **"failure" task** that simulates a failed job (queued → running → failure), analogous to `https://example.com/failure`. Default messages: processingMessage = "Checking your answers…", result message = "Sorry, you haven't finished answering all the questions. Go back and check your answers. Then return here and click this button again."
  - Unknown tasks should immediately resolve with an `IJobInfo` having `status: "failure"` and `result: { message: "Unknown task: <task name>" }`. No queued/running transitions are emitted — the job goes directly to the failure terminal state
- The mock executor must support custom task parameters from the job request: `processingMessage` and `message` fields in the request override the defaults (e.g., `createJob({ task: "success", processingMessage: "Custom…", message: "Custom result" })`), mirroring the existing fake script handler's URL query parameter support
- The `IframeRuntime` component must register the interactive with the `JobManager` when the iframe-phone connection is established and unregister it on cleanup
- The `JobManager` instance must be shared across all `IframeRuntime` instances within the same demo page (single mock executor, single routing layer)
- The helpers package must add `@concord-consortium/interactive-api-host` as a dependency (a separate npm package from `@concord-consortium/lara-interactive-api`, both published from the `lara-typescript` monorepo). `JobManager` and `IJobExecutor` are imported from this package. During development, `npm link` is used to connect the locally-built packages from the sibling `lara` repo while LARA-210 is in progress; once published, the regular npm dependency versions are bumped
- The `cancelJob` operation on the mock executor must clear any pending `setTimeout` transitions for the job, transition it to `"cancelled"` status, and notify via `onJobUpdate`. A cancelled job must not subsequently transition to success/failure
- `getJobs()` on the mock executor must return all in-memory jobs regardless of context (empty on fresh page load, populated after jobs are created within the session). This enables backfill when `IframeRuntime` re-mounts during a session (e.g., when authored state changes). No persistence across page reloads. Note: `JobManager` already enforces per-interactive scoping for ongoing job updates (routes by `jobId → interactiveId` mapping). `getJobs()` only affects backfill on `addInteractive` — in the demo harness there is a single runtime interactive, and in production contexts (carousel/side-by-side) no interactive creates jobs through this mock executor, so unscoped backfill is safe
- Unit tests must be written for the mock executor covering: success task lifecycle, failure task lifecycle, unknown task handling, custom message overrides, cancel clearing in-flight timeouts, `onJobUpdate` callback invocation, and `getJobs()` behavior (empty on fresh load, returns created jobs within session)
- End-to-end verification of the full integration (IframeRuntime → JobManager → mock executor → status updates back to interactive) is deferred to the button interactive update ticket, which will exercise the job system through the `useJobs()` hook

## Technical Notes

- The LARA job system spec (LARA-210) defines the full `IJobInfo`, `IJobExecutor`, `ICreateJobRequest`, `ICreateJobResponse`, `ICancelJobRequest`, and `IJobInfoMessage` interfaces — see `lara/specs/LARA-210-add-job-system-to-lara-client-api/requirements.md`
- `IframeRuntime` (`packages/helpers/src/components/iframe-runtime.tsx`) creates a `iframePhone.ParentEndpoint` and sets up message listeners — the `JobManager.addInteractive()` call needs access to this phone endpoint. The interactive ID passed to `addInteractive`/`removeInteractive` must match the `id` prop (defaulting to `"demo-interactive"`), consistent with the ID used in `initInteractiveMessage`
- The demo harness architecture uses nested iframes: root → authoring-container + runtime-container → authoring/runtime. The `IframeRuntime` component lives in the runtime-container and manages the phone endpoint for the runtime iframe
- The `JobManager` instance and mock executor must be created as a module-level singleton (matching the existing `dynamicTextProxy` pattern in `demo.tsx`), persisting across React re-renders but resetting naturally on page reload
- The mock executor's delay simulation should use `setTimeout` to transition jobs through states (queued → running → success/failure), calling the `onJobUpdate` callback at each transition
- Key files:
  - `packages/helpers/src/components/iframe-runtime.tsx` — primary integration point for `JobManager.addInteractive()`
  - `packages/helpers/src/components/demo.tsx` — demo harness orchestrator
  - `packages/button/src/components/fake-script-handler.ts` — reference for success/failure simulation behavior and messages
  - `packages/button/src/components/types.ts` — `IScriptResponse` shows the current status/message pattern
- The button interactive will be updated in a subsequent ticket to use `useJobs()` instead of the fake script system — this ticket focuses on providing the host-side infrastructure

## Out of Scope

- Modifying the button interactive to use `useJobs()` (separate ticket — the button will be updated to use the job system once this host support is in place)
- Real `IJobExecutor` implementations (Firebase Functions, etc.)
- Job persistence across page reloads (explicitly excluded — mock executor is ephemeral)
- Changes to the `lara` repository itself (LARA-210 is handled separately)
- Authorization, validation, or size limits for job requests
- Custom task registration API for the mock executor (built-in "success" and "failure" tasks are sufficient for now)

