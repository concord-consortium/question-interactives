// Registry for built-in Blockly blocks that can be nested within action blocks
// Provides metadata about built-in Blockly blocks in a format compatible with our custom block system

export interface IBuiltInBlockInfo {
  color: string;
  description: string;
  hasStatements: boolean;
  id: string;
  name: string;
  type: "builtin";
}

// Registry of available built-in Blockly blocks
export const BUILT_IN_BLOCKS: IBuiltInBlockInfo[] = [
  {
    color: "#5ba55b",
    description: "If-then conditional block",
    hasStatements: true,
    id: "controls_if",
    name: "if",
    type: "builtin"
  },
  {
    color: "#5ba55b",
    description: "Logical AND/OR operation",
    hasStatements: false,
    id: "logic_operation",
    name: "and/or", 
    type: "builtin"
  },
  {
    color: "#5ba55b", 
    description: "Logical NOT operation",
    hasStatements: false,
    id: "logic_negate",
    name: "not",
    type: "builtin",
  }
];
