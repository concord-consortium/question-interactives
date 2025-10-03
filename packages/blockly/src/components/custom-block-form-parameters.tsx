import React from "react";

import { IParameter } from "./types";
import { CustomBlockFormOptionList } from "./custom-block-form-option-list";

import css from "./custom-block-form-parameters.scss";

interface IProps {
  parameters: IParameter[];
  onParametersChange: (parameters: IParameter[]) => void;
}

export const CustomBlockFormParameters: React.FC<IProps> = ({ parameters, onParametersChange }) => {
  const addSelectParameter = () => {
    const newParameter: IParameter = {
      kind: "select",
      labelPosition: "prefix",
      options: [["", ""]],
      name: "",
    };
    onParametersChange([...parameters, newParameter]);
  };

  const addNumberParameter = () => {
    const newParameter: IParameter = {
      kind: "number",
      labelPosition: "prefix",
      name: ""
    };
    onParametersChange([...parameters, newParameter]);
  };

  const removeParameter = (index: number) => {
    onParametersChange(parameters.filter((_, i) => i !== index));
  };

  const updateParameter = (index: number, updates: Partial<IParameter>) => {
    const updatedParameters = parameters.map((param, i) => 
      i === index ? { ...param, ...updates } as IParameter : param
    );
    onParametersChange(updatedParameters);
  };

  const updateParameterOptions = (index: number, newOptions: { label: string; value: string }[]) => {
    const paramOptions = newOptions.map(opt => [opt.label, opt.value] as [string, string]);
    updateParameter(index, { options: paramOptions });
  };

  return (
    <div className={css.customBlockForm_parameters} data-testid="section-parameters">
      <label htmlFor="block-parameters">Parameters</label>
      <div id="block-parameters" className={css.paramToolbar}>
        <button
          className={css.addParamButton}
          data-testid="add-param-select"
          type="button"
          onClick={addSelectParameter}
        >
          Add Select Parameter
        </button>
        <button
          className={css.addParamButton}
          data-testid="add-param-number"
          type="button"
          onClick={addNumberParameter}
        >
          Add Number Parameter
        </button>
      </div>
      <div>
        {parameters.map((p, i) => (
          <div key={i} className={css.paramRow} data-testid={`param-row-${i}`}>
            <div className={css.paramHeader}>
              <span
                className={css.paramType}
                data-testid={`parameter-type-${i}`}
              >
                {p.kind === "select" ? "Select Parameter" : "Number Parameter"}
              </span>
              <button
                className={css.removeParamButton}
                data-testid={`remove-param-${i}`}
                type="button"
                onClick={() => removeParameter(i)}
              >
                Remove
              </button>
            </div>
            
            <div className={css.paramFields}>
              <div className={css.fieldRow}>
                <div className={css.fieldGroup}>
                  <label htmlFor={`param-name-${i}`}>Name</label>
                  <input
                    data-testid={`param-name-${i}`}
                    id={`param-name-${i}`}
                    placeholder="e.g., DIRECTION"
                    type="text"
                    value={p.name}
                    onChange={(e) => updateParameter(i, { name: e.target.value })}
                  />
                </div>
                
                <div className={css.fieldGroup}>
                  <label htmlFor={`label-text-${i}`}>Label Text</label>
                  <input
                    data-testid={`param-labelText-${i}`}
                    id={`label-text-${i}`}
                    placeholder="e.g., Move"
                    type="text"
                    value={p.labelText || ""}
                    onChange={(e) => updateParameter(i, { labelText: e.target.value })}
                  />
                </div>
                
                <div className={css.fieldGroup}>
                  <label htmlFor={`label-position-${i}`}>Label Position</label>
                  <select
                    data-testid={`param-labelPosition-${i}`}
                    id={`label-position-${i}`}
                    value={p.labelPosition || "prefix"}
                    onChange={(e) => updateParameter(i, { labelPosition: e.target.value as "prefix" | "suffix" })}
                  >
                    <option value="prefix">Before</option>
                    <option value="suffix">After</option>
                  </select>
                </div>
              </div>

              {p.kind === "select" ? (
                <div className={css.selectOptions} data-testid={`param-select-options-${i}`}>
                  <label htmlFor="options">Options</label>
                  <CustomBlockFormOptionList
                    dataTestIdPrefix={`param-option-${i}`}
                    labelPlaceholder="Display text (e.g., forward)"
                    options={(p as any).options?.map((opt: [string, string]) => ({ label: opt[0], value: opt[1] })) || []}
                    valuePlaceholder="Value (e.g., FORWARD)"
                    onOptionsChange={(newOptions) => updateParameterOptions(i, newOptions)}
                  />
                </div>
              ) : (
                <div className={css.numberOptions} data-testid={`param-number-options-${i}`}>
                  <div className={css.fieldGroup}>
                    <label htmlFor={`default-value-${i}`}>Default Value</label>
                    <input
                      data-testid={`param-defaultValue-${i}`}
                      id={`default-value-${i}`}
                      placeholder="0"
                      type="number"
                      value={(p as any).defaultValue ?? ""}
                      onChange={(e) => updateParameter(i, { defaultValue: Number(e.target.value) })}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
