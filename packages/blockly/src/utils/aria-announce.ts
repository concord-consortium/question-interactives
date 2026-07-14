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
