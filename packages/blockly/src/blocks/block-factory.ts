import { FieldSlider } from "@blockly/field-slider";
import { Blocks, FieldDropdown } from "blockly/core";
import { javascriptGenerator } from "blockly/javascript";

import { ICustomBlock, ICustomBlockCreate, ICustomBlockSet } from "../components/types";

export function registerCustomBlocks(customBlocks: ICustomBlock[]) {
  customBlocks.forEach(blockDef => {
    const blockType = `custom_${blockDef.id}`;
    
    if (blockDef.type === "creator") {
      const config = blockDef.config as ICustomBlockCreate;
      
      Blocks[blockType] = {
        init() {
          this.appendDummyInput()
            .appendField(blockDef.name)
            .appendField(new FieldSlider(
              config.defaultCount,
              config.minCount,
              config.maxCount
            ), "count")
            .appendField(new FieldDropdown(config.typeOptions), "type")
            .appendField(config.typeLabel);
          this.setPreviousStatement(true);
          this.setNextStatement(true);
          this.setColour(blockDef.color);
        }
      };

      javascriptGenerator.forBlock[blockType] = function(block) {
        const count = block.getFieldValue("count");
        const type = block.getFieldValue("type");
        return `async function ${blockDef.name.toLowerCase().replace(/\s+/g, "_")}() {\n  // Count: ${count}, Type: ${type}\n}\n`;
      };
    } else if (blockDef.type === "setter") {
      const config = blockDef.config as ICustomBlockSet;
      
      Blocks[blockType] = {
        init() {
          this.appendDummyInput()
            .appendField(blockDef.name)
            .appendField(new FieldDropdown(config.typeOptions), "value");
          this.setPreviousStatement(true);
          this.setNextStatement(true);
          this.setColour(blockDef.color);
        }
      };

      javascriptGenerator.forBlock[blockType] = function(block) {
        const value = block.getFieldValue("value");
        return `async function ${blockDef.name.toLowerCase().replace(/\s+/g, "_")}() {\n  // ${config.typeLabel}: ${value}\n}\n`;
      };
    }
  });
}
