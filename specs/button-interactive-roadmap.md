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

**Details to work out:**
- The OIDC token must specify an `audience` claim (typically the Portal's URL). The Portal must validate that `aud` matches its expected value to prevent token replay across services.
- Portal should bind trust to the service account's stable `sub` (unique ID), not just the `email` claim, which can be renamed or aliased. Full JWT validation (`iss`, `aud`, `exp`/`iat`) is required.
- How does the Portal cache Google's JWKS? What happens on fetch failure? What clock-skew tolerance for `iat`/`exp`?

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

**Details to work out:**
- How does the function initialize a student-scoped client SDK? The callable provides decoded claims in `context.auth`, not a raw JWT. `signInWithCustomToken` won't accept an ID token — the function may need to mint a custom token for the student too (via Admin SDK), same as the teacher path.
- What is the lifecycle of client SDK instances in a Cloud Functions environment? The client SDK is designed for browser use. Multiple instances per invocation could cause memory leaks or connection exhaustion. Per-invocation or pooled? What cleanup is needed?
- How does the function validate that the authenticated student actually belongs to the `assignmentId` they send in the request payload?
- How does the function map from `assignmentId` (a Portal concept) to the correct Firestore document paths for student answers and activity structure?
- Where does `teacherId` come from for `getTeacherToken(classId, teacherId)`? The student's Firebase JWT likely only contains `class_hash`, not the teacher's identity.
- The student's Firebase JWT claims (`class_hash`, `platform_user_id`, etc.) may be stale if enrollment changed between JWT issuance and button click. How long do these JWTs live? Should the function validate current enrollment before Portal operations?
- The function should validate the request payload shape/types and required custom claims (fail-closed). Missing or malformed values should yield a safe error with no side effects.
- If the Firebase project is shared across environments/apps, the function should verify callers are signed in via the expected provider (e.g., `sign_in_provider == "custom"` with required claims).
- Does `platform_id` in the student's claims require routing Portal API calls to different Portal instances (multi-tenancy)?

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

**Details to work out:**
- What is the button's state machine? Can the student retry on error? Is the button disabled after first click, after success, or re-enabled on transient errors?
- What response status codes does the function return beyond `"incomplete"` and `"success"`? (e.g., `"error"`, `"already_completed"`, `"partial_failure"`) — the interactive needs to handle each appropriately.
- Should there be a confirmation step before triggering irreversible actions (email, class change, assignment unlock)?
- What does the button show in report mode and authoring mode? Is it clickable? Can authors preview without triggering real operations?
- How does the interactive persist and rehydrate the last result on page reload or navigation, so it reflects prior success rather than inviting re-clicks?
- What happens if the Firebase auth session is unavailable (expired, missing, preview context)? Should the button be disabled, or show a message?
- What are the accessibility requirements? Disabled/loading state announced, error messages announced, keyboard activation.

### Step 4: Teacher JWT minting + cross-student Firestore reads

**Repository:** report-service/functions
**Goal:** Validate the two-client-SDK pattern — the function can read data across students by minting a teacher-scoped token and using it through Firestore security rules.

**Work:**
- Implement the `getTeacherToken(classId, teacherId)` interface using Admin SDK's `createCustomToken` with teacher-level claims
- Initialize a second Firebase client SDK instance with the teacher token
- Read another student's data from Firestore through this teacher-scoped client (to confirm security rules allow it)
- Confirm the student-scoped client still cannot read other students' data (to confirm security rules block it)

**What this proves:** The dual-client-SDK approach works in practice — both the novel client-SDK-in-a-function pattern and the self-minted teacher JWT. This is the last major architectural risk.

**Details to work out:**
- What exact claims does the minted teacher token contain? Is it scoped to a single `class_hash`, or broader? If the function is compromised, an attacker could mint teacher tokens for any class — the scope should be as narrow as possible.
- Should the teacher token be minted fresh on every invocation, or cached? Fresh is wasteful but safe; caching introduces a window where a revoked teacher's access persists.
- Check what the UID of the minted token should be. I was assuming it should be just the teacher of the class not some fake UID. But perhaps the UID doesn't matter for the point of view of the firestore access rules. So then we could use a fake UID like `service:teacher:<classId>`.

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
- How are concurrent assignments serialized? If 30 students click simultaneously, each function reads the same class composition and assigns to the same "underrepresented" class. A serialization strategy is needed (Firestore transaction, distributed lock, queue, or accept-then-rebalance).
- If a lock or transaction is used, what happens when it can't be acquired — timeout, backoff, fallback to random?
- Should the function scan all student answer docs at click time, or maintain precomputed counters per class in Firestore to bound read costs at scale?
- Using race/sex for assignment may require explicit policy basis, opt-out mechanism, or consent. How does the system behave when a student declines to provide demographic data (vs. didn't complete the survey)?
- The function reads sensitive PII (grade, sex, race) under FERPA. It must not log or persist demographic data beyond the assignment decision. Assignment results must not reveal demographics indirectly.
- Plan for periodic fairness/bias evaluation: check that outcomes don't systematically disadvantage groups. Define who owns this review.

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
- If students can continue answering while the function runs, which answers count — latest saved, last submitted, a specific snapshot? This affects consistency of the completion check.
- Where is the completion threshold configured — authored content, per-assignment config, or hardcoded in the function?

### Step 7: Portal — Unlock assignment + Send email APIs

**Repository:** rigse
**Goal:** Add the two remaining Portal API endpoints.

**Work:**
- Unlock assignment API: new endpoint to change an offering's availability for a specific student or class. Follows existing API patterns, protected by OIDC middleware from Step 1 and Pundit authorization.
- Send email API: new endpoint that accepts a recipient (Portal user ID or role like "teacher of class X") and message content. Uses existing Action Mailer infrastructure, `ClazzMailer` as a pattern. Protected by OIDC auth.

**Verification:** Test both endpoints with `curl` using an OIDC token, same approach as Step 1 verification.

**Details to work out:**
- Who is the email recipient — the student, the teacher, an administrator?
- Should the Portal independently verify student/assignment/class relationships rather than trusting the function's request body?
- Should Portal endpoints accept idempotency keys for safe retries (independent of the function's tracking)?
- Define the function-to-Portal API contract for each operation: routes, request fields, response format. This should be explicit since function and Portal are in different repos.
- Scope Portal endpoints narrowly — e.g., email endpoint should only send mail to existing users, and if possible only users accessible by the user the script is running as (Trudi).
- Specify whether email content contains student PII and whether it's templated on the Portal side or composed by the function.
- Portal responses should return minimal status data; avoid identifiers, roster sizes, or other sensitive information.

### Step 8: Function — Wire up unlock + email + idempotency

**Repository:** report-service/functions
**Goal:** The function calls all Portal operations and handles retries safely.

**Work:**
- Call the unlock endpoint after the student passes completion check and is assigned to a new class
- Call the email endpoint to notify the relevant people
- Add idempotency checks — record in Firestore what has been completed for each student, skip operations that already succeeded on a previous button press
- Handle partial failures — if email fails but class assignment succeeded, don't redo the class assignment on retry

**Details to work out:**
- Which client SDK writes idempotency and assignment records to Firestore? The student client probably can't (security rules). The teacher client would need write rules. Using Admin SDK would break the "no admin writes" principle. The write path and security rules need to be specified.
- What is the write ordering for idempotency? Recording "processed" before Portal calls blocks retries if a Portal call fails. Recording after risks duplicate operations on crash/timeout.
- What is the error handling strategy and operation ordering? If email succeeds but class-add fails, what's the student experience? This needs a specific decision, not deferred options.

---

## Cross-cutting concerns

Details that apply across multiple steps or the project as a whole. These should be resolved during the detailed design for whichever step encounters them first.

### Security & auth
- Concrete rate limiting strategy: per-student, per-class, what limits? "Can be configured" is not a decision.
- Decide whether Firebase App Check is required in production. Specify enforcement behavior and what happens in dev/staging where App Check may not be available.
- Tokens (Firebase ID tokens, OIDC tokens) must never appear in logs. Use correlation IDs for diagnostics.
- Decide canonical user identity: Firebase `uid` or `platform_user_id`? Ensure a stable mapping and use consistently for auditing and idempotency.
- Enumerate which student-controlled request fields can influence side effects (e.g., only `assignmentId`) vs. optional hints, to prevent scope creep.
- Restrict outbound Portal API calls to an allowlisted base URL per environment (no redirect following).
- Specify or reference the Firestore security rules the design depends on. Outline requirements: student tokens read only their own data within matching `class_hash`; teacher tokens read all student data within matching `class_hash`.

### Infrastructure & deployment
- Use a dedicated service account with minimal IAM roles, not the default compute SA.
- Environment configuration: where are Portal URL, mapped user, Firestore config stored? Environment variables, Secret Manager, or runtime config?
- Environment isolation: dev/staging/prod should use separate service accounts, Portal hosts, and ideally separate Firebase projects.
- Deployment strategy: is the function deploy cycle tied to the interactive or independent?
- Function region should align with Firestore and Portal deployment for latency and data residency.
- Capacity/quota planning: define `maxInstances`, concurrency limits, and budget for Firestore read quotas and Portal rate limits to handle burst classroom usage.
- Network egress: confirm the Portal is publicly accessible or configure VPC connector / Cloud NAT for static IPs.

### Observability & operations
- Monitoring: structured logging (student ID, assignment ID, outcome, duration — no demographics or tokens), success/failure metrics, latency percentiles, Portal API error rates.
- Alerting: action-specific metrics (emails sent, unlocks, class-joins) with alerts for anomalous spikes.
- Traceability: propagate a correlation ID from callable request through Firestore and Portal calls, without logging PII.
- Kill switch: environment flag to disable side effects (email/unlock/class-add) without redeploying, while still returning safe student messaging.

### Testing & QA
- End-to-end testability strategy for staging: the function depends on Firebase auth, Firestore data, Portal APIs, and a service account identity.
- Load/performance testing for bursty classroom usage (30 students clicking within minutes): concurrency, Firestore read quotas, Portal rate limits, p95 latency targets.
- Edge cases to test: session expires mid-flow, enrollment changes between check and assignment, Portal is down, all target classes at capacity, student retries after partial success.

### Privacy & data
- Student-facing responses must not leak cross-student data (class composition, other students' demographics).
- Cross-student reads (via teacher token) should be logged/auditable.
- Retention/deletion policy for idempotency records, audit logs, and assignment outcomes: duration, access, cleanup at end of term.
