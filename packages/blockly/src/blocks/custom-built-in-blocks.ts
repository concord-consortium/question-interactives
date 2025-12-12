// Custom built-in blocks that we define.
// These blocks are always available and don't need to be created by authors.

import { Blocks, FieldNumber, FieldDropdown } from "blockly/core";
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

// Number Block
Blocks.number = {
  init() {
    this.appendDummyInput()
      .appendField("")
      .appendField(new FieldNumber(0), "NUM");
    this.setOutput(true, "Number");
    this.setColour(BG_COLOR);
  }
};

javascriptGenerator.forBlock.number = function(block) {
  const num = block.getFieldValue("NUM") || 0;
  return [num, Order.NONE];
};

// Math Operation Block
Blocks.mathOperation = {
  init() {
    this.appendValueInput("NUM1").setCheck("Number");
    this.appendDummyInput()
      .appendField(new FieldDropdown([["+", "+"], ["-", "-"], ["×", "×"], ["÷", "÷"], ["^", "^"]]), "OPERATOR");
    this.appendValueInput("NUM2").setCheck("Number");
    this.setInputsInline(true);
    this.setOutput(true, "Number");
    this.setColour(BG_COLOR);
  }
};

javascriptGenerator.forBlock.mathOperation = function(block) {
  const num1 = javascriptGenerator.valueToCode(block, "NUM1", Order.NONE) || "0";
  const num2 = javascriptGenerator.valueToCode(block, "NUM2", Order.NONE) || "0";
  const operator = block.getFieldValue("OPERATOR");
  let expression = "";

  switch (operator) {
    case "+":
    case "-":
    case "×":
    case "÷":
      expression = `(${num1}) ${operator.replace("×", "*").replace("÷", "/")} (${num2})`;
      break;
    case "^":
      expression = `Math.pow(${num1}, ${num2})`;
      break;
    default:
      expression = `(${num1}) + (${num2})`;
  }
  return [expression, Order.NONE];
};

// Random Integer Block
Blocks.randomInteger = {
  init() {
    this.appendValueInput("MIN").setCheck("Number").appendField("random integer from");
    this.appendValueInput("MAX").setCheck("Number").appendField("to");
    this.setInputsInline(true);
    this.setOutput(true, "Number");
    this.setColour(BG_COLOR);
  }
};

javascriptGenerator.forBlock.randomInteger = function(block) {
  const min = javascriptGenerator.valueToCode(block, "MIN", Order.NONE) || "0";
  const max = javascriptGenerator.valueToCode(block, "MAX", Order.NONE) || "0";
  const expression = `Math.floor(Math.random() * ((${max}) - (${min}) + 1)) + (${min})`;
  return [expression, Order.NONE];
};

// Comparison Block
Blocks.comparison = {
  init() {
    this.appendValueInput("NUM1").setCheck("Number");
    this.appendDummyInput()
      .appendField(new FieldDropdown([["=", "="], ["≠", "≠"], [">", ">"], ["<", "<"], ["≥", "≥"], ["≤", "≤"]]), "OPERATOR");
    this.appendValueInput("NUM2").setCheck("Number");
    this.setInputsInline(true);
    this.setOutput(true, "Boolean");
    this.setColour(BG_COLOR);
  }
};

javascriptGenerator.forBlock.comparison = function(block) {
  const num1 = javascriptGenerator.valueToCode(block, "NUM1", Order.NONE) || "0";
  const num2 = javascriptGenerator.valueToCode(block, "NUM2", Order.NONE) || "0";
  const operator = block.getFieldValue("OPERATOR");
  const operatorMap: { [key: string]: string } = {
    "=": "===",
    "≠": "!==",
    ">": ">",
    "<": "<",
    "≥": ">=",
    "≤": "<=",
  };
  const jsOperator = operatorMap[operator] || "===";
  const expression = `(${num1}) ${jsOperator} (${num2})`;
  return [expression, Order.NONE];
};

export const CUSTOM_BUILT_IN_BLOCKS: IBuiltInBlockInfo[] = [
  {
    canHaveChildren: true,
    color: BG_COLOR,
    description: "Execute blocks with a probability",
    hasStatements: true,
    id: "chance",
    name: "chance",
    type: "built-in"
  },
  {
    canHaveChildren: false,
    color: BG_COLOR,
    description: "Compare two numbers",
    hasStatements: false,
    id: "comparison",
    name: "comparison",
    toolboxConfig: {
      inputs: {
        NUM1: {
          shadow: { type: "number", fields: { NUM: 0 } }
        },
        NUM2: {
          shadow: { type: "number", fields: { NUM: 0 } }
        }
      }
    },
    type: "built-in"
  },
  {
    canHaveChildren: false,
    color: BG_COLOR,
    description: "A math operation input block",
    hasStatements: false,
    id: "mathOperation",
    name: "math operation",
    toolboxConfig: {
      inputs: {
        NUM1: {
          shadow: { type: "number", fields: { NUM: 0 } }
        },
        NUM2: {
          shadow: { type: "number", fields: { NUM: 0 } }
        }
      }
    },
    type: "built-in"
  },
  {
    canHaveChildren: false,
    color: BG_COLOR,
    description: "A numeric input block",
    hasStatements: false,
    id: "number",
    name: "number",
    type: "built-in"
  },
  {
    canHaveChildren: false,
    color: BG_COLOR,
    description: "Generate a random integer between two values",
    hasStatements: false,
    id: "randomInteger",
    name: "random integer",
    toolboxConfig: {
      inputs: {
        MIN: {
          shadow: { type: "number", fields: { NUM: 0 } }
        },
        MAX: {
          shadow: { type: "number", fields: { NUM: 100 } }
        }
      }
    },
    type: "built-in"
  },
  {
    canHaveChildren: true,
    color: BG_COLOR,
    description: "Repeat blocks a specified number of times",
    hasStatements: true,
    id: "repeat",
    name: "repeat",
    type: "built-in"
  },
  {
    canHaveChildren: true,
    color: BG_COLOR,
    description: "Execute blocks when a condition is true",
    hasStatements: true,
    id: "when",
    name: "when",
    type: "built-in"
  }
];
