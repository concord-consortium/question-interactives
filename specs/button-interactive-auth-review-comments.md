# Button Interactive: Auth Design Review Comments

**Source:** AI review of [button-interactive-auth-design.md](button-interactive-auth-design.md)
**Review date:** 2026-02-23

**Note:** These comments were generated as part of an AI review of the auth design document. Most are implementation-level details that will be addressed in the detailed specs for each phase of the [roadmap](button-interactive-roadmap.md), not in the architecture design document itself.

**Note:** The document header says "Unlike other specs in this folder which describe UI/authoring behavior." If a companion spec exists for the button interactive's UI, authoring configuration, and runtime behavior, it should be cross-referenced here. If one doesn't exist yet, several items in this auth design depend on authored configuration (assignment ID, target classes, completion threshold) that should be defined in a companion spec.

## 1. Security Engineer

**Strengths:**
- The two-client Firestore approach (student-scoped + teacher-scoped) with all access through security rules is a solid principle. Avoiding Admin SDK for reads/writes means a compromised function can't bypass Firestore rules arbitrarily.
- Firebase Callable Functions handling auth token attachment automatically eliminates a class of client-side token mishandling bugs.
- The OIDC identity token approach for Portal auth (no shared secrets, verified against Google's public JWKS) is a good choice.

**Concerns:**

- **Teacher token minting is the highest-risk element.** The function uses Admin SDK `createCustomToken` to mint a teacher-scoped token. If the function is compromised, an attacker can mint teacher tokens for *any* class, not just the student's class. The doc mentions this as a future migration target, but it should be called out explicitly as a current risk with a mitigation plan. What are the claims on this minted token? Is it scoped to a single `class_hash`, or broader?

- **Service-account-to-Portal-user mapping is dangerously broad.** The Portal maps the function's identity to an actual Portal user account and processes requests "using existing authorization logic." What user is this mapped to? If it's a teacher or admin account, the function effectively has that user's full permissions across *all* Portal operations, not just the three it needs. This should be a purpose-built service account with the minimum required permissions, or the Portal endpoints should be dedicated narrow-scope endpoints that only accept service-identity callers.

- **Student identity in the request body is trust-by-proxy.** The Portal trusts the function to accurately relay `platform_user_id`. If the function is compromised or has a bug, it could relay a different student's ID. Consider whether the Portal should independently verify the student identity (e.g., by accepting a forwarded Firebase token and verifying it).

- **No mention of token expiry or caching for the teacher token.** If the function mints a new teacher token on every invocation, that's wasteful but safe. If it caches tokens, there's a window where a revoked teacher's token could still be in use.

- **Rate limiting section is vague.** "Can be configured" is not a design decision. For a function that sends emails and modifies class membership, the rate limiting strategy should be specified. Per-student? Per-class? What limits?

- **No input validation on `assignmentId`.** The client sends `{ assignmentId }` in the callable payload. The spec doesn't mention validating that the authenticated student actually belongs to this assignment. A student could potentially craft a request with a different assignment ID to trigger completion checks or Portal actions against an assignment they're not enrolled in. The function should cross-reference `assignmentId` against the student's `class_hash` or other claims from their Firebase token.

- **Firestore security rules are a critical unspecified dependency.** The entire security model rests on Firestore security rules correctly enforcing student-level and teacher-level access. But the spec doesn't reference existing rules or specify what new rules are needed. If the rules are too permissive, the two-client approach provides no benefit over just using Admin SDK reads. The spec should either reference the existing rule set or outline the rule requirements (e.g., "student tokens can only read documents where `class_hash` matches and `user_id` matches; teacher tokens can read all student documents within a matching `class_hash`").

- **OIDC identity token audience is not specified.** When the function requests a Google OIDC identity token, it must specify an `audience` claim — typically the target service's URL or a pre-agreed identifier. The Portal must validate that the `aud` claim in the received token matches its expected value. This is a critical part of OIDC security (prevents tokens meant for one service from being replayed against another) and is not mentioned in the spec.

- **Stale token claims.** The student's Firebase JWT contains claims (`class_hash`, `platform_user_id`, etc.) that were set when the Portal originally minted the JWT via `getFirebaseJwt`. If a student's enrollment changes between JWT issuance and button click (e.g., moved to a different class, removed by teacher), the function would operate with stale context. How long do these JWTs live? Is there a refresh mechanism? The function should at minimum validate that the student's enrollment is still current before performing Portal operations.

- **Client-supplied activity structure URL is an SSRF vector.** The spec says the client "optionally includes the activity structure URL as a fallback." This means an authenticated student can send an arbitrary URL that the Cloud Function will fetch server-side. This is a textbook Server-Side Request Forgery risk — an attacker could probe internal GCP metadata endpoints (`http://metadata.google.internal/...`), internal services, or other non-public URLs from the function's network context. If this fallback is kept, the function must strictly validate the URL against a domain allowlist and reject anything that doesn't match expected activity structure URL patterns.

- **Token claims are incompletely enumerated.** The spec lists `platform_user_id`, `class_hash`, `platform_id`, "etc." for the student's custom claims. For a security design document, "etc." is insufficient — the function's logic depends on specific claims for student identification, teacher token scoping, Portal routing, and Firestore path construction. The complete set of claims the function reads and depends on should be listed explicitly, along with which are required vs. optional.

- **Multi-tenancy and Portal routing.** The claims include `platform_id`, suggesting students may come from different Portal instances. If students from different Portals share the same Firebase project, the function needs to route Portal API calls to the correct Portal URL based on `platform_id`. The spec assumes a single Portal, but if multi-tenancy is in scope, the OIDC trust relationship, service account mapping, and Portal URL configuration all become per-tenant concerns.

- **Firestore writes are not addressed in the security model.** The spec describes "Two-client Firestore access" entirely in terms of reads, and states "The function never uses the Admin SDK for Firestore reads or writes." But the function must also WRITE to Firestore — at minimum for idempotency (recording that a student has been processed) and for the balanced assignment (recording which class the student was assigned to, so concurrent invocations can see it). Through which client SDK do these writes happen? The student client presumably can't write assignment results (security rules wouldn't allow it). The teacher client might — but then teacher-scoped security rules need to permit writes, not just reads. If neither client can write what's needed, the "no Admin SDK writes" principle may need to be relaxed, which changes the security posture. This is a significant gap: the write path, the Firestore paths for written data, and the security rules governing those writes should all be specified.

