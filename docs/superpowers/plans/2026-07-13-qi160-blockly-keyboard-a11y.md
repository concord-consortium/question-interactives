# QI-160 Blockly Keyboard Accessibility Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Announce a block's new position after a move commits and after a delete, give the `+/-` disclosure toggle a real accessible name and `aria-expanded`, and give custom blocks a meaningful `aria-roledescription`.

**Architecture:** One new util (`aria-announce.ts`) splits into pure functions that compose the announcement text and a thin listener that pushes it into Blockly's live region via the public `utils.aria.announceDynamicAriaState`. One new field subclass (`disclosure-field.ts`) puts our `aria-expanded` on the same lifecycle as Blockly's own ARIA by overriding the public `recomputeAriaContext()`. Role descriptions go in via the public `setAriaRoleDescriptionProvider()`, which works from the imperative `init()` our blocks already use.

**Tech Stack:** TypeScript (strictNullChecks), React, Blockly 13.1.1, Jest + ts-jest (jsdom), Cypress.

**Spec:** `docs/superpowers/specs/2026-07-13-qi160-blockly-keyboard-a11y-design.md`
**Branch:** `QI-160-blockly-keyboard-a11y` (already cut from `origin/master`)

## Global Constraints

- **Public Blockly API only.** Do not import from `core/block_aria_composer.ts` or `core/hints.ts` (not in Blockly's barrel, marked `@internal`), and do not override `BlockDragStrategy.announceMove` (private).
- **An announcement must never break the workspace.** `announceDynamicAriaState` throws if the live region is not initialized; every call is wrapped.
- **The read-only report workspace is untouched.** `report-item/get-report-item-html.tsx` gets no listener — nothing can move or be deleted there.
- **All work happens in `packages/blockly`.** Run Jest from that directory: `cd packages/blockly && npx jest`.
- **Announce on any user drag, keyboard or mouse.** The discriminator is `event.reason?.includes("drag")` — there is no keyboard-vs-mouse signal on `BlockMove`.
- Exact announcement strings, from the spec:
  - connected → `"<block> connected inside <parent>."`
  - loose → `"<block> placed on workspace, not connected, disabled."` (`, disabled` only when `!block.isEnabled()`)
  - deleted → `"<block> deleted."`, or `"Block deleted."` when the label is unknown
- Exact disclosure labels: `"Show child blocks"` (collapsed) / `"Hide child blocks"` (expanded).

---

### Task 1: Pure announcement composers

The guards and the wording live in pure functions that need no live workspace. Blockly under jsdom is fragile (it is what made QI-181 expensive), so the logic worth testing must not require `inject()`.

**Files:**
- Create: `packages/blockly/src/utils/aria-announce.ts`
- Test: `packages/blockly/src/utils/aria-announce.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `describeMove(event: IMoveEventLike, workspace: IAnnounceableWorkspace): string | null`
  - `describeDelete(event: IDeleteEventLike, labels: Map<string, string>): string | null`
  - `IAnnounceableBlock`, `IAnnounceableWorkspace`, `IMoveEventLike`, `IDeleteEventLike`

- [ ] **Step 1: Write the failing test**

Create `packages/blockly/src/utils/aria-announce.test.ts`:

```ts
import { utils } from "blockly/core";

import {
  describeDelete, describeMove, IAnnounceableBlock, IAnnounceableWorkspace
} from "./aria-announce";

// Blockly's event type strings. Hard-coded rather than imported so these tests stay
// independent of Blockly's module graph.
const BLOCK_MOVE = "move";
const BLOCK_DELETE = "delete";

const makeBlock = (
  label: string, { parent = null, enabled = true }: { parent?: IAnnounceableBlock | null; enabled?: boolean } = {}
): IAnnounceableBlock => ({
  getAriaLabel: () => label,
  getParent: () => parent,
  isEnabled: () => enabled
});

const makeWorkspace = (blocks: Record<string, IAnnounceableBlock>): IAnnounceableWorkspace => ({
  getBlockById: (id: string) => blocks[id] ?? null
});

const dragMove = (blockId = "b1") => ({
  type: BLOCK_MOVE, blockId, reason: ["drag"], recordUndo: true
});

describe("describeMove", () => {
  it("announces the parent a block was connected into", () => {
    const parent = makeBlock("setup, empty");
    const workspace = makeWorkspace({ b1: makeBlock("move forward", { parent }) });

    expect(describeMove(dragMove(), workspace)).toBe("move forward connected inside setup, empty.");
  });

  it("announces a loose block as not connected, and disabled when disableOrphans disabled it", () => {
    const workspace = makeWorkspace({ b1: makeBlock("move forward", { enabled: false }) });

    expect(describeMove(dragMove(), workspace))
      .toBe("move forward placed on workspace, not connected, disabled.");
  });

  it("omits the disabled clause for a loose block that is still enabled", () => {
    const workspace = makeWorkspace({ b1: makeBlock("setup, empty") });

    expect(describeMove(dragMove(), workspace)).toBe("setup, empty placed on workspace, not connected.");
  });

  it.each([
    ["a bump", { reason: ["bump"] }],
    ["a snap", { reason: ["snap"] }],
    ["a cleanup", { reason: ["cleanup"] }],
    ["a connect not caused by dragging", { reason: ["connect"] }],
    ["a move with no reason at all", { reason: undefined }]
  ])("stays silent for %s", (_label, overrides) => {
    const workspace = makeWorkspace({ b1: makeBlock("move forward") });

    expect(describeMove({ ...dragMove(), ...overrides }, workspace)).toBeNull();
  });

  it("stays silent for load and seed events, which do not record undo", () => {
    const workspace = makeWorkspace({ b1: makeBlock("move forward") });

    expect(describeMove({ ...dragMove(), recordUndo: false }, workspace)).toBeNull();
  });

  it("still announces a drag merged with a bump and a snap", () => {
    const workspace = makeWorkspace({ b1: makeBlock("move forward") });
    const event = { ...dragMove(), reason: ["drag", "bump", "snap"] };

    expect(describeMove(event, workspace)).toBe("move forward placed on workspace, not connected.");
  });

  it("stays silent when the block is gone", () => {
    expect(describeMove(dragMove("missing"), makeWorkspace({}))).toBeNull();
  });

  it("stays silent for an event that is not a move", () => {
    const workspace = makeWorkspace({ b1: makeBlock("move forward") });

    expect(describeMove({ ...dragMove(), type: BLOCK_DELETE }, workspace)).toBeNull();
  });
});

describe("describeDelete", () => {
  const labels = new Map([["b1", "move forward"]]);

  it("names the deleted block from the cached label", () => {
    const event = { type: BLOCK_DELETE, blockId: "b1", recordUndo: true };

    expect(describeDelete(event, labels)).toBe("move forward deleted.");
  });

  it("falls back to a generic message when the label was never cached", () => {
    const event = { type: BLOCK_DELETE, blockId: "unknown", recordUndo: true };

    expect(describeDelete(event, labels)).toBe("Block deleted.");
  });

  it("stays silent for the workspace clear that precedes a load", () => {
    const event = { type: BLOCK_DELETE, blockId: "b1", recordUndo: false };

    expect(describeDelete(event, labels)).toBeNull();
  });

  it("stays silent for an event that is not a delete", () => {
    const event = { type: BLOCK_MOVE, blockId: "b1", recordUndo: true };

    expect(describeDelete(event, labels)).toBeNull();
  });
});

// These tests hard-code Blockly's event type strings. If Blockly ever renames them, the tests
// above would keep passing against a listener that no longer fires. Pin them.
describe("Blockly event type strings", () => {
  it("match the constants these tests hard-code", () => {
    expect(Events.BLOCK_MOVE).toBe(BLOCK_MOVE);
    expect(Events.BLOCK_DELETE).toBe(BLOCK_DELETE);
  });
});
```

The `Events` import this needs goes at the top of the test file alongside `utils`:

```ts
import { Events, utils } from "blockly/core";
```

- [ ] **Step 2: Run the test and verify it fails**

Run: `cd packages/blockly && npx jest src/utils/aria-announce.test.ts`
Expected: FAIL — `Cannot find module './aria-announce'`.

- [ ] **Step 3: Write the implementation**

Create `packages/blockly/src/utils/aria-announce.ts`:

```ts
import { Events, utils } from "blockly/core";

/**
 * Blockly narrates a block's journey during a keyboard move ("Moving inside setup, empty.")
 * but says nothing when the move commits, and nothing when a block is deleted. A student who
 * cannot see the canvas has no way to know whether a drop landed, or landed where they meant.
 * These functions compose what the live region should say; `attachAriaAnnouncements` pushes it.
 *
 * The shapes below are structural on purpose. BlockSvg and WorkspaceSvg satisfy them, but the
 * pure functions can be unit-tested with plain objects, without standing up a Blockly workspace
 * under jsdom.
 */
export interface IAnnounceableBlock {
  getAriaLabel(verbosity: utils.aria.Verbosity): string;
  getParent(): IAnnounceableBlock | null;
  isEnabled(): boolean;
}

export interface IAnnounceableWorkspace {
  getBlockById(id: string): IAnnounceableBlock | null;
}

export interface IMoveEventLike {
  type: string;
  blockId?: string;
  reason?: string[];
  recordUndo: boolean;
}

export interface IDeleteEventLike {
  type: string;
  blockId?: string;
  recordUndo: boolean;
}

/** Keyboard commits route through the same dragger as the mouse, so both land here. Programmatic
 *  moves (bump, snap, cleanup, connect, load) carry other reasons and must stay silent. */
const USER_DRAG = "drag";

/** TERSE keeps the parent's label to its own name rather than reciting its whole subtree. */
export const ARIA_VERBOSITY = utils.aria.Verbosity.TERSE;

export function describeMove(event: IMoveEventLike, workspace: IAnnounceableWorkspace): string | null {
  if (event.type !== Events.BLOCK_MOVE) return null;
  // Seed and load events carry recordUndo: false; only a real user action records undo.
  if (!event.recordUndo) return null;
  if (!event.reason?.includes(USER_DRAG)) return null;
  if (!event.blockId) return null;

  const block = workspace.getBlockById(event.blockId);
  if (!block) return null;

  const label = block.getAriaLabel(ARIA_VERBOSITY);
  const parent = block.getParent();
  if (parent) {
    return `${label} connected inside ${parent.getAriaLabel(ARIA_VERBOSITY)}.`;
  }

  // An orphaned block is silently disabled by disableOrphans and does nothing. Say so.
  const disabled = block.isEnabled() ? "" : ", disabled";
  return `${label} placed on workspace, not connected${disabled}.`;
}

export function describeDelete(event: IDeleteEventLike, labels: Map<string, string>): string | null {
  if (event.type !== Events.BLOCK_DELETE) return null;
  // workspace.clear() during a load fires a delete per block, none of which record undo.
  if (!event.recordUndo) return null;

  const label = event.blockId ? labels.get(event.blockId) : undefined;
  return label ? `${label} deleted.` : "Block deleted.";
}
```

- [ ] **Step 4: Run the test and verify it passes**

Run: `cd packages/blockly && npx jest src/utils/aria-announce.test.ts`
Expected: PASS — every test green.

If TypeScript rejects `utils.aria.Verbosity` as a type annotation, replace the `getAriaLabel` signature in `IAnnounceableBlock` with `getAriaLabel(verbosity: number): string` — `Verbosity` is a numeric enum (`TERSE = 0`), so this is equivalent and still accepts `BlockSvg`.

- [ ] **Step 5: Lint and commit**

```bash
cd packages/blockly && npm run lint
git add src/utils/aria-announce.ts src/utils/aria-announce.test.ts
git commit -m "feat: compose ARIA announcements for block moves and deletes [QI-160]"
```

---

### Task 2: The announcement listener

**Files:**
- Modify: `packages/blockly/src/utils/aria-announce.ts`
- Test: `packages/blockly/src/utils/aria-announce.test.ts`

**Interfaces:**
- Consumes: `describeMove`, `describeDelete` from Task 1.
- Produces: `attachAriaAnnouncements(workspace: WorkspaceSvg): () => void` — attaches one change listener, returns a disposer.

The listener needs a label cache. By the time `BLOCK_DELETE` fires, the block is gone and there is nothing left to ask for a label, so labels are recorded on create/change/move and read on delete.

- [ ] **Step 1: Write the failing test**

Append to `packages/blockly/src/utils/aria-announce.test.ts`:

```ts
import { attachAriaAnnouncements } from "./aria-announce";

// A fake WorkspaceSvg: enough surface for the listener, no Blockly rendering.
const makeListenableWorkspace = (blocks: Record<string, IAnnounceableBlock>) => {
  const listeners: Array<(event: unknown) => void> = [];
  return {
    getBlockById: (id: string) => blocks[id] ?? null,
    addChangeListener: (fn: (event: unknown) => void) => { listeners.push(fn); return fn; },
    removeChangeListener: (fn: (event: unknown) => void) => {
      const i = listeners.indexOf(fn);
      if (i >= 0) listeners.splice(i, 1);
    },
    fire: (event: unknown) => listeners.forEach(fn => fn(event)),
    listenerCount: () => listeners.length
  };
};

describe("attachAriaAnnouncements", () => {
  let announce: jest.SpyInstance;

  beforeEach(() => {
    announce = jest.spyOn(utils.aria, "announceDynamicAriaState").mockImplementation(() => undefined);
  });

  afterEach(() => jest.restoreAllMocks());

  it("announces where a dragged block landed", () => {
    const parent = makeBlock("setup, empty");
    const ws = makeListenableWorkspace({ b1: makeBlock("move forward", { parent }) });

    attachAriaAnnouncements(ws as never);
    ws.fire({ type: "move", blockId: "b1", reason: ["drag"], recordUndo: true });

    expect(announce).toHaveBeenCalledWith("move forward connected inside setup, empty.");
  });

  it("names a deleted block using the label cached while it existed", () => {
    const ws = makeListenableWorkspace({ b1: makeBlock("move forward") });

    attachAriaAnnouncements(ws as never);
    // The block is seen while it still exists...
    ws.fire({ type: "create", blockId: "b1", recordUndo: true });
    // ...then deleted, at which point getBlockById would return null.
    ws.fire({ type: "delete", blockId: "b1", recordUndo: true });

    expect(announce).toHaveBeenCalledWith("move forward deleted.");
  });

  it("says nothing for programmatic events", () => {
    const ws = makeListenableWorkspace({ b1: makeBlock("move forward") });

    attachAriaAnnouncements(ws as never);
    ws.fire({ type: "move", blockId: "b1", reason: ["bump"], recordUndo: true });
    ws.fire({ type: "move", blockId: "b1", reason: ["drag"], recordUndo: false });
    ws.fire({ type: "delete", blockId: "b1", recordUndo: false });

    expect(announce).not.toHaveBeenCalled();
  });

  it("never lets a failed announcement break the workspace", () => {
    const ws = makeListenableWorkspace({ b1: makeBlock("move forward") });
    announce.mockImplementation(() => { throw new Error("ARIA live region not initialized."); });
    const warn = jest.spyOn(console, "warn").mockImplementation(() => undefined);

    attachAriaAnnouncements(ws as never);

    expect(() => ws.fire({ type: "move", blockId: "b1", reason: ["drag"], recordUndo: true })).not.toThrow();
    expect(warn).toHaveBeenCalled();
  });

  it("removes its listener when disposed", () => {
    const ws = makeListenableWorkspace({ b1: makeBlock("move forward") });

    const detach = attachAriaAnnouncements(ws as never);
    expect(ws.listenerCount()).toBe(1);

    detach();
    expect(ws.listenerCount()).toBe(0);
  });
});
```

- [ ] **Step 2: Run the test and verify it fails**

Run: `cd packages/blockly && npx jest src/utils/aria-announce.test.ts`
Expected: FAIL — `attachAriaAnnouncements is not a function`.

- [ ] **Step 3: Write the implementation**

Add to `packages/blockly/src/utils/aria-announce.ts`. Extend the import to include `WorkspaceSvg`:

```ts
import { Events, utils, WorkspaceSvg } from "blockly/core";
```

and append:

```ts
/** The label cache exists because a BLOCK_DELETE event arrives after the block is gone — there is
 *  nothing left to ask for a name. Reconstructing one from event.oldJson would mean duplicating
 *  Blockly's label composition, which is exactly the internal coupling this module avoids. */
const LABEL_CACHING_EVENTS: string[] = [Events.BLOCK_CREATE, Events.BLOCK_CHANGE, Events.BLOCK_MOVE];

export function attachAriaAnnouncements(workspace: WorkspaceSvg): () => void {
  const labels = new Map<string, string>();

  const listener = (event: Events.Abstract) => {
    const { blockId } = event as unknown as { blockId?: string };

    if (blockId && LABEL_CACHING_EVENTS.includes(event.type)) {
      const block = workspace.getBlockById(blockId);
      if (block) labels.set(blockId, block.getAriaLabel(ARIA_VERBOSITY));
    }

    let message: string | null = null;
    if (event.type === Events.BLOCK_MOVE) {
      message = describeMove(event as unknown as IMoveEventLike, workspace);
    } else if (event.type === Events.BLOCK_DELETE) {
      message = describeDelete(event as unknown as IDeleteEventLike, labels);
      if (blockId) labels.delete(blockId);
    }

    if (!message) return;

    try {
      utils.aria.announceDynamicAriaState(message);
    } catch (e) {
      // announceDynamicAriaState throws if the live region is not initialized. An unspoken
      // announcement is a bug; a broken workspace is a catastrophe.
      console.warn("Blockly ARIA announcement failed:", e);
    }
  };

  workspace.addChangeListener(listener);
  return () => workspace.removeChangeListener(listener);
}
```

- [ ] **Step 4: Run the test and verify it passes**

Run: `cd packages/blockly && npx jest src/utils/aria-announce.test.ts`
Expected: PASS — the Task 1 tests plus the five new listener tests.

- [ ] **Step 5: Lint and commit**

```bash
cd packages/blockly && npm run lint
git add src/utils/aria-announce.ts src/utils/aria-announce.test.ts
git commit -m "feat: push move and delete announcements to Blockly's live region [QI-160]"
```

---

### Task 3: The disclosure field

The `+/-` toggle is a `FieldImage` whose alt text is the literal string `"+/-"`, which a screen reader reads as "plus slash minus, button". It also never exposes `aria-expanded`.

A subclass rather than setting attributes from the click handler: Blockly re-runs `recomputeAriaContext()` on every re-render and rewrites `role` and `aria-label` on that element, so attributes set outside that lifecycle would work until the first re-render and then silently rot.

**Files:**
- Create: `packages/blockly/src/blocks/disclosure-field.ts`
- Test: `packages/blockly/src/blocks/disclosure-field.test.ts`
- Modify: `packages/blockly/src/blocks/block-factory.ts` (lines 13-19 constants, and the disclosure block at 321-372)
- Modify: `packages/blockly/src/blocks/block-factory.test.ts` (add a mock for the new module)

**Interfaces:**
- Consumes: nothing.
- Produces: `class DisclosureField extends FieldImage` with `setExpanded(expanded: boolean): void` and `isExpanded(): boolean`; constants `DISCLOSURE_LABEL_COLLAPSED = "Show child blocks"`, `DISCLOSURE_LABEL_EXPANDED = "Hide child blocks"`.

- [ ] **Step 1: Write the failing test**

Create `packages/blockly/src/blocks/disclosure-field.test.ts`:

```ts
import { FieldImage } from "blockly/core";

import {
  DISCLOSURE_LABEL_COLLAPSED, DISCLOSURE_LABEL_EXPANDED, DisclosureField
} from "./disclosure-field";

const ICON = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg'/>";

describe("DisclosureField", () => {
  let element: SVGElement;
  let field: DisclosureField;

  beforeEach(() => {
    element = document.createElementNS("http://www.w3.org/2000/svg", "g");
    field = new DisclosureField(ICON, 16, 16, DISCLOSURE_LABEL_COLLAPSED);

    // Blockly's own ARIA pass needs a rendered field; stub it out so these tests exercise
    // only our override. Rendering Blockly under jsdom is what made QI-181 expensive.
    jest.spyOn(FieldImage.prototype, "recomputeAriaContext").mockReturnValue(true);
    jest.spyOn(field, "getFocusableElement").mockReturnValue(element);
  });

  afterEach(() => jest.restoreAllMocks());

  it("starts collapsed and says so", () => {
    field.recomputeAriaContext();

    expect(field.isExpanded()).toBe(false);
    expect(element.getAttribute("aria-expanded")).toBe("false");
  });

  it("exposes aria-expanded when expanded", () => {
    const setAlt = jest.spyOn(field, "setAlt").mockImplementation(() => undefined);

    field.setExpanded(true);

    expect(field.isExpanded()).toBe(true);
    expect(element.getAttribute("aria-expanded")).toBe("true");
    expect(setAlt).toHaveBeenCalledWith(DISCLOSURE_LABEL_EXPANDED);
  });

  it("goes back to the collapsed name when closed", () => {
    const setAlt = jest.spyOn(field, "setAlt").mockImplementation(() => undefined);

    field.setExpanded(true);
    field.setExpanded(false);

    expect(element.getAttribute("aria-expanded")).toBe("false");
    expect(setAlt).toHaveBeenLastCalledWith(DISCLOSURE_LABEL_COLLAPSED);
  });

  // The whole reason this is a subclass: Blockly rewrites this element's ARIA on every
  // re-render, so aria-expanded has to be re-applied on Blockly's own lifecycle.
  it("re-applies aria-expanded after Blockly re-renders the field", () => {
    jest.spyOn(field, "setAlt").mockImplementation(() => undefined);
    field.setExpanded(true);

    element.removeAttribute("aria-expanded");   // what a re-render does
    field.recomputeAriaContext();

    expect(element.getAttribute("aria-expanded")).toBe("true");
  });
});
```

- [ ] **Step 2: Run the test and verify it fails**

Run: `cd packages/blockly && npx jest src/blocks/disclosure-field.test.ts`
Expected: FAIL — `Cannot find module './disclosure-field'`.

- [ ] **Step 3: Write the implementation**

Create `packages/blockly/src/blocks/disclosure-field.ts`:

```ts
import { FieldImage, utils } from "blockly/core";

export const DISCLOSURE_LABEL_COLLAPSED = "Show child blocks";
export const DISCLOSURE_LABEL_EXPANDED = "Hide child blocks";

/**
 * The +/- toggle that opens a custom block's child-block area.
 *
 * FieldImage announces its alt text verbatim, so the old `"+/-"` alt read out as
 * "plus slash minus, button", and whether the block was open or closed was invisible.
 *
 * aria-expanded is applied by overriding `recomputeAriaContext` (public API) rather than by
 * setting the attribute from the click handler: Blockly re-runs `recomputeAriaContext` on every
 * re-render and rewrites `role` and `aria-label` on this element, so an attribute set outside
 * that lifecycle would survive until the first re-render and then silently disappear.
 */
export class DisclosureField extends FieldImage {
  private expanded = false;

  isExpanded(): boolean {
    return this.expanded;
  }

  setExpanded(expanded: boolean) {
    this.expanded = expanded;
    this.setAlt(expanded ? DISCLOSURE_LABEL_EXPANDED : DISCLOSURE_LABEL_COLLAPSED);
    this.recomputeAriaContext();
  }

  override recomputeAriaContext(): boolean {
    const customized = super.recomputeAriaContext();
    const element: HTMLElement | SVGElement | null = this.getFocusableElement();
    if (element) {
      utils.aria.setState(element, utils.aria.State.EXPANDED, this.expanded);
    }
    return customized;
  }
}
```

- [ ] **Step 4: Run the test and verify it passes**

Run: `cd packages/blockly && npx jest src/blocks/disclosure-field.test.ts`
Expected: PASS, 4 tests.

- [ ] **Step 5: Use it in the block factory**

In `packages/blockly/src/blocks/block-factory.ts`, add the import:

```ts
import { DISCLOSURE_LABEL_COLLAPSED, DisclosureField } from "./disclosure-field";
```

Then replace the disclosure icon construction (currently `const icon = new FieldImage(PLUS_ICON, 16, 16, "+/-");` at line 328) with:

```ts
          // Add open/close toggle button.
          const icon = new DisclosureField(PLUS_ICON, 16, 16, DISCLOSURE_LABEL_COLLAPSED);
```

and inside that field's `setOnClickHandler` callback, alongside the existing `icon.setValue(...)` call (line 368), add the `setExpanded` call so the name and `aria-expanded` track the icon:

```ts
            icon.setValue(open ? MINUS_ICON : PLUS_ICON);
            icon.setExpanded(open);
            this.render();
```

`FieldImage` may now be unused in `block-factory.ts`; if lint reports it, drop it from the `blockly/core` import.

- [ ] **Step 6: Keep the existing block-factory tests working**

`block-factory.test.ts` mocks the whole of `blockly/core`, so importing `disclosure-field.ts` (which reaches for `utils.aria`) from `block-factory.ts` would break it. Mock the new module instead. Add near the other `jest.mock` calls at the top of `packages/blockly/src/blocks/block-factory.test.ts`:

```ts
jest.mock("./disclosure-field", () => ({
  DISCLOSURE_LABEL_COLLAPSED: "Show child blocks",
  DISCLOSURE_LABEL_EXPANDED: "Hide child blocks",
  DisclosureField: jest.fn().mockImplementation((src, width, height, alt) => ({
    setValue: jest.fn(),
    setExpanded: jest.fn(),
    setOnClickHandler: jest.fn(),
    src, width, height, alt
  }))
}));
```

- [ ] **Step 7: Run the blocks tests and verify they pass**

Run: `cd packages/blockly && npx jest src/blocks`
Expected: PASS. `block-factory.nested-override.test.ts` uses real Blockly and exercises the real `DisclosureField`, so a pass there confirms the subclass works inside an injected workspace.

- [ ] **Step 8: Lint and commit**

```bash
cd packages/blockly && npm run lint
git add src/blocks/disclosure-field.ts src/blocks/disclosure-field.test.ts src/blocks/block-factory.ts src/blocks/block-factory.test.ts
git commit -m "fix: give the disclosure toggle a real name and aria-expanded [QI-160]"
```

---

### Task 4: Role descriptions

Authored blocks announce as Blockly's structural `"statement"` / `"value"`, which says nothing about what the block is. `setAriaRoleDescriptionProvider` is public and works from the imperative `init()` these blocks already use, so no conversion to `defineBlocksWithJsonArray`.

**Files:**
- Modify: `packages/blockly/src/blocks/block-factory.ts`
- Modify: `packages/blockly/src/blocks/starter-blocks.ts`
- Modify: `packages/blockly/src/blocks/custom-built-in-blocks.ts`
- Modify: `packages/blockly/src/blocks/block-factory.test.ts` (the mock block needs the new method)
- Test: `packages/blockly/src/blocks/block-factory.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `ariaRoleDescriptionForType(type: string): string | undefined`, exported from `block-factory.ts`.

- [ ] **Step 1: Write the failing test**

Add to `packages/blockly/src/blocks/block-factory.test.ts`. The mock block currently has no `setAriaRoleDescriptionProvider`, so first add it to the `mockBlock` object literal (around line 95-113), alongside `setColour`:

```ts
      setAriaRoleDescriptionProvider: jest.fn(),
```

Then add this describe block:

```ts
import { ariaRoleDescriptionForType, registerCustomBlocks } from "./block-factory";

describe("aria role descriptions", () => {
  it("maps every authored block type to a description a student would recognize", () => {
    expect(ariaRoleDescriptionForType("creator")).toBe("creator block");
    expect(ariaRoleDescriptionForType("setter")).toBe("setter block");
    expect(ariaRoleDescriptionForType("globalValue")).toBe("global value block");
    expect(ariaRoleDescriptionForType("ask")).toBe("ask block");
    expect(ariaRoleDescriptionForType("action")).toBe("action block");
    expect(ariaRoleDescriptionForType("condition")).toBe("condition block");
  });

  it("has no description for a type it does not know", () => {
    expect(ariaRoleDescriptionForType("builtIn")).toBeUndefined();
  });

  it("applies the description when the block is registered", () => {
    const blockDef: ICustomBlock = {
      category: "Properties",
      color: "#ff0000",
      config: {},
      id: "custom_action_move",
      name: "move",
      type: "action"
    };

    registerCustomBlocks([blockDef]);
    Blocks.custom_action_move.init.call(mockBlock);

    expect(mockBlock.setAriaRoleDescriptionProvider).toHaveBeenCalledWith("action block");
  });
});
```

- [ ] **Step 2: Run the test and verify it fails**

Run: `cd packages/blockly && npx jest src/blocks/block-factory.test.ts`
Expected: FAIL — `ariaRoleDescriptionForType is not a function`.

- [ ] **Step 3: Add the map and apply it in the factory**

In `packages/blockly/src/blocks/block-factory.ts`, add near the top-level constants:

```ts
/** Blockly's default role description for our blocks is the structural "statement" or "value",
 *  which tells a student nothing about what the block does. These names match the block types
 *  authors already work in and the toolbox categories students already see. */
const ARIA_ROLE_DESCRIPTIONS: Record<string, string> = {
  action: "action block",
  ask: "ask block",
  condition: "condition block",
  creator: "creator block",
  globalValue: "global value block",
  setter: "setter block"
};

export const ariaRoleDescriptionForType = (type: string): string | undefined =>
  ARIA_ROLE_DESCRIPTIONS[type];
```

Then inside `registerCustomBlocks`'s `init()` (after `const input = this.appendDummyInput();`, around line 202), add:

```ts
        const roleDescription = ariaRoleDescriptionForType(blockDef.type);
        if (roleDescription) this.setAriaRoleDescriptionProvider(roleDescription);
```

- [ ] **Step 4: Run the test and verify it passes**

Run: `cd packages/blockly && npx jest src/blocks/block-factory.test.ts`
Expected: PASS.

- [ ] **Step 5: Describe the static blocks too**

In `packages/blockly/src/blocks/starter-blocks.ts`, add `this.setAriaRoleDescriptionProvider("program section");` to each of the three `init()` bodies, after `this.setColour(BG_COLOR);`. These are the top-level hats a program hangs from — "program section" says more than Blockly's "container".

```ts
Blocks.setup = {
  init() {
    // ...existing body...
    this.setColour(BG_COLOR);
    this.setAriaRoleDescriptionProvider("program section");
  }
};
```

Do the same in `Blocks.go` and `Blocks.onclick`.

In `packages/blockly/src/blocks/custom-built-in-blocks.ts`, add to each `init()` after `this.setColour(BG_COLOR);`:

- `chance`, `repeat`, `when` → `this.setAriaRoleDescriptionProvider("control block");`
- `number`, `mathOperation`, `randomInteger`, `comparison` → `this.setAriaRoleDescriptionProvider("value block");`

- [ ] **Step 6: Run the full blocks suite**

Run: `cd packages/blockly && npx jest src/blocks`
Expected: PASS. `starter-blocks.test.ts` calls these `init()` bodies — if its mock block lacks `setAriaRoleDescriptionProvider`, add `setAriaRoleDescriptionProvider: jest.fn()` to that mock the same way.

- [ ] **Step 7: Lint and commit**

```bash
cd packages/blockly && npm run lint
git add src/blocks/
git commit -m "feat: announce what each block is, not just its structure [QI-160]"
```

---

### Task 5: Wire it up and verify in a real browser

**Files:**
- Modify: `packages/blockly/src/components/blockly.tsx` (inject at line 73; cleanup at 213-218)
- Modify: `packages/blockly/src/components/starter-program-editor.tsx` (inject at line 58; cleanup returns from the effect)
- Modify: `packages/blockly/src/components/custom-block-form-child-blocks.tsx` (inject at line 59; cleanup returns from the effect)
- Modify: `packages/tests-e2e/e2e/blockly.test.js`

**Interfaces:**
- Consumes: `attachAriaAnnouncements` from Task 2.
- Produces: nothing.

The read-only report workspace (`report-item/get-report-item-html.tsx`) is deliberately **not** wired — nothing can move or be deleted there.

- [ ] **Step 1: Attach the listener in the student runtime**

In `packages/blockly/src/components/blockly.tsx`, import:

```ts
import { attachAriaAnnouncements } from "../utils/aria-announce";
```

Inside `initWorkspace`, after `newWorkspace.addChangeListener(saveState);` (line 130), add:

```ts
        attachAriaAnnouncements(newWorkspace);
```

The workspace is disposed on re-init and unmount (lines 62-65, 213-218), and disposal drops its listeners, so no separate detach is needed here.

- [ ] **Step 2: Attach the listener in both authoring workspaces**

In `packages/blockly/src/components/starter-program-editor.tsx`, import `attachAriaAnnouncements` from `../utils/aria-announce`, then after `workspace.addChangeListener(listener);` add:

```ts
    const detachAnnouncements = attachAriaAnnouncements(workspace);
```

and call it in the effect's existing cleanup, before `workspace.dispose()`:

```ts
    return () => {
      detachAnnouncements();
      workspace.removeChangeListener(listener);
      workspace.dispose();
      container.innerHTML = "";
    };
```

In `packages/blockly/src/components/custom-block-form-child-blocks.tsx`, do the same: import it, add `const detachAnnouncements = attachAriaAnnouncements(newWorkspace);` after `newWorkspace.addChangeListener(saveState);`, and call `detachAnnouncements();` first in the effect's cleanup, before `newWorkspace.removeChangeListener(saveState);`.

- [ ] **Step 3: Run the whole package suite**

Run: `cd packages/blockly && npx jest`
Expected: PASS, all suites. Component tests inject real Blockly under jsdom, so this is where a bad `utils.aria` call would surface.

- [ ] **Step 4: Write the Cypress regression test**

QI-181's Cypress spec covers the live region and reaching a block, and explicitly left keyboard drag-and-drop to QI-160. This closes that.

Add to `packages/tests-e2e/e2e/blockly.test.js`. First, give the runtime a starter program with a block that can actually be connected — replace the `authoredState` object with:

```js
const authoredState = {
  version: 1,
  questionType: "iframe_interactive",
  simulationCode: "",
  customBlocks: [],
  // A loose controls_if alongside the seed blocks, so a keyboard user has something to move.
  starterBlocklyState: JSON.stringify({
    blocks: {
      languageVersion: 0,
      blocks: [
        { type: "setup", id: "seed_setup", x: 10, y: 10, deletable: false },
        { type: "controls_if", id: "loose_if", x: 240, y: 10 }
      ]
    }
  }),
  toolbox: JSON.stringify({
    kind: "flyoutToolbox",
    contents: [
      { kind: "block", type: "controls_if" }
    ]
  })
};
```

Then add this context, inside `context("Runtime view", ...)`:

```js
    // Blockly narrates a block's journey during a move but says nothing when it lands. Without
    // these announcements a student who cannot see the canvas has no way to know a drop worked.
    context("announcements", () => {
      // Blockly reads KeyboardEvent fields, so a plain Event (Cypress's default) is ignored.
      const pressKey = (key, code, keyCode) => {
        cy.getIframeBody().find(".blocklyActiveFocus").first().trigger("keydown", {
          eventConstructor: "KeyboardEvent",
          key, code, keyCode, which: keyCode,
          bubbles: true, cancelable: true
        });
      };

      const focusLooseIf = () => {
        cy.getIframeBody().find("g.controls_if > path.blocklyPath").first().click({ force: true });
        cy.getIframeBody().find("path.blocklyPath.blocklyActiveFocus").should("exist");
      };

      it("announces the parent a block was connected into", () => {
        focusLooseIf();

        pressKey("m", "KeyM", 77);            // enter move mode
        pressKey("ArrowDown", "ArrowDown", 40); // walk to a candidate connection
        pressKey("Enter", "Enter", 13);         // commit

        cy.getIframeBody().find("#blocklyAriaAnnounce").should("contain", "connected inside");
      });

      it("announces a deletion", () => {
        focusLooseIf();

        pressKey("Delete", "Delete", 46);

        cy.getIframeBody().find("#blocklyAriaAnnounce").should("contain", "deleted");
      });
    });
```

- [ ] **Step 5: Run Cypress and verify it passes**

```bash
npm run build && npm start          # terminal 1, serves dist/
npm run test:cypress                # terminal 2
```

Expected: PASS, including the two new announcement tests.

If a key does not register, the likely cause is the keydown target. `.blocklyActiveFocus` is the element Blockly focuses; if it has moved, target `g.blocklyWorkspace` instead and re-run. Confirm the assertion text against what actually lands in `#blocklyAriaAnnounce` — do not loosen the assertion to make it pass.

- [ ] **Step 6: Verify the real announcement strings in a browser**

The Cypress assertions use `contain`, so they would pass on a badly-worded string. Read the actual text once:

```bash
cd packages/blockly && npm start    # serves the demo at http://localhost:8080/blockly/demo.html
```

Open `http://localhost:8080/blockly/demo.html`, and in the runtime pane: Tab to the toolbox, `→` into the flyout, `Enter` to pick a block up, arrows to a candidate, `Enter` to commit. Then in DevTools, inspect `#blocklyAriaAnnounce` inside the runtime iframe.

Confirm it reads like `"<block> connected inside <parent>."` and that the parent's label is its own name rather than a recitation of its whole subtree. If the parent label is too verbose, `ARIA_VERBOSITY` in `aria-announce.ts` is the single knob — it is already `TERSE`, the tersest setting, so a verbose label means `getAriaLabel` is composing more than expected and the composition needs revisiting rather than the constant.

Also confirm the `+/-` toggle on a creator block now reports `aria-label="Show child blocks"` and `aria-expanded="false"`, flipping to `"Hide child blocks"` / `"true"` when opened with `Enter`.

- [ ] **Step 7: Manual VoiceOver pass**

DOM content and speech are not the same thing — this is the lesson of the whole ticket, and it is why this step is not optional.

Turn on VoiceOver (`Cmd+F5`), enable the caption panel (VoiceOver Utility → Panels and Menus → Show Caption Panel), and make sure **Quick Nav is off** (press `←` and `→` together) or single-letter shortcuts like `M` never reach Blockly.

Repeat the move from Step 6 and confirm:
- committing the move is **spoken**, naming the new parent
- deleting a block is **spoken**
- the `+/-` toggle reads as "Show child blocks, button, collapsed" rather than "plus slash minus, button"

- [ ] **Step 8: Full check, then commit**

```bash
cd /Users/kswenson/Development/cc-dev/question-interactives
npm run lint && npm test
git add packages/blockly/src/components packages/tests-e2e/e2e/blockly.test.js
git commit -m "feat: announce block moves and deletes in every editable workspace [QI-160]"
```

---

## Follow-up, not in this plan

**NVDA / JAWS on Windows.** Browse mode is on by default in both and consumes single letters, exactly as VoiceOver's Quick Nav was observed to do — with Quick Nav on, `M` never reaches Blockly and keyboard move is unusable. Whether NVDA auto-switches to focus mode when a Blockly block takes focus depends on the roles Blockly applies, and the observed roles (`figure`, `option`) do not reliably trigger the switch.

If it does not switch, `M` never arrives and keyboard move is dead for the majority of screen-reader users, who are on Windows. **This is the largest remaining unknown on QI-160 and cannot be tested from macOS.** It needs Windows hardware and a follow-up story if it fails. Record it on the ticket; do not let this plan's completion imply it was checked.
