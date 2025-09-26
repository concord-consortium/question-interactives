import { BUILT_IN_BLOCKS } from "../blocks/built-in-blocks-registry";
import { ICustomBlock } from "../components/types";

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

  const required = ["id", "type", "name", "color", "category", "config"];
  const seenIds = new Set<string>();

  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i] as any;

    if (!b || typeof b !== "object") {
      return { valid: false, error: `Item ${i + 1} is not an object` };
    }

    for (const key of required) {
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

    if (!["creator", "setter", "action"].includes(b.type)) {
      return { valid: false, error: `Item ${i + 1} has invalid type: ${String(b.type)}` };
    }

    if (typeof b.name !== "string" || b.name.length === 0) {
      return { valid: false, error: `Item ${i + 1} has invalid name` };
    }

    if (typeof b.category !== "string" || b.category.length === 0) {
      return { valid: false, error: `Item ${i + 1} has invalid category` };
    }

    if (typeof b.color !== "string") {
      return { valid: false, error: `Item ${i + 1} has invalid color` };
    }

    if (typeof b.config !== "object" || b.config === null) {
      return { valid: false, error: `Item ${i + 1} has invalid config` };
    }
  }

  return { valid: true };
};
