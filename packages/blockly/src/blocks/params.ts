import Blockly, { FieldDropdown, FieldNumber } from "blockly/core";
import { IParameter } from "../components/types";

export const appendParameterFields = (input: Blockly.Input, params?: IParameter[], blockInstance?: Blockly.Block) => {
  if (!Array.isArray(params) || params.length === 0) return;

  params.forEach((param: IParameter) => {
    const labelPos = (param.labelPosition ?? "prefix");
    if (param.labelText && labelPos === "prefix") {
      input.appendField(param.labelText);
    }

    if (param.kind === "select") {
      const selectParam = param;
      const rawOpts = selectParam.options || [];
      let opts: [string, string][] = [];
      
      if (Array.isArray(rawOpts)) {
        // Normalize options to [label, value] pairs  to satisfy FieldDropdown, which expects the
        // latter format (equivalent to Blockly's MenuOption[]), and filter invalid entries.
        const normalized = rawOpts.map((o) => 
          Array.isArray(o) && o.length === 2 ? o : 
          (o && o.label !== undefined && o.value !== undefined ? [o.label, o.value] : null)
        );
        opts = normalized.filter((o): o is [string, string] => 
          Array.isArray(o) && o.length === 2 && typeof o[0] === "string" && typeof o[1] === "string"
        );
      }

      if (opts.length > 0) {
        input.appendField(new FieldDropdown(opts), selectParam.name);
        const paramDefault = selectParam.defaultOptionValue ?? selectParam.defaultValue;
        if (paramDefault !== undefined && paramDefault !== null) {
          try {
            blockInstance?.setFieldValue(paramDefault, selectParam.name);
          } catch (e) {
            console.debug("Failed to set default for parameter", selectParam.name, e);
          }
        }
      }
    } else if (param.kind === "number") {
      const numberParam = param;
      input.appendField(new FieldNumber(numberParam.defaultValue ?? 0), numberParam.name);
    }

    if (param.labelText && labelPos === "suffix") {
      input.appendField(param.labelText);
    }
  });
};

export const applyParameterDefaults = (blockInstance: Blockly.Block, params?: IParameter[]) => {
  if (!Array.isArray(params) || params.length === 0) return;

  try {
    params.forEach((param: IParameter) => {
      if (param.kind === "select") {
        const selectParam = param;
        const paramDefault = selectParam.defaultOptionValue ?? selectParam.defaultValue;
        if (paramDefault !== undefined && paramDefault !== null) {
          try {
            blockInstance.setFieldValue(paramDefault, selectParam.name);
          } catch (e) {
            console.debug("Failed to apply param default", selectParam.name, e);
          }
        }
      } else if (param.kind === "number") {
        const numberParam = param;
        if (numberParam.defaultValue !== undefined && numberParam.defaultValue !== null) {
          try {
            blockInstance.setFieldValue(numberParam.defaultValue, numberParam.name);
          } catch (e) {
            console.debug("Failed to apply numeric param default", numberParam.name, e);
          }
        }
      }
    });
  } catch (e) {
    console.debug("Error applying parameter defaults", e);
  }
};
