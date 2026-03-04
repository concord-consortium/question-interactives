# Button Interactive — Package Scaffolding

**Status**: **Closed**

## Overview

Scaffold a new `packages/button` interactive from the starter template. This story creates the empty package, fixes bugs and removes unused dependencies in the starter template, adds the package to the release workflow, and updates the README with a missing CI step.

## Requirements

### Package Setup
- Create a new `packages/button` package by copying the `packages/starter` directory
- Replace all instances of "starter" with "button" across the copied files (package.json, source files, etc.)
- Keep all default starter authoring, runtime, and report-item behavior unchanged

### CI Configuration
- Add `- INTERACTIVE_FOLDER: button` to the matrix list in `.github/workflows/release.yml`
  - This workflow uses an explicit list of interactive folder names for release promotion
  - Build, test, and branch deploys (in `ci.yml`) are automatic via lerna/workspaces and need no changes

### README Update
- Update the README's "Adding a new interactive" section to include the missing step: add the new interactive to the `release.yml` matrix list

### Fix Starter Package Bugs
- Fix `packages/starter/src/components/runtime.tsx` — `css.barGraph` changed to `css.starter` to match `runtime.scss`
- Ensure `packages/button` uses `css.button` / `.button` consistently (happens naturally during rename)

### Clean Up Starter Package
- Remove `src/plugins/chart-info.ts` — unused Chart.js plugin copied from bar-graph
- Remove unused dependencies: `chart.js`, `react-chartjs-2`, `@types/chart.js`

### Verification
- The package builds successfully via `npm run build`
- `npm start` from `packages/button` serves the interactive locally
- Demo page loads at `http://localhost:8080/button/demo.html`
- Tests pass (`npm test` from the package directory)
- Lint passes
- Starter package still builds and tests pass after the CSS class fix and dependency cleanup

## Technical Notes

### Key Details
- `webpack.config.js` auto-derives the interactive name from `path.basename(__dirname)` — renaming the folder to `button` handles webpack entry points automatically
- npm workspaces auto-discovers packages under `packages/` — no changes to root `package.json` or `lerna.json` needed
- After creating the package, run `npm install` from the repo root to register the new workspace
- Tests require Node 16 (`nvm use 16`) due to native `canvas` module compatibility

### Files Copied From `packages/starter/`
All files copied as-is, with "starter" replaced by "button":
- `package.json` — update the `name` field
- `tsconfig.json`, `webpack.config.js`, `postcss.config.js` — no changes needed (paths are relative)
- `.eslintrc.js`, `.eslintrc.build.js` — no changes needed
- `__mocks__/` — no changes needed
- `src/` — rename `starter.tsx` → `button.tsx`, `starter.scss` → `button.scss`, update imports and component names

## Out of Scope

- Custom authoring fields (button label, prompt text, function name, etc.)
- Custom runtime behavior (Firebase callable, state machine, loading/success/error states)
- Firebase integration
- Cloud Function implementation (report-service repo)
- Portal API endpoints (rigse repo)
- Report-item customization — use starter defaults

## Decisions

### Should the release workflow (`release.yml`) require a manual update for new interactives?
**Context**: When adding a new interactive, the CI build/test/deploy pipeline picks it up automatically via lerna workspaces, but the release promotion workflow uses an explicit matrix list.
**Decision**: Yes — the release workflow requires manually adding the new interactive's folder name to the matrix. This was identified as a missing step in the README and has been documented.

### Should the starter package CSS bug be fixed as part of this story?
**Context**: The starter's `runtime.tsx` referenced `css.barGraph` (a copy-paste artifact from bar-graph) but its `runtime.scss` defines `.starter`. The button package would inherit this bug if not fixed first.
**Decision**: Fix it before copying, so both the starter template and the new button package start clean.

### Should unused chart.js dependencies be removed from the starter?
**Context**: The starter package included `chart.js`, `react-chartjs-2`, `@types/chart.js`, and `src/plugins/chart-info.ts` — all copied from bar-graph but not imported or used anywhere in the starter source.
**Decision**: Remove them before copying. This keeps the starter template lean and ensures the button package doesn't ship with unnecessary dependencies.

### Where should `button` appear in the `release.yml` matrix list?
**Context**: The matrix list is ordered alphabetically by folder name.
**Decision**: After `blockly` and before `carousel` (alphabetical order: `bl` < `bu` < `ca`).

### Should the verification step cover both the new button package and the modified starter?
**Context**: The starter package was modified (CSS fix + dependency removal), so it needs to be re-verified alongside the new button package.
**Decision**: Yes — verification explicitly includes confirming the starter still builds and tests pass after changes.
