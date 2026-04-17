import { serialization } from "blockly";
import { BLOCKLY_BUILT_IN_BLOCKS } from "../blocks/blockly-built-in-registry";
import { CUSTOM_BUILT_IN_BLOCKS } from "../blocks/custom-built-in-blocks";
import { ICustomBlock, SEED_BLOCK_TYPES } from "../components/types";

type BlockState = serialization.blocks.State;
type ConnectionState = serialization.blocks.ConnectionState;
type StarterProgram = { blocks: { blocks: BlockState[] } };

const SEED_SET = new Set<string>(SEED_BLOCK_TYPES);

function isStarterProgram(value: unknown): value is StarterProgram {
  return Array.isArray((value as { blocks?: { blocks?: unknown } })?.blocks?.blocks);
}

/**
 * Parses a serialized starter program into its in-memory shape, or returns null if the input
 * is empty, malformed, or structurally invalid. The returned value can be passed directly
 * to `serialization.workspaces.load` (after being narrowed by `hasAuthoredStarterContent`).
 */
export function parseStarterProgram(raw: string | undefined): StarterProgram | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    return isStarterProgram(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * A starter counts as "authored" only when it contains at least one non-seed block, or a
 * seed block with nested blocks.
 */
export function hasAuthoredStarterContent(program: StarterProgram | null): program is StarterProgram {
  if (!program) return false;
  return program.blocks.blocks.some(b => !SEED_SET.has(b.type) || blockHasChildren(b));
}

function blockHasChildren(block: BlockState): boolean {
  if (block.inputs && Object.keys(block.inputs).length > 0) {
    for (const input of Object.values(block.inputs)) {
      if (input?.block || input?.shadow) return true;
    }
  }
  if (block.next?.block) return true;
  return false;
}

export function buildValidTypeSet(customBlocks: ICustomBlock[]): Set<string> {
  const set = new Set<string>(SEED_BLOCK_TYPES);
  BLOCKLY_BUILT_IN_BLOCKS.forEach(b => set.add(b.id));
  CUSTOM_BUILT_IN_BLOCKS.forEach(b => set.add(b.id));
  customBlocks.forEach(b => set.add(b.id));
  return set;
}

/**
 * Returns a serialized starter state with any blocks whose types are not in `validTypes`
 * removed. Used to protect the authoring editor against deleted custom block definitions
 * that a starter program may still reference until the form is saved.
 */
export function pruneStarterState(raw: string, validTypes: Set<string>): string {
  const parsed: unknown = JSON.parse(raw);
  if (!isStarterProgram(parsed)) return raw;
  const prunedTop = parsed.blocks.blocks
    .map(b => pruneBlock(b, validTypes))
    .filter((block): block is BlockState => block !== null);
  return JSON.stringify({
    ...parsed,
    blocks: { ...parsed.blocks, blocks: prunedTop }
  });
}

function pruneBlock(block: BlockState, valid: Set<string>): BlockState | null {
  if (!valid.has(block.type)) return null;

  const result: BlockState = { ...block };

  if (block.inputs) {
    const newInputs: Record<string, ConnectionState> = {};
    for (const [key, input] of Object.entries(block.inputs)) {
      const prunedBlock  = input.block  ? pruneBlock(input.block,  valid) : undefined;
      const prunedShadow = input.shadow ? pruneBlock(input.shadow, valid) : undefined;
      if (prunedBlock || prunedShadow) {
        newInputs[key] = {
          ...(prunedBlock && { block: prunedBlock }),
          ...(prunedShadow && { shadow: prunedShadow })
        };
      }
    }
    if (Object.keys(newInputs).length) {
      result.inputs = newInputs;
    } else {
      delete result.inputs;
    }
  }

  if (block.next?.block) {
    const prunedNext = pruneBlock(block.next.block, valid);
    if (prunedNext) {
      result.next = { block: prunedNext };
    } else {
      delete result.next;
    }
  }

  return result;
}
