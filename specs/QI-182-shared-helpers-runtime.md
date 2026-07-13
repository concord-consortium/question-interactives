# Sharing the `helpers` Package at Runtime

**Status:** Phase 0 spike DONE and validated; Phase 1 (entry-point API) scoped from a
full import inventory — see "Phase 1 — Entry-point API (scoped)". (ticket TBD)
**Author:** (draft)

Instead of bundling the `helpers` package (and its CSS and font assets) into every
interactive, build `helpers` **once** as a runtime bundle deployed to a shared,
co-located location, and have interactives load it from there at runtime. This is
the broader, more maintainable successor to the per-asset font-injection prototype
(see [[shared-runtime-assets]]).

---

## Session handoff (read this first)

**How we got here.** This started from a single flaky CI failure and turned into a
design thread. The chain of reasoning: the CI "shutdown signal" flake traced to the
heavy ~13-min monorepo build repeated across jobs → explored Nx per-package build
caching → found caching requires each interactive's `dist/` output to be
**self-contained**, but shared fonts leak to the `dist/` root → explored delivering
shared assets from one co-located location → realized per-asset handling won't scale
→ **landed here: share the `helpers` package itself at runtime** (this doc).

**The three specs (all currently untracked on `master`):**
- **[[shared-helpers-runtime]]** (this doc) — the **chosen** approach. Phase 0 spike
  is done (see "Phase 0 spike results" below).
- **[[shared-runtime-assets]]** — superseded predecessor (per-asset font injection);
  kept for its co-location / deploy-model / runtime-resolution analysis, which all
  carry forward.
- **[[nx-per-package-build-caching]]** — the original goal; **blocked on** this spec
  (needs self-contained interactive outputs first). Also holds resolved decisions:
  Nx `outputs` overrides for the two name-mismatched packages (`drawing-tool`,
  `wrapper`); `DEPLOY_PATH` only affects `index-top.html`.

**Branches with prototype code (not on master — master is clean):**
- `QI-proto-helpers-federation` (commit 088a8a1) — the **Module Federation spike**
  for THIS approach. Start here to resume.
- `QI-proto-shared-font-injection` (commit 446b66d) — the earlier, superseded
  font-injection prototype (validated but per-asset).

**⚠️ Working-tree caveat:** the MF spike upgraded `mini-css-extract-plugin`
0.11.3 → 2.10.2 on its branch. `git checkout master` did **not** revert
`node_modules`, so the installed plugin may still be v2 while master's lockfile says
0.11.3. Run `npm ci` on master before building, or `git checkout
QI-proto-helpers-federation` to continue the spike with the intended deps.

**What's proven and what's next.** Phase 0 validated MF remote + host + React
singleton, that the font problem dissolves (relative `url()` resolves from the
co-located remote, no injection), and that it works under a nested deploy path — see
the detailed results and the 4 rollout findings (mini-css-extract upgrade; tsconfig
`module: esnext`; dynamic remote URL via host publicPath; chunk-name collision risk)
below. **Phase 1 is now scoped** from a full import inventory — the exposed entry-point
surface (**subsystem barrels**, decided), the `helpers.scss` split, and the
type/value/SCSS handling are defined in "Phase 1 — Entry-point API (scoped)", along with
a developer-experience analysis (barrel-as-contract; local dev must resolve `helpers`
from source for hot-reload). **Next: build it.**

## Why (and why not the font-injection approach)

The font-injection prototype worked, but it does a **per-asset** URL
transformation: for every shared asset we would have to import it, strip and
recompute its URL, and inject a reference at runtime. That doesn't scale — each new
kind of shared asset needs its own bespoke handling, and the logic is spread across
the interactives.

Key realization: **the CSS that references these assets is only ever loaded via the
`helpers` JavaScript.** (`bootstrap-3.3.7.scss` and `helpers/src/styles/authoring.scss`
are imported solely by `helpers/src/components/base-authoring.tsx`, plus a direct
import in `live-graph`.) So the natural unit to share is not the individual asset —
it's **`helpers` itself**.

If `helpers` is loaded at runtime from one shared location, then:

- `helpers` has a small number of **entry points** (the modules interactives
  consume).