- **OIDC verification should not rely on `email` alone.** For the Portal-side service-identity trust, validating only an `email` claim can be brittle (renames, aliasing) and is broader than necessary. The Portal should validate the full token (signature, `iss`, `aud`, `exp`/`iat`) and bind trust to a stable identity like the service account's subject (`sub`) / unique ID, with `email` as a display or secondary check.

- **Prevent credential leakage via logs/analytics.** The design introduces high-value bearer tokens (Firebase ID tokens in callable requests and Google OIDC tokens to the Portal). The spec should explicitly state that these tokens must never be logged (Cloud Function logs, Portal request logs, error telemetry), and that any diagnostic logging should use correlation IDs instead.

- **Harden the SSRF mitigation beyond domain allowlisting.** If the activity structure URL fallback remains, the function should (at minimum) enforce `https`, disallow redirects, and block private/link-local IP ranges after DNS resolution to reduce redirect/DNS-rebinding bypasses.

- **App Check enforcement needs an explicit decision.** The spec mentions Firebase App Check as a future option, but callable functions support verifying App Check tokens (`context.app`). If this function can send emails/unlock assignments, the spec should decide whether App Check is required in production, and what the behavior is in environments where App Check is not available (e.g., dev/staging).

- **Fail-closed payload and claim validation.** Beyond validating `assignmentId` logically, the function should validate the request shape and types (e.g., `assignmentId` is a non-empty string; optional URL is absent unless allowed) and validate required custom claims are present and correctly typed (`platform_user_id`, `class_hash`, `platform_id`). Missing/invalid values should yield a safe error and no side effects.

- **Least-privilege IAM for token minting.** Since Admin SDK token minting is a known high-risk capability, the function should run under a dedicated service account with minimal IAM roles, and deployments should avoid broad project roles (e.g., Editor/Owner). If feasible, isolate token minting into a separate service/function with tighter controls and auditing.

- **Ensure only the expected Firebase auth population can call the function.** If the Firebase project is shared (or could be shared) across environments/apps, the function should enforce that callers are signed in via the expected provider (e.g., `sign_in_provider == "custom"` and/or a required claim) so arbitrary Firebase users from other contexts can't trigger Portal side effects.

- **Be explicit about what student-controlled inputs can influence side effects.** Even with claim validation, the spec should clearly enumerate which request fields are allowed to affect Portal actions (e.g., only `assignmentId`), and which are strictly optional hints (e.g., activity structure URL) to reduce the risk of "smuggling" new behavior into the function over time.

- **Avoid UID collisions for minted tokens.** If the function mints custom tokens (student or teacher), it should ensure the resulting Firebase `uid` values can't collide with real end-user accounts (e.g., prefix service/minted UIDs like `service:teacher:<id>`), and security rules should key off explicit claims rather than brittle UID patterns.

- **Clarify the canonical user identity.** The design references both Firebase `uid` and custom-claim identifiers like `platform_user_id`. The spec should state which is canonical for auditing/idempotency and ensure a stable mapping (e.g., verify that `platform_user_id` in claims corresponds to the authenticated Firebase user, rather than treating it as an arbitrary string).

- **Constrain outbound Portal targets.** To reduce misconfiguration or SSRF-style issues via config, the function should restrict Portal API calls to an allowlisted base URL per environment/tenant (and avoid following redirects) so it can't be pointed at arbitrary hosts.

