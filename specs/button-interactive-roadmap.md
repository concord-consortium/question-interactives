# Button Interactive: Implementation Roadmap

> **Document type:** Implementation roadmap. This describes the implementation plan for building the button interactive feature across three repositories. For the authentication and authorization design, see [button-interactive-auth-design.md](button-interactive-auth-design.md).

**Date:** 2026-02-24
**Status:** Draft

## Overview

The button interactive triggers a remote Firebase Cloud Function when a student clicks a button. The function checks assignment completion, assigns the student to a balanced class, and performs elevated Portal operations (sending emails, unlocking assignments, managing class membership).

The work spans three repositories:
- **question-interactives** — The interactive itself (authoring, runtime, logging)
- **report-service** (`/functions`) — The Firebase Cloud Function (https://github.com/concord-consortium/report-service/tree/master/functions)
- **rigse** — The Portal (new API endpoints, OIDC auth middleware) (https://github.com/concord-consortium/rigse)

### Approach

Build bottom-up from the leaf dependency (Portal) through the function to the interactive. This catches architectural risks early — the novel patterns (OIDC auth, client SDK in a Cloud Function, dual-client Firestore access) are validated before building the UI layer, which follows established patterns.

Each step is scoped to one codebase where possible so the work is independently testable and reviewable.

---

## Phase 1: Thin Slice

The goal of the first four steps is an end-to-end path from button click to Portal action, validating all the key architectural decisions from the auth design doc.

### Step 1: Portal — OIDC verification middleware

**Repository:** rigse
**Goal:** The Portal can accept API requests authenticated by a Google Cloud service account's OIDC token, mapped to a Portal user.

**Work:**
- Add middleware in the Rails API controller that detects Google OIDC bearer tokens (alongside the existing JWT/OAuth paths)
- Verify the token against Google's public JWKS endpoint (`https://www.googleapis.com/oauth2/v3/certs`)
- Add a configuration/table mapping service account email to Portal user ID
- When a valid OIDC token arrives, set `current_user` to the mapped Portal user
- The existing `add_to_class` endpoint and Pundit authorization work unchanged

**Verification:** `curl` the staging Portal's `add_to_class` endpoint with a real OIDC token obtained from a test Google Cloud service account. Confirm the student gets added to the class.

**What this proves:** The core auth design works — a Cloud Function can authenticate to the Portal with elevated permissions using OIDC, no shared secrets.

### Step 2: Cloud Function — Minimal callable with Firestore read + Portal call

**Repository:** report-service/functions
**Goal:** A Firebase Callable Function that verifies the student's identity, reads their answers from Firestore, does a basic completion check, and makes one real Portal API call.

**Work:**
- Add a new callable function (`checkCompletionAndAdvance`) using Firebase Functions v4's `onCall` handler — this is the first callable function in this repo (existing functions are all HTTP/Express-based)
- Verify `context.auth` to identify the student
- Initialize a Firebase client SDK with the student's token to read their answers from Firestore (basic completion check — e.g., count answered questions vs total questions for one activity). Note: this is the first time the client SDK would be used in a function in this codebase; all existing functions use the Admin SDK. The client SDK's `signInWithCustomToken` flow may behave differently in a Node.js server environment vs a browser, so this is worth testing early.
- Request a Google OIDC identity token for the function's service account
- Call the Portal's `add_to_class` endpoint with the OIDC token and the student's info
- Return a status and message to the caller

**Verification:** Deploy to the staging Firebase project. Call the function from the Firebase emulator shell or a test script with a real student auth token. Confirm it reads the student's Firestore data and successfully calls the Portal to add them to a class.

**What this proves:** The full auth chain works end-to-end — student auth via callable, Firestore reads through security rules with client SDK, and OIDC-authenticated Portal API calls from the function.

### Step 3: Interactive — Button interactive with authoring and runtime

**Repository:** question-interactives
**Goal:** A working button interactive that can trigger the Cloud Function and display the result.

**Work:**
- Create a new `packages/button` package following established patterns (BaseQuestionApp wrapper, RJSF authoring, runtime component)
- Authoring form: configure the button label, prompt text shown to the student, the Cloud Function name to call, and the assignment/context parameters to pass
- Runtime view: display the prompt text, a button, a loading state while the function runs, and the result message returned by the function
- Logging: use `useBasicLogging` to log button presses and function results
- State: save the function result to interactive state so it appears in reports
- Wire up the Firebase callable using the existing Firebase auth session (same one used by `use-student-settings-helpers.ts`)

**Verification:** Run locally with `npm start`, test the authoring form in demo mode. Deploy to staging and test inside Activity Player against the real Cloud Function from Step 2.

**What this proves:** The complete thin slice works — a student clicks a button in an interactive, it calls the Cloud Function, the function checks Firestore and calls the Portal, and the student sees the result.

### Step 4: Teacher JWT minting + cross-student Firestore reads

**Repository:** report-service/functions
**Goal:** Validate the two-client-SDK pattern — the function can read data across students by minting a teacher-scoped token and using it through Firestore security rules.

**Work:**
- Implement the `getTeacherToken(classId, teacherId)` interface using Admin SDK's `createCustomToken` with teacher-level claims
- Initialize a second Firebase client SDK instance with the teacher token
- Read another student's data from Firestore through this teacher-scoped client (to confirm security rules allow it)
- Confirm the student-scoped client still cannot read other students' data (to confirm security rules block it)

**What this proves:** The dual-client-SDK approach works in practice — both the novel client-SDK-in-a-function pattern and the self-minted teacher JWT. This is the last major architectural risk.

---

## Phase 2: Full Implementation

### Step 5: Balanced random assignment

**Repository:** report-service/functions
**Goal:** Implement the algorithm that incrementally assigns students to new classes with balanced demographic characteristics.

**Work:**
- Using the teacher-scoped client from Step 4, read demographic survey answers (grade level, sex, race, and one other variable) for the current student
- Read the current compositions of the target classes — which students are already in each class and what their demographic answers were
- Implement the balancing algorithm: given the existing distributions across target classes, pick the class that best balances characteristics when this student is added
- Handle edge cases: first student assigned (no existing distribution), student already assigned (idempotency), target classes not yet created
- Wire the result into the existing add-to-class Portal call from Step 2

**Details to work out:**
- How are the target classes identified? Configured in the authored state, or derived from the current assignment/teacher?
- How is the demographic survey assignment identified so the function knows where to find those answers?
- What does "balanced" mean precisely — equal counts per demographic group in each class, minimizing variance across classes, or something simpler?
- How to handle students who didn't complete the demographic survey

### Step 6: Full completion check

**Repository:** report-service/functions
**Goal:** Replace the basic completion check from Step 2 with the real logic.

**Work:**
- Read the activity structure (from Firestore, or fetch from URL if not available in Firestore)
- Parse the structure to enumerate all questions across all activities in the sequence
- Read the student's answers for each question using the student-scoped client
- Define what "complete" means for each answer (non-empty? meets a minimum length? depends on question type?)
- Apply the threshold (e.g., 90% answered) and decide pass/fail
- Generate descriptive messages: "You missed X questions in Y activities. Please go back and complete any missing work."
- If the student passes, proceed with the remaining operations (balanced assignment, Portal calls)

**Details to work out:**
- Which question types count toward completion — all of them, or only certain types?
- Does the threshold apply per-activity or across the whole sequence?
- Should the message identify specific activities with missing work so the student knows where to go back to?

### Step 7: Portal — Unlock assignment + Send email APIs

**Repository:** rigse
**Goal:** Add the two remaining Portal API endpoints.

**Work:**
- Unlock assignment API: new endpoint to change an offering's availability for a specific student or class. Follows existing API patterns, protected by OIDC middleware from Step 1 and Pundit authorization.
- Send email API: new endpoint that accepts a recipient (Portal user ID or role like "teacher of class X") and message content. Uses existing Action Mailer infrastructure, `ClazzMailer` as a pattern. Protected by OIDC auth.

**Verification:** Test both endpoints with `curl` using an OIDC token, same approach as Step 1 verification.

### Step 8: Function — Wire up unlock + email + idempotency

**Repository:** report-service/functions
**Goal:** The function calls all Portal operations and handles retries safely.

**Work:**
- Call the unlock endpoint after the student passes completion check and is assigned to a new class
- Call the email endpoint to notify the relevant people
- Add idempotency checks — record in Firestore what has been completed for each student, skip operations that already succeeded on a previous button press
- Handle partial failures — if email fails but class assignment succeeded, don't redo the class assignment on retry