- Once a dependent package loads an entry point, **everything that entry point
  needs — its code, chunks, CSS, and the fonts referenced by that CSS — is relative
  to where the entry point was loaded from.**
- So the **only URL transformation is at the entry-point level** (locating the
  shared `helpers` bundle), *not* per asset. Webpack's `publicPath: 'auto'` in the
  `helpers` bundle makes all of its internal assets self-locate from there.

This also delivers the two goals from [[shared-runtime-assets]] as side effects:
- **Load-time win:** `helpers` (code + CSS + fonts) is downloaded and parsed once
  per page instead of once per interactive type.
- **Caching prerequisite:** interactives stop bundling `helpers`, so each
  `dist/<interactive>/` becomes self-contained — the precondition for
  [[nx-per-package-build-caching]].

## The core mechanism

- Build `helpers` as its **own** webpack bundle (its own entry/output), emitted to a
  **co-located** shared location: `question-interactives/<deployPath>/shared/helpers/…`
  (sibling of the interactives, so the existing whole-`dist` deploy ships it, and
  branch = production parity — same rationale as [[shared-runtime-assets]]).
- Interactives treat `helpers` as an **external / remote** instead of bundling it.
- At runtime, an interactive loads the shared `helpers` bundle. `helpers`'
  `publicPath` resolves to its own location, so:
  - its lazily-loaded chunks load from `shared/helpers/…`;
  - its extracted CSS (bootstrap/authoring) loads from `shared/helpers/…`;
  - the `@font-face url(../fonts/…)` inside that CSS resolves **relative to the
    helpers CSS file** → `shared/helpers/fonts/…`, where the fonts are co-located.

Note the elegant consequence: **the font problem dissolves.** Because `helpers`'
CSS and fonts live together in `helpers`' own output at a single fixed location, the
original `url(../fonts/…)` reference just works — no `@font-face` removal, no runtime
injection. The prototype's SCSS edits and injection util would be **reverted**.

### The one URL transformation: locating the `helpers` entry

The single thing an interactive must compute is *where* the shared `helpers` entry
is. This is the same co-located deploy-root computation from the prototype, applied
**once** (not per asset):

```
helpersEntry = deployRoot() + "shared/helpers/<entry>"   // e.g. remoteEntry.js
```

Once loaded from that URL, `publicPath: 'auto'` inside `helpers` takes over and
everything else self-locates. Cache-busting/versioning uses a content hash on the
`helpers` bundle (e.g. `shared/helpers/<hash>/…`), same reasoning as
[[shared-runtime-assets]] (a per-deploy sibling, content-hashed filenames).

## Mechanism options (primary design decision)

1. **Module Federation (webpack 5) — recommended candidate.**
   `helpers` is a **remote** that `exposes` its entry-point modules; each interactive
   is a **host** that consumes them. MF handles the hard parts automatically: loading
   the remote container, setting the remote's `publicPath` to where it was loaded
   from (so assets self-locate), lazy chunk loading, and **sharing singletons**
   (React) between host and remote. The remote entry URL can be a runtime-computed
   (dynamic) remote — the one transformation above.
2. **Externals + a self-locating library bundle.**
   Build `helpers` as a library exposing a global (or ESM), mark `helpers` (and
   React) as `externals` in interactives, and load the shared bundle via a `<script>`
   / import map. `publicPath: 'auto'` in `helpers` self-locates its assets. Simpler
   mental model, but React sharing and load-ordering are manual.
3. **Import maps + ESM.** Map the `helpers` specifier to the shared URL. Modern, but
   needs an ESM build and careful React sharing.

Lean toward **Module Federation** because it solves publicPath, lazy loading, and
the React singleton in one place; keep externals as a simpler fallback to evaluate
during the spike.

## Critical constraints

- **Iframes ⇒ HTTP-cache sharing, not a runtime singleton.** Interactives load in
  separate iframes (separate JS realms). So each iframe loads *its own* instance of
  the shared `helpers` bundle; the cross-interactive win is that the browser
  **downloads and parses it once** and reuses it across iframes. There is no shared
  memory/instance across interactives — consistent with the load-time framing.
