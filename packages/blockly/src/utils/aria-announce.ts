import { Events, utils, WorkspaceSvg } from "blockly/core";

/**
 * Blockly narrates a block's journey during a keyboard move ("Moving inside setup.") but says
 * nothing when the move commits, and nothing when a block is deleted. A student who cannot see
 * the canvas has no way to know whether a drop landed, or landed where they meant. These
 * functions compose what the live region should say; `attachAriaAnnouncements` pushes it.
 *
 * The shapes below are structural on purpose. BlockSvg and WorkspaceSvg satisfy them, but the
 * pure functions can be unit-tested with plain objects, without standing up a Blockly workspace
 * under jsdom.
 *
 * Public API only. Blockly composes its own move narration in `core/block_aria_composer.ts`
 * (`computeMoveLabel`, `configureAriaRole`) and `core/hints.ts`, and `BlockDragStrategy.announceMove`
 * is private -- none are exported from Blockly's barrel, and all are marked @internal. They are the
 * obvious place to reach when asked to improve this wording, and they are off limits: composing our
 * own text from public getters is what keeps a Blockly upgrade from breaking this file.
 */
export interface IAnnounceableBlock {
  id: string;
  getAriaLabel(verbosity: utils.aria.Verbosity): string;
  getParent(): IAnnounceableBlock | null;
  /** The block that *contains* this one (an if, a loop, setup), skipping previous-statement
   *  parents. Null for a block in a top-level stack. */
  getSurroundParent(): IAnnounceableBlock | null;
  /** Compared by identity only, so it is typed loosely: Blockly's `getNextBlock()` returns a
   *  `Block`, which -- unlike `BlockSvg` -- has no `getAriaLabel`. */
  getNextBlock(): unknown;
  getDescendants(ordered: boolean): IAnnounceableBlock[];
  isEnabled(): boolean;
  /** A block with neither connection has nothing it *could* attach to: `setup`/`go`/`onclick` are
   *  top level by design. Held only to tell them apart from a block dropped loose, so they are
   *  typed as loosely as that use allows. */
  previousConnection: object | null;
  outputConnection: object | null;
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
  /** Every id in the deleted stack. BLOCK_DELETE fires once for the stack, not once per block. */
  ids?: string[];
  recordUndo: boolean;
}

/** Keyboard commits route through the same dragger as the mouse, so both land here. Programmatic
 *  moves (bump, snap, cleanup, connect, load) carry other reasons and must stay silent.
 *
 *  Announcing mouse drags as well as keyboard ones is deliberate: live-region text is inaudible to
 *  sighted users, and a low-vision user running a magnifier alongside a screen reader may well drag
 *  with a mouse. Do not narrow this to keyboardNavigationController.getIsActive() -- it buys nothing
 *  and silences exactly that user. */
const USER_DRAG = "drag";

/** TERSE keeps the parent's label to its own name rather than reciting its whole subtree. */
export const ARIA_VERBOSITY = utils.aria.Verbosity.TERSE;

