// This file is not currently used but may be helpful in the future if we decide
// to pre-define some custom blocks for specific use cases.

import { Blocks, FieldDropdown, MenuOption } from "blockly/core";
import { javascriptGenerator } from "blockly/javascript";

const BG_COLOR = "#312b84";

const diffusionSpeedOptions: MenuOption[] = [
  ["zero", "ZERO"],
  ["low", "LOW"],
  ["medium", "MEDIUM"],
  ["high", "HIGH"],
  ["initial temperature", "TEMP"]
];
// const photosynthesisSpeedOptions = [
//   ["zero", "ZERO"],
//   ["low", "LOW"],
//   ["medium", "MEDIUM"],
//   ["high", "HIGH"]
// ];
// const wildfireSpeedOptions = [
//   ["zero", "ZERO"],
//   ["very low", "VERY_LOW"],
//   ["low", "LOW"],
//   ["medium", "MEDIUM"],
//   ["high", "HIGH"],
//   ["wind speed", "WIND"]
// ];

const diffusionTypeOptions: MenuOption[] = [
  ["water", "WATER"],
  ["ink", "INK"],
];
// const wildfireTypeOptions = [
//   ["air", "AIR"],
//   ["smoke", "SMOKE"]
// ];

Blocks.set_speed = {
  init() {
    this.appendDummyInput()
      .appendField("set speed")
      .appendField(new FieldDropdown(diffusionSpeedOptions), "speed");
    // this.appendStatementInput("statements");
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour(BG_COLOR);
  }
};

Blocks.set_type = {
  init() {
    this.appendDummyInput()
      .appendField("set type")
      .appendField(new FieldDropdown(diffusionTypeOptions), "type");
    // this.appendStatementInput("statements");
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour(BG_COLOR);
  }
};

javascriptGenerator.forBlock.set_speed = function(block) {
  const speed = block.getFieldValue("speed");
  return `async function set_speed() {\n  // Selected speed: ${speed}\n}\n`;
};

javascriptGenerator.forBlock.set_type = function(block) {
  const type = block.getFieldValue("type");
  return `async function set_type() {\n  // Selected type: ${type}\n}\n`;
};
