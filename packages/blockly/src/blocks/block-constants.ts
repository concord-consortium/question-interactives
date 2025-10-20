import { IBuiltInBlockInfo } from "../components/types";
import { CUSTOM_BUILT_IN_BLOCKS } from "./custom-built-in-blocks";
import { BLOCKLY_BUILT_IN_BLOCKS } from "./blockly-built-in-registry";

export const DEFAULT_MAX_NESTING_DEPTH = 5;

export const ALL_BUILT_IN_BLOCKS: IBuiltInBlockInfo[] = [
  ...CUSTOM_BUILT_IN_BLOCKS,
  ...BLOCKLY_BUILT_IN_BLOCKS
];
