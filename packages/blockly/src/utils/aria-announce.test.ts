import { Events } from "blockly/core";

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
