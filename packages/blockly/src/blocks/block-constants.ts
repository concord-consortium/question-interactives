import { CUSTOM_BUILT_IN_BLOCKS } from "./custom-built-in-blocks";
import { BLOCKLY_BUILT_IN_BLOCKS } from "./blockly-built-in-registry";

export const MAX_NESTING_DEPTH = 5;

export const ALL_BUILT_IN_BLOCK_IDS: string[] = [
  ...CUSTOM_BUILT_IN_BLOCKS.map(info => info.id),
  ...BLOCKLY_BUILT_IN_BLOCKS.map(info => info.id)
];