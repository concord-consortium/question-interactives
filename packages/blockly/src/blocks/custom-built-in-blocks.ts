// Custom built-in blocks that we define.
// These blocks are always available and don't need to be created by authors.

import { Blocks, FieldNumber } from "blockly/core";
import { javascriptGenerator, Order } from "blockly/javascript";

import { IBuiltInBlockInfo } from "../components/types";

const BG_COLOR = "#0089b8";

// Chance Block
Blocks.chance = {
  init() {
    this.appendDummyInput()
        .appendField("with a chance of");
    this.appendValueInput("NUM").setCheck("Number");
    this.appendDummyInput().appendField("%");
    this.appendStatementInput("statements");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(BG_COLOR);
  }
};

javascriptGenerator.forBlock.chance = function(block) {
  const num = javascriptGenerator.valueToCode(block, "NUM", Order.NONE) || "0";
  const statements = javascriptGenerator.statementToCode(block, "statements");
  return `if (Math.random() * 100 < ${num}) {\n${statements}}\n`;
};

// Repeat Block
Blocks.repeat = {
  init() {
    this.appendDummyInput()
        .appendField("repeat")
        .appendField(new FieldNumber(1, 0), "TIMES");
    this.appendStatementInput("statements");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(BG_COLOR);
  }
};

javascriptGenerator.forBlock.repeat = function(block) {
  const times = block.getFieldValue("TIMES") || 0;
  const statements = javascriptGenerator.statementToCode(block, "statements");
  return `for (let i = 0; i < ${times}; i++) {\n${statements}}\n`;
};

// When Block
Blocks.when = {
  init() {
    this.appendDummyInput()
      .appendField("when");
    this.appendValueInput("condition").setCheck("Boolean");
    this.appendStatementInput("statements");
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(BG_COLOR);
  }
};

javascriptGenerator.forBlock.when = function(block) {
  const cond = javascriptGenerator.valueToCode(block, "condition", Order.NONE) || "false";
  const statements = javascriptGenerator.statementToCode(block, "statements");
  return `if (${cond}) {\n${statements}}\n`;
};

export const CUSTOM_BUILT_IN_BLOCKS: IBuiltInBlockInfo[] = [
  {
    color: BG_COLOR,
    description: "Execute blocks with a probability",
    hasStatements: true,
    id: "chance",
    name: "chance",
    type: "built-in"
  },
  {
    color: BG_COLOR,
    description: "Repeat blocks a specified number of times",
    hasStatements: true,
    id: "repeat",
    name: "repeat",
    type: "built-in"
  },
  {
    color: BG_COLOR,
    description: "Execute blocks when a condition is true",
    hasStatements: true,
    id: "when",
    name: "when",
    type: "built-in"
  }
];
