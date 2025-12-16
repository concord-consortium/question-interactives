import { FieldSlider } from "@blockly/field-slider";
import type { BlockSvg } from "blockly";
import { javascriptGenerator } from "blockly/javascript";
import Blockly, { Blocks, Connection, FieldDropdown, FieldNumber } from "blockly/core";

import { ICustomBlock, INestedBlock, IBlockConfig } from "../components/types";
import { createGenerator } from "./generators";
import { appendParameterFields, applyParameterDefaults } from "./params";

const PLUS_ICON  = "data:image/svg+xml;utf8," +
  "<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16'>" +
  "<text fill='white' x='8' y='12' text-anchor='middle' font-size='14'>+</text></svg>";

const MINUS_ICON = "data:image/svg+xml;utf8," +
  "<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16'>" +
  "<text fill='white' x='8' y='12' text-anchor='middle' font-size='14'>−</text></svg>";

const blockHasDisclosure = (blockDef: ICustomBlock, blockConfig: IBlockConfig): boolean => {
  return blockDef.type === "creator" ||
    (blockDef.type === "action" && !!blockConfig.canHaveChildren);
};

const appendDropdownFromTypeOptions = (input: Blockly.Input, blockConfig: IBlockConfig, fieldName: string) => {
  if (Array.isArray(blockConfig.typeOptions) && blockConfig.typeOptions.length > 0) {
    const opts = blockConfig.typeOptions.filter(
      opt => Array.isArray(opt) && opt.length === 2 && typeof opt[0] === "string" && typeof opt[1] === "string"
    );
    if (opts.length > 0) {
      input.appendField(new FieldDropdown(opts), fieldName);
    }
  }
};

const displayNameForBlock = (blockDef: ICustomBlock): string => {
  return blockDef.type === "ask" ? "ask" :
         blockDef.type === "creator" ? "create" :
         blockDef.type === "setter" ? `set ${blockDef.name}` :
         blockDef.name;
};