export function describeMove(event: IMoveEventLike, workspace: IAnnounceableWorkspace): string | null {
  if (event.type !== Events.BLOCK_MOVE) return null;
  // recordUndo: false marks the seed and load paths, so this excludes them. It does NOT mean "a
  // student did this": block-factory's bookkeeping runs inside click and validator handlers, where
  // recordUndo is `true` (see markInternalDisposal below). What actually carries the weight here is
  // the drag reason on the next line -- bookkeeping connects blocks, which reports `connect`, never
  // `drag`.
  if (!event.recordUndo) return null;
  if (!event.reason?.includes(USER_DRAG)) return null;
  if (!event.blockId) return null;

  const block = workspace.getBlockById(event.blockId);
  if (!block) return null;

  const label = block.getAriaLabel(ARIA_VERBOSITY);

  // A block that does nothing is the one thing a student most needs told, so this qualifier goes on
  // every branch below. disableOrphans disables the block dropped loose AND everything connected
  // into it, so "connected" is no promise that the block will run: drop `repeat` on bare canvas and
  // it is disabled, and the `move forward` you then drag inside it is disabled with it.
  const disabled = block.isEnabled() ? "" : ", disabled";

  const parent = block.getParent();
  if (parent) {
    // `getParent()` is NOT "the block that surrounds me". A block joined to a preceding block's
    // nextConnection has that *sibling* as its parent -- Blockly's own docs on getSurroundParent()
    // say so: "A parent block might just be the previous statement, whereas the surrounding block
    // is an if statement, while loop, etc." Announcing "connected inside move forward" for a block
    // stacked after `move forward` is confidently wrong about the one fact this module exists to
    // convey, and sequencing statements is the commonest thing a student does here.
    const parentLabel = parent.getAriaLabel(ARIA_VERBOSITY);
    const stackedAfterParent = parent.getNextBlock() === block;
    if (!stackedAfterParent) {
      return `${label} connected inside ${parentLabel}${disabled}.`;
    }

    // Stacked after a sibling. Name what it follows *and* what contains it: "after turn right"
    // alone leaves a blind student unable to tell a statement inside `setup` from one inside `go`.
    const surround = block.getSurroundParent();
    return surround
      ? `${label} connected after ${parentLabel}, inside ${surround.getAriaLabel(ARIA_VERBOSITY)}${disabled}.`
      : `${label} connected after ${parentLabel}${disabled}.`;
  }

  // `setup`/`go`/`onclick` have neither a previous-statement nor an output connection: there is
  // nothing on the canvas they could attach to, and disableOrphans exempts them for exactly that
  // reason. Telling a student who cannot see the canvas that the program's root container is "not
  // connected" describes a fault that does not exist. They repositioned it; say so.
  if (!block.previousConnection && !block.outputConnection) {
    return `${label} moved${disabled}.`;
  }

  // An orphaned block is silently disabled by disableOrphans and does nothing. Say so.
  return `${label} placed on workspace, not connected${disabled}.`;
}

/** Ids of blocks this app's own machinery is about to dispose, which no student asked to delete.
 *
 *  `recordUndo` is not the "the student did this" flag it looks like. block-factory disposes blocks
 *  on the *live* workspace as a matter of routine -- collapsing a disclosure block stashes its
 *  children in `__savedChildrenXml` and disposes them; expanding one, and changing a creator's type
 *  dropdown, append a template into the workspace and dispose it again -- and all of that runs
 *  inside plain click and validator handlers, where `recordUndo` is `true`. Left alone, a student
 *  who collapses a block hears their whole program announced as deleted.
 *
 *  A "we are mutating internally right now" flag cannot work: Blockly fires its events from a timer,
 *  so the flag is long since false by the time the listener runs. Naming the blocks is what survives
 *  the wait.
 *
 *  Keyed per workspace, and it has to be. A block id is NOT unique across workspaces: a loaded block
 *  takes its id from the saved JSON, and `getXmlFromTemplate` appends a child-block template that
 *  carries the id it was saved with. Authoring renders the starter-program editor and the child-block
 *  editor side by side, so the very same template id is a throwaway in one and the author's real,
 *  deletable block in the other -- and one shared set would let the throwaway's mark silence the real
 *  block's deletion. Scoping to the workspace makes that impossible by construction rather than by
 *  argument. A WeakMap, so a disposed workspace's ids go with it: blockly.tsx re-creates its workspace
 *  whenever the toolbox or the custom blocks change. */
const disposalsByWorkspace = new WeakMap<object, Set<string>>();

/** The internal-disposal set for one workspace, created on first use. Exported so a test can assert
 *  that two workspaces really do not share one. */
export function disposalsForWorkspace(workspace: object): Set<string> {
  let disposals = disposalsByWorkspace.get(workspace);
  if (!disposals) disposalsByWorkspace.set(workspace, disposals = new Set());
  return disposals;
}

/** Call immediately BEFORE disposing a block the student did not ask to delete, while the block is
 *  still alive and can still name its descendants -- `dispose()` takes the whole subtree with it. */
export function markInternalDisposal(
  block: { getDescendants(ordered: boolean): Array<{ id: string }>; workspace?: { isReadOnly(): boolean } },
  internallyDisposed?: Set<string>
): void {
  const { workspace } = block;
  if (!workspace) return;
  // A read-only workspace attaches no announcer, so nothing would ever evict an id marked there --
  // and the report view injects one, then runs registerCustomBlocks, whose block init disposes
  // template blocks. Nothing can be moved or deleted in a report, so there is no announcement to
  // suppress and nothing worth remembering.
  if (workspace.isReadOnly()) return;

  const disposals = internallyDisposed ?? disposalsForWorkspace(workspace);
  block.getDescendants(false).forEach(b => disposals.add(b.id));
}