## 2. Backend / Cloud Functions Developer

**Strengths:**
- The callable function pattern is well-suited — it handles auth, CORS, and serialization automatically.
- The end-to-end flow is clear and well-sequenced.

**Concerns:**

- **Concurrent balanced-assignment race condition.** Consider the scenario where a teacher tells 30 students to click the button at the end of class. Multiple function invocations run concurrently, each reads the current class compositions from Firestore, each sees the same distribution, and each independently decides to assign its student to the same "underrepresented" class — defeating the balancing entirely. This is not the same as the double-click idempotency issue (which is per-student). This is a cross-student race condition on the shared state that drives the algorithm. The spec needs to address how concurrent assignments are serialized. Options include: a Firestore transaction with an optimistic lock on a class-composition counter, a distributed lock or queue so assignments are processed one at a time, or an "assign then rebalance" approach that accepts temporary imbalance. Without this, the algorithm's correctness is not guaranteed under real-world usage patterns.

- **Student-scoped client SDK initialization may be more complex than described.** The spec says the student client is "initialized with the student's token from the callable context." However, Firebase Callable Functions provide `context.auth` as decoded claims, not a raw JWT suitable for `signInWithCustomToken`. To initialize a client SDK instance with the student's identity, the function would likely need to either: extract the raw ID token from `context.rawRequest` headers and find a way to use it with the client SDK (ID tokens are not custom tokens — `signInWithCustomToken` won't accept them), or use the Admin SDK to mint a *new* custom token with the student's claims, then call `signInWithCustomToken` on the client SDK. If the second approach is needed, then *both* the student and teacher paths require Admin SDK token minting, not just the teacher path as the spec implies. This changes the implementation picture and should be clarified.

- **Two Firestore client SDK instances in a Cloud Function is unusual.** The doc says the function initializes a separate client SDK instance with the teacher token. In a Node.js Cloud Functions environment, the client SDK (`firebase/app` + `firebase/firestore`) is designed for browser/mobile use. Using it server-side requires careful handling — it maintains persistent connections, caches, and listeners. Initializing multiple instances per invocation could cause memory leaks or connection pool exhaustion at scale. The doc should address whether this is per-invocation or pooled, and what cleanup looks like.

- **Cold start latency and Firestore read volume.** Initializing two SDK instances, minting a custom token, calling `signInWithCustomToken`, and then making Firestore reads — all before the Portal calls — could push cold start times high. The read volume also matters: "the student's answers" could be dozens of documents (one per question), and "cross-student demographic data" for balanced assignment could mean reading answers from every student in the class (e.g., 30 students x 4 demographic variables = 120+ document reads). Combined with the activity structure, token operations, and three Portal API calls, a single invocation could involve hundreds of Firestore reads and significant latency. Has the total latency and document read count been estimated?

- **The "activity structure URL as a fallback"** is mentioned in passing. If the activity structure isn't in Firestore, does the function fetch it from a URL? That introduces a new external dependency, potential SSRF surface, and caching questions. This deserves more detail.

- **Idempotency** says the function "checks whether the student has already been assigned before repeating Portal operations." Where is this state stored? Firestore? Is the check-then-act atomic, or is there a race condition if a student double-clicks quickly? Additionally, the write timing creates a classic exactly-once problem: if the function records "student processed" BEFORE making Portal calls and a Portal call then fails, the student is marked as done but wasn't fully processed (and retries are blocked). If it records AFTER all Portal calls succeed, a crash or timeout between the last Portal call and the Firestore write means the student isn't marked as done, and a retry could duplicate Portal operations. The spec should specify the write ordering and how partial failure interacts with the idempotency record.

- **Error handling** acknowledges the partial-state problem but doesn't commit to a strategy. For a function that does email + unlock + class-add, the ordering matters. If email succeeds but class-add fails, what's the student's experience? This needs a decision, not "options."

- **Completion threshold configuration.** The spec uses "e.g., 90%" as an example threshold but doesn't specify where this value is configured. Is it per-activity? Per-assignment? Hardcoded in the function? Stored in Firestore as part of the activity structure? As authored content? This is a key business rule that drives the function's primary decision and should be specified.

- **Class ownership and target class discovery.** The spec says the function adds the student to "another class owned by the same teacher." How does the function discover which classes the teacher owns and which one to target? Is this configuration stored in Firestore (readable with the teacher token), passed as part of the authored interactive config, or queried from the Portal? This data flow is missing from the end-to-end sequence.

- **Cloud Functions generation is not specified.** 1st gen vs 2nd gen Cloud Functions differ significantly in ways that affect this design: timeout limits (60s default vs 540s), concurrency model (1 request per instance vs configurable concurrency per instance), and minimum instance support (for reducing cold starts). The concurrency model matters particularly for the two-client SDK approach — if 2nd gen with concurrency > 1, multiple requests could share a function instance, and the client SDK instances initialized for one request could interfere with another. The spec should specify which generation is intended.

