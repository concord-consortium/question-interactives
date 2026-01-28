import { FieldSlider } from "@blockly/field-slider";
import type { BlockSvg } from "blockly";
import { javascriptGenerator } from "blockly/javascript";
import {
  Blocks, FieldDropdown, FieldImage, FieldNumber, Input, MenuOption, serialization, utils, WorkspaceSvg, Xml
} from "blockly/core";

import { ICustomBlock, IBlockConfig } from "../components/types";
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

const getXmlFromTemplate = (childBlocks: serialization.blocks.State, workspace: WorkspaceSvg) => {
  const innerRoot = serialization.blocks.append(childBlocks, workspace);
  const dom = Xml.blockToDom(innerRoot, true);
  const xml = Xml.domToText(dom);
  innerRoot.dispose(false);
  return xml;
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
          const { defaultChildBlocks, optionChildBlocks, useOptionChildBlocks } = blockConfig;
          
          // Initialize as closed (no statement input).
          this.__disclosureOpen = false;
          this.__cachedChildrenCode = "";
          this.__childrenSeeded = false;

          // Add open/close toggle button.
          const icon = new FieldImage(PLUS_ICON, 16, 16, "+/-");
          icon.setOnClickHandler?.(() => {
            const open = !this.__disclosureOpen;
            this.__disclosureOpen = open;

            if (open) {
              // Opening: add statement input
              this.appendStatementInput("statements");

              // Create default child blocks if this is the first time opening the block
              // FIXME This will add default child blocks to a child block if no child blocks are specified for it. To reproduce:
              // 1. Define three custom blocks, A, B, and C.
              // 2. Make the default child blocks of B a single C.
              // 3. Make the default child blocks of A a single B with no children (no C in it).
              // 4. Add an A block to the workspace and open it. Then open the B within it.
              //    C will be in B, even though it is not specified in A's default child blocks.
              if (includeDefaultChildBlocks && !this.__childrenSeeded && !this.__savedChildrenXml) {
                this.__childrenSeeded = true;
                const option = this.getFieldValue("type");
                const childBlocks = useOptionChildBlocks ? optionChildBlocks?.[option] : defaultChildBlocks;
                if (childBlocks) {
                  restoreChildBlocks(this, getXmlFromTemplate(childBlocks, this.workspace));
                }
              } else if (this.__savedChildrenXml) {
                restoreChildBlocks(this, this.__savedChildrenXml);
              }

              // Clear saved status since the children exist.
              this.__savedChildrenXml = "";
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
          // TODO changing this should change the default child block code
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
