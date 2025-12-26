import { FieldSlider } from "@blockly/field-slider";
import type { BlockSvg } from "blockly";
import { javascriptGenerator } from "blockly/javascript";
import {
  Blocks, Connection, FieldDropdown, FieldImage, FieldNumber, Input, MenuOption, serialization, utils, WorkspaceSvg, Xml
} from "blockly/core";

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


// Filters and validates dropdown options to Blockly MenuOption format.
const filterDropdownOptions = (options: unknown[]): MenuOption[] => {
  if (!Array.isArray(options)) return [];
  return options.filter(
    opt => Array.isArray(opt) && opt.length === 2 && typeof opt[0] === "string" && typeof opt[1] === "string"
  ) as [string, string][];
};

// Appends a dropdown field to an input based on type options in block config.
const appendDropdownFromTypeOptions = (input: Input, blockConfig: IBlockConfig, fieldName: string) => {
  const opts = filterDropdownOptions(blockConfig.typeOptions || []);
  if (opts.length > 0) {
    input.appendField(new FieldDropdown(opts), fieldName);
  }
};

// Determines display name for a block based on its type.
const displayNameForBlock = (blockDef: ICustomBlock): string => {
  return blockDef.type === "ask" ? "ask" :
         blockDef.type === "creator" ? "create" :
         blockDef.type === "setter" ? `set ${blockDef.name}` :
         blockDef.name;
};

// Collects all blocks in a chain starting from a given block.
const collectBlockChain = (startBlock: BlockSvg | null): BlockSvg[] => {
  const blocks: BlockSvg[] = [];
  let current: BlockSvg | null = startBlock;
  while (current) {
    blocks.push(current);
    current = current.getNextBlock();
  }
  return blocks;
};

// Disposes all connected child blocks from a statement input.
const disposeChildBlocks = (block: BlockSvg, inputName = "statements"): void => {
  const stmt = block.getInput(inputName);
  if (!stmt?.connection) return;
  
  const targetBlock = stmt.connection.targetBlock() as BlockSvg | null;
  if (!targetBlock) return;

  const blocksToDispose = collectBlockChain(targetBlock);
  // Dispose in reverse order to avoid connection issues
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

// Serializes connected blocks to XML string.
const serializeChildBlocks = (block: BlockSvg, inputName = "statements"): string => {
  const stmt = block.getInput(inputName);
  if (!stmt?.connection) return "";
  
  const targetBlock = stmt.connection.targetBlock();
  if (!targetBlock) return "";

  try {
    const dom = Xml.blockToDom(targetBlock, true);
    return Xml.domToText(dom);
  } catch (e) {
    console.warn("Failed to serialize children:", e);
    return "";
  }
};

// Restores blocks from XML string to a connection.
const restoreChildBlocks = (block: BlockSvg, xml: string, inputName = "statements"): void => {
  if (!xml) return;
  
  const stmt = block.getInput(inputName);
  const conn = stmt?.connection;
  if (!conn || !block.workspace) return;

  try {
    const dom = utils.xml.textToDom(`<xml>${xml}</xml>`);
    const blockDom = dom.firstElementChild;
    if (blockDom) {
      const restoredBlock = Xml.domToBlock(blockDom, block.workspace);
      if (restoredBlock.previousConnection) {
        conn.connect(restoredBlock.previousConnection);
      }
    }
  } catch (e) {
    console.warn("Failed to restore children:", e);
  }
};

// Builds XML for a single block with its nested children.
const buildBlockXml = (child: INestedBlock): string => {
  const defaultFieldXml = child.defaultOptionValue
    ? `<field name="value">${child.defaultOptionValue}</field>`
    : "";
  const nestedXml = child.children?.length 
    ? `<statement name="statements">${buildSiblingChainXml(child.children)}</statement>` 
    : "";
  return `<block type="${child.blockId}">${defaultFieldXml}${nestedXml}</block>`;
};

// Builds XML for a chain of sibling blocks connected via <next>.
const buildSiblingChainXml = (children: INestedBlock[]): string => {
  if (children.length === 0) return "";
  if (children.length === 1) return buildBlockXml(children[0]);
  
  // Build from last to first, wrapping in <next> tags
  let xml = buildBlockXml(children[children.length - 1]);
  for (let i = children.length - 2; i >= 0; i--) {
    const child = children[i];
    const defaultFieldXml = child.defaultOptionValue
      ? `<field name="value">${child.defaultOptionValue}</field>`
      : "";
    const nestedXml = child.children?.length 
      ? `<statement name="statements">${buildSiblingChainXml(child.children)}</statement>` 
      : "";
    xml = `<block type="${child.blockId}">${defaultFieldXml}${nestedXml}<next>${xml}</next></block>`;
  }
  return xml;
};

const getXmlFromTemplate = (childBlocksTemplate: serialization.blocks.State, workspace: WorkspaceSvg) => {
  const innerRoot = serialization.blocks.append(childBlocksTemplate, workspace);
  const dom = Xml.blockToDom(innerRoot, true);
  const xml = Xml.domToText(dom);
  innerRoot.dispose(false);
  return xml;
};

// Generates code from XML by temporarily creating blocks.
const generateCodeFromXml = (block: BlockSvg, xml: string, inputName: string): string => {
  if (!xml || !block.workspace || block.workspace.isFlyout) return "";

  try {
    // Temporarily add statement input
    const tempStmt = block.appendStatementInput(inputName);
    const tempConn = tempStmt.connection;
    
    if (!tempConn) return "";

    // Create blocks from XML
    const dom = utils.xml.textToDom(`<xml>${xml}</xml>`);
    const blockDom = dom.firstElementChild;
    if (!blockDom) return "";

    const tempBlock = Xml.domToBlock(blockDom, block.workspace) as BlockSvg;
    if (tempBlock.previousConnection) {
      tempConn.connect(tempBlock.previousConnection);
    }
    
    // Generate code from the temporary blocks
    const code = javascriptGenerator.statementToCode(block, inputName) || "";
    
    // Clean up: dispose temp blocks
    const blocksToDispose = collectBlockChain(tempBlock);
    blocksToDispose.reverse().forEach(b => {
      try {
        // false = do not "heal stack", i.e., don't reconnect remaining blocks when
        // one is removed. We skip healing because we're disposing all children.
        // See https://developers.google.com/blockly/reference/js/blockly.blocksvg_class.dispose_1_method.md
        b.dispose(false);
      } catch (e) {
        console.warn("Error disposing temp block:", e);
      }
    });
    
    // Remove temporary input
    block.removeInput(inputName, true);
    
    return code;
  } catch (e) {
    console.warn("Failed to generate code from XML:", e);
    return "";
  }
};

// Creates nested blocks from config (used for seeding).
const createNestedBlocksFromConfig = (
  workspace: WorkspaceSvg, nestedBlocks: INestedBlock[], parentConnection: Connection
): void => {
  let previousChild: BlockSvg | null = null;

  for (const nestedBlock of nestedBlocks) {
    const child = workspace.newBlock(nestedBlock.blockId) as BlockSvg;
    child.initSvg();

    // If an override for a dropdown is specified, apply it
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
        createNestedBlocksFromConfig(workspace, nestedBlock.children, childStmt.connection);
      }
    }
  }
};

