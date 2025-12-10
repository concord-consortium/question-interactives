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

          // Helper to dispose all connected child blocks
          const disposeChildren = (block: BlockSvg) => {
            const stmt = block.getInput("statements");
            if (!stmt?.connection) return;
            const targetBlock = stmt.connection.targetBlock() as BlockSvg | null;
            if (!targetBlock) return;

            const blocksToDispose: BlockSvg[] = [];
            let currentBlock: BlockSvg | null = targetBlock;
            while (currentBlock) {
              blocksToDispose.push(currentBlock);
              currentBlock = currentBlock.getNextBlock();
            }

            // Dispose in reverse order to avoid connection issues.
            blocksToDispose.reverse().forEach(b => {
              try {
                b.dispose(false); // false = don't animate
              } catch (e) {
                console.warn("Error disposing child block:", e);
              }
            });
          };

          // Helper to serialize connected blocks to XML string
          const serializeChildren = (block: BlockSvg): string => {
            const stmt = block.getInput("statements");
            if (!stmt?.connection) return "";
            const targetBlock = stmt.connection.targetBlock();
            if (!targetBlock) return "";

            try {
              const dom = Blockly.Xml.blockToDom(targetBlock as any, true);
              return Blockly.Xml.domToText(dom);
            } catch (e) {
              console.warn("Failed to serialize children:", e);
              return "";
            }
          };

          // Helper to restore blocks from XML string
          const restoreChildren = (block: BlockSvg, xml: string) => {
            if (!xml) return;
            const stmt = block.getInput("statements");
            const conn = stmt?.connection;
            if (!conn) return;

            try {
              const dom = Blockly.utils.xml.textToDom(`<xml>${xml}</xml>`);
              const blockDom = dom.firstElementChild;
              if (blockDom && block.workspace) {
                const restoredBlock = Blockly.Xml.domToBlock(blockDom, block.workspace as any);
                if (restoredBlock.previousConnection) {
                  conn.connect(restoredBlock.previousConnection);
                }
              }
            } catch (e) {
              console.warn("Failed to restore children:", e);
            }
          };

          // Add open/close toggle button
          const icon = new Blockly.FieldImage(PLUS_ICON, 16, 16, "+/-");
          icon.setOnClickHandler?.(() => {
            const wasOpen = this.__disclosureOpen;
            const open = !wasOpen;
            this.__disclosureOpen = open;

            if (open) {
              // Opening: add statement input and restore saved children.
              this.appendStatementInput("statements");
              if (this.__savedChildrenXml) {
                restoreChildren(this, this.__savedChildrenXml);
                this.__savedChildrenXml = "";
              }
            } else {
              // Closing: save children XML, dispose them, then remove statement input.
              this.__savedChildrenXml = serializeChildren(this);
              disposeChildren(this);
              this.removeInput("statements", true);
            }

            icon.setValue(open ? MINUS_ICON : PLUS_ICON);
            this.render();
          });
          input.insertFieldAt(0, icon, "__disclosure_icon");
          
          // Initialize as closed (no statement input).
          this.__disclosureOpen = false;
          this.__savedChildrenXml = "";
          // Don't create statement input initially. It will be added when opened.
          
          // One-time seeding of child blocks on first creation/attach.
          const hasChildren = Array.isArray(blockConfig.childBlocks) && blockConfig.childBlocks.length > 0;
          
          if (hasChildren) {
            this.__childrenSeeded = false;
            this.setOnChange(() => {
              if (this.__childrenSeeded || !this.workspace || this.workspace.isFlyout) return;
    
              // Temporarily add statement input for seeding.
              let stmt = this.getInput("statements");
              const wasOpen = this.__disclosureOpen;
              if (!stmt) {
                stmt = this.appendStatementInput("statements");
              }
    
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
                
                // If was closed, save children, dispose them, and remove input.
                if (!wasOpen) {
                  this.__savedChildrenXml = serializeChildren(this);
                  disposeChildren(this);
                  this.removeInput("statements", true);
                  this.render();
                }
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

        if (blockDef.type === "creator") {
          if (blockConfig.defaultCount !== undefined && blockConfig.minCount !== undefined && blockConfig.maxCount !== undefined) {
            input.appendField(new FieldSlider(blockConfig.defaultCount, blockConfig.minCount, blockConfig.maxCount), "count");
          }
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

      // Persist open/closed state and children for blocks that have a disclosure toggle.
      mutationToDom() {
        const el = document.createElement("mutation");
        const hasDisclosure = blockHasDisclosure(blockDef, blockConfig);
        const open = hasDisclosure ? (this.__disclosureOpen ?? false) : true;
        el.setAttribute("open", String(open));
        
        // If closed, save current savedChildrenXml. If open, serialize current children.
        if (hasDisclosure && !open) {
          const savedXml = (this as any).__savedChildrenXml || "";
          if (savedXml) {
            el.setAttribute("children", savedXml);
          }
        } else if (hasDisclosure && open) {
          // Serialize currently connected children.
          const stmt = this.getInput("statements");
          if (stmt?.connection) {
            const targetBlock = stmt.connection.targetBlock();
            if (targetBlock) {
              try {
                const dom = Blockly.Xml.blockToDom(targetBlock as any, true);
                el.setAttribute("children", Blockly.Xml.domToText(dom));
              } catch (e) {
                console.warn("Failed to serialize children in mutationToDom:", e);
              }
            }
          }
        }
        return el;
      },
      domToMutation(el: Element) {
        const b = this as BlockSvg;
        const hasDisclosure = blockHasDisclosure(blockDef, blockConfig);
        if (hasDisclosure) {
          const open = el.getAttribute("open") !== "false";
          const childrenXml = el.getAttribute("children") || "";
          
          (b as any).__disclosureOpen = open;
          (b as any).__savedChildrenXml = childrenXml;
          
          // Add or remove statement input based on state.
          const existingStmt = b.getInput("statements");
          if (open && !existingStmt) {
            b.appendStatementInput("statements");
          } else if (!open && existingStmt) {
            b.removeInput("statements", true);
          }
          
          const iconField = b.getField("__disclosure_icon");
          if (iconField) {
            iconField.setValue(open ? MINUS_ICON : PLUS_ICON);
          }
        }
        // Note: blocks without disclosure don't need statement inputs added here.
        // If a block type needs a statement input, it should be added in its init().
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
        
        // Handle collapsed blocks -- statements input may not exist.
        let statements = "";
        if (block.getInput("statements")) {
          statements = javascriptGenerator.statementToCode(block, "statements");
        } else {
          // Block is collapsed -- restore children temporarily to generate code.
          const savedXml = (block as any).__savedChildrenXml;
          if (savedXml && block.workspace) {
            try {
              const dom = Blockly.utils.xml.textToDom(`<xml>${savedXml}</xml>`);
              const blockDom = dom.firstElementChild;
              if (blockDom) {
                const tempBlock = Blockly.Xml.domToBlock(blockDom, block.workspace);
                const codeResult = javascriptGenerator.blockToCode(tempBlock);
                // blockToCode can return string or [string, number] tuple.
                statements = Array.isArray(codeResult) ? codeResult[0] : codeResult;
                tempBlock.dispose();
              }
            } catch (e) {
              console.warn("Failed to generate code from saved children:", e);
            }
          }
        }
        const callback = statements ? `(agent) => {\n${statements}\n}` : "";

        return `create_${type}(${count}, ${callback});\n`;
      } else if (blockDef.type === "ask") {
        const target = block.getFieldValue("target");
        
        // Handle collapsed blocks -- statements input may not exist.
        let statements = "";
        if (block.getInput("statements")) {
          statements = javascriptGenerator.statementToCode(block, "statements");
        } else {
          // Block is collapsed -- restore children temporarily to generate code.
          const savedXml = (block as any).__savedChildrenXml;
          if (savedXml && block.workspace) {
            try {
              const dom = Blockly.utils.xml.textToDom(`<xml>${savedXml}</xml>`);
              const blockDom = dom.firstElementChild;
              if (blockDom) {
                const tempBlock = Blockly.Xml.domToBlock(blockDom, block.workspace);
                const codeResult = javascriptGenerator.blockToCode(tempBlock);
                // blockToCode can return string or [string, number] tuple
                statements = Array.isArray(codeResult) ? codeResult[0] : codeResult;
                tempBlock.dispose();
              }
            } catch (e) {
              console.warn("Failed to generate code from saved children:", e);
            }
          }
        }
        const agents = target === "all" ? "sim.actors" : `sim.withLabel("${target}")`;
        return `${agents}.forEach(agent => {\n${statements}\n});\n`;
      } else if (blockDef.type === "condition") {
        const condition = block.getFieldValue("condition");

        if (blockConfig.generatorTemplate) {
          let code = replaceParameters(blockConfig.generatorTemplate, blockConfig.parameters || [], block);
          code = code.replace(/\$\{CONDITION\}/g, condition);
          return [code, Order.ATOMIC];
        }

        return condition;
      }

      return "";
    };
  });
}