- **Cloud Functions timeout risk.** The end-to-end flow involves many sequential operations: SDK initialization, token minting, `signInWithCustomToken`, multiple Firestore reads, OIDC token request, and three Portal API calls. With cold starts, this could exceed the default timeout (60s for 1st gen). The spec should estimate the expected latency budget and confirm the timeout is sufficient, or specify a higher timeout configuration.

- **Define the completion boundary ("when" completion is evaluated).** If students can continue answering while the button is clicked, the function needs a clear rule for which answers count (latest attempt? last-saved? submitted state?) and how it handles in-flight saves. Without a defined boundary, students may see inconsistent "incomplete" responses depending on timing.

- **Consider using a single Portal operation for atomicity.** The function currently performs multiple Portal side effects (email + unlock + class add). A single Portal endpoint like "advance student" (with its own internal transaction/ordering) can simplify partial failure handling and reduce the need for distributed exactly-once semantics.

- **Specify per-call timeouts and retry policy for external requests.** Portal API calls (and any activity-structure fetch) should use explicit deadlines, bounded retries, and clear retryability rules (e.g., retry on 5xx/timeouts; do not retry on 4xx). Otherwise, a single hung request can burn the full Cloud Function timeout and leave ambiguous outcomes.

- **Define how balanced assignment reads are bounded.** If class sizes grow or demographic variables expand, cross-student reads can become expensive. The spec should call out a bounded data model (e.g., maintain precomputed counters per class in Firestore) rather than scanning student answer docs at click time.

- **Assignment-to-activity data model bridge.** The function receives an `assignmentId` (a Portal concept) but reads an "activity structure" and "student answers" from Firestore. How does the function map from an assignment ID to the correct Firestore document paths? Is there a known path convention, a lookup table, or does the assignment ID appear directly in Firestore paths? This mapping is fundamental to the function's operation but isn't described.

- **Email recipient is ambiguous.** Step 2 of "What the first remote function does" says "send an email to a portal user" — which user? The student? The teacher? A project administrator? The recipient matters for the Portal endpoint design, the required permissions, and privacy implications.

- **Where does `teacherId` come from?** The `getTeacherToken(classId, teacherId)` interface requires a teacher ID, but the student's Firebase JWT likely only contains `class_hash`, not the teacher's identity. How does the function determine the teacher ID for the student's class? A Firestore lookup? A Portal API call? A claim that isn't listed? This is a concrete data flow gap in the teacher token minting path.

- **Activity structure parsing implies deep coupling to Activity Player's data model.** To evaluate completion, the function must parse the activity structure to identify which items are answerable questions, then match those against student answer documents to calculate a percentage. This requires the function to understand the Activity Player's internal schema — pages, sections, question types, embeddable vs. non-embeddable items. If the Activity Player's structure format evolves, the function's parsing logic must be updated in lockstep. The spec should reference the activity structure schema or acknowledge this coupling as a maintenance risk.

- **"LARA Firebase JWT" terminology may be outdated.** Line 39 refers to "custom claims from the LARA Firebase JWT." LARA is the legacy system; Activity Player is the current runtime. If the Portal's `getFirebaseJwt` endpoint was originally built for LARA and is now used by Activity Player, this should be clarified — otherwise readers may assume a LARA-specific dependency that doesn't exist, or miss that the JWT format may have evolved.

- **Callable HTTP requests can still be retried / duplicated.** Even if the UI disables the button, network retries, refreshes, or client bugs can re-invoke the callable. The spec should treat the function as at-least-once and require that *each* side effect has an idempotency key (function-side and Portal-side), not just a single "already assigned" check.

- **Serialization strategy should include a failure mode.** If a lock/transaction/queue is used to serialize balanced assignment, the spec should define what happens when it can't be acquired (timeout/backoff/fallback to random) and how long a student should wait before seeing a deterministic response.

## 3. Frontend / Interactive Developer

**Strengths:**
- The client-side integration is simple — `httpsCallable` with an assignment ID, display the returned message. Good separation of concerns.

**Concerns:**

- **No loading/progress UX is mentioned.** Steps 4–11 in the end-to-end flow could take several seconds (Firestore reads, token minting, multiple Portal API calls). The spec should note that the interactive needs a loading state, and potentially a timeout with a user-friendly message.

- **Retry behavior is unspecified.** If the function returns an error, can the student retry? Is the button disabled after first click? After success? The interactive's button state machine is important for UX and ties directly to the idempotency requirement.

- **The response contract is loosely defined.** The spec shows `{ status: "incomplete", message: "..." }` and `{ status: "success", message: "..." }`. What about `"error"`, `"already_completed"`, `"partial_failure"`? A defined set of status codes would help the frontend handle cases appropriately (e.g., show a retry button for transient errors, show a contact-teacher message for permanent failures).

