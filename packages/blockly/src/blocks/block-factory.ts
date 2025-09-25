import { FieldSlider } from "@blockly/field-slider";
import Blockly, { Blocks, FieldDropdown, FieldNumber } from "blockly/core";
import type { BlockSvg } from "blockly";

import { ICustomBlock, ICreateBlockConfig, ISetBlockConfig } from "../components/types";
import { netlogoGenerator } from "../utils/netlogo-generator";

// function renderTemplate(tpl: string, context: Record<string, unknown>) {
//   return tpl.replace(/\$\{(\w+)\}/g, (_m, key) => {
//     const v = context[key];
//     return v === undefined || v === null ? "" : String(v);
//   });
// }

const PLUS_ICON  = "data:image/svg+xml;utf8," +
  "<svg xmlns='http://www.w3.org/2000/svg' width='14' height='14'>" +
  "<text fill='white' x='7' y='10' text-anchor='middle' font-size='12'>+</text></svg>";

const MINUS_ICON = "data:image/svg+xml;utf8," +
  "<svg xmlns='http://www.w3.org/2000/svg' width='14' height='14'>" +
  "<text fill='white' x='7' y='10' text-anchor='middle' font-size='12'>−</text></svg>";

/**
 * Adds a small +/– image button to a block.
 * Clicking it toggles visibility of the statement input named `inputName`.
 */
function attachDisclosureButton(block: Blockly.Block, inputName = "statements", startOpen = false) {
  const stmt = block.getInput(inputName);
  if (!stmt) return;

  const b = block as BlockSvg;
  const row = b.appendDummyInput("__disclosure_button");
  const icon = new Blockly.FieldImage(startOpen ? MINUS_ICON : PLUS_ICON, 14, 14, "+/-");

  (icon as any).setOnClickHandler?.(() => {
    const open = !(b as any).__disclosureOpen;
    (b as any).__disclosureOpen = open;
    stmt.setVisible(open);
    icon.setValue(open ? MINUS_ICON : PLUS_ICON);
    b.render();
  });

  row.appendField(icon, "__disclosure_icon");

  const open0 = (b as any).__disclosureOpen ?? startOpen;
  (b as any).__disclosureOpen = open0;
  stmt.setVisible(open0);

  b.render();
}

export function registerCustomBlocks(customBlocks: ICustomBlock[]) {
  if (!Array.isArray(customBlocks)) {
    console.warn("registerCustomBlocks: customBlocks is not an array:", customBlocks);
    return;
  }
  
  customBlocks.forEach(blockDef => {
    const blockType = blockDef.id;
    const cfg = blockDef.config as (ICreateBlockConfig | ISetBlockConfig);

    const applyCommonFlags = (block: any) => {
      if (cfg.inputsInline !== undefined) block.setInputsInline(!!cfg.inputsInline);
      if (cfg.previousStatement !== undefined) block.setPreviousStatement(!!cfg.previousStatement);
      if (cfg.nextStatement !== undefined) block.setNextStatement(!!cfg.nextStatement);
    };

    
    Blocks[blockType] = {
      init() {
        const input = this.appendDummyInput().appendField(blockDef.name);
    
        if (blockDef.type === "creator") {
          const c: ICreateBlockConfig = cfg;

          // Optional count slider for creator
          if (c.defaultCount !== undefined && c.minCount !== undefined && c.maxCount !== undefined) {
            input.appendField(new FieldSlider(c.defaultCount, c.minCount, c.maxCount), "count");
          }
          
          // Optional child setter blocks
          if (Array.isArray(c.childBlocks) && c.childBlocks.length > 0) {
            this.appendStatementInput("statements").setCheck(c.childBlocks);
            attachDisclosureButton(this, "statements"); // adds the +/- toggle button
    
            // One-time seeding of child setter blocks on first creation/attach.
            (this as any).__childrenSeeded = false;
            this.setOnChange(() => {
              if ((this as any).__childrenSeeded || !this.workspace || this.isInFlyout) return;
    
              const stmt = this.getInput("statements");
              if (!stmt || stmt.connection.targetBlock()) return;
    
              try {
                let previousChild: any = null;
                if (!c.childBlocks) return;

                for (const childType of c.childBlocks) {
                  const child = this.workspace.newBlock(childType);
                  child.initSvg();
                  if (!previousChild) {
                    if (stmt.connection && child.previousConnection) {
                      stmt.connection.connect(child.previousConnection);
                    }
                  } else {
                    if (previousChild.nextConnection && child.previousConnection) {
                      previousChild.nextConnection.connect(child.previousConnection);
                    }
                  }
                  child.render();
                  previousChild = child;
                }
                (this as any).__childrenSeeded = true;
              } catch {
                // If any child type is missing or connection fails, do nothing.
              }
            });
          }
        }
    
        // Optional dropdown for creator or setter
        const typeOptions = (cfg as ICreateBlockConfig | ISetBlockConfig).typeOptions;
        if (typeOptions && typeOptions.length > 0) {
          const dropdownFieldName = blockDef.type === "creator" ? "type" : "value";
          input.appendField(new FieldDropdown(typeOptions), dropdownFieldName);
        }

        // Optional number input for setter blocks
        if (blockDef.type === "setter") {
          const setterConfig = cfg as ISetBlockConfig;
          if (setterConfig.includeNumberInput) {
            input.appendField(new FieldNumber(1), "value");
          }
        }
    
        // Optional trailing label
        if (cfg.typeLabel) {
          input.appendField(cfg.typeLabel);
        }
    
        // Default connections if not specified
        if (cfg.previousStatement === undefined) this.setPreviousStatement(true);
        if (cfg.nextStatement === undefined) this.setNextStatement(true);

        // Color and inline/connection flags
        this.setColour(blockDef.color);
        applyCommonFlags(this);
      },

      // Persist open/closed state
      mutationToDom() {
        const el = document.createElement("mutation");
        el.setAttribute("open", String((this as any).__disclosureOpen ?? true));
        return el;
      },
      domToMutation(el: Element) {
        const b = this as Blockly.BlockSvg;
        const open = el.getAttribute("open") !== "false";
        (b as any).__disclosureOpen = open;
        const stmt = b.getInput("statements");
        if (stmt) stmt.setVisible(open);
        b.render();
      }
    };

    // Generator: include available values
    netlogoGenerator.forBlock[blockType] = function(block) {
      if (blockDef.type === "setter") {
        // This is probably close to what we want.
        const attributeName = blockDef.name.toLowerCase().replace(/\s+/g, "_");
        const setterConfig = cfg as ISetBlockConfig;
        
        // Get the value from either dropdown or number input
        let attributeValue;
        if (setterConfig.typeOptions && setterConfig.typeOptions.length > 0) {
          attributeValue = block.getFieldValue("value");
        } else if (setterConfig.includeNumberInput) {
          attributeValue = block.getFieldValue("value");
        } else {
          attributeValue = "1"; // default value
        }

        return `set ${attributeName} ${attributeValue}\n`;
      } else if (blockDef.type === "creator") {
        // This is probaly NOT close to what we want. There can be other parameters
        // to take into consideration and statements to process, e.g. child setter blocks.
        // For now, though, we just return a simple create command.
        const count = block.getFieldValue("count");
        const type = block.getFieldValue("type").toLowerCase().replace(/\s+/g, "_");
        const statements = netlogoGenerator.statementToCode(block, "statements");

        return `create-${type} ${count}\n${statements}`;
      }
      return "";
    };
  });
}
