import Blockly, { Events, serialization, utils, WorkspaceSvg } from "blockly/core";
import * as En from "blockly/msg/en";

// The real-workspace suite at the bottom of this file needs Blockly's built-in blocks and our seed
// blocks registered, and its English messages loaded -- inject() cannot build a workspace, nor
// compose an ARIA label, without them.
import "blockly/blocks";
import "../blocks/starter-blocks";

import {
  ARIA_VERBOSITY, attachAriaAnnouncements, describeDelete, describeMove, IAnnounceableBlock,
  IAnnounceableWorkspace
} from "./aria-announce";

Blockly.setLocale(En as unknown as {[key: string]: string});

// Blockly's event type strings. Hard-coded rather than imported so these tests stay
// independent of Blockly's module graph.
const BLOCK_MOVE = "move";
const BLOCK_DELETE = "delete";

interface IMakeBlockOptions {
  id?: string;
  /** The block this one hangs off: a container when nested, the preceding block when stacked. */
  parent?: IAnnounceableBlock | null;
  /** The block that contains this one. Null for a block in a top-level stack. */
  surroundParent?: IAnnounceableBlock | null;
  /** Blocks inside this one. Blockly's `getDescendants()` includes the block itself. */
  descendants?: IAnnounceableBlock[];
  enabled?: boolean;
}

const makeBlock = (
  label: string,
  { id = label, parent = null, surroundParent = null, descendants = [], enabled = true }: IMakeBlockOptions = {}
): IAnnounceableBlock => {
  const block: IAnnounceableBlock = {
    id,
    getAriaLabel: () => label,
    getParent: () => parent,
    getSurroundParent: () => surroundParent,
    getNextBlock: () => null,
    getDescendants: () => [block, ...descendants],
    isEnabled: () => enabled
  };
  return block;
};

/** Stack `block` after `previous`, the relationship Blockly models by making the *preceding
 *  sibling* the parent. `previous.getNextBlock()` is what tells the two relationships apart. */
const stackAfter = (previous: IAnnounceableBlock, block: IAnnounceableBlock) => {
  previous.getNextBlock = () => block;
};

const makeWorkspace = (blocks: Record<string, IAnnounceableBlock>): IAnnounceableWorkspace => ({
  getBlockById: (id: string) => blocks[id] ?? null
});

const dragMove = (blockId = "b1") => ({
  type: BLOCK_MOVE, blockId, reason: ["drag"], recordUndo: true
});

