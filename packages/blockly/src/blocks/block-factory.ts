import { FieldSlider } from "@blockly/field-slider";
import { Blocks, FieldDropdown } from "blockly/core";

import { ICustomBlock, ICreateBlockConfig, ISetBlockConfig } from "../components/types";
import { netlogoGenerator } from "../utils/netlogo-generator";

function renderTemplate(tpl: string, context: Record<string, unknown>) {
  return tpl.replace(/\$\{(\w+)\}/g, (_m, key) => {
    const v = context[key];
    return v === undefined || v === null ? "" : String(v);
  });
}

export function registerCustomBlocks(customBlocks: ICustomBlock[]) {
  customBlocks.forEach(blockDef => {
    const blockType = `custom_${blockDef.id}`;
    const cfg = blockDef.config as (ICreateBlockConfig | ISetBlockConfig);

    const applyCommonFlags = (block: any) => {
      if (cfg.inputsInline !== undefined) block.setInputsInline(!!cfg.inputsInline);
      if (cfg.previousStatement !== undefined) block.setPreviousStatement(!!cfg.previousStatement);
      if (cfg.nextStatement !== undefined) block.setNextStatement(!!cfg.nextStatement);
    };

    
    Blocks[blockType] = {
      init() {
        const input = this.appendDummyInput().appendField(blockDef.name);

        // Optional count slider for creator
        if (blockDef.type === "creator") {
          const c = cfg as ICreateBlockConfig;
          if (c.defaultCount !== undefined && c.minCount !== undefined && c.maxCount !== undefined) {
            input.appendField(new FieldSlider(c.defaultCount, c.minCount, c.maxCount), "count");
          }
        }

        // Optional dropdown for creator or setter
        const typeOptions = (cfg as ICreateBlockConfig | ISetBlockConfig).typeOptions;
        if (typeOptions && typeOptions.length > 0) {
          const dropdownFieldName = blockDef.type === "creator" ? "type" : "value";
          input.appendField(new FieldDropdown(typeOptions), dropdownFieldName);
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
      }
    };

    // Generator: include available values
    netlogoGenerator.forBlock[blockType] = function(block) {
      const fn = blockDef.name.toLowerCase().replace(/\s+/g, "_");

      // Collect fields that may exist
      const data: Record<string, unknown> = {
        count: block.getFieldValue("count"),
        label: cfg.typeLabel,
        name: blockDef.name,
        type: block.getFieldValue("type"),
        value: block.getFieldValue("value")
      };

      if (cfg.generatorTemplate && cfg.generatorTemplate.trim()) {
        // Use authored template, wrapped in a function body
        const body = renderTemplate(cfg.generatorTemplate, data);
        return `async function ${fn}() {\n${body}\n}\n`;
      } else {
        // Default fallback
        const parts: string[] = [];
        if (data.count !== undefined && data.count !== null) parts.push(`count: ${data.count}`);
        if (data.type) parts.push(`type: ${data.type}`);
        if (data.value) parts.push(`${cfg.typeLabel || "value"}: ${data.value}`);
        const comment = parts.length ? `  // ${parts.join(", ")}\n` : "";
        return `async function ${fn}() {\n${comment}}\n`;
      }
    };
  });
}
