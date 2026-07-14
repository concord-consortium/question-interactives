# QI-160 — Blockly Interactive: Make fully keyboard accessible

**Date:** 2026-07-13
**Story:** QI-160 (epic AP-81 VPAT Accessibility) — audit issue #97, WCAG 2.1.1 Keyboard, Level A
**Depends on:** QI-181 (Blockly 12.3.0 → 13.1.1), merged

## Background

QI-160 was written on the assumption that we would have to build an entire keyboard
alternative to drag-and-drop from scratch, following the Salesforce menu-button pattern
that the audit cited as an example. The Blockly v13 upgrade (QI-181) changed that: v13
ships keyboard navigation and screen-reader support in core.

Before designing this work, the shipped behavior was verified in a real browser (Chromium
via Playwright, driving the runtime iframe of the demo page) and with VoiceOver on macOS.
That verification is the basis for the scope below. Notably, two plausible-sounding
conclusions were falsified by actually running it: that keyboard drag-and-drop did not
work (it does, end to end), and that our custom blocks were unlabelled for screen readers
(v13 derives labels from block text automatically).

### Verified working — no work required

- **Keyboard-only drag-and-drop, end to end.** Tab reaches the toolbox; arrows select a
  category; `→` enters the flyout; `Enter` picks a block up; arrows walk candidate
  connections; `Enter` commits. The block genuinely connects, including into a nested
  creator block behind an opened `+/-` disclosure.
- **Keyboard delete.** `Delete` removes a student-added block. Seed blocks
  (`setup`, `go`, `onclick`) are `setDeletable(false)` and correctly survive it.
- **Focus management after relocation.** Focus remains on the moved block.
- **The live region exists and is genuinely spoken.** `inject()` creates
  `div#blocklyAriaAnnounce` (`role=status`, `aria-live=polite`), and VoiceOver speaks it:
  "Moving if, do on workspace", "Moving inside setup, empty."
- **Fields are keyboard-reachable and labelled.** Number fields announce as
  "Edit number: 100"; dropdowns as "dropdown: water" with a proper `role=listbox` editor.
- **The `+/-` disclosure toggle is keyboard-operable.** `Enter` toggles it.
- **The authoring form is not hijacked** by v13's single-key shortcuts (`M`/`T`/`C`/`I`/`D`).
  Typing in RJSF text inputs works normally and moves no blocks. (This closes QI-181's
  last open item.)

This satisfies QI-160 acceptance criteria 1, 2, 3 and 4. AC 2's menu-button pattern is
introduced with "for example" and is illustrative; the criterion asks for *a*
keyboard-accessible alternative, which exists. AC 3 describes that same illustrative
pattern's mechanics. **The ticket should record that the alternative implemented is
Blockly's native canvas navigation, not the menu-button pattern**, so that a future VPAT
audit grepping for `aria-haspopup="menu"` finds the explanation rather than concluding the
checklist was falsified.

### The gaps this design addresses

1. **No confirmation on drop or delete (AC 5).** Blockly narrates the *journey* — every
   candidate connection as you walk it — but says nothing on commit. The live region
   retains its stale "Moving inside setup, empty." text. Deletion is likewise unannounced.
   A student who cannot see the canvas has no way to know whether the drop succeeded, or
   landed where they intended. Verified identical with Blockly's screen-reader mode
   (`⌥⇧A`) both on and off, so this is a genuine gap in Blockly, not a setting we failed
   to enable.

   AC 5 asks specifically for the item's **new position** to be announced. This is the
   core of the story. Formally WCAG 4.1.3 Status Messages (AA), inside a ticket filed as
   2.1.1 (A).

2. **The `+/-` disclosure toggle has no usable accessible name.**
   `block-factory.ts:328` constructs `new FieldImage(PLUS_ICON, 16, 16, "+/-")`. A screen
   reader reads the alt text verbatim: *"plus slash minus, button."* It also never exposes
   `aria-expanded`, so open/closed state is invisible. WCAG 4.1.2 Name, Role, Value (A).

