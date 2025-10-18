import { FieldSlider } from "@blockly/field-slider";
import type { BlockSvg } from "blockly";
import { javascriptGenerator, Order } from "blockly/javascript";
import Blockly, { Blocks, Connection, FieldDropdown, FieldNumber } from "blockly/core";

import { ICustomBlock, INestedBlock, IParameter, IBlockConfig } from "../components/types";
import { replaceParameters } from "../utils/block-utils";

const PLUS_ICON  = "data:image/svg+xml;utf8," +
  "<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16'>" +
  "<text fill='white' x='8' y='12' text-anchor='middle' font-size='14'>+</text></svg>";

const MINUS_ICON = "data:image/svg+xml;utf8," +
  "<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16'>" +
  "<text fill='white' x='8' y='12' text-anchor='middle' font-size='14'>−</text></svg>";

function blockHasDisclosure(blockDef: ICustomBlock, blockConfig: IBlockConfig): boolean {
  return blockDef.type === "creator" ||
    (blockDef.type === "action" && !!blockConfig.canHaveChildren);
}

function appendDropdownFromTypeOptions(input: Blockly.Input, blockConfig: IBlockConfig, fieldName: string) {
  if (Array.isArray(blockConfig.typeOptions) && blockConfig.typeOptions.length > 0) {
    const opts = blockConfig.typeOptions.filter(
      opt => Array.isArray(opt) && opt.length === 2 && typeof opt[0] === "string" && typeof opt[1] === "string"
    );
    if (opts.length > 0) {
      input.appendField(new FieldDropdown(opts), fieldName);
    }
  }
}