- **React must be a singleton *within* an iframe.** The interactive's own bundle and
  the shared `helpers` bundle must use **one** React instance, or React throws
  "invalid hook call". Decide whether React is provided by the `helpers` bundle
  (exposed as a shared singleton) or as a separate shared vendor bundle. MF
  `shared: { react: { singleton: true }, "react-dom": { singleton: true } }` is the
  standard handling.
- **`helpers` becomes a runtime contract.** Its exposed entry points are now a
  versioned public API; deep imports (`helpers/src/…/x`) scattered across
  interactives must be consolidated into a **few explicit exposed entry points**
  (this is the "few entry points" the design is built around — a benefit, but a
  refactor).
- **Blast radius.** A broken shared `helpers` bundle breaks every interactive in that
  deploy. Mitigated by co-location + content-hash versioning (a deploy is
  self-consistent).
- **Released top-level pointer.** The `helpers` entry must resolve from the released
  `<interactive>/index.html` too; the deploy-root computation handles this because it
  keys off the interactive's actual runtime location (validated in the prototype).
- **Hermetic dev/CI.** webpack-dev-server and Cypress (`http-server dist`) must serve
  the `helpers` remote locally; no network dependency.

## Benefits

- **One URL transformation, not per-asset** → scales to any asset `helpers` owns
  (fonts today, images/icons/etc. later) with zero additional URL logic.
- **The font problem disappears** — no SCSS edits, no injection; `helpers`' own CSS
  resolves its fonts relative to the co-located `helpers` bundle.
- **Smaller interactive bundles** (no bundled `helpers`/vendor) → self-contained
  outputs (unblocks [[nx-per-package-build-caching]]) and less to build.
- **Download/parse `helpers` once per page** across interactive types.
- **A clean, explicit `helpers` public API** (the exposed entry points).
- Natural path to also sharing **React / vendor** the same way.

## Costs / risks

- Larger architectural change than font injection: a `helpers` remote build, MF (or
  externals) config across ~24 interactives, and a deploy of the shared `helpers`
  bundle.
- React-singleton discipline and version coupling within a deploy.
- Consolidating scattered deep `helpers` imports into a few exposed entry points.
- Build/test tooling: dev-server + Cypress must serve the remote; jest (which imports
  `helpers` source directly today) needs a resolution story that bypasses MF.

## Phase 0 spike results — DONE (branch `QI-proto-helpers-federation`)

A Module-Federation spike on bar-graph validated the core of this approach
end-to-end in a browser (Chrome DevTools). What was proven:

- **MF remote + host works** in this webpack 5 (5.88.1) setup, using the built-in
  `webpack.container.ModuleFederationPlugin` (no new plugin dep). `helpers` built as
  a remote (`remoteEntry.js` + chunks) emitted to `dist/shared/helpers/`.
- **React shared singleton works.** An exposed component using `useState`, rendered
  by the *host's* ReactDOM, incremented correctly (0→1) with no "invalid hook call"
  — host and remote share one React (`shared: { react/react-dom: { singleton: true }}`).
- **The font problem dissolves, exactly as predicted.** The remote's CSS references
  its font with a plain relative `url(fonts/glyphicons-…woff2)`, which resolves
  relative to the remote's own co-located CSS → `…/shared/helpers/fonts/…` (200), with
  **no `@font-face` removal and no injection.** `document.fonts.check` confirmed the
  font loaded.
- **Works under an arbitrary nested deploy path.** Served under
  `…/version/1.2/`, all remote resources loaded from
  `…/version/1.2/shared/helpers/…` and the app + remote rendered.

Findings that shape the rollout (all resolved or noted):

1. **`mini-css-extract-plugin` MUST be upgraded (0.11.3 → v2).** The v0.x (webpack-4
   era) plugin cannot load CSS for **async chunks** under webpack 5 — it throws
   `TypeError: f.h is not a function` in `miniCssF`. Since MF requires an async
   boundary, *every* interactive becomes an async-CSS chunk, so this is a hard
   prerequisite. Upgraded to **2.10.2** in the spike, which fixed it. (Same upgrade
   the caching spec flagged for its Option B.)
