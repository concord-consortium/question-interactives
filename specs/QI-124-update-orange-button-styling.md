# Update Orange Button Styling Across Question Interactives

**Jira**: https://concord-consortium.atlassian.net/browse/QI-124

**Status**: **Closed**

## Overview

Update the orange button styling in question-interactives for WCAG accessibility compliance, matching the color and focus changes already shipped in the activity-player (AP-66). Changes include black text, revised background colors for default/hover/click states, updated border color, and a keyboard-visible focus indicator.

## Requirements

- **Label color**: Change button text color from #3f3f3f to #000000
- **Default state**: Update background from #ffa350 to #ffba7d; border from 1.5px #979797 to 1.5px #949494
- **Hover state**: Update background from #ff8415 to #ff9a42; border 1.5px #949494
- **Click/pressed state**: Set background to #ff8113; text remains #000000 (currently turns white); border 1.5px #949494
- **Disabled state**: Use default background (#ffba7d) with opacity 0.35; text #000000; border 1.5px #949494
- **Keyboard focus state**: Add a visible `:focus-visible` indicator:
  - `box-shadow: inset 0 0 0 2.5px #0957d0, inset 0 0 0 3.5px white`
  - `outline: none` (suppress browser default)
  - Background matches hover (#ff9a42)
  - Text remains #000000
- **SVG icon fill**: Update SVG fill from #3f3f3f to #000000; remove `fill: white` on `:active` (use `currentColor` instead)
- **Border radius**: Maintain existing 4px
- **CSS pseudo-class ordering**: `:hover` → `:focus-visible` → `:active` so click background shows during keyboard press
- **Disabled opacity**: Update from 0.3 to 0.35 to match AP-66
- All changes apply to the `@mixin ap-button` / `.apButton` class in `packages/helpers/src/styles/helpers.scss`
- No layout shift from focus indicator (uses box-shadow, not border changes)

### WCAG Contrast Ratios

| State | Combination | Ratio | WCAG |
|-------|------------|-------|------|
| **Current** | #3f3f3f on #ffa350 | ~3.2:1 | Fails AA |
| Default | #000000 on #ffba7d | ~11.4:1 | Passes AAA |
| Hover/Focus | #000000 on #ff9a42 | ~8.6:1 | Passes AAA |
| Click | #000000 on #ff8113 | ~7.0:1 | Passes AAA |
| Focus ring | #0957d0 on #ffffff | ~7.0:1 | Passes AA (non-text) |

## Technical Notes

### Color Values (from AP-66 spec / Zeplin)

All color values sourced from the closed AP-66 spec, which extracted them from the Zeplin design screen (`698a06d8e09b8e5c861b796f`).

| State | Background | Text | Border |
|-------|-----------|------|--------|
| Default | #ffa350 → **#ffba7d** | #3f3f3f → **#000000** | 1.5px #979797 → **1.5px #949494** |
| Hover | #ff8415 → **#ff9a42** | #3f3f3f → **#000000** | — → **1.5px #949494** |
| Click/Pressed | — → **#ff8113** | white → **#000000** | — → **1.5px #949494** |
| Disabled | opacity 0.3 → **opacity 0.35** | — → **#000000** | — → **1.5px #949494** |
| Keyboard Focus | — → **#ff9a42** | — → **#000000** | — → **box-shadow ring** |

### CSS Variables Added

```scss
--cc-ap-button-color: #000000;
--cc-ap-button-default: #ffba7d;
--cc-ap-button-hover: #ff9a42;
--cc-ap-button-click: #ff8113;
--cc-ap-button-border: #949494;
--cc-ap-button-focus-ring: #0957d0;
```

### Key Files

| File | What changed |
|------|-------------|
| `packages/helpers/src/styles/helpers.scss` | Added CSS variables to `:root`; updated `@mixin ap-button` and `.apButton` class |
| `packages/labbook/src/components/runtime.scss` | Added same `--cc-ap-button-*` CSS variables to duplicate `:root` block |

### Components Using the Orange Button

**Via `.apButton` CSS class:**
- `packages/helpers/src/components/submit-button.tsx`
- `packages/multiple-choice-alerts/src/components/runtime.tsx`
- `packages/multiple-choice/src/components/runtime.tsx`

**Via `@include ap-button` mixin:**
- `packages/scaffolded-question/src/components/runtime.scss`
- `packages/carousel/src/components/runtime.scss`

## Out of Scope

- `@mixin interactive-button-orange` in agent-simulation — separate button pattern with different color progression (white default background)
- Orange-themed modal styling (`modal.scss`) — uses `--cc-orange-*` CSS custom properties for a different purpose
- `@mixin interactive-button` — teal-based, not orange
- `@mixin lara-button` — gradient-based LARA styling
- Changes to the existing `--cc-orange-*` CSS custom property values
- Consolidating or deduplicating the `:root` blocks between `helpers.scss` and `labbook/runtime.scss`

## Decisions

### Should the `interactive-button-orange` mixin in agent-simulation also be updated?
**Context**: The `@mixin interactive-button-orange` in `_shared-button-styles.scss` is a separate orange button variant used by recording/delete controls in agent-simulation. It has a different color progression (white default, `--cc-orange-light-3` hover, `--cc-orange` active) and doesn't use the same colors as the AP button.
**Options considered**:
- A) Out of scope — only the `@mixin ap-button` / `.apButton` class (matching AP-66's narrow scope)
- B) In scope — update the agent-simulation orange buttons too with equivalent accessibility improvements
- C) Separate ticket — flag for a follow-up

**Decision**: A) Out of scope — only the `@mixin ap-button` / `.apButton` class, matching AP-66's narrow scope.

---

### Should CSS custom properties or hardcoded hex values be used in the updated `ap-button` mixin?
**Context**: The current `ap-button` mixin uses hardcoded hex values. QI's color system uses CSS custom properties (`--cc-orange-*`). AP-66 used SCSS variables.
**Options considered**:
- A) Add new CSS custom properties (`--cc-ap-button-*`) to `:root` and reference them in the mixin (consistent with QI's existing pattern)
- B) Use hardcoded hex values directly in the mixin (simpler, matches current `ap-button` pattern)
- C) Add SCSS variables like AP-66 did (consistent with activity-player)

**Decision**: A) Add new CSS custom properties (`--cc-ap-button-*`) to `:root` and reference them in the mixin, consistent with QI's existing pattern.

---

### Should the duplicate `:root` color definitions in `labbook/runtime.scss` also get the new button variables?
**Context**: The `packages/labbook/src/components/runtime.scss` file contains a duplicate copy of the `:root` CSS custom properties.
**Options considered**:
- A) Yes — add to both files for consistency
- B) No — the labbook copy doesn't need button variables since it doesn't use `ap-button`
- C) Out of scope — cleaning up the duplicate `:root` is a separate concern

**Decision**: A) Yes — add the new `--cc-ap-button-*` variables to both `:root` blocks for consistency.