export function registerCustomBlocks(customBlocks: ICustomBlock[]) {
  if (!Array.isArray(customBlocks)) {
    console.warn("registerCustomBlocks: customBlocks is not an array:", customBlocks);
    return;
  }
  
  customBlocks.forEach(blockDef => {
    // Skip built-in blocks -- they're already registered in custom-built-in-blocks.ts
    // TODO: Remove this check once the TODO in custom-block-editor.tsx about tracking category assignments
    // for built-in blocks is resolved.
    if (blockDef.type === "builtIn") {
      return;
    }

    const blockType = blockDef.id;
    const blockConfig: IBlockConfig = blockDef.config;

    Blocks[blockType] = {
      init() {
        // Display block name with appropriate prefix based on block type
        const displayName = blockDef.type === "action" ? blockDef.name :
                            blockDef.type === "creator" ? "create" :
                            blockDef.type === "ask" ? "ask" :
                            blockDef.type === "setter" ? `set ${blockDef.name}` :
                            blockDef.name;
        // Create input without immediately appending the name so we can control placement as needed.
        const input = this.appendDummyInput();
    
        if (blockHasDisclosure(blockDef, blockConfig)) {
          const statementsInput = this.appendStatementInput("statements");
          
          // Add open/close toggle button
          const icon = new Blockly.FieldImage(PLUS_ICON, 16, 16, "+/-");
          icon.setOnClickHandler?.(() => {
            const open = !this.__disclosureOpen;
            this.__disclosureOpen = open;
            statementsInput.setVisible(open);
            icon.setValue(open ? MINUS_ICON : PLUS_ICON);
            this.render();
          });
          input.insertFieldAt(0, icon, "__disclosure_icon");
          
          // Initialize as closed
          this.__disclosureOpen = false;
          statementsInput.setVisible(false);

          if (blockDef.type === "creator") {
            if (blockConfig.defaultCount !== undefined && blockConfig.minCount !== undefined && blockConfig.maxCount !== undefined) {
              input.appendField(new FieldSlider(blockConfig.defaultCount, blockConfig.minCount, blockConfig.maxCount), "count");
            }
          }
          
          // One-time seeding of child blocks on first creation/attach.
          const hasChildren = Array.isArray(blockConfig.childBlocks) && blockConfig.childBlocks.length > 0;
          
          if (hasChildren) {
            this.__childrenSeeded = false;
            this.setOnChange(() => {
              if (this.__childrenSeeded || !this.workspace || this.isInFlyout) return;
    
              const stmt = this.getInput("statements");
              if (!stmt) return;
    
              try {
                // Clean up existing child blocks first to avoid connection conflicts
                const existingBlock = stmt.connection.targetBlock();
                if (existingBlock) {
                  // Collect existing child blocks and their connections to dispose of them below
                  const blocksToDispose: BlockSvg[] = [];
                  let currentBlock: BlockSvg | null = existingBlock;
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
                  const createNestedBlocks = (nestedBlocks: INestedBlock[], parentConnection: Connection) => {
                    let previousChild = null;
                    
                    for (const nestedBlock of nestedBlocks) {
                      const child = this.workspace.newBlock(nestedBlock.blockId);
                      child.initSvg();
                      
                      // Connect to previous sibling or parent
                      const nextConnection = previousChild ? previousChild.nextConnection : parentConnection;
                      if (nextConnection && child.previousConnection) {
                        nextConnection.connect(child.previousConnection);
                      }
                      
                      child.render();
                      previousChild = child;
                      
                      // Recursively create children of this block
                      if (nestedBlock.children && nestedBlock.children.length > 0) {
                        const childStmt = child.getInput("statements");
                        if (childStmt && childStmt.connection) {
                          createNestedBlocks(nestedBlock.children, childStmt.connection);
                        }
                      }
                    }
                    
                    return previousChild;
                  };
                  
                  createNestedBlocks(blockConfig.childBlocks, stmt.connection);
                }
                this.__childrenSeeded = true;
              } catch (error) {
                console.warn("Failed to auto-seed child blocks for", blockDef.id, error);
              }
            });
          }
        }

        // Except for condition blocks, append the display name immediately.
        if (blockDef.type !== "condition") {
          input.appendField(displayName);
        }

        if (blockDef.type === "action") {
          if (Array.isArray(blockConfig.parameters) && blockConfig.parameters.length > 0) {
            blockConfig.parameters.forEach((param: IParameter) => {
              if (param.labelText && (param.labelPosition ?? "prefix") === "prefix") {
                input.appendField(param.labelText);
              }
              if (param.kind === "select") {
                let opts = (param as any).options || [];
                // Convert {label, value}[] to [label, value][] as needed to satisfy FieldDropdown which expects the latter format (equivalent to Blockly's MenuOption[])
                if (Array.isArray(opts)) {
                  opts = opts.map(opt => [opt?.label, opt?.value]);
                  opts = opts.filter((opt: any) => typeof opt[0] === "string" && typeof opt[1] === "string");
                } else {
                  opts = [];
                }
                opts = Array.isArray(opts)
                  ? opts.filter(opt => Array.isArray(opt) && opt.length === 2 && typeof opt[0] === "string" && typeof opt[1] === "string")
                  : [];
                if (opts.length > 0) {
                  input.appendField(new FieldDropdown(opts), param.name);
                  if (param.defaultValue) {
                    try { this.setFieldValue(param.defaultValue, param.name); } catch (e) {
                      console.warn("Failed to set default value for parameter", param.name, e);
                    }
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
          appendDropdownFromTypeOptions(input, blockConfig, "type");
        } else if (blockDef.type === "setter") {
          if (blockConfig.includeNumberInput) {
            input.appendField(new FieldNumber(0), "value");
          } else {
            appendDropdownFromTypeOptions(input, blockConfig, "value");
          }
        } else if (blockDef.type === "ask") {
          let askOptions = Array.isArray(blockConfig.options) ? [...blockConfig.options] : [];
          askOptions = askOptions.filter(opt => Array.isArray(opt) && opt.length === 2 && typeof opt[0] === "string" && typeof opt[1] === "string");
          if (askOptions.length > 0) {
            if (blockConfig.includeAllOption) askOptions.push(["all", "all"]);
            input.appendField(new FieldDropdown(askOptions), "target");
          }
          // Add entity name as static label after dropdown if showTargetEntityLabel is true (default true)
          if (blockConfig.targetEntity && (blockConfig.showTargetEntityLabel !== false)) {
            input.appendField(blockConfig.targetEntity);
          }
          this.appendStatementInput("statements");
        } else if (blockDef.type === "condition") {
          // Condition blocks are value blocks with Boolean output.
          this.setOutput(true, "Boolean");
          const labelPosition = blockConfig.labelPosition || "prefix";
          const hasOptions = Array.isArray(blockConfig.options) && blockConfig.options.length > 0;
          const blockOptions = hasOptions ? blockConfig.options : undefined;

          if (labelPosition === "prefix") {
            // Display name first, then dropdown.
            input.appendField(displayName);
            if (blockOptions) {
              input.appendField(new FieldDropdown(blockOptions), "condition");
            }
          } else {
            // Dropdown first, then display name.
            const dropdownInput = this.appendDummyInput();
            if (blockOptions) {
              dropdownInput.appendField(new FieldDropdown(blockOptions), "condition");
            }
            dropdownInput.appendField(blockDef.name);
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

        // Color and inline/connection flags
        this.setColour(blockDef.color);

        // For all blocks except condition blocks, set previous/next statement connections. Use config value
        // if defined, otherwise default to true.
        if (blockDef.type !== "condition") {
          this.setPreviousStatement(
            blockConfig.previousStatement !== undefined ? !!blockConfig.previousStatement : true
          );
          this.setNextStatement(
            blockConfig.nextStatement !== undefined ? !!blockConfig.nextStatement : true
          );
        }

        // For all blocks, set inputsInline if defined.
        if (blockConfig.inputsInline !== undefined) {
          this.setInputsInline(!!blockConfig.inputsInline);
        }
      },

      // Persist open/closed state for blocks that have a disclosure toggle.
      mutationToDom() {
        const el = document.createElement("mutation");
        const hasDisclosure = blockHasDisclosure(blockDef, blockConfig);
        const open = hasDisclosure ? (this.__disclosureOpen ?? false) : true;
        el.setAttribute("open", String(open));
        return el;
      },
      domToMutation(el: Element) {
        const b = this as BlockSvg;
        const hasDisclosure = blockHasDisclosure(blockDef, blockConfig);
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
    javascriptGenerator.forBlock[blockType] = function(block) {
      if (blockDef.type === "action") {
        // If a generatorTemplate is provided, interpolate parameter fields
        const actionName = blockDef.name.toLowerCase().replace(/\s+/g, "_");

        if (blockConfig.generatorTemplate) {
          let code = String(blockConfig.generatorTemplate);
          code = replaceParameters(code, blockConfig.parameters || [], block);
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

        return `set_${attributeName}(agent, "${value}");\n`;
      } else if (blockDef.type === "creator") {
        // This is probaly NOT close to what we want. There can be other parameters
        // to take into consideration and statements to process, e.g. child setter blocks.
        // For now, though, we just return a simple create command.
        const count = block.getFieldValue("count");
        const type = block.getFieldValue("type").toLowerCase().replace(/\s+/g, "_");
        const statements = javascriptGenerator.statementToCode(block, "statements");
        const callback = statements ? `(agent) => {\n${statements}\n}` : "";

        return `create_${type}(${count}, ${callback});\n`;
      } else if (blockDef.type === "ask") {
        const target = block.getFieldValue("target");
        const statements = javascriptGenerator.statementToCode(block, "statements");
        const agents = target === "all" ? "sim.actors" : `sim.withLabel("${target}")`;
        return `${agents}.forEach(agent => {\n${statements}\n});\n`;
      } else if (blockDef.type === "condition") {
        if (blockConfig.generatorTemplate) {
          // TODO: Is there a more appropriate order than atomic?
          return [replaceParameters(blockConfig.generatorTemplate, blockConfig.parameters || [], block), Order.ATOMIC];
        }

        const condition = block.getFieldValue("condition");
        return condition;
      }

      return "";
    };
  });
}
