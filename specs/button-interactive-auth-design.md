# Button Interactive: Remote Function Auth & Identity Design

> **Document type:** Architecture design document. Unlike other specs in this folder which describe UI/authoring behavior, this document describes the authentication and authorization design for a new server-side capability.

**Date:** 2026-02-19
**Status:** Draft

## Context

The "button interactive" is a new interactive that triggers a remote Cloud Function when a student clicks a button. The function performs elevated operations: checking assignment completion, sending emails, unlocking assignments, and managing class membership. This document focuses on how the function identifies the current user and how it gets the permissions it needs.

### What the first remote function does

1. **Check completion** — Reads the activity structure and the student's answers from Firestore. If the activity structure is not in Firestore, the function uses the assignment ID to look up the activity structure URL from the Portal. Evaluates whether the student has answered a sufficient percentage of questions (e.g., 90%). Returns a descriptive message if incomplete.
2. **Send an email** — Calls a Portal API to send an email to a portal user (elevated permission).
3. **Unlock the next assignment** — Calls a Portal API to unlock the next assignment in the student's class (elevated permission).
4. **Add student to a new class** — Calls a Portal API to add the student to another class owned by the same teacher (elevated permission).
5. **Balanced random assignment** — Determines which new class the student should join based on demographic survey answers (grade level, sex, race, and one other variable), distributing students incrementally across classes with balanced characteristics.

## Design

### Why a Cloud Function, not a Portal endpoint

The Portal already handles elevated operations, so it could orchestrate this flow directly. However, a Cloud Function keeps the scripting logic outside the Portal. New button behaviors can be added as new functions without Portal changes, and if a function turns out to be unused it can simply be deleted. This keeps the Portal focused on its core responsibilities and avoids accumulating one-off workflow logic there.

### Client-side: How the interactive calls the function

The interactive uses the Firebase JS SDK's `httpsCallable` to invoke the Cloud Function.

1. Student clicks the button in the interactive's runtime component.
2. The interactive already has a Firebase auth session — the same one used for Firestore student settings today (via `getFirebaseJwt` then `signInWithCustomToken`).
3. The interactive calls `httpsCallable(functions, "checkCompletionAndAdvance")` with a payload containing the **assignment ID** (so the function knows which activity to check).
4. Firebase automatically attaches the user's auth token to the request — no manual JWT handling.
5. The function returns a response with a status and message (e.g., `{ status: "incomplete", message: "You missed 3 questions in Activity 2..." }`).
6. The interactive displays the message to the student.

The interactive does **not** send auth tokens or the student's identity — Firebase handles this automatically.

**Protection against external calls:** Firebase Callable Functions validate that the request comes from an authenticated Firebase user. Firebase App Check can be added later to further verify requests come from a legitimate app instance rather than a script.

### Function identity & Firestore access

**Identifying the student:** Firebase Callable Functions provide `context.auth.uid` and `context.auth.token` automatically. The token contains custom claims from the LARA Firebase JWT: `platform_user_id`, `class_hash`, `platform_id`, etc.

**Two-client Firestore access, both through security rules:**

1. **Student client** — initialized with the student's token from the callable context. Used for reading the student's own answers and the activity structure. Firestore security rules enforce student-level access.

