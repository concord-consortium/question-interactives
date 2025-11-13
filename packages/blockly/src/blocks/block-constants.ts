import { IBuiltInBlockInfo, CustomBlockType } from "../components/types";
import { CUSTOM_BUILT_IN_BLOCKS } from "./custom-built-in-blocks";
import { BLOCKLY_BUILT_IN_BLOCKS } from "./blockly-built-in-registry";

export const DEFAULT_MAX_NESTING_DEPTH = 5;

export const ALL_BUILT_IN_BLOCKS: IBuiltInBlockInfo[] = [
  ...CUSTOM_BUILT_IN_BLOCKS,
  ...BLOCKLY_BUILT_IN_BLOCKS
];

/**
 * Defines the desired display order of all block type groupings in both the authoring
 * form and the Blockly toolbox.
 * 
 * If the desired order changes or becomes unnecessary, we may be able to use
 * `VALID_BLOCK_TYPES` from `types.ts` instead and avoid duplicating the list here.
 */
export const BLOCK_TYPE_ORDER: CustomBlockType[] = [
  "creator",
  "setter", 
  "ask",
  "action",
  "condition",
  "builtIn"
];
