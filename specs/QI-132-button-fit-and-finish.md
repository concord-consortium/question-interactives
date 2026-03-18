# AI4VS "I'm Done" Button Fit and Finish

**Jira**: https://concord-consortium.atlassian.net/browse/QI-132

**Status**: **Closed**

## Overview

Improve the button interactive's user experience by showing immediate visual feedback (spinner + message) on click instead of waiting for the backend job system to respond, and add activity logging for job outcomes (success, failure, cancellation) to support downstream analysis.

## Requirements

- **R1: Immediate progress indication on click** — When the user clicks the button, a spinner and the default processing message ("Please wait...") must appear immediately (synchronously with the click handler), without waiting for the first job status update from the backend. If `createJob` throws an error, display the error icon with "Something went wrong. Please try again." and re-enable the button.
- **R2: Seamless transition to job-provided progress** — Once the job system returns a status with a `processingMessage`, the display should transition seamlessly from the immediate local message to the job-provided message. A text change from the default "Please wait..." to the job-provided message (e.g., "Submitting your work...") is expected and acceptable. There should be no flicker, gap, or momentary blank state during this transition.
- **R3: Log final job success** — When a job completes with `success` status, log a `"job success"` activity event with payload `{ jobId, message, buttonLabel, task }`.
- **R4: Log final job failure** — When a job completes with `failure` status, log a `"job failure"` activity event with payload `{ jobId, message, buttonLabel, task }`.
- **R5: Log job cancellation** — When a job is `cancelled`, log a `"job cancelled"` activity event with payload `{ jobId, buttonLabel, task }`.
- **R6: No duplicate logging** — Job outcome events should be logged exactly once per job completion (i.e., per unique `jobId`), not on every re-render. Retry attempts that create new jobs should each generate their own log events.
- **R7: Existing behavior preserved** — All existing button behaviors (disable logic, retry on failure/cancelled, accessibility attributes, authoring form, report item) must continue to work as before.
- **R8: Unit test coverage** — All new behavior (immediate progress display, createJob error handling, job outcome logging, no-duplicate-logging guarantee) must be covered by unit tests in the existing test suite.

## Technical Notes

- **Button component**: `packages/button/src/components/button.tsx` — main runtime component.
- **Logging API**: `log()` from `@concord-consortium/lara-interactive-api` — sends structured events to the activity logging system via postMessage to the host.
- **Job hook**: `useJobs()` returns `{ createJob, latestJob }`. `latestJob` has `status` (`queued`|`running`|`success`|`failure`|`cancelled`) and `result` (with `processingMessage` and `message` fields). `IJobInfo` includes an `id` field for tracing.
- **State model**: Local button state uses a `LocalStatus` discriminated union (`{ status: "clicked" } | { status: "error"; errorMessage: string }`) instead of separate boolean flags, making impossible states unrepresentable.
- **Session-scoped logging**: A `createdJobId` ref tracks the job ID returned by `createJob`. The logging useEffect only fires when `latestJob.id` matches this ref, preventing logging of stale jobs hydrated from persistence on page load. The ref is cleared after logging a terminal status.
- **Test file**: `packages/button/src/components/runtime.test.tsx` — 47 tests (17 existing + 11 new) using Jest + Enzyme with mocked `useJobs()`.

## Out of Scope

- Changes to the authoring form or authored state schema.
- Changes to the report item component.
- Changes to the job system API (`useJobs`, `createJob`, job executor).
- Visual styling changes (colors, fonts, spacing, icon sizes).
- Changes to other interactive types.