2. **Teacher client** — the function uses the Firebase Admin SDK *only* to mint a custom token with teacher-level claims (scoped to the student's class), then initializes a separate client SDK instance with that token. Used for cross-student reads (demographic answers, class compositions for balanced assignment). Firestore security rules enforce teacher-level access.

**The function never uses the Admin SDK for Firestore reads or writes.** All data access goes through the client SDK with rule-enforced tokens.

**Isolation for future migration:** The token-minting logic lives behind a simple interface (e.g., `getTeacherToken(classId, teacherId): Promise<string>`). The current implementation uses the Admin SDK's `createCustomToken`. A future implementation can swap this to a Portal API call that mints the teacher JWT instead, at which point the Admin SDK dependency can be removed entirely. This future approach would create a harder security boundary since the function would have no way to bypass Firestore security rules even if compromised.

### Portal auth: OIDC identity for elevated operations

The function needs to call Portal APIs for operations that students must not be able to perform directly.

**Why OIDC, not a Portal JWT exchange:** An alternative would be to have the function send the student's learner JWT to the Portal and receive back a teacher-level JWT. But this means any holder of a learner JWT — including the student themselves — could call that Portal endpoint to escalate their permissions. Preventing that requires authorizing the caller as a trusted service, which is exactly what OIDC provides. It is the standard way to authenticate a service running in a trusted environment like a Cloud Function, and unlike API keys it requires no shared or persistent secrets. On the Portal side, OIDC verification is an alternative to the existing API key authentication — same pattern, stronger security.

**How it works:**

1. The Cloud Function runs as a **Google Cloud service account** (e.g., `button-function@your-project.iam.gserviceaccount.com`).
2. When calling the Portal, the function requests a **Google OIDC identity token** for itself — a one-liner using Google's auth libraries, no secrets required.
3. The function sends this token as a bearer token in Portal API requests.
4. The Portal verifies the token against **Google's public JWKS endpoint** (`https://www.googleapis.com/oauth2/v3/certs`) — standard JWT verification, no shared secrets.
5. The Portal checks that the token's `email` claim matches a pre-configured trusted service identity.

**Portal-side (initial implementation):** The Portal maps the service account identity to a Portal user account. When an API request arrives with a valid OIDC token, the Portal sets the "current user" to the mapped Portal user and processes the request using existing authorization logic. This requires minimal Portal changes — just the OIDC verification middleware and the service-account-to-user mapping, plus the new API endpoints. Since these scripts automate what a project admin would do manually, running as that admin user is a natural starting point. Building a dedicated service role system is premature until we see what permissions future scripts need (see Future considerations).

**What the function sends to the Portal on each call:**
- The OIDC bearer token (proves the function's identity)
- The student's `platform_user_id` and class/assignment context (so the Portal knows who and what to act on)

The student's identity is conveyed as data in the request body, not as the auth credential. The Portal trusts the function to provide accurate student context because the function has already verified the student's Firebase auth.

### End-to-end flow

1. Student clicks button in the interactive.
2. Interactive calls `httpsCallable(functions, "checkCompletionAndAdvance")` with `{ assignmentId }`.
3. Cloud Function verifies `context.auth`.
4. Function reads student's answers and activity structure via **student-scoped client SDK** (security rules enforced).
5. Function evaluates completeness against the threshold.
6. **If incomplete:** returns `{ status: "incomplete", message: "You missed X questions..." }` — done.
7. **If complete:** function mints a teacher-scoped token, initializes teacher client SDK.
8. Function reads cross-student demographic data via **teacher-scoped client SDK** (security rules enforced).
9. Function determines balanced class assignment.
10. Function requests a Google OIDC token for its service account.
11. Function calls Portal APIs (as the mapped Portal user) to: send email, unlock next assignment, add student to new class.
12. Function returns `{ status: "success", message: "You've been assigned to..." }`.

### Abuse prevention

- **Authentication required:** Firebase Callable Functions reject unauthenticated requests automatically.
- **Firebase App Check** (optional, add later): verifies requests come from a legitimate app instance.
- **Rate limiting:** can be configured at the Cloud Functions level (max instances) or in application logic.
- **Idempotency:** The function checks whether the student has already been assigned before repeating Portal operations. Clicking the button twice does not send two emails or add the student to two classes.

### Error handling

- If any Portal API call fails, the function should not leave things in a partial state. Options: accept partial completion and record what succeeded, or treat Portal calls as best-effort with retries.
- The function returns a clear message to the student in all cases, including on failure (e.g., "Something went wrong, please try again or contact your teacher").

## Future considerations

- **Portal-minted teacher JWTs:** Migrate from self-minted teacher tokens (Admin SDK) to Portal-minted tokens. This removes the Admin SDK dependency and creates a hard security boundary where the function cannot bypass Firestore security rules. Requires a new Portal API endpoint.
- **Granular service roles:** Replace the Portal user mapping with a dedicated service role system, where the Portal defines fine-grained permissions for service identities rather than mapping them to user accounts.
- **Firebase App Check:** Add App Check attestation to further restrict calls to legitimate app instances.