2. **The interactive's TS `module` must be `esnext`** (not the shared `commonjs`) so
   ts-loader preserves `import()` for the MF async boundary; otherwise TS downlevels
   it to `require` and MF breaks. Set per-interactive in `tsconfig.json`.
3. **The dynamic remote URL is a one-liner, but `__webpack_public_path__` is NOT
   available inside the MF remote-promise string** (`ReferenceError`). Capture the
   host's runtime `__webpack_public_path__` in app code (where it *is* defined) and
   stash it on `window`; the promise reads that. Conveniently, the host's
   `publicPath: 'auto'` resolves to the **deploy root** (the entry filename includes
   the `"<interactive>/assets/"` prefix, so auto strips it), so
   `remoteUrl = deployRoot + "shared/helpers/remoteEntry.js"`. This is also correct
   for the released top-level pointer (keys off the actual script location), unlike
   anchoring on `location.pathname`.
4. **Chunk-naming collision risk (must fix in rollout).** With the current
   `output.filename: "[name]/assets/index.[contenthash].js"`, async chunks emit to
   `dist/<chunkId>/assets/…` at the **dist root** (siblings of the interactives),
   with numeric chunk ids. Two interactives could emit the same `dist/<id>/…` path
   and collide in the shared deploy. The rollout must namespace chunks per interactive
   (e.g. `output.uniqueName` + a `chunkFilename` under the interactive's folder).
5. **Whole-`dist` deploy carries `shared/helpers` automatically** (co-located), as
   assumed.
6. Spike used **partial** federation (only one exposed module); bar-graph still bundles
   `helpers` deeply. Full conversion needs the exposed entry-point API (Phase 1) and
   the async boundary applied to all three entries (main/demo/report-item).

Spike artifacts (on branch): `packages/helpers/webpack.federation.js`,
`packages/helpers/src/spike/*`, bar-graph `webpack.config.js` MF host config +
`bootstrap.tsx` async boundary + `index.tsx` deploy-root capture, and the
`mini-css-extract-plugin` bump.

## Phase 1 — Entry-point API (scoped)

Grounded in a full inventory of how the other packages import `helpers` today
(measured across `packages/*`, excluding `helpers` itself).

### What the imports look like today

There is **no** public surface: `helpers` has no `index`, no `main`/`module`/`exports`
in `package.json`. Every consumer reaches directly into source, resolving through the
workspace symlink `@concord-consortium/question-interactives-helpers/src/<file>`. A
minority bypass the package name entirely with relative `../../../helpers/src/…`
imports (2 TS files; ~30 SCSS files). So Phase 1 is: introduce a small explicit
surface and repoint ~190 import sites at it.

By subsystem (occurrence counts; **bold** = consumed by 10+ files):

- **components/** — **base-question-app (36)**, demo (9), base-app (8), iframe-runtime
  (4), base-authoring (2), modal (2), media-library/* (3), submit-button (1),
  locked-info (1), pub-sub-simulation (1), styled-file-input (1, relative).
- **hooks/** — **use-context-init-message (11)**, use-glossary-decoration (9),
  use-linked-interactive-id (6), use-cors-image-error-check (3),
  use-linked-interactives-authoring (2), use-force-update (1), use-student-settings
  (1), use-delayed-validation (1).
- **utilities/** — **render-html (22)**, **dynamic-text-tester (17)**,
  library-interactives (6), copy-image-to-s3 (5), css-url-value (3), media-library
  (3), get-url-param (2), voice-typing (2), render-styled-component-to-string (1).
- **types** — IframePhone (5).
- **styles/** — `helpers.scss` (28 SCSS `@import` for mixins/vars + ~8 JS
  `import css from …` for the class map), `px-to-rem.scss` (17 SCSS `@import`),
  `bootstrap-3.3.7.scss` / `authoring.scss` (live-graph, direct).
- **icons/** — 13 SVG default imports across 7 packages (1–2 each).
- **widgets/** — image-upload-widget (1).

### The key move: three resolution regimes, only one is federated

The imports are not homogeneous. They split into three kinds that need **different**
handling — a distinction the rest of the spec had blurred. Only the first crosses the
Module-Federation boundary:

1. **Runtime values → federate (MF `exposes`).** React components, hooks, utility
   *functions*, and the CSS-Modules class map. These are the only things that must
   load from the shared `helpers` bundle.
2. **Compile-time types → erase; never cross the MF boundary.** The interfaces/aliases
   (`IRuntimeQuestionComponentProps`, `IRuntimeComponentProps`, `IAuthoringComponentProps`,
   `IBaseAuthoredState`, `UpdateFunc`, `IFormContext`, `ILinkedInteractiveProp`,
   `IframePhone`, `ParseHTMLReplacer`). Crucially, several live in the **same module as
   a value** — `base-question-app` exports both the `BaseQuestionApp` value and the
   `IRuntimeQuestionComponentProps` type; likewise `base-app` and `render-html`. Rule:
   consumers must import types with **`import type`** so `tsc` emits no runtime `import()`
   against the remote. Only 4 consumer files use `import type` today, so this is a real
   (but mechanical) rewrite. Types resolve at build time from source (tsconfig `paths`),
   independent of MF — a broken remote can't break type-checking, and jest is unaffected.
3. **Build-time SCSS → partials; cannot be federated.** `pxToRem()` and the mixins/vars
   in `helpers.scss` emit no CSS until invoked; SASS inlines them at compile time
   wherever `@use`d. They must stay build-time SCSS partials — MF shares runtime
   JS/CSS, not SASS source.

### Required refactor: split `helpers.scss`

`helpers.scss` is today **both** build-time tooling **and** global CSS, which is why it
is imported two incompatible ways (as a SASS partial for its mixins, and as a JS module
for its class map). Split it:

- `styles/_tools.scss` — functions (`pxToRem`), mixins (`ap-button`,
  `interactive-button`, `native-focus-ring`, `lara-button`, `ap-styles`,
  `lara-styles`), `$vars`. `@use`d at build time; emits no CSS. Absorbs
  `px-to-rem.scss`. The 28 `@import ".../styles/helpers"` (mixins) and 17 px-to-rem
  sites repoint here.
- **Global CSS** (`:root` custom properties; `.apButton` / `.interactiveButton` /
  `.laraButton` / `.error` / `.smallIcon` / `.mediumIcon`) → compiled into the shared
  bundle's CSS **once**. The ~8 JS consumers that `import css from ".../helpers.scss"`
  for the class-name map get that map from an exposed MF module whose CSS is emitted
  once; CSS-Modules hashing stays consistent because the emitted CSS and the class map
  come from the same single shared build.

**Status — the `_tools.scss` seam has landed** (commits on this branch). `styles/_tools.scss`
now owns the functions/`$vars`/mixins (emits no CSS); `helpers.scss` and `px-to-rem.scss`
`@forward` it, so no consumer imports changed. This was done as a **pure, zero-behavior-change
refactor** — the compiled CSS of the representative interactives is byte-identical before/after
(verified against a pre-refactor baseline). Still **deferred to Phase 2** (the MF rollout, where
the shared bundle emits the global CSS once): repointing the 28 `@import ".../helpers"` + 17
px-to-rem sites to `@use ".../tools"`, moving the `:root` tokens / button classes to emit from
the shared bundle, and deleting the `px-to-rem.scss` shim. See
`docs/superpowers/plans/2026-07-13-helpers-scss-tools-split.md`.

### Proposed exposed surface (recommend: subsystem barrels)

Matches the source dirs and the way interactives already group their imports, and keeps
the `exposes` map small:

- `./components` — the component **values** (BaseQuestionApp, BaseApp, DemoComponent,
  IframeRuntime, Modal, SubmitButton, LockedInfo, media-library/*, PubSubSimulationConfig,
  StyledFileInput, ImageUploadComponent). They already form one dependency cluster
  (`base-question-app` pulls `base-app`, `base-authoring`, `submit-button`,
  `locked-info`, and 6 hooks), so per-component splitting buys little.
- `./hooks` — the 8 externally-used hooks.
- `./utilities` — the 9 utility functions.
- `./styles` — the global CSS-Modules class map; its side-effect ensures the shared
  global CSS is present.

Non-federated companions (no `exposes` entry):
- **Types** — resolve from source via tsconfig `paths` (`…-helpers/*` → `packages/helpers/src/*`),
  always consumed with `import type`.
- **`styles/_tools.scss`** — build-time `@use`.
- **Icons** (13 SVGs) — leave **bundled** in each interactive. They are self-contained
  SVGs with no font/CSS coupling, so they don't block the self-contained-`dist` caching
  goal and aren't worth a federation boundary.

**Decided — barrels** (the subsystem barrels above), over per-module (~30) exposes.
The deciding reason is the **contract**, not performance (per-iframe parse and MF
config are close to a wash — and honestly, a barrel is *slightly heavier* per iframe
because the remote is built independently, so an exposed barrel can't be tree-shaken by
the host and pulls its whole subsystem). A curated barrel is an explicit public surface
that hides `helpers` internals — the encapsulation this whole spec is built around.
Per-module effectively republishes the entire `src/` tree as the API (today's deep
imports with a new prefix), which does not deliver that goal.

### Developer experience

For a developer editing shared `helpers` code and a consuming interactive **together**,
the barrel's small update-friction is a *feature*, not a cost. Editing
`components/index.ts` to add an export is a deliberate moment — "I am changing the
shared contract" — whereas per-module makes widening your dependence on shared internals
indistinguishable from any other import.

Note the tension: **"you never have to touch the barrel" and "the barrel makes you
pause" are the same dial.** A *named* re-export barrel (`export { renderHTML } from
"./render-html"`) gives the pause but needs a line per new public name; an `export *`
barrel needs no edits but restores no encapsulation (per-module with indirection). We
choose the **named** barrel and take the edit as the price of the nudge. Two honest
limits: the nudge guards surface *additions*, not behavior *changes* to existing exports
(the more dangerous blast radius — that needs tests/review, not a barrel), and it is a
speed bump, not a gate.

**The dominant DX factor is the dev loop, and it is orthogonal to barrels vs modules.**
Today `helpers` resolves as symlinked source, so a change hot-reloads across `helpers`
and the interactive in one compilation. Under MF the interactive consumes a *built*
remote, so a `helpers` edit means rebuilding/re-serving the remote before the host sees
it — a real regression for exactly the cross-cutting workflow above. Mitigation (now a
firm requirement — see open questions): **dev-server and jest resolve `helpers` from
source via tsconfig `paths`; MF is used only for production/CI builds.** Then the
day-to-day loop keeps normal hot-reload and the barrel-vs-module choice reduces to an
ordinary TS import.

*Accepted risk of that mitigation:* because dev bypasses MF, asset-loading nuances that
only exist under the federated/deployed path (publicPath resolution, per-interactive
chunk naming, CSS/font co-location) will **not** surface in local development — they
surface on **branch deploy**. We accept this: branch = production parity is a core
property of this design, these nuances should be rare, and branch testing is expected to
catch them.

### Migration mechanics
- Add barrel `index.ts` files + tsconfig `paths` for the type-only surface.
- Codemod deep specifiers → barrel specifiers; rewrite type-only imports to `import type`.
- First normalize the relative `../../../helpers/src/…` imports (2 TS, ~30 SCSS) to the
  package form, so there is a single import style to migrate.
- Split `helpers.scss`; repoint mixin `@import`s to `@use ".../styles/tools"`.

### Phase 1 open questions
- **Local dev must hot-reload shared `helpers` code** (see "Developer experience"):
  dev-server + jest resolve `helpers` from source via tsconfig `paths`, MF only for
  prod/CI. Firm requirement; the mechanism (webpack resolve/alias vs `paths` only) is
  the remaining detail. Accepted tradeoff: MF-only asset nuances surface at branch
  deploy, not locally.
- Whether `./styles` needs federating at all, or the global CSS simply rides along in
  the shared bundle and the ~8 class-map consumers switch to plain global class names.
- tsconfig `paths` to source vs a generated `.d.ts` barrel for the type-only surface.

## Remaining phasing
- **Phase 1 — Entry-point API.** Scoped above: define the exposed surface, split
  `helpers.scss`, and migrate deep imports (with `import type` for the type surface).
- **Phase 2 — Roll out** across all interactives; delete bundled-`helpers` paths;
  revert the font-injection prototype changes.
- **Phase 3 — Extend** the same pattern to React/vendor if the load-time numbers
  justify it.

## Open questions

- Module Federation vs externals vs import maps.
- Where React lives (exposed by the `helpers` remote vs a separate shared vendor
  remote) and how the singleton is guaranteed within an iframe.
- The exact exposed entry-point surface for `helpers`.
- Versioning/cache-busting scheme for the shared `helpers` bundle and how the entry
  URL is located at runtime (dynamic remote vs computed URL).
- Jest/unit-test resolution of `helpers` (keep direct source resolution; MF only
  affects the webpack builds).
- Dev-server / Cypress serving of the remote. **Leaning:** local dev-server resolves
  `helpers` from source (not as a remote) so cross-cutting edits hot-reload — MF is a
  prod/CI-only build mode. Cypress runs against the built `dist` (MF active). Accepted
  consequence: federated asset nuances are caught at branch deploy, not in local dev.
  See Phase 1 "Developer experience".

## Relationship to the other specs

- **[[shared-runtime-assets]]** — the narrower predecessor. Its co-location,
  deploy-model, and runtime-resolution analysis carry over; its font-injection
  mechanism is superseded by sharing `helpers` (the font-injection prototype remains
  on branch `QI-proto-shared-font-injection` for reference).
- **[[nx-per-package-build-caching]]** — this work satisfies that spec's Phase 0
  prerequisite (self-contained interactive outputs) by removing bundled `helpers`
  from each interactive. See "How this interacts with Nx caching" below for what does
  and doesn't get decoupled.

### How this interacts with Nx caching

A natural question once types resolve from source (Phase 1): does type-checking against
`helpers` **source** (rather than its built product) undercut per-package caching? Short
answer: **no — caching works, but the `helpers → interactive` dependency edge stays, so
a `helpers` source change still cascades to all interactives.** The details:

**Two independently-cached artifacts.** Nx caches two *kinds* of build task separately:
the **`helpers` remote** dist (one task) and each **interactive** dist (one task each).
Crucially, an interactive's webpack build does **not** consume the shared dist at all —
not even a cached copy. Under Module Federation the host references the remote by URL and
loads it **at runtime**, so the shared dist is not a build input to the interactive. The
shared dist is combined with the interactive dists only at **deploy assembly** (the
whole-`dist` deploy), not inside any interactive's webpack step.

**Interactive-only change → single rebuild (the happy path).** If only an interactive's
own source changes, Nx rebuilds just that interactive. Its type-check reads (unchanged)
`helpers` source and is deterministic; every other interactive and the `helpers` remote
stay cached.

**But interactives keep a build-time *source* dependency on `helpers` — broader than
types.** After Phase 1, only helpers' **runtime JS** (components/hooks/utilities) moves
to the remote. Interactives still pull helpers **source** at build time via three edges:
(1) **TS types** (`import type`, resolved from source), (2) the **SCSS `_tools` mixins /
`pxToRem`** (compiled into each interactive's own CSS), and (3) the **icons** (SVGs kept
bundled per-interactive). So Nx keeps the `helpers → interactive` graph edge, and a
**change to `helpers` source invalidates every interactive's build cache** and rebuilds
them all — even though their packaged *output* wouldn't change (helpers JS is no longer
inside it).

**Why that's acceptable.** It is **not a regression**: with helpers bundled today, a
helpers change already invalidates every interactive. And it is **correct**: a helpers
public-type change *can* break an interactive's type-check. The caching win this spec
unblocks is not "helpers changes stop rebuilding interactives" — it is that each
interactive's **output becomes self-contained** (no shared fonts leaked to the dist
root), so the artifacts are independently cacheable and deployable *at all*. Output
self-containment ≠ decoupling the input dependency graph.

**Optional future lever (only if the cascade hurts).** Type-check interactives against
helpers' emitted **`.d.ts`** instead of source, and scope the Nx input to that
declaration output — then helpers *implementation-only* changes no longer invalidate
dependents (only public-API/`.d.ts` changes do). Cost: a helpers declaration build step
plus more Nx input config, and the loss of the simple source-based dev loop (or
maintaining both). Not worth doing up front; noted as the escape hatch.
