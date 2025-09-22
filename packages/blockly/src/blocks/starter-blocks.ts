import { Blocks, FieldImage, inputs } from "blockly/core";
import { javascriptGenerator } from "blockly/javascript";

import GoIcon from "../assets/go-icon.png";
import OnclickIcon from "../assets/onclick-icon.png";
import Setup from "../assets/setup-icon.png";

Blocks.setup = {
  init() {
    this.appendDummyInput()
      .appendField("setup")
      .setAlign(inputs.Align.RIGHT).appendField(new FieldImage(
      Setup,
      15, // width in px
      15, // height in px
      "*" // alt text (shown if image missing)
    ));
    this.appendStatementInput("statements");
    this.setColour("#f26522"); // border color #f69364
  }
};

Blocks.go = {
  init() {
    this.appendDummyInput()
      .appendField("go")
      .setAlign(inputs.Align.RIGHT).appendField(new FieldImage(
      GoIcon,
      10, // width in px
      10, // height in px
      "*" // alt text (shown if image missing)
    ));
    this.appendStatementInput("statements");
    this.setColour("#f26522");
  }
};

Blocks.onclick = {
  init() {
    this.appendDummyInput()
      .appendField("on mouse click")
      .setAlign(inputs.Align.RIGHT).appendField(new FieldImage(
      OnclickIcon,
      10, // width in px
      10, // height in px
      "*" // alt text (shown if image missing)
    ));
    this.appendStatementInput("statements");
    this.setColour("#f26522");
  }
};

javascriptGenerator.forBlock.setup = function(block) {
  const statements = javascriptGenerator.statementToCode(block, "statements");
  return `async function setup() {\n${statements}}\n`;
};

javascriptGenerator.forBlock.go = function(block) {
  const statements = javascriptGenerator.statementToCode(block, "statements");
  return `async function go() {\n${statements}}\n`;
};

javascriptGenerator.forBlock.onclick = function(block) {
  const statements = javascriptGenerator.statementToCode(block, "statements");
  return `async function onclick() {\n${statements}}\n`;
};
