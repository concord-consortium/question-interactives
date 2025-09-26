// This file is not currently used but may be helpful in the future if we decide
// to pre-define some custom blocks for specific use cases.

import { FieldSlider } from "@blockly/field-slider";
import { Blocks, FieldDropdown, MenuOption } from "blockly/core";
import { javascriptGenerator } from "blockly/javascript";

const BG_COLOR = "#312b84";

const diffusionDefaultCount = 100;
const diffusionMinCount = 0;
const diffusionMaxCount = 500;
const diffusionCreateTypeOptions: MenuOption[] = [
  ["water", "WATER"],
  ["ink", "INK"]
];
const diffusionTypeLabel = "particles";

// const photosynthesisDefaultCount = 50;
// const photosynthesisMinCount = 0;
// const photosynthesisMaxCount = 100;
// const photosynthesisCreateTypeOptions: MenuOption[] = [
//   ["co2", "co2"],
//   ["h2o", "h20"]
// ];
// const photosynthesisTypeLabel = "molecules";

// const wildfireDefaultCount = 1000;
// const wildfireMinCount = 0;
// const wildfireMaxCount = 2000;
// const wildfireCreateTypeOptions: MenuOption[] = [
//   ["air", "AIR"],
//   ["smoke", "SMOKE"]
// ];
// const wildfireTypeLabel = "particles";

Blocks.create = {
  init() {
    this.appendDummyInput()
      .appendField("create")
      .appendField(new FieldSlider(diffusionDefaultCount, diffusionMinCount, diffusionMaxCount), "count")
      .appendField(new FieldDropdown(diffusionCreateTypeOptions), "type")
      .appendField(diffusionTypeLabel);
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour(BG_COLOR);
  }
};

javascriptGenerator.forBlock.create = function(block) {
  const count = block.getFieldValue("count");
  const type = block.getFieldValue("type");
  return `async function create() {\n  // Selected count: ${count}\n  // Selected type: ${type}\n}\n`;
};
