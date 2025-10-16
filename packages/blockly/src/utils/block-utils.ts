import { Block } from "blockly";
import { BLOCKLY_BUILT_IN_BLOCKS } from "../blocks/blockly-built-in-registry";
import { CUSTOM_BUILT_IN_BLOCKS } from "../blocks/custom-built-in-blocks";
import { ICustomBlock, IParameter, REQUIRED_BLOCK_FIELDS, VALID_BLOCK_TYPES } from "../components/types";

const validateString = (value: unknown): boolean => {
  return typeof value === "string" && value.length > 0;
};

// Return all blocks available to be contained as children.
export const availableChildBlocks = (existingCustomBlocks: ICustomBlock[] = [], excludeBlockId?: string) => {
  const creatorBlocks = existingCustomBlocks.filter(b => b.type === "creator" && b.id !== excludeBlockId);
  const setterBlocks = existingCustomBlocks.filter(b => b.type === "setter" && b.id !== excludeBlockId);
  const actionBlocks = existingCustomBlocks.filter(b => b.type === "action" && b.id !== excludeBlockId);
  const customBuiltInBlocks = CUSTOM_BUILT_IN_BLOCKS;
  const blocklyBuiltInBlocks = BLOCKLY_BUILT_IN_BLOCKS;
  
  return [
    ...creatorBlocks.map(b => ({ id: b.id, name: `${b.name} (creator)`, type: "creator", canHaveChildren: b.config.canHaveChildren })),
    ...setterBlocks.map(b => ({ id: b.id, name: `${b.name} (setter)`, type: "setter", canHaveChildren: b.config.canHaveChildren })),
    ...actionBlocks.map(b => ({ id: b.id, name: `${b.name} (action)`, type: "action", canHaveChildren: b.config.canHaveChildren })),
    ...customBuiltInBlocks,
    ...blocklyBuiltInBlocks
  ];
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

// Replace ${PARAM} placeholders with field values
export function replaceParameters(code: string, params: IParameter[], block: Block) {
  params.forEach((p: IParameter) => {
    const val = block.getFieldValue(p.name);
    const safe = val != null ? String(val) : "";
    const re = new RegExp(`\\$\\{${p.name}\\}`, "g");
    code = code.replace(re, safe);
  });
  return code;
}