export const registerCustomBlocks = (customBlocks: ICustomBlock[]) => {
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
        const displayName = displayNameForBlock(blockDef);
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
                // false = do not "heal stack", i.e., don't reconnect remaining blocks when
                // one is removed. We skip healing because we're disposing all children.
                // See https://developers.google.com/blockly/reference/js/blockly.blocksvg_class.dispose_1_method.md
                b.dispose(false);
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

          // Helper to create nested blocks from config (used for seeding).
          const createNestedBlocksFromConfig = (nestedBlocks: INestedBlock[], parentConnection: Connection) => {
            let previousChild: BlockSvg | null = null;

            for (const nestedBlock of nestedBlocks) {
              const child = this.workspace.newBlock(nestedBlock.blockId) as BlockSvg;
              child.initSvg();

              // If an override for a dropdown is specified, apply it.
              if (nestedBlock.defaultOptionValue) {
                child.setFieldValue(nestedBlock.defaultOptionValue, "value");
              }

              const targetConnection = previousChild?.nextConnection ?? parentConnection;
              if (targetConnection && child.previousConnection) {
                targetConnection.connect(child.previousConnection);
              }

              child.render();
              previousChild = child;

              if (nestedBlock.children && nestedBlock.children.length > 0) {
                const childStmt = child.getInput("statements");
                if (childStmt?.connection) {
                  createNestedBlocksFromConfig(nestedBlock.children, childStmt.connection);
                }
              }
            }
          };

          // Check if this block type has child blocks configured for seeding.
          const hasChildBlocksConfig = Array.isArray(blockConfig.childBlocks) && blockConfig.childBlocks.length > 0;

          // Add open/close toggle button
          const icon = new Blockly.FieldImage(PLUS_ICON, 16, 16, "+/-");
          icon.setOnClickHandler?.(() => {
            const wasOpen = this.__disclosureOpen;
            const open = !wasOpen;
            this.__disclosureOpen = open;

            if (open) {
              // Opening: add statement input.
              this.appendStatementInput("statements");

              if (!this.__childrenSeeded && hasChildBlocksConfig) {
                this.__childrenSeeded = true;
                // If we have pre-generated XML, use restoration (more efficient).
                // Otherwise, create programmatically.
                if (this.__savedChildrenXml) {
                  restoreChildren(this, this.__savedChildrenXml);
                  this.__savedChildrenXml = "";
                } else {
                  const stmtConnection = this.getInput("statements")?.connection;
                  if (stmtConnection && this.workspace && !this.workspace.isFlyout && blockConfig.childBlocks) {
                    createNestedBlocksFromConfig(blockConfig.childBlocks, stmtConnection);
                  }
                }
              } else if (this.__savedChildrenXml) {
                restoreChildren(this, this.__savedChildrenXml);
                this.__savedChildrenXml = "";
              }

              // Clear cached code since children are now editable.
              this.__cachedChildrenCode = "";
            } else {
              // Closing: save children XML and cache generated code.
              this.__savedChildrenXml = serializeChildren(this);
              const stmt = this.getInput("statements");
              if (stmt) {
                this.__cachedChildrenCode = javascriptGenerator.statementToCode(this, "statements") || "";
              }
              disposeChildren(this);
              this.removeInput("statements", true);
            }

            icon.setValue(open ? MINUS_ICON : PLUS_ICON);
            this.render();
          });
          input.insertFieldAt(0, icon, "__disclosure_icon");
          
          // Initialize as closed (no statement input).
          this.__disclosureOpen = false;
          this.__cachedChildrenCode = "";
          this.__childrenSeeded = false;

          // Pre-generate XML for configured child blocks so code generation works even before opening.
          if (hasChildBlocksConfig) {
            // Build XML for a single block with its nested children.
            const buildBlockXml = (child: INestedBlock): string => {
              const defaultFieldXml = child.defaultOptionValue
                ? `<field name="value">${child.defaultOptionValue}</field>`
                : "";
              const nestedXml = child.children?.length 
                ? `<statement name="statements">${buildSiblingChain(child.children)}</statement>` 
                : "";
              return `<block type="${child.blockId}">${defaultFieldXml}${nestedXml}</block>`;
            };

            // Build XML for a chain of sibling blocks connected via <next>.
            const buildSiblingChain = (children: INestedBlock[]): string => {
              if (children.length === 0) return "";
              if (children.length === 1) return buildBlockXml(children[0]);

              let xml = buildBlockXml(children[children.length - 1]);
              for (let i = children.length - 2; i >= 0; i--) {
                const child = children[i];
                const nestedXml = child.children?.length
                  ? `<statement name="statements">${buildSiblingChain(child.children)}</statement>`
                  : "";
                xml = `<block type="${child.blockId}">${nestedXml}<next>${xml}</next></block>`;
              }
              return xml;
            };

            this.__savedChildrenXml = buildSiblingChain(blockConfig.childBlocks || []);
 
            // Generate cached code from the XML so code generation works even before opening.
            // We temporarily create the blocks, generate code, then dispose them.
            if (this.__savedChildrenXml && this.workspace && !this.workspace.isFlyout) {
              try {
                // Temporarily add statement input to connect blocks
                const tempStmt = this.appendStatementInput("__temp_statements");
                const tempConn = tempStmt.connection;
                
                if (tempConn) {
                  // Create blocks from XML
                  const dom = Blockly.utils.xml.textToDom(`<xml>${this.__savedChildrenXml}</xml>`);
                  const blockDom = dom.firstElementChild;
                  if (blockDom) {
                    const tempBlock = Blockly.Xml.domToBlock(blockDom, this.workspace as any) as BlockSvg;
                    if (tempBlock.previousConnection) {
                      tempConn.connect(tempBlock.previousConnection);
                    }
                    
                    // Generate code from the temporary blocks
                    this.__cachedChildrenCode = javascriptGenerator.statementToCode(this, "__temp_statements") || "";
                    
                    // Clean up: dispose temp blocks manually
                    const blocksToDispose: BlockSvg[] = [];
                    let currentBlock: BlockSvg | null = tempBlock;
                    while (currentBlock) {
                      blocksToDispose.push(currentBlock);
                      currentBlock = currentBlock.getNextBlock();
                    }
                    blocksToDispose.reverse().forEach(b => {
                      try {
                        b.dispose(false);
                      } catch (e) {
                        console.warn("Error disposing temp block:", e);
                      }
                    });
                  }
                }
                
                // Remove temporary input
                this.removeInput("__temp_statements", true);
              } catch (e) {
                console.warn("Failed to pre-generate cached code for child blocks:", e);
                this.__cachedChildrenCode = "";
              }
            }
          } else {
            this.__savedChildrenXml = "";
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
            appendParameterFields(input, blockConfig.parameters, this);
            try {
              applyParameterDefaults(this, blockConfig.parameters);
            } catch (e) {
              console.debug("Error applying parameter defaults", e);
            }
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
              // Apply default selection for ask target dropdown if provided
              try {
                if ((blockConfig as any).defaultOptionValue) {
                  this.setFieldValue((blockConfig as any).defaultOptionValue, "target");
                }
              } catch (e) {
                console.debug("Failed to apply ask default", e);
              }
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
              try {
                if ((blockConfig as any).defaultOptionValue) {
                  this.setFieldValue((blockConfig as any).defaultOptionValue, "condition");
                }
              } catch (e) {
                console.debug("Failed to apply condition default", e);
              }
            }
          } else {
            // Dropdown first, then display name.
            const dropdownInput = this.appendDummyInput();
            if (blockOptions) {
              dropdownInput.appendField(new FieldDropdown(blockOptions), "condition");
              try {
                if ((blockConfig as any).defaultOptionValue) {
                  this.setFieldValue((blockConfig as any).defaultOptionValue, "condition");
                }
              } catch (e) {
                console.debug("Failed to apply condition default", e);
              }
            }
            dropdownInput.appendField(blockDef.name);
          }

          // Add entity name as static label after dropdown.
          if (blockConfig.targetEntity) {
            input.appendField(blockConfig.targetEntity);
          }
        } else if (blockDef.type === "globalValue") {
          // Global value blocks are value blocks that return the value of a global variable.
          const outputType = blockConfig.globalValueType === "string" ? "String" : "Number";
          this.setOutput(true, outputType);
        }

        // Add object name at the end for creator blocks
        if (blockDef.type === "creator") {
          input.appendField(blockDef.name);
        }

        // Color and inline/connection flags
        // Apply default dropdown selections from config (do this after all fields are appended)
        try {
          const def = (blockConfig as any).defaultOptionValue;
          if (def !== undefined && def !== null) {
            // Try common field names where dropdowns are used.
            try { this.setFieldValue(def, "type"); } catch (e) { console.debug("Failed to set default for 'type'", def, e); }
            try { this.setFieldValue(def, "value"); } catch (e) { console.debug("Failed to set default for 'value'", def, e); }
            try { this.setFieldValue(def, "target"); } catch (e) { console.debug("Failed to set default for 'target'", def, e); }
            try { this.setFieldValue(def, "condition"); } catch (e) { console.debug("Failed to set default for 'condition'", def, e); }
          }
        } catch (e) {
          // ignore
        }

        this.setColour(blockDef.color);

        // For all blocks except condition and globalValue blocks, set previous/next statement connections.
        // Use config value if defined, otherwise default to true.
        if (blockDef.type !== "condition" && blockDef.type !== "globalValue") {
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

    // Generator
    javascriptGenerator.forBlock[blockType] = createGenerator(blockDef, blockConfig);
  });
};
