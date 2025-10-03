import { BUILT_IN_BLOCKS } from "../blocks/built-in-blocks-registry";
import { ICustomBlock, REQUIRED_BLOCK_FIELDS, VALID_BLOCK_TYPES } from "../components/types";

const validateString = (value: unknown): boolean => {
  return typeof value === "string" && value.length > 0;
};

// Return all child blocks that can be contained within action blocks
export const actionBlockChildOptions = (existingCustomBlocks: ICustomBlock[] = [], excludeBlockId?: string) => {
  const setterBlocks = existingCustomBlocks.filter(b => b.type === "setter" && b.id !== excludeBlockId);
  const actionBlocks = existingCustomBlocks.filter(b => b.type === "action" && b.id !== excludeBlockId);
  const builtInBlocks = BUILT_IN_BLOCKS;
  
  return {
    setterBlocks,
    actionBlocks, 
    builtInBlocks,
    allBlocks: [...setterBlocks, ...actionBlocks, ...builtInBlocks]
  };
};

// Validate JSON representing an array of custom blocks.
export const validateBlocksJson = (blocks: unknown): { valid: boolean; error?: string } => {
  if (!Array.isArray(blocks)) {
    return { valid: false, error: "JSON must be an array of blocks" };
  }
  const seenIds = new Set<string>();

  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i] as any;

    if (!b || typeof b !== "object") {
      return { valid: false, error: `Item ${i + 1} is not an object` };
    }

    for (const key of REQUIRED_BLOCK_FIELDS) {
      if (!(key in b)) {
        return { valid: false, error: `Item ${i + 1} is missing required field: ${key}` };
      }
    }

    if (typeof b.id !== "string" || b.id.length === 0) {
      return { valid: false, error: `Item ${i + 1} has invalid id` };
    }

    if (seenIds.has(b.id)) {
      return { valid: false, error: `Duplicate id found: ${b.id}` };
    }

    seenIds.add(b.id);

    if (!VALID_BLOCK_TYPES.includes(b.type)) {
      return { valid: false, error: `Item ${i + 1} has invalid type: ${String(b.type)}` };
    }

    if (!validateString(b.name)) {
      return { valid: false, error: `Item ${i + 1} has invalid name` };
    }

    if (!validateString(b.category)) {
      return { valid: false, error: `Item ${i + 1} has invalid category` };
    }

    if (!validateString(b.color)) {
      return { valid: false, error: `Item ${i + 1} has invalid color` };
    }

    if (typeof b.config !== "object" || b.config === null) {
      return { valid: false, error: `Item ${i + 1} has invalid config` };
    }
  }

  return { valid: true };
};
