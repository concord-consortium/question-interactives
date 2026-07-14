import { Events, utils, WorkspaceSvg } from "blockly/core";

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

/** The label cache exists because a BLOCK_DELETE event arrives after the block is gone — there is
 *  nothing left to ask for a name. Reconstructing one from event.oldJson would mean duplicating
 *  Blockly's label composition, which is exactly the internal coupling this module avoids. */
const LABEL_CACHING_EVENTS: string[] = [Events.BLOCK_CREATE, Events.BLOCK_CHANGE, Events.BLOCK_MOVE];

export function attachAriaAnnouncements(workspace: WorkspaceSvg): () => void {
  const labels = new Map<string, string>();

  const listener = (event: Events.Abstract) => {
    // The whole body is guarded, not just the announcing call. Workspace.fireChangeListener has no
    // try/catch of its own, and fireNow has already cleared the fire queue before dispatching, so a
    // throw from here -- composing a label as much as speaking it -- would drop every remaining
    // event in the batch, for every workspace on the page. An unspoken announcement is a bug; a
    // broken workspace is a catastrophe.
    try {
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

      // announceDynamicAriaState throws if the live region is not initialized.
      utils.aria.announceDynamicAriaState(message);
    } catch (e) {
      console.warn("Blockly ARIA announcement failed:", e);
    }
  };

  workspace.addChangeListener(listener);
  return () => workspace.removeChangeListener(listener);
}