- **Report mode and authoring mode behavior are unspecified.** The button interactive will appear in teacher reports (report mode) and in the authoring environment. What does the button show in report mode — the last status returned? Is it clickable? In authoring mode, can the author preview the button without triggering real Portal operations? These are important for the interactive's full lifecycle beyond student runtime.

- **Firebase auth session is assumed but not guaranteed.** The spec says "the interactive already has a Firebase auth session." But what if it doesn't — if `getFirebaseJwt` failed, if the session expired and wasn't refreshed, or if the interactive is loaded in a context without Portal auth (e.g., a preview or standalone embed)? The spec should address what happens when the button is clicked without a valid Firebase session, and whether the interactive should verify the session before enabling the button.

- **No confirmation before irreversible actions.** Clicking the button triggers irreversible operations — an email is sent, class membership changes, and an assignment is unlocked. There's no mention of a confirmation step or pre-click messaging explaining what will happen. A student who accidentally clicks (or doesn't understand the consequences) would trigger all of these operations with no way to undo. Consider whether a confirmation dialog or explanatory text is needed before the function call.

- **Accessibility and messaging requirements are not mentioned.** Since this is a single critical button with potentially long-running side effects, the spec should call out basic accessibility expectations (disabled/loading state announced, error message announced, keyboard activation), and minimum copy requirements for explaining outcomes and next steps.

- **Offline / network-failure UX is unspecified.** The button triggers a server action; the spec should define what the interactive does when the network is offline or the callable fails due to connectivity (e.g., show a retry affordance and preserve the last known state).

- **Persisting and rehydrating the last result is unspecified.** If the page reloads (or the student navigates away/back), the interactive should know whether the action already succeeded and reflect that state (e.g., disable button and show the last success message) rather than encouraging repeated clicks.

## 4. DevOps / Infrastructure

**Concerns:**

- **Service account setup is mentioned but not specified.** "e.g., `button-function@your-project.iam.gserviceaccount.com`" — is this the default Cloud Functions service account, or a dedicated one? It should be a dedicated service account with minimal IAM roles. If it's the default compute service account, it likely has far more permissions than needed.

- **No mention of environment configuration.** The function needs to know: which Portal URL to call, which Portal user it maps to, Firestore project config, etc. Are these environment variables? Secret Manager? Runtime config?

- **No deployment or versioning strategy.** If the function's behavior needs to change (e.g., new threshold, different email template), how is it deployed? Is it tied to the interactive's deploy cycle or independent?

- **No monitoring or observability plan.** For a function that sends emails, modifies class membership, and reads sensitive student data, operational visibility is essential. Consider: structured logging of each function invocation (student ID, assignment ID, outcome, duration) without logging sensitive demographic data; metrics on success/failure rates, latency percentiles, and Portal API error rates; alerts for anomalies (sudden spike in invocations, elevated error rates, unusually high latency).

- **Network egress / static IP for Portal calls.** Cloud Functions don't have static egress IPs by default. If the Portal has IP allowlisting, WAF rules, or firewall restrictions, the function's outbound IP will be unpredictable unless a VPC connector with Cloud NAT is configured. This could be a deployment blocker if the Portal restricts inbound traffic by IP. The spec should confirm whether the Portal is publicly accessible or whether network configuration is needed.

- **Cloud Functions concurrency settings matter for correctness.** If 2nd gen functions are used, default concurrency may allow multiple requests per instance. If any stateful client SDK instances or caches are shared globally, concurrency > 1 can cause cross-request interference. The spec should specify whether concurrency is limited to 1 or how per-request isolation is guaranteed.

- **Traceability across systems is not addressed.** For incident response and QA, it helps to propagate a single correlation ID from the callable request through Firestore reads/writes and Portal API calls (and back in responses) without logging PII.

- **Add an operational kill switch.** Given the irreversible operations, the deployment should support quickly disabling side effects (email/unlock/class-add) via an environment flag/config so incidents can be contained without a full redeploy.

- **Define alerting for high-impact actions.** Monitoring should include action-specific metrics (emails sent, unlocks performed, class-joins) and alerts for anomalous spikes, not just generic error rate/latency.

- **Region/data residency and latency are not specified.** The spec should state the Cloud Function region and ensure it aligns with Firestore and the Portal deployment to avoid avoidable latency and potential data residency concerns.

- **Capacity / quota planning is missing.** Burst usage plus cross-student reads can hit Firestore read quotas and Portal rate limits. The spec should define `maxInstances`, concurrency, and budget/quotas to prevent cost spikes and cascading failures.

- **Environment isolation is not specified.** The spec should call out that dev/staging/prod use separate service accounts, separate Portal hosts, and ideally separate Firebase projects (or at minimum strict config separation) so a staging function can't act on production data.

## 5. Portal API Developer

