import { BlockSvg } from "blockly";
import { javascriptGenerator, Order } from "blockly/javascript";
import { ICustomBlock, IParameter, IBlockConfig } from "../components/types";
import { replaceParameters } from "../utils/block-utils";

export const createGenerator = (blockDef: ICustomBlock, blockConfig: IBlockConfig) => {
  return function(block: BlockSvg): string | [string, Order] {
    switch (blockDef.type) {
      case "action": {
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
      }

      case "setter": {
        // This is probably at least close to what we want.
        const attributeName = blockDef.name.toLowerCase().replace(/\s+/g, "_");
        const value = block.getFieldValue("value");

        return `set_${attributeName}(agent, "${value}");\n`;
      }

      case "creator": {
        // This is probably NOT close to what we want. There can be other parameters
        // to take into consideration and statements to process, e.g. child setter blocks.
        // For now, though, we just return a simple create command. 
        const count = block.getFieldValue("count");
        const type = (block.getFieldValue("type") || "").toLowerCase().replace(/\s+/g, "_");
        
        // Handle collapsed blocks -- statements input may not exist.
        let statements = "";
        if (block.getInput("statements")) {
          statements = javascriptGenerator.statementToCode(block, "statements");
        } else {
          // Block is collapsed -- use cached code.
          statements = (block as any).__cachedChildrenCode || "";
        }
        
        const callback = statements ? `(agent) => {\n${statements}\n}` : "";
  
        return `create_${type}(${count}, ${callback});\n`;
      }

      case "ask": {
        const target = block.getFieldValue("target");
        
        // Handle collapsed blocks -- statements input may not exist.
        let statements = "";
        if (block.getInput("statements")) {
          statements = javascriptGenerator.statementToCode(block, "statements");
        } else {
          // Block is collapsed -- use cached code.
          statements = (block as any).__cachedChildrenCode || "";
        }

        const agents = target === "all" ? "sim.actors" : `sim.withLabel("${target}")`;
  
        return `${agents}.forEach(agent => {\n${statements}\n});\n`;
      }

      case "condition": {
        const condition = block.getFieldValue("condition");
        if (blockConfig.generatorTemplate) {
          let code = replaceParameters(blockConfig.generatorTemplate, blockConfig.parameters || [], block);
          code = code.replace(/\$\{CONDITION\}/g, condition);
          return [code, Order.ATOMIC];
        }
  
        return condition;
      }

      case "globalValue": {
        const globalName = blockConfig.globalName || blockDef.name;
        return [`globals.get("${globalName}")`, Order.ATOMIC];
      }

      default:
        return "";
    }
  };
};
