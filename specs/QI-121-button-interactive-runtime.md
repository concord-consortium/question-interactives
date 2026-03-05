# Button Interactive Runtime

**Jira**: https://concord-consortium.atlassian.net/browse/QI-121

**Status**: **Closed**

## Overview

Implement the runtime UI for the button interactive, replacing the temporary debug view with a styled orange button that executes fake scripts and displays processing/success/failure status messages. This story scopes to local fake script execution only (using `https://example.com/<action>` URLs) so the full UI can be built and tested without Firebase infrastructure.

## Requirements

### Button Rendering
- Replace the temporary debug view in `ButtonComponent` with an actual styled button element
- Render the button label from `authoredState.buttonLabel` (default to "Submit" if empty/unset)
- Apply the `ap-button` mixin styling from helpers (orange button with WCAG-accessible colors)
- Button states per Zeplin spec:
  - **Default**: Orange fill (`--cc-ap-button-default: #ffba7d`), black text (`#000`), border (`#949494`)
  - **Hover**: Darker orange (`--cc-ap-button-hover: #ff9a42`), black text, cursor pointer
  - **Click/Active**: Click orange (`--cc-ap-button-click: #ff8113`), black text
  - **Disabled**: Same as default with `opacity: 0.35`
  - **Keyboard Focus**: Hover color with blue focus ring (`--cc-ap-button-focus-ring: #0957d0`), inset white gap

### Script Execution (Fake/Local)
- When the button is clicked, check if `authoredState.scriptUrl` matches the pattern `https://example.com/<action>` (where `<action>` is a path segment like `submit`, `check`, etc.)
- If the URL matches, execute a local fake script handler that returns a two-phase result:
  - A `queued` response applied immediately (transitions to "queued" state with a custom processing message)
  - A `result` Promise that resolves after a simulated delay with the success/failure result
- The script response type (`IScriptResponse`) should contain:
  - `status`: `"queued"` | `"success"` | `"failure"`
  - `message`: string (the message to display)
  - `disableButton`: boolean (whether to disable the button after completion)
  - `processingMessage`: optional string (custom processing message shown during queued/processing state; defaults to "Please wait…" if not provided)
- The two-phase result type (`IFakeScriptResult`) should contain:
  - `queued`: `IScriptResponse` (immediate response with `status: "queued"` and optional `processingMessage`)
  - `result`: `Promise<IScriptResponse>` (delayed response with `status: "success"` or `"failure"`)
- Provide at least two fake actions:
  - `https://example.com/success` — queued with "Submitting your work…", then returns success after ~2 seconds, message: "Great! Your teacher will be notified that you have submitted your work.", disables button
  - `https://example.com/failure` — queued with "Checking your answers…", then returns failure after ~2 seconds, message: "Sorry, you haven't finished answering all the questions. Go back and check your answers. Then return here and click this button again.", re-enables button
- Fake script URLs support optional query parameters to override default messages:
  - `?processingMessage=<text>` — overrides the processing/queued message
  - `?message=<text>` — overrides the final success/failure message
  - Example: `https://example.com/success?processingMessage=Working...&message=Custom success!`
- If `scriptUrl` is empty or not configured, the button renders disabled with an inline error message ("No script URL is configured for this button.") — no click required
- If `scriptUrl` does not match the `example.com` pattern, clicking the button shows an inline failure message in the UI
- All fake script logic (URL matching, simulated responses, delay) must live in a separate file (`fake-script-handler.ts`) so it can be cleanly removed with minimal diff when real script integration is added
- Script execution routing must live in a separate `execute-script.ts` file that delegates to the appropriate handler (currently only fake scripts). When real script execution is added, only this file needs updating — the button component remains unchanged

### State Machine (Local React State)
- The component manages its own UI state via `useState`, NOT via `setInteractiveState`
- UI states:
  - **idle**: Button is enabled, no status message shown
  - **queued**: Button is disabled, spinner + processing message shown below button. This is the initial state after clicking — the script has been queued but not yet started processing. The processing message can be customized by the script response's `processingMessage` field (defaults to "Please wait…")
  - **processing**: Button is disabled, spinner + processing message shown below button. Same visual as queued — reserved for future use when real scripts report intermediate processing status
  - **success**: Button is disabled (if script response says so) or enabled, success icon + message shown below button
  - **failure**: Button is enabled, failure icon + message shown below button