**Concerns:**

- **Three new Portal API endpoints are implied** (send email, unlock assignment, add student to class) but not specified. What are the routes, request shapes, and auth requirements? Are these new endpoints, or existing ones being reused?

- **The OIDC verification middleware is non-trivial.** The Portal needs to: fetch Google's JWKS, verify the JWT signature, check the `email` claim, map it to a user, and set the current user context. This is a new auth pathway for the Portal — it should be treated as a significant Portal change, not "minimal Portal changes."

- **"Maps to a Portal user account"** — does this user need to exist in every Portal environment (staging, production, demo)? How is it provisioned? What happens if the mapped user is deactivated?

- **The function-to-Portal API contract is undefined.** The spec says the function sends "the student's `platform_user_id` and class/assignment context" but doesn't define the specific fields, request format, or expected responses for each of the three Portal operations. Since the function and Portal are developed by different teams, this contract should be explicit — it's part of the auth design because the Portal needs to know what to authorize and what context to expect.

- **Idempotency should be supported by the Portal APIs as well.** Even if the Cloud Function tracks "processed" state, retries/timeouts can still lead to duplicate Portal calls. The Portal endpoints should accept an idempotency key (e.g., derived from assignment + student + action) and guarantee safe retries.

- **JWKS caching / clock skew / key rotation behavior is unspecified.** The OIDC middleware should define how it caches Google JWKS, how it handles fetch failures, and what clock-skew tolerance it allows for `iat`/`exp` (and whether `nbf` is checked), to avoid intermittent auth failures.

- **Portal should validate the student/assignment/class relationship, not just accept it.** Even with a trusted service identity, the Portal endpoints should treat `platform_user_id` and `assignmentId` as inputs to be authorized (e.g., verify the student belongs to the assignment/class and the teacher owns the target classes), rather than assuming the function always provides correct context.

- **Limit Portal endpoint scope to the minimum viable action.** Instead of a generic "send email" capability, the Portal should consider a narrowly-scoped endpoint (or template allowlist) that only sends the specific message needed for this workflow, to reduce blast radius if the function is compromised.

- **Response content should be explicitly constrained.** Portal endpoints and the function should return only minimal status data needed by the student UI. Any free-form message generation should avoid including identifiers, roster sizes, or other potentially sensitive data.

## 6. QA / Test Engineer

**Concerns:**

- **No testability strategy.** How do you test this end-to-end in a staging environment? The function depends on: a real Firebase auth session, Firestore data, Portal APIs, and a service account identity. Integration testing will need a plan.

- **The balanced random assignment** is the most complex piece of logic but gets the least specification. What algorithm? How is "balanced" defined? What happens when demographic data is incomplete? This alone could be its own spec section.