3. **Generic role descriptions.** Authored blocks announce as Blockly's structural
   `"statement"` / `"value"`, which says nothing about what the block *is*.

Items 2 and 3 fall under this story's title ("Make fully keyboard accessible") but map to
none of the six original acceptance criteria. Left to the checklist alone they would be
silently dropped.

## Design

Three new pieces, all built on **public** Blockly API. No imports from Blockly internals.

```
src/utils/aria-announce.ts             NEW   compose + push announcements
src/blocks/disclosure-field.ts         NEW   FieldImage subclass: real name + aria-expanded
src/blocks/block-factory.ts            EDIT  use DisclosureField; role description by type
src/blocks/starter-blocks.ts           EDIT  role descriptions
src/blocks/custom-built-in-blocks.ts   EDIT  role descriptions
src/components/blockly.tsx             EDIT  attach listener
src/components/starter-program-editor.tsx           EDIT  attach listener
src/components/custom-block-form-child-blocks.tsx   EDIT  attach listener
```

The read-only report workspace (`report-item/get-report-item-html.tsx`) is excluded: no
block can move or be deleted there.

### Relevant Blockly 13.1.1 API (all public, all verified against the installed package)

| Symbol | Source | Use |
|---|---|---|
| `utils.aria.announceDynamicAriaState(text, opts?)` | `core/utils/aria.ts:379` | push to the live region |
| `utils.aria.setState`, `State.EXPANDED` | `core/utils/aria.ts` | set `aria-expanded` |
| `Block.setAriaRoleDescriptionProvider(string \| () => string)` | `core/block.ts:1559` | role description, works from imperative `init()` |
| `BlockSvg.getAriaLabel(verbosity?)` | `core/block_svg.d.ts:792` | read a block's composed label |
| `Field.getFocusableElement()` | `core/field.d.ts:751` | the element Blockly puts ARIA on |
| `Field.recomputeAriaContext()` | `core/field.d.ts:780` | override point (public) |
| `FieldImage.setAlt(alt)` | `core/field_image.d.ts:94` | `FieldImage.getAriaValue()` returns alt text |
| `Events.BLOCK_MOVE`, `Events.BLOCK_DELETE`, `BlockMove.reason` | `core/events/*` | the events we hook |

Two behaviors of `announceDynamicAriaState` constrain the design:

- **It throws** `Error('ARIA live region not initialized.')` if called before `inject()`.
- **It coalesces**: calls within the same `setTimeout` window are joined with `"\n"` into a
  single announcement rather than replacing one another. We are concatenated with
  Blockly's own announcements, not layered over them. This is acceptable here because
  Blockly emits nothing on commit — which is precisely the gap.

Deliberately **not** used, because they are not exported from Blockly's barrel and are
marked `@internal`: `block_aria_composer.ts` (`computeMoveLabel`, `configureAriaRole`),
`hints.ts`, `BlockDragStrategy.announceMove` (private).

### 1. `src/utils/aria-announce.ts`

Split into a pure core and a thin side-effecting shell. The guards and the message
wording — the parts worth testing — are pure functions that need no live workspace. This
matters: Blockly under jsdom is the thing that made QI-181 expensive, and it should not be
a prerequisite for testing our own logic.

```ts
// Pure. Returns the string to announce, or null to stay silent.
export function describeMove(event: Events.BlockMove, workspace: WorkspaceSvg): string | null
export function describeDelete(event: Events.BlockDelete, labels: Map<string, string>): string | null

// Side-effecting. Attaches one change listener; returns a disposer.
export function attachAriaAnnouncements(workspace: WorkspaceSvg): () => void
```

**Guards.** A move announces only when all hold:

- `event.type === Events.BLOCK_MOVE`
- `event.reason?.includes("drag")`
- `event.recordUndo`

