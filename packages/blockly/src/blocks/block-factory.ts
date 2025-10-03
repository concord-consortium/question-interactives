import { FieldSlider } from "@blockly/field-slider";
import type { BlockSvg } from "blockly";
import Blockly, { Blocks, FieldDropdown, FieldNumber } from "blockly/core";

import { ICustomBlock, IParameter, IBlockConfig, STATEMENT_KIND_LABEL } from "../components/types";
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
    const blockConfig: IBlockConfig = blockDef.config;

    const applyCommonFlags = (block: any) => {
      if (blockConfig.inputsInline !== undefined) block.setInputsInline(!!blockConfig.inputsInline);
      if (blockConfig.previousStatement !== undefined) block.setPreviousStatement(!!blockConfig.previousStatement);
      if (blockConfig.nextStatement !== undefined) block.setNextStatement(!!blockConfig.nextStatement);
    };

    Blocks[blockType] = {
      init() {
        // Display block name with appropriate prefix based on block type
        const displayName = blockDef.type === "action" ? blockDef.name :
                            blockDef.type === "creator" ? "create" :
                            blockDef.type === "setter" ? `set ${blockDef.name}` :
                            blockDef.name;
        // Create input without immediately appending the name so we can control placement as needed.
        const input = this.appendDummyInput();
    
        if ((blockDef.type === "action" && blockConfig.canHaveChildren) || blockDef.type === "creator") {
          const statementsInput = this.appendStatementInput("statements");
          // Only apply child block restrictions for action and creator blocks, not statement blocks.
          if (Array.isArray(blockConfig.childBlocks) && blockConfig.childBlocks.length > 0) {
            statementsInput.setCheck(blockConfig.childBlocks);
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

          if (blockDef.type === "creator") {
            if (blockConfig.defaultCount !== undefined && blockConfig.minCount !== undefined && blockConfig.maxCount !== undefined) {
              input.appendField(new FieldSlider(blockConfig.defaultCount, blockConfig.minCount, blockConfig.maxCount), "count");
            }
          }
          
          // One-time seeding of child blocks on first creation/attach.
          const hasChildren = Array.isArray(blockConfig.childBlocks) && blockConfig.childBlocks.length > 0;
          
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

                if (Array.isArray(blockConfig.childBlocks) && blockConfig.childBlocks.length > 0) {
                  let previousChild: any = null;
                  for (const childType of blockConfig.childBlocks) {
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
    
        // Except for condition or statement blocks, append the display name immediately.
        if (blockDef.type !== "condition" && blockDef.type !== "statement") {
          input.appendField(displayName);
        }

        if (blockDef.type === "action") {
          if (Array.isArray(blockConfig.parameters) && blockConfig.parameters.length > 0) {
            blockConfig.parameters.forEach((param: IParameter) => {
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
          if (Array.isArray(blockConfig.typeOptions) && blockConfig.typeOptions.length > 0) {
            input.appendField(new FieldDropdown(blockConfig.typeOptions), "type");
          }
        } else if (blockDef.type === "setter") {
          if (blockConfig.includeNumberInput) {
            input.appendField(new FieldNumber(0), "value");
          } else if (Array.isArray(blockConfig.typeOptions) && blockConfig.typeOptions.length > 0) {
            input.appendField(new FieldDropdown(blockConfig.typeOptions), "value");
          }
        } else if (blockDef.type === "statement") {
          this.setPreviousStatement(true);
          this.setNextStatement(true);
          const statementKind = blockConfig.statementKind || "custom";
          const kindLabel = STATEMENT_KIND_LABEL[statementKind as keyof typeof STATEMENT_KIND_LABEL] || "";
          if (statementKind === "when") { // "when [condition]"
            input.appendField(kindLabel);
            if (blockConfig.conditionInput) {
              this.appendValueInput("condition").setCheck("Boolean");
            }
          } else if (statementKind === "repeat") { // "repeat [n]"
            input.appendField(kindLabel);
            input.appendField(new FieldNumber(1, 0), "TIMES");
          } else if (statementKind === "chance") { // "with a chance of [n]%"
            input.appendField(kindLabel);
            this.appendValueInput("NUM").setCheck("Number");
            const suffix = this.appendDummyInput();
            suffix.appendField("%");
          } else if (statementKind === "ask") { // "ask [target]"
            input.appendField(kindLabel);
          } else {
            input.appendField(displayName);
          }
          if (Array.isArray(blockConfig.options) && blockConfig.options.length > 0) {
            input.appendField(new FieldDropdown(blockConfig.options), "target");
          }
          // Add entity name as static label after dropdown.
          if (blockConfig.targetEntity) {
            input.appendField(blockConfig.targetEntity);
          }
          this.appendStatementInput("statements");
        } else if (blockDef.type === "condition") {
          // Condition blocks are value blocks with Boolean output.
          this.setOutput(true, "Boolean");
          const labelPosition = blockConfig.labelPosition || "prefix";
          if (labelPosition === "prefix") {
            input.appendField(displayName);
            if (Array.isArray(blockConfig.options) && blockConfig.options.length > 0) {
              input.appendField(new FieldDropdown(blockConfig.options), "condition");
            }
          } else {
            // Remove existing name field and add after dropdown.
            const fresh = this.appendDummyInput();
            if (Array.isArray(blockConfig.options) && blockConfig.options.length > 0) {
              fresh.appendField(new FieldDropdown(blockConfig.options), "condition");
            }
            fresh.appendField(blockDef.name);
          }

          // Add entity name as static label after dropdown.
          if (blockConfig.targetEntity) {
            input.appendField(blockConfig.targetEntity);
          }
        }

        // Add object name at the end for creator blocks
        if (blockDef.type === "creator") {
          input.appendField(blockDef.name);
        }
    
        // Default connections if not specified. For condition blocks, we intentionally skip
        // setting previous/next so the block remains a value block.
        const isConditionBlock = blockDef.type === "condition";
        if (!isConditionBlock) {
          if (blockConfig.previousStatement === undefined) this.setPreviousStatement(true);
          if (blockConfig.nextStatement === undefined) this.setNextStatement(true);
        }

        // Color and inline/connection flags
        this.setColour(blockDef.color);
        const isConditionBlockFinal = blockDef.type === "condition"; // TODO: Is this right?
        if (isConditionBlockFinal) {
          // Respect inputsInline, but do not apply previous/next connections for value blocks.
          if (blockConfig.inputsInline !== undefined) this.setInputsInline(!!blockConfig.inputsInline);
        } else {
          applyCommonFlags(this);
        }
      },

      // Persist open/closed state for blocks that have a disclosure toggle.
      mutationToDom() {
        const el = document.createElement("mutation");
        const hasDisclosure = (blockDef.type === "creator") || (blockDef.type === "action" && !!blockConfig.canHaveChildren);
        const open = hasDisclosure ? ((this as any).__disclosureOpen ?? false) : true;
        el.setAttribute("open", String(open));
        return el;
      },
      domToMutation(el: Element) {
        const b = this as Blockly.BlockSvg;
        const hasDisclosure = (blockDef.type === "creator") || (blockDef.type === "action" && !!blockConfig.canHaveChildren);
        if (hasDisclosure) {
          const open = el.getAttribute("open") !== "false";
          (b as any).__disclosureOpen = open;
          const stmt = b.getInput("statements");
          if (stmt) stmt.setVisible(open);
          const iconField = b.getField("__disclosure_icon");
          if (iconField) {
            iconField.setValue(open ? MINUS_ICON : PLUS_ICON);
          }
        } else {
          // Ensure statement input is visible for blocks without disclosure toggle
          const stmt = b.getInput("statements");
          if (stmt) stmt.setVisible(true);
        }
        b.render();
      }
    };

    // Generator: include available values
    netlogoGenerator.forBlock[blockType] = function(block) {
      if (blockDef.type === "action") {
        // If a generatorTemplate is provided, interpolate parameter fields
        const actionName = blockDef.name.toLowerCase().replace(/\s+/g, "_");

        if (blockConfig.generatorTemplate && typeof blockConfig.generatorTemplate === "string") {
          let code = String(blockConfig.generatorTemplate);
          // Replace ${PARAM} placeholders with field values
          const params = Array.isArray(blockConfig.parameters) ? blockConfig.parameters : [];
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
        if (Array.isArray(blockConfig.parameters) && blockConfig.parameters.length > 0) {
          blockConfig.parameters.forEach((param: IParameter) => {
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
      } else if (blockDef.type === "statement") {
        const statements = netlogoGenerator.statementToCode(block, "statements");
        const kind = blockConfig.statementKind || "custom";
        if (kind === "ask") {
          const target = block.getFieldValue("target");
          const targetEntity = blockConfig.targetEntity || "";
          return `ask ${target} ${targetEntity} [\n${statements}]\n`;
        } else if (kind === "when") {
          const condition = netlogoGenerator.valueToCode(block, "condition", netlogoGenerator.ORDER_NONE) || "false";
          return `if ${condition} [\n${statements}]\n`;
        } else if (kind === "repeat") {
          const times = block.getFieldValue("TIMES") || 0;
          return `repeat ${times} [\n${statements}]\n`;
        } else if (kind === "chance") {
          const num = netlogoGenerator.valueToCode(block, "NUM", netlogoGenerator.ORDER_NONE) || "0";
          return `if random-float 100 < ${num} [\n${statements}]\n`;
        } else { // kind is "custom" or undefined/unknown
          if (blockConfig.generatorTemplate && typeof blockConfig.generatorTemplate === "string") {
            const code = String(blockConfig.generatorTemplate);
            return code.endsWith("\n") ? code : code + "\n";
          }

          return statements;
        }
      } else if (blockDef.type === "condition") {
        const condition = block.getFieldValue("condition");
        return condition;
      }

      return "";
    };
  });
}