- **Edge cases not addressed:**
  - Student's Firebase session expires mid-flow
  - Student is removed from class between completion check and class assignment
  - Portal is down — does the function retry? How many times?
  - Student has already completed and clicks again (idempotency is mentioned but the test cases aren't)
  - No target classes are configured, or all target classes have reached capacity
  - Demographic data is missing for some students — does the algorithm skip those variables, fall back to random, or fail?

- **No rollback or undo mechanism.** If the function completes successfully but the outcome is wrong (algorithm bug, incomplete demographic data, misconfigured target class), there's no described mechanism to reverse the Portal operations. Emails can't be unsent, but class membership and assignment unlocks could potentially be reversed. The spec should address whether an admin/teacher undo capability is needed, or whether manual Portal intervention is the expected recovery path.

- **No teacher/admin visibility or audit trail.** When the function assigns students to new classes, sends emails, and unlocks assignments, there's no mention of how teachers or admins can see what happened. If 30 students get processed, the teacher may want a summary of who was assigned where, whether anyone failed, and whether the balanced distribution looks correct. An audit log or dashboard would also help diagnose issues in production.

- **Load/soak testing for peak classroom usage is not described.** The design implies bursty usage (entire class clicking within minutes). The spec should call out a performance test plan (concurrency, Firestore read quotas, Portal rate limits) and acceptance criteria (e.g., p95 latency and failure rate targets).

- **Include explicit concurrency tests for the balancing mechanism.** Beyond load tests, QA should include a targeted test that simulates N parallel invocations and asserts the distribution remains within acceptable bounds, validating the chosen locking/transaction approach.

- **Add tests for auth hardening and operational toggles.** QA should include cases for: App Check required vs optional behavior, OIDC key rotation/clock skew handling, Portal idempotency key semantics under retries/timeouts, and the kill switch disabling side effects while still returning safe student messaging.

## 7. Student Data Privacy (FERPA / COPPA)

**Concerns:**

- **Demographic data (grade, sex, race) is read by the function** for balanced assignment. This is sensitive PII under FERPA. The spec should explicitly address:
  - Where this data is stored and who can access it
  - Whether the function logs or persists any of this data beyond the assignment decision
  - Whether the balanced assignment result reveals demographic information indirectly (e.g., if a class is labeled "Group A" and it's all one demographic)

- **Email sending** — what email is sent, to whom, and does it contain student PII? Is the content templated on the Portal side or composed by the function?

- **Cross-student reads** — the teacher-scoped token lets the function read other students' demographic answers within the class. This is necessary for the algorithm but should be logged/auditable.

- **Use of protected classes for assignment may require explicit policy/consent.** Using race/sex (and similar demographic attributes) to influence class assignment can be legally and ethically sensitive depending on context. The spec should note the policy basis (why these variables are used, who approves), whether students can opt out, and how the system behaves when demographic data is missing/refused.

- **Retention/deletion of assignment artifacts is unspecified.** If the function writes idempotency records, audit logs, or assignment outcomes, the spec should note retention duration, who can access them, and how deletion requests (or end-of-term cleanup) are handled.

- **Student-facing responses must avoid leaking cross-student data.** Since the function reads other students' demographics for balancing, the spec should explicitly forbid returning any content that could reveal class composition or other students' info in the message shown to a student.

- **Fairness and bias evaluation plan is not mentioned.** Since the workflow uses demographic attributes, the spec should call out at least a basic evaluation plan (e.g., periodic checks that outcomes don't systematically disadvantage groups) and who owns that review.

## 8. Architecture / Design Alternatives

**Concerns:**

- **Why a Cloud Function instead of a Portal endpoint?** Most of the elevated operations (send email, unlock assignment, add to class) are Portal API calls. An alternative would be to have the Portal itself orchestrate the entire flow: receive a "check and advance" request, read student data from Firestore via a service account or forwarded token, evaluate completion, and perform Portal operations natively. This would eliminate the OIDC auth layer, the service-account-to-user mapping, and much of the cross-system complexity. The spec should explain why the Cloud Function approach was chosen over Portal-side orchestration — presumably because the completion-checking logic is tightly coupled to the Firestore data model and it's better to keep that close to Firebase. Making this rationale explicit would strengthen the document.

- **Function scope and coupling.** One function (`checkCompletionAndAdvance`) performs five distinct operations: completion checking, email sending, assignment unlocking, class membership, and balanced random assignment. This tight coupling means: you can't retry just the email if it fails, you can't test the balanced assignment logic in isolation without triggering Portal calls, and any change to one step requires redeploying the entire function. Consider whether the spec should discuss decomposition (e.g., a completion-check function that triggers a separate assignment-and-notify function), or explicitly justify the monolithic approach (simpler to deploy, fewer moving parts, atomic from the student's perspective).

- **Extensibility for future functions.** The heading "What the first remote function does" implies more Cloud Functions will follow. But the auth design doesn't discuss whether this is a reusable pattern. Will future functions also use callable functions, the two-client Firestore approach, OIDC for Portal auth, and the same service account? If this is intended as a template, it should say so and identify which pieces are reusable vs. specific to this function. If each function will have its own auth design, the spec should note that.

- **Coupling to Activity Player's data model.** The function must parse activity structures and match student answers — schemas owned by the Activity Player. This creates a cross-system dependency where changes to the Activity Player's data format could break the Cloud Function. The spec should acknowledge this coupling and consider whether the completion-evaluation logic should live in a shared library, or whether the Activity Player should expose a "completion status" API that the function consumes instead of reimplementing the evaluation.

- **Threat model / trust boundaries are implicit.** This doc is primarily auth/identity design; adding a lightweight trust-boundary diagram (interactive ↔ Firebase ↔ function ↔ Firestore ↔ Portal) would clarify which inputs are trusted, where validation happens, and where tokens exist.

- **API/contract versioning is unspecified.** The callable request/response and the function-to-Portal endpoints should include a versioning strategy (explicit `version` field or URL versioning) so the interactive, function, and Portal can be deployed independently without breaking older clients.

## Summary of Recommendations

| Priority | Item | Section |
|----------|------|---------|
| **High** | Define the teacher token's exact claims and scope — ensure it can't be used beyond the target class | Security |
| **High** | Replace Portal-user-mapping with narrow-scope service endpoints or a dedicated service role | Security |
| **High** | Mitigate SSRF risk from client-supplied activity structure URL (domain allowlist or remove fallback) | Security |
| **High** | Address concurrent balanced-assignment race condition (cross-student serialization) | Backend |
| **High** | Commit to an error handling strategy (ordering, partial failure behavior) | Backend |
| **High** | Specify the idempotency mechanism (where state is stored, atomicity) | Backend |
| **High** | Clarify student-scoped client SDK initialization mechanism (may require Admin SDK minting for both paths) | Backend |
| **High** | Specify the Firestore write path — which client writes idempotency/assignment records, and under what security rules? | Security |
| **High** | Ensure Portal OIDC verification binds to stable service identity (`sub`) and validates full JWT (`iss`/`aud`/expiry); avoid trusting `email` alone | Security / Portal |
| **Medium** | Enumerate all token claims the function depends on (replace "etc." with a complete list) | Security |
| **Medium** | Address multi-tenancy — does `platform_id` require routing to different Portal instances? | Security |
| **Medium** | Validate `assignmentId` against the student's token claims | Security |
| **Medium** | Specify or reference required Firestore security rules | Security |
| **Medium** | Add OIDC `audience` claim to the Portal auth flow | Security |
| **Medium** | Address stale token claims and JWT lifetime | Security |
| **Medium** | Decide whether Firebase App Check is required; specify enforcement and environment behavior | Security |
| **Medium** | Add fail-closed schema/type validation for callable payload and required custom claims | Security |
| **Medium** | Ensure callable function restricts callers to the expected auth provider/claims (e.g., custom-token users only) | Security |
| **Medium** | Prevent UID collisions for minted/custom tokens (use a dedicated namespace/prefix) | Security |
| **Medium** | Clarify canonical identity (Firebase `uid` vs `platform_user_id`) and verify their mapping | Security |
| **Medium** | Define completion semantics (latest answers vs submission boundary) to avoid timing-dependent results | Backend |
| **Medium** | Specify Cloud Functions generation (1st vs 2nd gen) and confirm timeout budget | Backend |
| **Medium** | Describe the assignment-to-activity data model bridge (assignment ID → Firestore paths) | Backend |
| **Medium** | Clarify where `teacherId` comes from for teacher token minting | Backend |
| **Medium** | Address the client SDK server-side usage pattern (lifecycle, cleanup, memory) | Backend |
| **Medium** | Specify explicit timeouts and retryability rules for Portal calls and any external fetches | Backend |
| **Medium** | Specify completion threshold configuration (where stored, who sets it) | Backend |
| **Medium** | Describe target class discovery mechanism | Backend |
| **Medium** | Clarify the email recipient ("a portal user" — which user?) | Backend |
| **Medium** | Define the response contract (all status codes, when retry is appropriate) | Frontend |
| **Medium** | Address Firebase auth session unavailability (expired, missing, preview contexts) | Frontend |
| **Medium** | Add confirmation step or pre-click messaging before irreversible actions | Frontend |
| **Medium** | Specify report mode and authoring mode behavior for the button interactive | Frontend |
| **Medium** | Specify rate limiting strategy concretely | Security |
| **Medium** | Define the function-to-Portal API contract (fields, formats, responses per operation) | Portal |
| **Medium** | Add a section on the balanced assignment algorithm | QA / Spec completeness |
| **Medium** | Address demographic data handling and logging for FERPA | Privacy |
| **Medium** | Add Portal API idempotency keys or a single atomic "advance student" endpoint to prevent duplicate side effects on retries | Portal |
| **Medium** | Specify Portal OIDC JWKS caching/rotation and clock-skew handling | Portal |
| **Medium** | Require Portal endpoints to authorize student/assignment/class relationships (don't trust request body context blindly) | Portal |
| **Medium** | Add narrow-scope Portal endpoints (or template allowlist) for email/side effects to reduce blast radius | Portal |
| **Medium** | Explain why Cloud Function orchestration was chosen over Portal-side orchestration | Architecture |
| **Medium** | Address Activity Player data model coupling (shared library or completion API) | Architecture |
| **Low** | Consider decomposing the monolithic function or justify the single-function approach | Architecture |
| **Low** | Discuss extensibility — is this auth pattern a template for future functions? | Architecture |
| **Low** | Add testability / integration testing strategy | QA |
| **Low** | Add teacher/admin visibility and audit trail for function outcomes | QA |
| **Low** | Add monitoring, logging, and observability plan | DevOps |
| **Low** | Add cross-system correlation IDs for tracing without logging PII | DevOps |
| **Low** | Add an operational kill switch to disable side effects quickly | DevOps |
| **Low** | Specify function region and align it with Firestore/Portal to reduce latency and clarify data residency | DevOps |
| **Low** | Add capacity/quota planning (max instances, concurrency, Portal rate limits, Firestore quotas) | DevOps |
| **Low** | Specify environment isolation (separate service accounts/hosts/projects or strict config separation) | DevOps |
| **Low** | Confirm network egress requirements for Portal calls (static IP, VPC connector) | DevOps |
| **Low** | Add a lightweight trust-boundary/threat-model diagram for the end-to-end flow | Architecture |
| **Low** | Add API/contract versioning strategy for callable and Portal endpoints | Architecture |
| **Low** | Clarify "LARA Firebase JWT" terminology (LARA vs Activity Player) | Spec clarity |
| **Low** | Cross-reference or create a companion UI/behavior spec for the button interactive | Spec clarity |
| **Low** | Address rollback / undo for incorrect outcomes | QA |
