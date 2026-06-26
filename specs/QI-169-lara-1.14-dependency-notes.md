# QI-169: Adopting lara-interactive-api 1.14.0-pre.0 — dependency investigation

**Status:** branch still red on CI, but the override mechanism is now **understood** (see "Overrides: empirically verified behavior"). The remaining blocker for the general solution is the unrelated `react-dnd-preview` ERESOLVE that prevents any clean from-scratch `npm install`.
**Purpose:** record every approach tried to get the `1.14.0-pre.0` prerelease working across the monorepo, and why each was rejected or failed, so we stop going in circles.

---

## Why we need it

QI-169 uses focus-protocol APIs added in lara **1.14.0** (`addFocusEnterListener`, `removeFocusEnterListener`, `sendFocusExit`, and `ISupportedFeatures.focusProtocol`). Only a **prerelease**, `1.14.0-pre.0`, is published so far. `packages/helpers` (where the `useFocusProtocol` hook + `BaseQuestionApp` wiring live) and `packages/image-question` both need it.

## Root cause of the trouble

1. **`@concord-consortium/dynamic-text` declares lara as a `peerDependency` `>=1.8.0`.**
2. Under semver, a **prerelease is excluded** from a range that doesn't itself name one: `1.14.0-pre.0` does **not** satisfy `>=1.8.0` (`semver.satisfies('1.14.0-pre.0','>=1.8.0') === false`).
3. So whenever any package uses `1.14.0-pre.0`, npm **also** installs a `1.13.0` copy to satisfy dynamic-text's peer. Two lara versions coexist in the tree.
4. lara has a runtime **singleton guard** — "LARA Interactive API is loaded multiple times … Already imported version: vX, trying to load: vY" — that throws when two physical copies load in one process.
5. Jest loads the **real** lara module (it isn't always mocked, e.g. via `DynamicText` / `getClient`). So **any package whose test loads both a `1.13.0` (through dynamic-text) and a `1.14.0-pre.0` (through helpers or its own dep) trips the guard** and the suite fails to run.
6. **This is invisible until Jest runs each package's tests.** Different packages fail under different install layouts / Node versions, which is why fixes that made one package pass moved the failure to another.

## Environmental factors that made fixes fragile

- **Pre-existing `react-dnd-preview` peer conflict** (`react@^16.13.1` required by `react-dnd-preview@6.0.2` vs `react@^17` in `drag-and-drop`). A clean full `npm install` aborts with `ERESOLVE`. The repo only installs cleanly via the **committed `package-lock.json` + `npm ci`** (which CI uses). This makes regenerating the lockfile risky.
- **macOS (local) vs Linux (CI)** differ in npm hoisting and symlink-realpath resolution. A fix could pass locally and fail on CI.
- **Node version.** CI ran Node **16**; local is **22/24**. Node 16 tripped the guard in image-question even with the robust mapper; Node 22/24 did not.

---

## Approaches tried

### 1. yalc local link (initial dev approach)
- **What:** `npx yalc add @concord-consortium/lara-interactive-api` in helpers + image-question, pointing at the locally-published 1.14.0 build.
- **Result:** worked for local dev.
- **Rejected because:** `file:.yalc/...` references can't be committed/merged; CI (`npm ci`) can't resolve them without the yalc store. This was the original "merge gate."

### 2. Minimal swap + hardcoded jest mapper + webpack alias *(currently committed)*
- **What:** helpers + image-question → published `1.14.0-pre.0`; other 21 packages stay `1.13.0`. Dedupe lara inside image-question only, via:
  - jest `moduleNameMapper`: `^@concord-consortium/lara-interactive-api$` → `<rootDir>node_modules/@concord-consortium/lara-interactive-api`
  - webpack `resolve.alias` using `require.resolve(...)`.
- **Result:** passed locally (macOS, Node 24, `npm install`). **Failed on CI:** image-question `app.test.tsx` — "loaded multiple times."
- **Why it failed:** the hardcoded `<rootDir>node_modules/...` path is layout/OS-dependent; on CI's Linux hoist + symlink-realpath it did not resolve to the same module identity that helpers-originated imports resolved to, so dedup silently failed.

### 3. `require.resolve` jest mapper via `jest.config.js` *(currently committed, commit `ce0911d`)*
- **What:** moved image-question's jest config from `package.json` to `jest.config.js` so the lara mapper could use `require.resolve('@concord-consortium/lara-interactive-api')` (canonical realpath, mirroring the webpack alias).
- **Result:** still **failed on CI under Node 16** — image-question "loaded multiple times."
- **Why:** on Node 16 the dedup still didn't hold (module-resolution behavior differs from Node 22/24). Passed locally on both Node 16 and 24, so it could not be reproduced locally.

### 4. Bump CI to Node 22 + `setup-node`/`checkout` actions to v5 *(currently committed, commit `c1023a2`)*
- **What:** `.github/workflows/ci.yml` Node `16` → `22`; `actions/checkout@v1,@v2` → `@v5`; `actions/setup-node@v1,@v2` → `@v5`. Rationale: lara-typescript was upgraded to Node 22; we run Node 24 locally without issue.
- **Result:**
  - First run: transient "runner received a shutdown signal" mid-build (not a real failure; cleared on rerun).
  - Rerun: build passed, **image-question now PASSED** (Node 22 + `require.resolve` fixed it), but the failure **moved to `drawing-tool`**: "Already imported version: v1.13.0, trying to load: v1.14.0-pre.0" (1 of its 10 suites).
- **Conclusion:** Node 22 fixes the image-question case but does not address the underlying two-version problem; it just surfaces in a different package. (The Node 22 / actions-v5 bump is still a reasonable modernization to keep regardless.)

### 5. Uniform bump: all 23 workspace packages → `1.14.0-pre.0` (no overrides)
- **What:** set every workspace package's lara dep to `1.14.0-pre.0`, expecting npm to dedupe to one copy.
- **Result:** npm produced **root `1.13.0`** (still pulled by dynamic-text's peer) **+ a nested `1.14.0-pre.0` in every package**. `drawing-tool` tests **failed on Node 24 locally** with the same "v1.13.0 vs v1.14.0-pre.0" multi-load.
- **Why:** uniform versions don't help while dynamic-text's peer keeps a `1.13.0` in the tree; any test loading dynamic-text (→1.13.0) plus a 1.14.0-pre.0 still trips the guard.

### 6. Uniform bump + root npm `overrides`
- **What:** added to root `package.json`:
  ```json
  "overrides": { "@concord-consortium/lara-interactive-api": "1.14.0-pre.0" }
  ```
  to force dynamic-text's peer copy to `1.14.0-pre.0` (which would leave a single version → single hoisted copy).
- **Original (mistaken) conclusion:** "npm (11.3.0) never applied the override — `grep -c overrides package-lock.json` = 0 across incremental `npm install`, after removing `node_modules/.package-lock.json`, and after removing the root lockfile."
- **What's actually true (verified 2026-06-26 in an isolated repro — see "Overrides: empirically verified behavior"):** the override **does** work, but only on a **from-scratch resolution**. The three observations above were red herrings:
  1. `grep -c overrides` is the **wrong diagnostic** — a *successful* override writes **no** `overrides` key to `package-lock.json`, so the count stays 0 even when it works. The real signal is the number/version of physical lara copies.
  2. Incremental installs and `--package-lock-only` **reuse the locked `1.13.0`** and never reprocess the override (an existing satisfiable lockfile short-circuits to "up to date").
  3. The one attempt that would have applied it — deleting the root lockfile — **aborts on the unrelated `react-dnd-preview` ERESOLVE** before resolution completes, so nothing is written. That failure was misattributed to overrides.
- **Status:** **explained and viable.** A clean `npm install` with the root override collapses the tree to a single `1.14.0-pre.0` copy; `npm ci` then reproduces it. The only blocker to baking it into the committed lockfile is getting one from-scratch resolve to succeed past the react-dnd ERESOLVE.

### 7. `npm install --legacy-peer-deps` full lockfile regen
- **What:** delete `package-lock.json`, then `npm install --legacy-peer-deps` (ignores all peer deps → dynamic-text's `>=1.8.0` ignored → no `1.13.0` → single `1.14.0-pre.0`).
- **Result:** **did** produce a single `1.14.0-pre.0` copy, **but** regenerated the entire lockfile (~**+12k / −33k lines**), shifting many unrelated transitive deps — including a newer **`parse5`** that needs `node:stream`, which broke the (old) Jest runtime (`ENOENT: node:stream`). Tests couldn't even load.
- **Rejected because:** the lockfile blast radius is unacceptable and it broke the test runtime. (This is the "legacy-peer-deps" option the team already ruled out for the volume of unrelated `package-lock.json` changes.)

---

## Overrides: empirically verified behavior (2026-06-26)

Tested in an isolated `/tmp` repro that mirrors this repo's structure (a workspace package depending on `@concord-consortium/dynamic-text`, whose lara peer is `>=1.8.0`, plus workspace packages wanting `1.14.0-pre.0`) using the **real** published packages, on npm **11.3.0** / Node **24**. The repro deliberately excludes this repo's `react-dnd-preview` conflict so override resolution could be observed cleanly.

### Results by install mode

| Install mode | Override at root? | node_modules result |
| --- | --- | --- |
| **Fresh** (no lockfile) | no | **2 copies** — `1.13.0` hoisted (via dynamic-text peer) + `1.14.0-pre.0` nested |
| **Fresh** (no lockfile) | yes | **1 copy: `1.14.0-pre.0`** ✓ |
| **Incremental** (existing 2-copy lockfile) | yes | **1 copy but WRONG — `1.13.0`** (reuses locked version) |
| **`npm install --package-lock-only`** (existing lockfile) | yes | **no change** — reports "up to date", override never processed |
| **`npm ci`** (from an override-baked lockfile) | (baked) | **1 copy: `1.14.0-pre.0`** ✓ reproduces faithfully |

### What this means

1. **The override is a resolution-layer rewrite, not a version bump.** It intercepts *every* request for `lara-interactive-api` in the tree — direct deps, transitive deps, **and peer-dependency slots** — and substitutes the override version. Verified: a package that *explicitly declares* `1.13.0` still resolved to `1.14.0-pre.0`. The package.json declarations are preserved as cosmetic records in the lockfile but no longer drive resolution.
2. **Per-package versions become irrelevant once a working override is present.** Bumping all 23 packages to `1.14.0-pre.0` vs. leaving them at `1.13.0` produces the same single-copy result. **You do not need to touch the other packages** — one root override is sufficient. (This is why the earlier "uniform bump" experiments were unnecessary.)
3. **Overrides are only applied during from-scratch resolution.** An existing complete `package-lock.json` makes npm reuse locked resolutions and skip the override (incremental → wrong single copy; `--package-lock-only` → no-op). You must delete the lockfile (or otherwise force a real re-resolve) for the override to take effect, then commit the resulting lockfile so `npm ci` can replay it.
   - **This is documented, general npm behavior — NOT a workspace/monorepo quirk.** Confirmed with a single-package, no-workspaces, no-peer-conflict repro: depend on lara `^1.13.0` (fresh → `1.13.0`), add an override to `1.14.0-pre.0`, incremental `npm install` → still `1.13.0`. Per npm's [package-locks docs](https://docs.npmjs.com/cli/v6/configuring-npm/package-locks/), when a lockfile is present npm *reproduces the locked tree* rather than recalculating versions from `package.json`, so a newly-added override is never evaluated. Tracked upstream as [npm/cli #4232](https://github.com/npm/cli/issues/4232) ("Overrides are not updating after running npm install", P1). Workaround is exactly the from-scratch delete-and-reinstall above.
4. **A successful override writes NO `overrides` key to `package-lock.json`** (root `packages[""]` keeps only `name`/`version`/`workspaces`). `grep -c overrides package-lock.json` = 0 even when it works. **Diagnose by counting physical lara copies, not by grepping for "overrides".**
5. **Caveat — `npm ls` reports the peer as `invalid`.** Forcing `1.14.0-pre.0` into dynamic-text's `>=1.8.0` peer slot leaves npm considering that peer technically unsatisfied: `npm ls` prints `invalid: ">=1.8.0"` and exits non-zero (`ELSPROBLEMS`). `install` / `ci` / `build` / `test` all succeed (exit 0) — it is a peer **warning**, not an install failure — but any CI step running a strict `npm ls` would flag it.
6. **Why the override is viable *because* this is a workspaces root.** npm refuses to override a package that the *current* `package.json` **directly depends on** when the override conflicts with that direct spec — it errors `npm error code EOVERRIDE — Override for ...@^1.13.0 conflicts with direct dependency`. Verified: a single non-workspace package that directly depends on lara `^1.13.0` cannot be overridden to `1.14.0-pre.0` (fresh install fails with EOVERRIDE; it only succeeds if the direct spec is *changed to match* the override). In our monorepo the **root `package.json` does not depend on lara at all** — only the workspace packages do — so the root override is free to rewrite every workspace/transitive/peer request without an EOVERRIDE conflict. The workspaces layout *helps* here.
7. **Risk to verify when baking it in: [npm/cli #9358](https://github.com/npm/cli/issues/9358).** "npm install produces incomplete `package-lock.json` when ERESOLVE overrides peer deps (`npm ci` fails immediately after)" — this is exactly our shape (an override forcing a prerelease into a peer slot that its range excludes). Our isolated repro's `npm ci` replayed cleanly, but #9358 documents conditions where the generated lockfile is incomplete and `npm ci` then fails. **Do not assume** — after the one-time from-scratch resolve, explicitly verify `npm ci` reproduces a single `1.14.0-pre.0` copy on a clean checkout (ideally on CI/Linux, not just locally).

### Why the `>=1.8.0-0` peer-range "fix" does NOT work

Loosening dynamic-text's peer to `>=1.8.0-0` was explored in another repo and **rejected**: under semver's prerelease rule, a comparator's prerelease tag only admits prereleases that share its exact `[major, minor, patch]` tuple. `>=1.8.0-0` opens prereleases of **1.8.0** (e.g. `1.8.0-pre.1`) but still **excludes `1.14.0-pre.0`** (tuple `[1,14,0]` ≠ `[1,8,0]`). There is no package.json range that means "allow any prerelease of any version" — that requires semver's `includePrerelease` option, which is not expressible in a dependency range. So the peer-range path is a dead end; the consumer-side **override** (or publishing a non-prerelease `1.14.0`) is the lever.

## Package-manager comparison: does another PM solve the workflow? (2026-06-26)

**Goal driving this:** make it cheap for a developer to push code in a dependent package against a **prerelease** of lara, have CI test it, and deploy for manual QA — because problems usually surface only once the dependent package actually uses the new dependency. The npm override workflow (edit override → delete `package-lock.json` → reinstall, *every time the prerelease version changes*) is too much friction to expect developers to repeat.

**Key insight: the two-copy problem is npm-specific, not universal.** It is caused by **npm 7+ aggressively auto-installing a *second* copy** to satisfy dynamic-text's `>=1.8.0` peer (which the prerelease can't satisfy by semver). yarn and pnpm don't do that — they bind the peer to the available `1.14.0-pre.0` and emit an **unmet-peer warning** (exit 0). One physical copy, no singleton-guard trip, **no override/resolution and no lockfile-delete ritual**.

Tested with the same isolated repro (real packages, on disk), counting **physical** lara copies:

| Package manager | Physical lara copies | Override/resolution needed? | Lockfile-delete dance? | Notes |
| --- | --- | --- | --- | --- |
| **npm** 11.3 | **2** (`1.13.0` + `1.14.0-pre.0`) | yes | yes — every version change ([#4232](https://github.com/npm/cli/issues/4232)) | current setup |
| **yarn 1** 1.22 | **1** (`1.14.0-pre.0`) | **no** | no | works, but yarn 1 is EOL/maintenance — not a good adoption target |
| **yarn berry** 4.9 | **1** (`1.14.0-pre.0`) | **no** | no | tested with `nodeLinker: node-modules`; default PnP linker is even stricter about single instances |
| **pnpm** 11.1 | **1** (`1.14.0-pre.0`) | **no** | no | modern, monorepo-first; default `strict-peer-dependencies` is off (warns, doesn't error) |

In all three non-npm managers the desired workflow is simply: **a developer bumps their package's lara version to the prerelease and pushes — done.** No override, no resolutions, no reinstall ritual.

**Likely bonus:** the pre-existing `react-dnd-preview` ERESOLVE that blocks a clean `npm install` is also a *hard peer error* unique to npm's strictness. yarn/pnpm treat peer conflicts as warnings, so that blocker probably disappears too (confirm on the real repo).

**Why no lockfile-delete dance:** yarn and pnpm *reconcile the lockfile with `package.json` on every install*, so a newly-added `resolutions`/`overrides` (or a version bump) takes effect on a normal `install`. npm instead *reproduces* an existing lockfile and only re-evaluates overrides on a from-scratch resolve (#4232) — that asymmetry is the entire DX gap.

### Yarn Berry (PnP) specifics — tested 2026-06-26

Berry's **default** linker is Plug'n'Play (no `node_modules`; a `.pnp.cjs` map). Findings with the mixed-version scenario (a package pinning `1.13.0`, another wanting `1.14.0-pre.0`, plus dynamic-text's peer):

- **Default PnP install does *not* hard-error** — it exits 0 with peer *warnings* (`YN0002` "consumer doesn't provide lara, requested by dynamic-text"; `YN0086` "peer dependencies incorrectly met"). It keeps **both** lara versions (`yarn why` shows `1.13.0` and `1.14.0-pre.0`). The hard failure surfaces at *runtime*: PnP is strict, so a package can only `require` what it (or a provided peer) declares. (Count versions via `yarn why`, or `.yarn/cache` zips when the cache is local; Yarn 4 defaults to a *global* cache.)
- **`resolutions: { lara: "1.14.0-pre.0" }`** collapses to a **single** version (fixes the duplicate/guard problem) — but the dynamic-text peer-*provision* warning remains, because resolutions fix *versions*, not whether an ancestor provides the peer.
- **`packageExtensions`** (in `.yarnrc.yml`) is the more powerful lever the npm side lacks: it rewrites a third-party package's manifest **without forking it**. Adding lara as a real dependency of `@concord-consortium/dynamic-text@*` removed the lara peer warning entirely and left a single `1.14.0-pre.0` — the cleanest result of any manager. (pnpm has the analogous `pnpm.packageExtensions` / `peerDependencyRules.allowedVersions`.)
- Both mechanisms apply on a normal `yarn install` — no lockfile deletion.

**The catch — this implies a package-manager migration:**
- **yarn 1** gives the behavior but is EOL; don't adopt it in 2026.
- **pnpm** (or **yarn berry**) is the realistic target: works alongside lerna, but migrating a 23-package npm+lerna repo is a real project — regenerate the lockfile, adjust CI, and **re-validate every package's tests/build under a stricter symlinked `node_modules`** (some packages may rely on npm's flat hoisting), then re-confirm the lara singleton guard holds.

**Cheaper npm-native middle ground (try first):** the pain is entirely npm's peer auto-install, which you can switch off *without leaving npm* via `.npmrc` `legacy-peer-deps=true` (≈ yarn 1's behavior → no second `1.13.0` copy, no per-developer override). Approach #7 touched this but conflated it with a full lockfile regen that caused churn; setting the flag deliberately and doing one controlled install is a smaller, reversible experiment. **Not yet validated** — it changes peer behavior repo-wide, so verify: single `1.14.0-pre.0` copy, drawing-tool/image-question suites pass, `npm ci` works on CI, and acceptable lockfile churn.

## Current state of the branch

Branch `QI-169-image-focus-protocol` (on top of `master` `3cf6bed`), latest commit `c1023a2`. Committed dependency-related state:

- helpers + image-question pin `1.14.0-pre.0`; the other 21 packages pin `1.13.0`.
- image-question has `jest.config.js` (with the `require.resolve` lara mapper) and a webpack `resolve.alias` for lara.
- CI uses Node 22 and `checkout`/`setup-node` at v5.
- **CI result:** image-question suite passes; **`drawing-tool` suite fails** with the lara multi-load guard. So the branch is currently red.

Local install was restored to this committed state (`npm ci`): 1× `1.13.0` + 2× `1.14.0-pre.0`.

---

## Options not yet completed (for the decision)

1. **Publish the non-prerelease `1.14.0`** *(cleanest).* `1.14.0` satisfies dynamic-text's `>=1.8.0`, so the problem disappears with no override and no `npm ls` warning — but it only helps the *final* release, not the prerelease-testing workflow we want generally.
2. **Root `overrides` (now verified to work)** — a single root `overrides: { "@concord-consortium/lara-interactive-api": "1.14.0-pre.0" }` gives one hoisted copy, no per-package changes. Mechanism is understood (see "Overrides: empirically verified behavior"). **The real prerequisite is one successful from-scratch `npm install`** so the override bakes into the committed lockfile; that currently fails on the `react-dnd-preview` ERESOLVE, not on anything lara-related. Accept the `npm ls` "invalid peer" warning, or don't run strict `npm ls` in CI. This is the most promising general approach: **fix the react-dnd ERESOLVE → one clean resolve with the override → commit lockfile → `npm ci` replays a single copy.**
3. **Per-package jest dedupe everywhere** — add the `require.resolve` lara mapper to every package whose tests load both versions. Downside: most question-interactives use `DynamicText` + helpers, so this likely touches many packages and is fragile. Superseded by option 2 once the override is baked in (a single copy means no dedup mapper is needed anywhere).
4. **`.npmrc` `legacy-peer-deps=true`** *(npm-native, try first for the workflow goal)* — stops npm auto-installing the second `1.13.0` copy, i.e. reproduces yarn/pnpm's behavior **without changing package manager or needing per-developer overrides**. A developer would just bump their package's lara version and push. **Verified (isolated repro): unlike `overrides`, this applies on a normal *incremental* `npm install` — it collapsed an existing 2-copy tree to a single `1.14.0-pre.0` with no lockfile deletion (exit 0), and `npm ci` reproduced it.** So it sidesteps the #4232 lockfile-short-circuit that makes overrides painful. Remaining concerns: it's repo-wide (silences *all* peer checks, including genuine ones), and lockfile churn in the real repo is unmeasured (see #7, which conflated it with a full regen). Validate in a controlled, reversible run. See "Package-manager comparison".
5. **Migrate to pnpm (or yarn berry)** — these PMs don't create the duplicate at all (verified: single `1.14.0-pre.0` copy, no override, no lockfile-delete ritual), so the prerelease workflow becomes friction-free and the `react-dnd-preview` ERESOLVE likely stops being a hard blocker too. Cost: a real migration of a 23-package npm+lerna repo (lockfile, CI, re-validating tests/build under a stricter symlinked `node_modules`). See "Package-manager comparison". Best if the prerelease workflow is a recurring, long-term need.

## Key facts to carry forward

- The blocker is specifically the **prerelease tag** vs dynamic-text's `>=1.8.0` **peer** range. A normal `1.14.0` release makes the problem disappear. Loosening the peer to `>=1.8.0-0` does **not** work (semver prerelease-tuple rule — see that section).
- **Root `overrides` works** but only on a **from-scratch resolve**, and is invisible to `grep -c overrides` (which stays 0). Diagnose by counting physical lara copies. Per-package version pins are irrelevant once an override is present.
- The real obstacle to a clean from-scratch resolve (and thus to baking in either the override or any lockfile regen) is the unrelated **`react-dnd-preview` peer conflict** (`react@^16` vs `react@^17`). Solving that is the highest-leverage next step for the general prerelease workflow.
- Any solution must keep working under **`npm ci` on CI (Linux, now Node 22)** — not just local `npm install` on macOS. (`npm ci` from an override-baked lockfile was verified to reproduce the single copy.)
- The committed `package-lock.json` is the source of truth; avoid regenerating it wholesale (react-dnd peer conflict + transitive churn).
