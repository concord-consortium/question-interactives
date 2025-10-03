import { FieldSlider } from "@blockly/field-slider";
import type { BlockSvg } from "blockly";
import Blockly, { Blocks, FieldDropdown, FieldNumber } from "blockly/core";

import { IActionBlockConfig, ICustomBlock, ICreateBlockConfig, ISetBlockConfig, IParameter, isCreateBlockConfig } from "../components/types";
import { netlogoGenerator } from "../utils/netlogo-generator";

const PLUS_ICON  = "data:image/svg+xml;utf8," +
  "<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16'>" +
  "<text fill='white' x='8' y='12' text-anchor='middle' font-size='14'>+</text></svg>";

const MINUS_ICON = "data:image/svg+xml;utf8," +
  "<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16'>" +
  "<text fill='white' x='8' y='12' text-anchor='middle' font-size='14'>−</text></svg>";

export function registerCustomBlocks(customBlocks: ICustomBlock[]) {
  if (!Array.isArray(customBlocks)) {
    console.warn("registerCustomBlocks: customBlocks is not an array:", customBlocks);
    return;
  }
  
  customBlocks.forEach(blockDef => {
    const blockType = blockDef.id;
    const cfg = blockDef.config as (IActionBlockConfig | ICreateBlockConfig | ISetBlockConfig);

    const applyCommonFlags = (block: any) => {
      if (cfg.inputsInline !== undefined) block.setInputsInline(!!cfg.inputsInline);
      if (cfg.previousStatement !== undefined) block.setPreviousStatement(!!cfg.previousStatement);
      if (cfg.nextStatement !== undefined) block.setNextStatement(!!cfg.nextStatement);
    };

    Blocks[blockType] = {
      init() {
        // Display block name with appropriate prefix based on block type
        const displayName = blockDef.type === "action" ? blockDef.name : 
                            blockDef.type === "creator" ? "create" : 
                            blockDef.type === "setter" ? `set ${blockDef.name}` :
                            blockDef.name;
        const input = this.appendDummyInput().appendField(displayName);
    
        if ((blockDef.type === "action" && cfg.canHaveChildren) || blockDef.type === "creator") {
          const c: IActionBlockConfig | ICreateBlockConfig = cfg;

          const statementsInput = this.appendStatementInput("statements");
          if (Array.isArray(c.childBlocks) && c.childBlocks.length > 0) {
            statementsInput.setCheck(c.childBlocks);
          }
          
          // Add open/close toggle button
          const icon = new Blockly.FieldImage(PLUS_ICON, 16, 16, "+/-");
          (icon as any).setOnClickHandler?.(() => {
            const open = !(this as any).__disclosureOpen;
            (this as any).__disclosureOpen = open;
            statementsInput.setVisible(open);
            icon.setValue(open ? MINUS_ICON : PLUS_ICON);
            (this as BlockSvg).render();
          });
          input.insertFieldAt(0, icon, "__disclosure_icon");
          
          // Initialize as closed
          (this as any).__disclosureOpen = false;
          statementsInput.setVisible(false);

          if (blockDef.type === "creator" && isCreateBlockConfig(c)) {
            if (c.defaultCount !== undefined && c.minCount !== undefined && c.maxCount !== undefined) {
              input.appendField(new FieldSlider(c.defaultCount, c.minCount, c.maxCount), "count");
            }
          }
          
          // One-time seeding of child blocks on first creation/attach.
          const hasChildren = Array.isArray(c.childBlocks) && c.childBlocks.length > 0;
          
          if (hasChildren) {
            (this as any).__childrenSeeded = false;
            this.setOnChange(() => {
              if ((this as any).__childrenSeeded || !this.workspace || this.isInFlyout) return;
    
              const stmt = this.getInput("statements");
              if (!stmt) return;
    
              try {
                // Clean up existing child blocks first to avoid connection conflicts
                const existingBlock = stmt.connection.targetBlock();
                if (existingBlock) {
                  // Dispose of existing child blocks and their connections
                  const blocksToDispose: any[] = [];
                  let currentBlock = existingBlock;
                  while (currentBlock) {
                    blocksToDispose.push(currentBlock);
                    currentBlock = currentBlock.getNextBlock();
                  }
                  
                  // Dispose blocks in reverse order to avoid connection issues
                  blocksToDispose.reverse().forEach(block => {
                    try {
                      block.dispose();
                    } catch (error) {
                      console.warn("Error disposing block:", error);
                    }
                  });
                }
    
                if (Array.isArray(c.childBlocks) && c.childBlocks.length > 0) {
                  let previousChild: any = null;
                  for (const childType of c.childBlocks) {
                    const child = this.workspace.newBlock(childType);
                    child.initSvg();
                    const nextConnection = previousChild ? previousChild.nextConnection : stmt.connection;
                    if (nextConnection && child.previousConnection) {
                      nextConnection.connect(child.previousConnection);
                    }
                    child.render();
                    previousChild = child;
                  }
                }
                (this as any).__childrenSeeded = true;
              } catch (error) {
                console.warn("Failed to auto-seed child blocks for", blockDef.id, error);
              }
            });
          }
        }
    
      if (blockDef.type === "action") {
          const actionCfg = cfg as IActionBlockConfig;
          if (Array.isArray(actionCfg.parameters) && actionCfg.parameters.length > 0) {
            actionCfg.parameters.forEach((param: IParameter) => {
              if (param.labelText && (param.labelPosition ?? "prefix") === "prefix") {
                input.appendField(param.labelText);
              }
              if (param.kind === "select") {
                const opts = (param as any).options || [];
                input.appendField(new FieldDropdown(opts), param.name);
                if ((param as any).defaultValue) {
                  try { (this as any).setFieldValue((param as any).defaultValue, param.name); } catch (e) {
                    console.warn("Failed to set default value for parameter", param.name, e);
                  }
                }
              } else if (param.kind === "number") {
                const p: any = param;
                input.appendField(new FieldNumber(p.defaultValue ?? 0), param.name);
              }
              if (param.labelText && (param.labelPosition ?? "prefix") === "suffix") {
                input.appendField(param.labelText);
              }
            });
          }
        } else if (blockDef.type === "creator") {
          const creatorCfg = cfg as ICreateBlockConfig;
          if (Array.isArray(creatorCfg.typeOptions) && creatorCfg.typeOptions.length > 0) {
            input.appendField(new FieldDropdown(creatorCfg.typeOptions), "type");
          }
        } else if (blockDef.type === "setter") {
          const setterCfg = cfg as ISetBlockConfig;
          if (setterCfg.includeNumberInput) {
            input.appendField(new FieldNumber(0), "value");
          } else if (Array.isArray(setterCfg.typeOptions) && setterCfg.typeOptions.length > 0) {
            input.appendField(new FieldDropdown(setterCfg.typeOptions), "value");
          }
        }

        // Add object name at the end for creator blocks
        if (blockDef.type === "creator") {
          input.appendField(blockDef.name);
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
        el.setAttribute("open", String((this as any).__disclosureOpen ?? false));
        return el;
      },
      domToMutation(el: Element) {
        const b = this as Blockly.BlockSvg;
        const open = el.getAttribute("open") !== "false";
        (b as any).__disclosureOpen = open;
        const stmt = b.getInput("statements");
        if (stmt) stmt.setVisible(open);

        const iconField = b.getField("__disclosure_icon");
        if (iconField) {
          iconField.setValue(open ? MINUS_ICON : PLUS_ICON);
        }
        
        b.render();
      }
    };

    // Generator: include available values
    netlogoGenerator.forBlock[blockType] = function(block) {
      if (blockDef.type === "action") {
        // If a generatorTemplate is provided, interpolate parameter fields
        const actionName = blockDef.name.toLowerCase().replace(/\s+/g, "_");
        const actionConfig: IActionBlockConfig = cfg;

        if (actionConfig.generatorTemplate && typeof actionConfig.generatorTemplate === "string") {
          let code = String(actionConfig.generatorTemplate);
          // Replace ${PARAM} placeholders with field values
          const params = Array.isArray(actionConfig.parameters) ? actionConfig.parameters : [];
          params.forEach((p: IParameter) => {
            const val = block.getFieldValue(p.name);
            const safe = val != null ? String(val) : "";
            const re = new RegExp(`\\$\\{${p.name}\\}`, "g");
            code = code.replace(re, safe);
          });
          // Also allow ${ACTION} for the action name
          code = code.replace(/\$\{ACTION\}/g, actionName);
          return code.endsWith("\n") ? code : code + "\n";
        }

        // Fallback: build from parameters
        const parts: string[] = [actionName];
        if (Array.isArray(actionConfig.parameters) && actionConfig.parameters.length > 0) {
          actionConfig.parameters.forEach((param: IParameter) => {
            if (param.labelText && (param.labelPosition ?? "prefix") === "prefix") {
              parts.push(String(param.labelText));
            }
            const v = block.getFieldValue(param.name);
            if (v) parts.push(String(v));
            if (param.labelText && (param.labelPosition ?? "prefix") === "suffix") {
              parts.push(String(param.labelText));
            }
          });
        }

        return parts.join(" ") + "\n";
      } else if (blockDef.type === "setter") {
        // This is probably at least close to what we want.
        const attributeName = blockDef.name.toLowerCase().replace(/\s+/g, "_");
        const value = block.getFieldValue("value");

        return `set ${attributeName} ${value}\n`;
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