export const registerCustomBlocks = (customBlocks: ICustomBlock[], includeDefaultChildBlocks = true) => {
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
          // Check if this block type has child blocks configured for seeding.
          const { childBlocks, childBlocksTemplate } = blockConfig;
          const hasChildBlocksOld = childBlocks && childBlocks.length > 0;
          const hasChildBlocksConfig = includeDefaultChildBlocks && (childBlocksTemplate || hasChildBlocksOld);

          // Add open/close toggle button.
          const icon = new FieldImage(PLUS_ICON, 16, 16, "+/-");
          icon.setOnClickHandler?.(() => {
            const open = !this.__disclosureOpen;
            this.__disclosureOpen = open;

            if (open) {
              // Opening: add statement input
              this.appendStatementInput("statements");

              // Seed child blocks on first open if configured
              if (!this.__childrenSeeded && hasChildBlocksConfig) {
                this.__childrenSeeded = true;
                if (this.__savedChildrenXml) {
                  restoreChildBlocks(this, this.__savedChildrenXml);
                  this.__savedChildrenXml = "";
                } else if (this.workspace && !this.workspace.isFlyout && childBlocks) {
                  // TODO Determine if this is ever reached, and remove it if not.
                  const stmtConnection = this.getInput("statements")?.connection;
                  if (stmtConnection) {
                    createNestedBlocksFromConfig(this.workspace, childBlocks, stmtConnection);
                  }
                }
              } else if (this.__savedChildrenXml) {
                restoreChildBlocks(this, this.__savedChildrenXml);
                this.__savedChildrenXml = "";
              }

              // Clear cached code since children are now editable.
              this.__cachedChildrenCode = "";
            } else {
              // Closing: save children XML and cache generated code.
              this.__savedChildrenXml = serializeChildBlocks(this);
              const stmt = this.getInput("statements");
              if (stmt) {
                this.__cachedChildrenCode = javascriptGenerator.statementToCode(this, "statements") || "";
              }
              disposeChildBlocks(this);
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

          // Pre-generate XML and cached code for configured child blocks.
          if (hasChildBlocksConfig) {
            if (childBlocksTemplate) {
              this.__savedChildrenXml = getXmlFromTemplate(childBlocksTemplate, this.workspace);
            } else {
              this.__savedChildrenXml = buildSiblingChainXml(childBlocks || []);
            }
            this.__cachedChildrenCode = generateCodeFromXml(this, this.__savedChildrenXml, "__temp_statements");
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
          const askOptions = filterDropdownOptions(blockConfig.options || []);
          if (askOptions.length > 0) {
            if (blockConfig.includeAllOption) {
              askOptions.push(["all", "all"]);
            }
            input.appendField(new FieldDropdown(askOptions), "target");
              // Apply default selection for ask target dropdown if provided
              try {
                if (blockConfig.defaultOptionValue) {
                  this.setFieldValue(blockConfig.defaultOptionValue, "target");
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
                if (blockConfig.defaultOptionValue) {
                  this.setFieldValue(blockConfig.defaultOptionValue, "condition");
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
                if (blockConfig.defaultOptionValue) {
                  this.setFieldValue(blockConfig.defaultOptionValue, "condition");
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
          const def = blockConfig.defaultOptionValue;
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
          const savedXml = this.__savedChildrenXml || "";
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
                const dom = Xml.blockToDom(targetBlock, true);
                el.setAttribute("children", Xml.domToText(dom));
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