export function describeDelete(
  event: IDeleteEventLike, labels: Map<string, string>, internallyDisposed: ReadonlySet<string> = new Set()
): string | null {
  if (event.type !== Events.BLOCK_DELETE) return null;
  // workspace.clear() during a load fires a delete per block, none of which record undo.
  if (!event.recordUndo) return null;
  // Our own machinery disposed this one. Nothing was deleted; the student did nothing.
  if (event.blockId && internallyDisposed.has(event.blockId)) return null;

  const label = event.blockId ? labels.get(event.blockId) : undefined;
  return label ? `${label} deleted.` : "Block deleted.";
}

/** The label cache exists because a BLOCK_DELETE event arrives after the block is gone — there is
 *  nothing left to ask for a name. Reconstructing one from event.oldJson would mean duplicating
 *  Blockly's label composition, which is exactly the internal coupling this module avoids. */
const LABEL_CACHING_EVENTS: string[] = [Events.BLOCK_CREATE, Events.BLOCK_CHANGE, Events.BLOCK_MOVE];

/** Cache the event's block *and its descendants*, not just the block the event names.
 *  `serialization.workspaces.load()` fires exactly ONE BLOCK_CREATE, for the root of the loaded
 *  stack; the blocks inside it never appear in any event. In this interactive a student's program
 *  lives inside `setup`/`go`/`onclick`, so without this every block a returning student wrote
 *  would fall through to the generic "Block deleted." — the fallback would be the default path.
 *
 *  Refresh upward as well: a block's ARIA label embeds the labels of the blocks plugged into its
 *  value inputs, so editing a child stales every ancestor's cached label. Plug `50` into `chance`
 *  and only the number block gets an event -- the cached label for `chance` still says "with a
 *  chance of, %", and that stale text is what a student hears when they delete it, missing the one
 *  number they would need to rebuild it. */
function cacheBlockLabels(block: IAnnounceableBlock, labels: Map<string, string>) {
  block.getDescendants(false).forEach(b => labels.set(b.id, b.getAriaLabel(ARIA_VERBOSITY)));
  for (let ancestor = block.getParent(); ancestor; ancestor = ancestor.getParent()) {
    labels.set(ancestor.id, ancestor.getAriaLabel(ARIA_VERBOSITY));
  }
}

export function attachAriaAnnouncements(workspace: WorkspaceSvg): () => void {
  const labels = new Map<string, string>();
  // Only this workspace's internal disposals. block-factory marks against the block's own workspace,
  // so a template disposed in the starter-program editor cannot silence a real deletion in the
  // child-block editor, even though both hold the same template id.
  const disposals = disposalsForWorkspace(workspace);

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
        if (block) cacheBlockLabels(block, labels);
      }

      let message: string | null = null;
      if (event.type === Events.BLOCK_MOVE) {
        message = describeMove(event as unknown as IMoveEventLike, workspace);
      } else if (event.type === Events.BLOCK_DELETE) {
        const deleteEvent = event as unknown as IDeleteEventLike;
        message = describeDelete(deleteEvent, labels, disposals);
        // BLOCK_DELETE fires once for a whole stack and carries every id in `ids`. Evicting only
        // `blockId` would strand the descendants' entries in the cache for the life of the
        // workspace. Fall back to `blockId` in case a future Blockly stops populating `ids`.
        const deletedIds = deleteEvent.ids ?? (blockId ? [blockId] : []);
        deletedIds.forEach(id => {
          labels.delete(id);
          disposals.delete(id);
        });
      }

      if (!message) return;

      // announceDynamicAriaState throws if the live region is not initialized. It also *coalesces*
      // rather than replaces: calls landing in the same setTimeout window are joined with "\n" into
      // a single announcement, so our text is concatenated with whatever Blockly said, not layered
      // over it. That reads oddly in the DOM but is tolerable, because Blockly says nothing at the
      // moment of commit -- which is the gap this module exists to fill.
      utils.aria.announceDynamicAriaState(message);
    } catch (e) {
      console.warn("Blockly ARIA announcement failed:", e);
    }
  };

  workspace.addChangeListener(listener);
  return () => workspace.removeChangeListener(listener);
}
