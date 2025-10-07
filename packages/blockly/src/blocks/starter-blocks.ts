import { Blocks, FieldImage, inputs } from "blockly/core";
import { javascriptGenerator } from "blockly/javascript";

import GoIcon from "../assets/go-icon.png";
import OnclickIcon from "../assets/onclick-icon.png";
import Setup from "../assets/setup-icon.png";

const BG_COLOR = "#f26522";
const ICON_WIDTH = 15;
const ICON_HEIGHT = 15;
const GO_ICON_WIDTH = 10;
const GO_ICON_HEIGHT = 10;
const ICON_ALT_TEXT = ""; // empty string since the icons are purely decorative

Blocks.setup = {
  init() {
    this.appendDummyInput()
      .appendField("setup")
      .setAlign(inputs.Align.RIGHT).appendField(new FieldImage(
      Setup,
      ICON_WIDTH,
      ICON_HEIGHT,
      ICON_ALT_TEXT
    ));
    this.appendStatementInput("statements");
    this.setColour(BG_COLOR);
  }
};

Blocks.go = {
  init() {
    this.appendDummyInput()
      .appendField("go")
      .setAlign(inputs.Align.RIGHT).appendField(new FieldImage(
      GoIcon,
      GO_ICON_WIDTH,
      GO_ICON_HEIGHT,
      ICON_ALT_TEXT
    ));
    this.appendStatementInput("statements");
    this.setColour(BG_COLOR);
  }
};

Blocks.onclick = {
  init() {
    this.appendDummyInput()
      .appendField("on mouse click")
      .setAlign(inputs.Align.RIGHT).appendField(new FieldImage(
      OnclickIcon,
      ICON_WIDTH,
      ICON_HEIGHT,
      ICON_ALT_TEXT
    ));
    this.appendStatementInput("statements");
    this.setColour(BG_COLOR);
  }
};

javascriptGenerator.forBlock.setup = function(block) {
  const statements = javascriptGenerator.statementToCode(block, "statements");
  return `function setup() {\n${statements}}\n`;
};

javascriptGenerator.forBlock.go = function(block) {
  const statements = javascriptGenerator.statementToCode(block, "statements");
  return `sim.afterTick = () => {\n${statements}}\n`;
};

javascriptGenerator.forBlock.onclick = function(block) {
  const statements = javascriptGenerator.statementToCode(block, "statements");
  return `async function onclick() {\n${statements}}\n`;
};