- Processing message defaults to "Please wait…" but can be overridden by a `processingMessage` field in the queued script response
- After success/failure, clicking the button again (if enabled) resets to queued state
- The button must be disabled synchronously on click (before the async handler runs) to prevent double-click/rapid-click issues
- If the component unmounts while a script is in-flight, the pending callback must not attempt to update state (use cleanup pattern)

### Status Message Display
- Status messages appear below the button in a horizontal layout: icon + message text
- **Processing**: Animated spinner icon + message text (default "Please wait…")
- **Success**: Green circle checkmark icon + message text
- **Failure**: Red circle X icon + message text
- Per Zeplin note: if message is longer than 2 lines, the container expands in height to accommodate

### Spinner
- No existing spinner component in the codebase — create a CSS-animated spinner
- The spinner should be a simple animated element matching the Zeplin spec (circular dots/segments)

### Interactive State
- The `ButtonComponent` must **never** call `setInteractiveState` — this is reserved for the real script URL (Firebase Cloud Function) in a future story
- The `submitted` field in `IInteractiveState` remains unused by this component for now

### Logging
- Log button clicks using the existing logging pattern (e.g., `log("button clicked", { buttonLabel, scriptUrl })`)
- Log script responses (success/failure) with the response details

### Accessibility
- Button must be keyboard-accessible (inherent with `<button>` element)
- Focus-visible styling per the `ap-button` mixin (blue inset ring)
- Status messages should be announced to screen readers (use `aria-live="polite"` with `role="status"` on the message region)
- Spinner should have appropriate `aria-label` or be hidden from screen readers with `aria-hidden="true"` (since processing message conveys the state)

### Tests
- All existing tests must continue to pass
- Update `runtime.test.tsx` to verify the button renders with the correct label
- Test the state transitions: idle → processing → success/failure

## Technical Notes

**Files to modify:**
- `packages/button/src/components/button.tsx` — Replace debug view with actual button + state machine
- `packages/button/src/components/button.scss` — Button styling using `ap-button` mixin + status message + spinner styles
- `packages/button/src/components/types.ts` — Add script response type interface
- `packages/button/src/components/runtime.test.tsx` — Update tests

**New files:**
- `packages/button/src/components/execute-script.ts` — Script execution router. Delegates to the appropriate handler based on the URL. Currently only supports fake scripts. When real script execution is added, only this file needs updating — `button.tsx` remains unchanged
- `packages/button/src/components/fake-script-handler.ts` — All fake script execution logic isolated here (URL matching, simulated delay, response mapping, query param overrides). When real script integration is added, this file is deleted

**Existing patterns to follow:**
- `@mixin ap-button` from `packages/helpers/src/styles/helpers.scss` for orange button styling
- CSS modules with `.scss` imports for component-scoped styles

**Zeplin design reference**: https://zpl.io/WQBl97M

**Button styling (from Zeplin screenshot):**
| State | Background | Text | Border |
|-------|-----------|------|--------|
| Default | `#ffba7d` | `#000` | `#949494` |
| Hover | `#ff9a42` | `#000` | `#949494` |
| Click | `#ff8113` | `#000` | `#949494` |
| Disabled | `#ffba7d` @ 35% opacity | `#000` | `#949494` |
| Focus | `#ff9a42` + blue ring `#0957d0` | `#000` | `#949494` |

**Icon assets (from Zeplin):**
- `packages/button/src/assets/correct-icon.svg` — Green circle (#17A62F) with white checkmark, 36x36px
- `packages/button/src/assets/incorrect-icon.svg` — Red circle (#DA0006) with white X, 36x36px
- Spinner: CSS-animated border rotation (gray)

## Out of Scope

- Firebase Cloud Function integration (future story — real script URL execution)
- Setting `interactiveState` from the button component (will be done by the real script)
- Report mode rendering (QI-127)
- Tooltip support (defined by script, per Jira — deferred until script integration)
- Button click logging to LARA/Portal (basic console logging only for now)
- Name/header bar rendering (handled by LARA host platform)
- Confirmation step before script execution (not in Zeplin design)

