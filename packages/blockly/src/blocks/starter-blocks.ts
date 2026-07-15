import { Blocks, inputs } from "blockly/core";
import { javascriptGenerator } from "blockly/javascript";

import { ARIA_ROLE_DESCRIPTIONS } from "./aria-role-descriptions";
import { DecorativeIcon } from "./decorative-icon";

import GoIcon from "../assets/go-icon.png";
import OnclickIcon from "../assets/onclick-icon.png";
import Setup from "../assets/setup-icon.png";

const BG_COLOR = "#f26522";
const ICON_WIDTH = 15;
const ICON_HEIGHT = 15;
const GO_ICON_WIDTH = 10;
const GO_ICON_HEIGHT = 10;
// Empty string since the icons are purely decorative -- they repeat the text label beside them.
// DecorativeIcon is what keeps that emptiness out of the block's ARIA label; a bare FieldImage
// would turn it into the word "empty". See decorative-icon.ts.
const ICON_ALT_TEXT = "";

Blocks.setup = {
  init() {
    this.appendDummyInput()
      .appendField("setup")
      .setAlign(inputs.Align.RIGHT).appendField(new DecorativeIcon(
      Setup,
      ICON_WIDTH,
      ICON_HEIGHT,
      ICON_ALT_TEXT
    ));
    this.appendStatementInput("statements");
    this.setColour(BG_COLOR);
    this.setAriaRoleDescriptionProvider(ARIA_ROLE_DESCRIPTIONS.programSection);
  }
};

Blocks.go = {
  init() {
    this.appendDummyInput()
      .appendField("go")
      .setAlign(inputs.Align.RIGHT).appendField(new DecorativeIcon(
      GoIcon,
      GO_ICON_WIDTH,
      GO_ICON_HEIGHT,
      ICON_ALT_TEXT
    ));
    this.appendStatementInput("statements");
    this.setColour(BG_COLOR);
    this.setAriaRoleDescriptionProvider(ARIA_ROLE_DESCRIPTIONS.programSection);
  }
};

Blocks.onclick = {
  init() {
    this.appendDummyInput()
      .appendField("on mouse click")
      .setAlign(inputs.Align.RIGHT).appendField(new DecorativeIcon(
      OnclickIcon,
      ICON_WIDTH,
      ICON_HEIGHT,
      ICON_ALT_TEXT
    ));
    this.appendStatementInput("statements");
    this.setColour(BG_COLOR);
    this.setAriaRoleDescriptionProvider(ARIA_ROLE_DESCRIPTIONS.programSection);
  }
};

javascriptGenerator.forBlock.setup = function(block) {
  const statements = javascriptGenerator.statementToCode(block, "statements");

  const content = statements.trim() ? statements : "// noop\n";
  return `function setup() {\n${content}}\n`;
};

javascriptGenerator.forBlock.go = function(block) {
  const statements = javascriptGenerator.statementToCode(block, "statements");

  // If no statements have been specified, don't generate any code
  if (!statements.trim()) return "";

  return `sim.afterTick = () => {\n${statements}}\n`;
};

javascriptGenerator.forBlock.onclick = function(block) {
  const _statements = javascriptGenerator.statementToCode(block, "statements");

  // If no statements have been specified, don't generate any code
  const statements = _statements.trim() || "// noop\n";

  return `function onClick() {\n${statements}}\n`;
};