describe("describeMove", () => {
  it("announces the container a block was nested into", () => {
    const parent = makeBlock("setup");
    const workspace = makeWorkspace({ b1: makeBlock("move forward", { parent, surroundParent: parent }) });

    expect(describeMove(dragMove(), workspace)).toBe("move forward connected inside setup.");
  });

  // Blockly makes the *preceding sibling* the parent of a stacked block, so announcing the parent
  // as a container would claim a nesting that does not exist ("turn right connected inside move
  // forward"). Stacking statements is the commonest thing a student does here.
  it("announces a stacked block as after its sibling, and inside the block that contains them", () => {
    const container = makeBlock("setup");
    const sibling = makeBlock("move forward", { parent: container, surroundParent: container });
    const stacked = makeBlock("turn right", { id: "b1", parent: sibling, surroundParent: container });
    stackAfter(sibling, stacked);
    const workspace = makeWorkspace({ b1: stacked });

    expect(describeMove(dragMove(), workspace)).toBe("turn right connected after move forward, inside setup.");
  });

  it("omits the container for a block stacked in a top-level stack, which has none", () => {
    const sibling = makeBlock("move forward");
    const stacked = makeBlock("turn right", { id: "b1", parent: sibling });
    stackAfter(sibling, stacked);
    const workspace = makeWorkspace({ b1: stacked });

    expect(describeMove(dragMove(), workspace)).toBe("turn right connected after move forward.");
  });

  it("announces a loose block as not connected, and disabled when disableOrphans disabled it", () => {
    const workspace = makeWorkspace({ b1: makeBlock("move forward", { enabled: false }) });

    expect(describeMove(dragMove(), workspace))
      .toBe("move forward placed on workspace, not connected, disabled.");
  });

  it("omits the disabled clause for a loose block that is still enabled", () => {
    const workspace = makeWorkspace({ b1: makeBlock("setup") });

    expect(describeMove(dragMove(), workspace)).toBe("setup placed on workspace, not connected.");
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
    const parent = makeBlock("setup");
    const ws = makeListenableWorkspace({ b1: makeBlock("move forward", { parent, surroundParent: parent }) });

    attachAriaAnnouncements(ws as never);
    ws.fire({ type: "move", blockId: "b1", reason: ["drag"], recordUndo: true });

    expect(announce).toHaveBeenCalledWith("move forward connected inside setup.");
  });

  it("names a deleted block using the label cached while it existed", () => {
    const ws = makeListenableWorkspace({ b1: makeBlock("move forward", { id: "b1" }) });

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

  // Composing the message is as dangerous as speaking it: Workspace.fireChangeListener has no
  // try/catch, and fireNow has already cleared the queue, so a throw here would swallow every
  // remaining event in the batch -- for every workspace on the page.
  it("never lets a failure while composing the message break the workspace", () => {
    const exploding: IAnnounceableBlock = {
      id: "b1",
      getAriaLabel: () => { throw new Error("label composition failed"); },
      getParent: () => null,
      getSurroundParent: () => null,
      getNextBlock: () => null,
      getDescendants: () => [exploding],
      isEnabled: () => true
    };
    const ws = makeListenableWorkspace({ b1: exploding });
    const warn = jest.spyOn(console, "warn").mockImplementation(() => undefined);

    attachAriaAnnouncements(ws as never);

    expect(() => ws.fire({ type: "move", blockId: "b1", reason: ["drag"], recordUndo: true })).not.toThrow();
    expect(warn).toHaveBeenCalled();
    expect(announce).not.toHaveBeenCalled();
  });

  it("names a block that only ever appeared as a descendant of a created block", () => {
    const child = makeBlock("move forward", { id: "child" });
    const parent = makeBlock("setup", { id: "parent", descendants: [child] });
    const ws = makeListenableWorkspace({ parent });

    attachAriaAnnouncements(ws as never);
    // A load fires ONE create, for the root of the stack. The child never gets an event of its own.
    ws.fire({ type: "create", blockId: "parent", recordUndo: false });
    ws.fire({ type: "delete", blockId: "child", ids: ["child"], recordUndo: true });

    expect(announce).toHaveBeenCalledWith("move forward deleted.");
  });

  // BLOCK_DELETE fires once for a whole stack. Evicting only the id it names would strand every
  // descendant's entry in the cache for the life of the workspace.
  it("evicts every id in a deleted stack, not just the one the event names", () => {
    const child = makeBlock("move forward", { id: "child" });
    const parent = makeBlock("setup", { id: "parent", descendants: [child] });
    const ws = makeListenableWorkspace({ parent });

    attachAriaAnnouncements(ws as never);
    ws.fire({ type: "create", blockId: "parent", recordUndo: false });
    ws.fire({ type: "delete", blockId: "parent", ids: ["parent", "child"], recordUndo: true });

    expect(announce).toHaveBeenCalledWith("setup deleted.");
    // The child's entry went with it: nothing is left in the cache to name.
    ws.fire({ type: "delete", blockId: "child", ids: ["child"], recordUndo: true });
    expect(announce).toHaveBeenLastCalledWith("Block deleted.");
  });

  it("removes its listener when disposed", () => {
    const ws = makeListenableWorkspace({ b1: makeBlock("move forward") });

    const detach = attachAriaAnnouncements(ws as never);
    expect(ws.listenerCount()).toBe(1);

    detach();
    expect(ws.listenerCount()).toBe(0);
  });
});

// The fakes above can only prove the listener does what we think Blockly asks of it. What Blockly
// actually asks is a separate question, and it is where the label cache broke: a real
// `serialization.workspaces.load()` fires exactly ONE BLOCK_CREATE, for the root of the loaded
// stack. Every block a returning student wrote lives inside setup/go/onclick, so every one of them
// is a descendant that no event ever names. Only a real load can catch that.
describe("attachAriaAnnouncements against a real Blockly workspace", () => {
  let workspace: WorkspaceSvg;
  let announce: jest.SpyInstance;
  let firedTypes: string[];

  // Blockly queues its change events and flushes them from a timer, so nothing has reached any
  // listener when `load()` or `dispose()` returns -- and it takes more than one macrotask. Waiting
  // a fixed number of ticks is a race; wait for the event itself, seen by a listener of our own.
  const waitForEvent = async (type: string) => {
    for (let i = 0; i < 100 && !firedTypes.includes(type); i++) {
      await new Promise(resolve => setTimeout(resolve, 5));
    }
    if (!firedTypes.includes(type)) throw new Error(`Blockly never fired a "${type}" event`);
  };

  // A student's saved program: their block lives inside `setup`, as it always does in this
  // interactive. `setup` is the block the runtime seeds; the `if` is the one the student added.
  const savedWork = {
    blocks: {
      languageVersion: 0,
      blocks: [{
        type: "setup",
        id: "seed_setup",
        x: 10,
        y: 10,
        inputs: { statements: { block: { type: "controls_if", id: "nested_if" } } }
      }]
    }
  };

  beforeEach(() => {
    document.body.innerHTML = "<div id=\"workspace\"></div>";
    const el = document.getElementById("workspace");
    if (!el) throw new Error("workspace element not found");
    workspace = Blockly.inject(el, { trashcan: false, toolbox: undefined });
    announce = jest.spyOn(utils.aria, "announceDynamicAriaState").mockImplementation(() => undefined);

    firedTypes = [];
    workspace.addChangeListener((event: Events.Abstract) => firedTypes.push(event.type));
    attachAriaAnnouncements(workspace);
  });

  afterEach(() => {
    workspace.dispose();
    document.body.innerHTML = "";
    jest.restoreAllMocks();
  });

  it("names a nested block restored from saved work when the student deletes it", async () => {
    serialization.workspaces.load(savedWork, workspace);
    await waitForEvent(Events.FINISHED_LOADING);

    const nested = workspace.getBlockById("nested_if");
    if (!nested) throw new Error("restored nested block not found");
    // The label a screen reader would read for this block: "if, do".
    const label = nested.getAriaLabel(ARIA_VERBOSITY);
    expect(label).toBeTruthy();

    nested.dispose(false);
    await waitForEvent(Events.BLOCK_DELETE);

    expect(announce).toHaveBeenCalledWith(`${label} deleted.`);
    expect(announce).not.toHaveBeenCalledWith("Block deleted.");
  });

  it("stays silent while the load itself is running", async () => {
    serialization.workspaces.load(savedWork, workspace);
    await waitForEvent(Events.FINISHED_LOADING);

    expect(announce).not.toHaveBeenCalled();
  });

  // `getParent()` means something different in each of these two arrangements, and the fakes above
  // can only assert the meaning we *believe* it has. These build the arrangements out of real
  // blocks, so real `getParent()` / `getNextBlock()` / `getSurroundParent()` decide the wording.
  describe("the two ways a block can be connected", () => {
    // setup { if ; print }  -- the `if` is nested in setup, the `print` is stacked after the `if`.
    const program = {
      blocks: {
        languageVersion: 0,
        blocks: [{
          type: "setup",
          id: "seed_setup",
          x: 10,
          y: 10,
          inputs: {
            statements: {
              block: {
                type: "controls_if",
                id: "nested_if",
                next: { block: { type: "text_print", id: "stacked_print" } }
              }
            }
          }
        }]
      }
    };

    const dragOf = (blockId: string) => ({ type: BLOCK_MOVE, blockId, reason: ["drag"], recordUndo: true });

    beforeEach(async () => {
      serialization.workspaces.load(program, workspace);
      await waitForEvent(Events.FINISHED_LOADING);
    });

    it("says a block nested into a container is inside it", () => {
      expect(describeMove(dragOf("nested_if"), workspace as unknown as IAnnounceableWorkspace))
        .toBe("if, do connected inside setup.");
    });

    it("says a block stacked after a sibling is after it -- Blockly calls that sibling its parent", () => {
      const stacked = workspace.getBlockById("stacked_print");
      // The relationship the old code mistook for containment: setup is the container, the `if` is
      // merely what this block follows.
      expect(stacked?.getParent()?.id).toBe("nested_if");
      expect(stacked?.getSurroundParent()?.id).toBe("seed_setup");

      expect(describeMove(dragOf("stacked_print"), workspace as unknown as IAnnounceableWorkspace))
        .toBe("print connected after if, do, inside setup.");
    });
  });
});