`reason` containing `'drag'` is what distinguishes a genuine user drag — keyboard *or*
mouse, since keyboard commits route through the same dragger — from `bump`, `snap`,
`cleanup`, `connect`/`disconnect`, and load-time moves. `recordUndo` excludes the seeding
path; seed and load events carry `recordUndo: false` (confirmed in the demo's event log).

A delete announces only when `event.type === Events.BLOCK_DELETE` and `event.recordUndo`,
which keeps the `workspace.clear()` inside `serialization.workspaces.load()` silent.

**Announcing both keyboard and mouse drags is intentional.** Live-region text is inaudible
to sighted users, and a low-vision user running a magnifier alongside a screen reader may
well drag with a mouse. Gating on `keyboardNavigationController.getIsActive()` would add a
second API dependency and leave that user silent, for no benefit.

**Messages**, composed from `BlockSvg.getAriaLabel()` on the moved block and on
`block.getParent()`:

| Situation | Announcement |
|---|---|
| connected to a parent | `"move forward connected inside setup."` |
| dropped loose on the canvas | `"move forward placed on workspace, not connected, disabled."` |
| deleted | `"move forward deleted."` |
| deleted, label unknown | `"Block deleted."` |

The `", disabled"` clause is conditional on `!block.isEnabled()` rather than assumed, so it
tracks `disableOrphans` (`blockly.tsx:81`) rather than duplicating its logic. This clause
is the reason to prefer stating the outcome over a bare "Placed on workspace": an orphaned
block is silently disabled and does nothing, and today nothing tells a blind student that.

**The label cache.** By the time `BLOCK_DELETE` fires, the block is gone — there is nothing
left to ask for a label. `attachAriaAnnouncements` therefore maintains a
`Map<blockId, string>` updated on create/change/move (O(1) per event) and read on delete.
Falls back to `"Block deleted."` on a miss. This is preferred over reconstructing a label
from `event.oldJson`, which would mean re-implementing Blockly's label composition — the
exact internal coupling this design avoids.

**Failure mode.** The `announceDynamicAriaState` call is wrapped so that a failed
announcement can never break the workspace. An unspoken message is a bug; a broken canvas
is a catastrophe. Failures warn to the console rather than throwing.

### 2. `src/blocks/disclosure-field.ts`

`DisclosureField extends FieldImage`, replacing the raw `FieldImage` at
`block-factory.ts:328`.

It overrides the **public** `recomputeAriaContext()` to call `super` and then set
`aria-expanded` via `utils.aria.setState(this.getFocusableElement(), State.EXPANDED, open)`.

A subclass rather than setting attributes after construction, because Blockly re-runs
`recomputeAriaContext()` on every re-render and rewrites `role` and `aria-label` on that
element. Attributes set from the click handler would work until the first re-render and
then silently rot. Overriding the method puts our ARIA on the same lifecycle as Blockly's.

The accessible name tracks state via `setAlt()` — `FieldImage.getAriaValue()` returns the
alt text, so this is the supported path:

- collapsed → `"Show child blocks"`
- expanded → `"Hide child blocks"`

Result: *"Show child blocks, button, collapsed"* rather than *"plus slash minus, button."*

The existing `setOnClickHandler` is unchanged. `Enter` already routes to it — verified.

### 3. Role descriptions

A single map, applied once in the factory, covers every authored block:

```ts
const ARIA_ROLE_DESCRIPTIONS: Record<string, string> = {
  creator:     "creator block",
  setter:      "setter block",
  globalValue: "global value block",
  ask:         "ask block",
  action:      "action block",
  condition:   "condition block",
};
// in registerCustomBlocks() (block-factory.ts:197), inside init():
this.setAriaRoleDescriptionProvider(ARIA_ROLE_DESCRIPTIONS[blockDef.type]);
```

plus explicit `setAriaRoleDescriptionProvider(...)` calls in the `init()` of the ten static
blocks in `starter-blocks.ts` and `custom-built-in-blocks.ts`.

`setAriaRoleDescriptionProvider` is public and works from an imperative `init()`, so the
blocks stay as `Blocks[type] = { init() {…} }` — no conversion to
`defineBlocksWithJsonArray`.

A block then announces as *"create, 100, water, molecules, creator block"* rather than
*"… statement."*

### 4. Wiring

Each of the three editable `inject()` sites gains one call, disposed alongside the
workspace in the existing cleanup path:

```ts
const detachAnnouncements = attachAriaAnnouncements(newWorkspace);
```

## Testing

**Jest (pure functions).** Each guard: a bumped block, a snap, a cleanup, a load-time
create, a seeded block — all silent. Each message shape: connected, loose-and-disabled,
deleted, deleted-with-unknown-id. These need no live workspace.

**Jest (`DisclosureField`).** `aria-expanded` survives a re-render — this is the entire
reason the field is a subclass, so it is the thing to pin down.

**Real browser (Playwright).** Re-run the harness used to produce the findings above,
against the runtime iframe, asserting on the actual text in `#blocklyAriaAnnounce` after a
keyboard commit and after a delete. Automated ARIA inspection is the only way to know what
the live region really contains — it is what falsified two wrong conclusions during this
investigation.

**Manual (VoiceOver).** Confirm the strings are actually *spoken*. DOM content and speech
are not the same thing, which is the lesson of this entire ticket.

## Out of scope

**Enabling Blockly's screen-reader mode by default.** `⌥⇧A` does exactly two things:
enables audio cues on scope change, and disables wrap-around at list ends
(`core/shortcut_items.ts:1308`). It does **not** affect announcements — verified with it
both on and off. Its `enabled` flag is a module-closure local that cannot be read or set,
so replicating the mode at inject time would desynchronize Blockly's own toggle: the user's
first `⌥⇧A` would turn *off* what we turned on. Not worth it.

**NVDA / JAWS on Windows — documented risk, needs a follow-up story.** Browse mode is on by
default in both and consumes single letters, exactly as VoiceOver's Quick Nav was observed
to do (with Quick Nav on, `M` never reaches Blockly and keyboard move is unusable). Whether
NVDA auto-switches to focus mode when a Blockly block takes focus depends on the roles
Blockly applies — and the observed roles are `role="figure"` and `role="option"`, neither of
which reliably triggers the switch.

If NVDA does not switch, `M` never arrives and keyboard move is dead for the majority of
screen-reader users, who are on Windows. **This is the largest remaining unknown on QI-160
and it cannot be tested from macOS.** It must be tested on Windows hardware by someone who
has it, and a follow-up story filed if it fails. It is recorded here rather than assumed
away.

**An authoring field for per-block screen-reader descriptions.** Considered and rejected as
YAGNI: it would mean a schema change, new authoring UI, and every existing authored block
shipping blank until an author filled it in. The type-derived role descriptions above cost
nothing and cover every block immediately.

## Acceptance criteria

- [ ] Committing a user drag — keyboard or mouse — announces the block's new position,
      distinguishing a connection from a loose (and therefore disabled) drop
- [ ] Deleting a block announces the deletion
- [ ] Programmatic moves (bump, snap, cleanup, load, seed) announce nothing
- [ ] The `+/-` disclosure toggle has a stateful accessible name and exposes `aria-expanded`
- [ ] `aria-expanded` survives a block re-render
- [ ] Custom blocks announce a role description derived from their type
- [ ] Announcements are wired into the runtime and both authoring workspaces; the read-only
      report is untouched
- [ ] A failed announcement cannot break the workspace
- [ ] Verified in a real browser and with VoiceOver
- [ ] The NVDA/JAWS Windows risk is recorded on the ticket for someone with the hardware
- [ ] No imports from Blockly internals
