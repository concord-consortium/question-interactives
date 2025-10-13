// Registry for Blockly's built-in blocks that can be nested within action blocks
// Provides metadata about Blockly library blocks in a format compatible with our custom block system

export interface IBlocklyBuiltInBlockInfo {
  color: string;
  description: string;
  hasStatements: boolean;
  id: string;
  name: string;
  type: "built-in";
}

// Registry of available Blockly built-in blocks (from Blockly core library)
export const BLOCKLY_BUILT_IN_BLOCKS: IBlocklyBuiltInBlockInfo[] = [
  {
    color: "#5ba55b",
    description: "If-then conditional block",
    hasStatements: true,
    id: "controls_if",
    name: "if",
    type: "built-in"
  },
  {
    color: "#5ba55b",
    description: "Logical AND/OR operation",
    hasStatements: false,
    id: "logic_operation",
    name: "and/or", 
    type: "built-in"
  },
  {
    color: "#5ba55b", 
    description: "Logical NOT operation",
    hasStatements: false,
    id: "logic_negate",
    name: "not",
    type: "built-in",
  }
];
