import { Events, utils } from "blockly/core";

import {
  attachAriaAnnouncements, describeDelete, describeMove, IAnnounceableBlock, IAnnounceableWorkspace
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

  // Composing the message is as dangerous as speaking it: Workspace.fireChangeListener has no
  // try/catch, and fireNow has already cleared the queue, so a throw here would swallow every
  // remaining event in the batch -- for every workspace on the page.
  it("never lets a failure while composing the message break the workspace", () => {
    const exploding: IAnnounceableBlock = {
      getAriaLabel: () => { throw new Error("label composition failed"); },
      getParent: () => null,
      isEnabled: () => true
    };
    const ws = makeListenableWorkspace({ b1: exploding });
    const warn = jest.spyOn(console, "warn").mockImplementation(() => undefined);

    attachAriaAnnouncements(ws as never);

    expect(() => ws.fire({ type: "move", blockId: "b1", reason: ["drag"], recordUndo: true })).not.toThrow();
    expect(warn).toHaveBeenCalled();
    expect(announce).not.toHaveBeenCalled();
  });

  it("removes its listener when disposed", () => {
    const ws = makeListenableWorkspace({ b1: makeBlock("move forward") });

    const detach = attachAriaAnnouncements(ws as never);
    expect(ws.listenerCount()).toBe(1);

    detach();
    expect(ws.listenerCount()).toBe(0);
  });
});
