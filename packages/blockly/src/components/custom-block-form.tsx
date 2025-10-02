import React, { useState, useEffect, useMemo } from "react";

import { actionBlockChildOptions } from "../utils/block-utils";
import { extractCategoriesFromToolbox } from "../utils/toolbox-utils";
import { CustomBlockType, IActionBlockConfig, ICustomBlock, ICreateBlockConfig, ISetBlockConfig,
  IParameter, isActionBlockConfig, isCreateBlockConfig, isSetBlockConfig } from "./types";

import css from "./custom-block-form.scss";

const categoryColors = {
  "action": "#004696",
  "creator": "#312b84",
  "setter": "#312b84"
};

interface IProps {
  blockType: CustomBlockType;
  editingBlock?: ICustomBlock | null;
  existingBlocks?: ICustomBlock[];
  toolbox: string;
  onSubmit: (block: ICustomBlock) => void;
}

const updateParameterOptions = (
  prev: IParameter[],
  paramIdx: number,
  optionIdx: number,
  update: (old: [string, string]) => [string, string]
): IParameter[] => {
  return prev.map((pp, idx) => {
    if (idx !== paramIdx) return pp;
    const opts = [ ...((pp as any).options || []) ];
    opts[optionIdx] = update(opts[optionIdx]);
    return ({ ...(pp as any), options: opts }) as IParameter;
  });
};

const removeParameterOption = (
  prev: IParameter[],
  paramIdx: number,
  optionIdx: number
): IParameter[] => {
  return prev.map((pp, idx) => {
    if (idx !== paramIdx) return pp;
    const opts = [ ...((pp as any).options || []) ];
    opts.splice(optionIdx, 1);
    return ({ ...(pp as any), options: opts }) as IParameter;
  });
};

export const CustomBlockForm: React.FC<IProps> = ({ blockType, editingBlock, existingBlocks, onSubmit, toolbox }) => {
  const [formData, setFormData] = useState<{
    canHaveChildren?: boolean;
    category: string;
    childBlocks: string[];
    color: string;
    defaultCount: number;
    generatorTemplate?: string;
    includeCount: boolean;
    includeNumberInput: boolean;
    inputsInline: boolean;
    maxCount: number;
    minCount: number;
    name: string;
    nextStatement: boolean;
    options: { label: string; value: string }[];
    previousStatement: boolean;
    type: CustomBlockType;
  }>({
    canHaveChildren: false,
    category: "",
    childBlocks: [],
    color: categoryColors[blockType] || "#312b84",
    defaultCount: 100,
    generatorTemplate: "",
    includeCount: true,
    includeNumberInput: false,
    inputsInline: true,
    maxCount: 500,
    minCount: 0,
    name: "",
    nextStatement: true,
    options: [{ label: "", value: "" }],
    previousStatement: true,
    type: blockType
  });

  const availableCategories = useMemo(() => extractCategoriesFromToolbox(toolbox), [toolbox]);
  const childSources = useMemo(() => {
    const { setterBlocks, actionBlocks, builtInBlocks } = actionBlockChildOptions(existingBlocks, editingBlock?.id);
    return { setterBlocks, actionBlocks, builtInBlocks };
  }, [existingBlocks, editingBlock]);

  const availableChildOptions = useMemo(() => {
    if (formData.type === "action") {
      return [
        ...(childSources.actionBlocks || []).map(b => ({ id: b.id, name: `${b.name} (action)` })),
        ...(childSources.setterBlocks || []).map(b => ({ id: b.id, name: `${b.name} (setter)` }))
      ];
    } else if (formData.type === "creator") {
      return [
        ...(childSources.setterBlocks || []).map(b => ({ id: b.id, name: `${b.name} (setter)` }))
      ];
    }
    return [];
  }, [formData.type, childSources]);

  const handleChildBlocksMultiSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected: string[] = Array.from(e.target.selectedOptions).map(o => o.value);
    setFormData(prev => ({ ...prev, childBlocks: selected }));
  };

  const blockOptionsFromConfig = (config: IActionBlockConfig | ICreateBlockConfig | ISetBlockConfig) => {
    if (isActionBlockConfig(config)) {
      return [{ label: "", value: "" }];
    } else if (isCreateBlockConfig(config)) {
      return config.typeOptions?.map(opt => ({ label: String(opt[0]), value: opt[1] })) || [{ label: "", value: "" }];
    } else if (isSetBlockConfig(config)) {
      return config.typeOptions?.map(opt => ({ label: String(opt[0]), value: opt[1] })) || [{ label: "", value: "" }];
    }

    return [{ label: "", value: "" }];
  };

  const [parameters, setParameters] = useState<IParameter[]>([]);

  // Populate form when editing.
  useEffect(() => {
    if (editingBlock) {
      const config = editingBlock.config as IActionBlockConfig | ICreateBlockConfig | ISetBlockConfig;

      setFormData({
        canHaveChildren: config.canHaveChildren ?? false,
        category: editingBlock.category || (availableCategories[0] || ""),
        childBlocks: config.childBlocks || [],
        color: editingBlock.color,
        defaultCount: isCreateBlockConfig(config) ? config.defaultCount ?? 100 : 100,
        generatorTemplate: config.generatorTemplate || "",
        includeCount: isCreateBlockConfig(config) ? config.defaultCount !== undefined : true,
        includeNumberInput: isSetBlockConfig(config) ? config.includeNumberInput ?? false : false,
        inputsInline: config.inputsInline ?? true,
        maxCount: isCreateBlockConfig(config) ? config.maxCount ?? 500 : 500,
        minCount: isCreateBlockConfig(config) ? config.minCount ?? 0 : 0,
        name: editingBlock.name,
        nextStatement: config.nextStatement ?? true,
        options: blockOptionsFromConfig(config),
        previousStatement: config.previousStatement ?? true,
        type: editingBlock.type
      });

      if (editingBlock.type === "action") {
        setParameters(((config as IActionBlockConfig).parameters) || []);
      } else {
        setParameters([]);
      }
    } else {
      // Reset form when not editing.
      setFormData(prev => ({
        ...prev,
        canHaveChildren: false,
        category: "",
        childBlocks: [],
        color: categoryColors[blockType] || "#312b84",
        name: "",
        type: blockType,
        inputsInline: true,
        previousStatement: true,
        nextStatement: true,
        options: [{ label: "", value: "" }],
        includeCount: true,
        defaultCount: 100,
        minCount: 0,
        maxCount: 500,
        includeNumberInput: false,
        generatorTemplate: ""
      }));
      setParameters([]);
    }
  }, [editingBlock, blockType, availableCategories]);


  const handleSubmit = () => {
    if (!formData.name) {
      alert("Please provide the block name.");
      return;
    }
    if (!formData.category) {
      alert("Please select a category.");
      return;
    }

    if (formData.type === "action" && (!formData.generatorTemplate || !formData.generatorTemplate.trim())) {
      alert("Please provide the code template for the action block.");
      return;
    }

    const base = {
      inputsInline: formData.inputsInline,
      nextStatement: formData.nextStatement,
      previousStatement: formData.previousStatement
    };

    const effectiveChildBlocks = formData.canHaveChildren ? formData.childBlocks : [];

    const config =
      formData.type === "action"
        ? {
            ...base,
            canHaveChildren: formData.canHaveChildren,
            childBlocks: effectiveChildBlocks,
            parameters: parameters.length ? parameters : undefined,
            generatorTemplate: formData.generatorTemplate?.trim() ? formData.generatorTemplate : undefined
          } as IActionBlockConfig
        : formData.type === "creator"
        ? {
            ...base,
            canHaveChildren: true,
            childBlocks: effectiveChildBlocks,
            typeOptions: formData.options
              .filter(opt => opt.label && opt.value)
              .map(opt => [opt.label, opt.value] as [string, string]),
            ...(formData.includeCount
              ? {
                  defaultCount: formData.defaultCount,
                  minCount: formData.minCount,
                  maxCount: formData.maxCount
                }
              : {})
          } as ICreateBlockConfig
        : {
            ...base,
            canHaveChildren: false,
            typeOptions: formData.includeNumberInput
              ? undefined
              : formData.options
                  .filter(opt => opt.label && opt.value)
                  .map(opt => [opt.label, opt.value] as [string, string]),
            includeNumberInput: formData.includeNumberInput
          } as ISetBlockConfig;

    onSubmit({
      category: formData.category,
      color: formData.color,
      config,
      id: editingBlock?.id ?? "",
      name: formData.name,
      type: formData.type
    });

    // Reset.
    setFormData(prev => ({
      ...prev,
      name: "",
      options: [{ label: "", value: "" }],
      childBlocks: []
    }));
    setParameters([]);
  };

  return (
    <div className={css.customBlockForm} data-testid="custom-block-form">
      <div className={css.customBlockForm_basicFields}>
        <div className={css.customBlockForm_name} data-testid="field-name">
          <label htmlFor="block-name">
            {blockType === "action" ? "Action Name" : blockType === "setter" ? "Property Name" : "Object Name"}
            <span className={css.required}>*</span>
          </label>
          <input
            data-testid="input-name"
            id="block-name"
            placeholder={blockType === "setter" ? "e.g., color, speed" : "e.g., molecules, people"}
            required
            type="text"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          />
        </div>
        <div className={css.customBlockForm_color} data-testid="field-color">
          <label>Color</label>
          <input
            data-testid="input-color"
            type="color"
            value={formData.color}
            onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
          />
        </div>
      </div>

      <div className={css.customBlockForm_category} data-testid="field-category">
        <label>Toolbox Category<span className={css.required}>*</span></label>
        <select
          data-testid="select-category"
          required
          value={formData.category}
          onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
        >
          <option value="">Select a category...</option>
          {availableCategories.map(category => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>

      {/* TODO: Determine if authors will need access to these options. For now, they are hidden by CSS. */}
      <div className={css.customBlockForm_inputs}>
        <label className={css.inlineLabel}>
          <input
            checked={formData.inputsInline}
            type="checkbox"
            onChange={(e) => setFormData(prev => ({ ...prev, inputsInline: e.target.checked }))}
          />
          inputsInline
        </label>
        <label className={css.inlineLabel}>
          <input
            checked={formData.previousStatement}
            type="checkbox"
            onChange={(e) => setFormData(prev => ({ ...prev, previousStatement: e.target.checked }))}
          />
          previousStatement
        </label>
        <label className={css.inlineLabel}>
          <input
            checked={formData.nextStatement}
            type="checkbox"
            onChange={(e) => setFormData(prev => ({ ...prev, nextStatement: e.target.checked }))}
          />
          nextStatement
        </label>
      </div>


      {formData.type === "action" && (
        <div className={css.customBlockForm_parameters} data-testid="section-parameters">
          <label htmlFor="block-parameters">Parameters</label>
          <div id="block-parameters" className={css.paramToolbar}>
            <button
              className={css.addParamButton}
              data-testid="add-param-select"
              type="button"
              onClick={() => setParameters(prev => ([...prev, { kind: "select", name: "", labelPosition: "prefix", options: [["", ""]] } as IParameter]))}
            >
              Add Select Parameter
            </button>
            <button
              className={css.addParamButton}
              data-testid="add-param-number"
              type="button"
              onClick={() => setParameters(prev => ([...prev, { kind: "number", name: "", labelPosition: "prefix" } as IParameter]))}
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
                    onClick={() => setParameters(prev => prev.filter((_, idx) => idx !== i))}
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
                        onChange={(e) => setParameters(prev => prev.map((pp, idx) => idx === i ? ({ ...pp, name: e.target.value }) as IParameter : pp))}
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
                        onChange={(e) => setParameters(prev => prev.map((pp, idx) => idx===i ? ({ ...pp, labelText: e.target.value }) as IParameter : pp))}
                      />
                    </div>
                    
                    <div className={css.fieldGroup}>
                      <label htmlFor={`label-position-${i}`}>Label Position</label>
                      <select
                        data-testid={`param-labelPosition-${i}`}
                        id={`label-position-${i}`}
                        value={p.labelPosition || "prefix"}
                        onChange={(e) => setParameters(prev => prev.map((pp, idx) => idx===i ? ({ ...pp, labelPosition: e.target.value as any }) as IParameter : pp))}
                      >
                        <option value="prefix">Before</option>
                        <option value="suffix">After</option>
                      </select>
                    </div>
                  </div>

                  {p.kind === "select" ? (
                    <div className={css.selectOptions} data-testid={`param-select-options-${i}`}>
                      <label htmlFor="options">Options</label>
                      <div id="options" className={css.optionsList}>
                        {(p as any).options?.map((opt: [string,string], oi: number) => (
                          <div key={oi} className={css.optionRow} data-testid={`param-option-row-${i}-${oi}`}>
                            <input
                              data-testid={`param-option-display-${i}-${oi}`}
                              placeholder="Display text (e.g., forward)"
                              type="text"
                              value={opt[0]}
                              onChange={e => setParameters(prev => updateParameterOptions(prev, i, oi, old => [e.target.value, old[1]]))}
                            />
                            <input
                              data-testid={`param-option-value-${i}-${oi}`}
                              placeholder="Value (e.g., FORWARD)"
                              type="text"
                              value={opt[1]}
                              onChange={e => setParameters(prev => updateParameterOptions(prev, i, oi, old => [old[0], e.target.value]))}
                            />
                            <button
                              className={css.removeOptionButton}
                              data-testid={`remove-param-option-${i}-${oi}`}
                              type="button"
                              onClick={() => setParameters(prev => removeParameterOption(prev, i, oi))}
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                      <button
                        className={css.addOptionButton}
                        data-testid={`add-param-option-${i}`}
                        type="button"
                        onClick={() => setParameters(prev => prev.map((pp, idx) => idx===i ? ({ ...(pp as any), options: [ ...((pp as any).options||[]), ["", ""] ] }) as IParameter : pp))}
                      >
                        Add Option
                      </button>
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
                          onChange={(e) => setParameters(prev => prev.map((pp, idx) => idx===i ? ({ ...(pp as any), defaultValue: Number(e.target.value) }) as IParameter : pp))}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {(formData.type === "creator" || formData.type === "setter") && (
        <div className={css.customBlockForm_options} data-testid="section-options">
          <label htmlFor="options">Options</label>
          <div id="options">
            {formData.options.map((option, index) => (
              <div key={index} className={css.optionRow} data-testid={`option-row-${index}`}>
                <input
                  data-testid={`option-label-${index}`}
                  placeholder="Display text (e.g., blue)"
                  type="text"
                  value={option.label}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    options: prev.options.map((opt, i) => i === index ? { ...opt, label: e.target.value } : opt)
                  }))}
                />
                <input
                  data-testid={`option-value-${index}`}
                  placeholder="Value (e.g., BLUE)"
                  type="text"
                  value={option.value}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    options: prev.options.map((opt, i) => i === index ? { ...opt, value: e.target.value } : opt)
                  }))}
                />
                <button
                  data-testid={`remove-option-${index}`}
                  type="button"
                  onClick={() => setFormData(prev => ({
                    ...prev,
                    options: prev.options.filter((_, i) => i !== index)
                  }))}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
          <button
            className={css.addOptionButton}
            data-testid="add-option"
            type="button"
            onClick={() => setFormData(prev => ({
              ...prev,
              options: [...prev.options, { label: "", value: "" }]
            }))}
          >
            Add Option
          </button>
        </div>
      )}

      {formData.type === "setter" && (
        <div className={css.customBlockForm_includeNumberInput} data-testid="section-include-number-input">
          <label htmlFor="include-number-input">
            <input
              checked={formData.includeNumberInput}
              data-testid="toggle-includeNumberInput"
              id="include-number-input"
              type="checkbox"
              onChange={(e) => setFormData(prev => ({ ...prev, includeNumberInput: e.target.checked }))}
            />
            Use Number Input Instead of Options
          </label>
        </div>
      )}

      {formData.type === "creator" && (
        <>
          <div className={css.customBlockForm_includeCount} data-testid="section-include-count">
            <label htmlFor="include-count">
              <input
                checked={formData.includeCount}
                data-testid="toggle-includeCount"
                id="include-count"
                type="checkbox"
                onChange={(e) => setFormData(prev => ({ ...prev, includeCount: e.target.checked }))}
              />
              Include Count Slider
            </label>
          </div>
          {formData.includeCount && (
            <div className={css.customBlockForm_countFields} data-testid="section-count-fields">
              <div>
                <label htmlFor="min-count">Min Count</label>
                <input
                  data-testid="input-minCount"
                  id="min-count"
                  type="number"
                  value={formData.minCount}
                  onChange={(e) => setFormData(prev => ({ ...prev, minCount: parseInt(e.target.value) }))}
                />
              </div>
              <div>
                <label htmlFor="max-count">Max Count</label>
                <input
                  data-testid="input-maxCount"
                  id="max-count"
                  type="number"
                  value={formData.maxCount}
                  onChange={(e) => setFormData(prev => ({ ...prev, maxCount: parseInt(e.target.value) }))}
                />
              </div>
              <div>
                <label htmlFor="default-count">Default Count</label>
                <input
                  data-testid="input-defaultCount"
                  id="default-count"
                  type="number"
                  value={formData.defaultCount}
                  onChange={(e) => setFormData(prev => ({ ...prev, defaultCount: parseInt(e.target.value) }))}
                />
              </div>
            </div>
          )}
        </>
      )}


      {(formData.type === "action") && (
        <div className={css.customBlockForm_canHaveChildren} data-testid="section-can-have-children">
          <label htmlFor="can-have-children">
            <input
              checked={formData.canHaveChildren}
              data-testid="toggle-canHaveChildren"
              id="can-have-children"
              type="checkbox"
              onChange={(e) => setFormData(prev => ({ ...prev, canHaveChildren: e.target.checked }))}
            /> 
            Contains Child Blocks
          </label>
        </div>
      )}   

      {(formData.type === "action" && formData.canHaveChildren) && (
        <div className={css.customBlockForm_childBlocks} data-testid="section-child-blocks">
          <label htmlFor="child-blocks">Child Blocks</label>
          <select
            data-testid="select-childBlocks"
            id="child-blocks"
            multiple
            size={6}
            value={formData.childBlocks}
            onChange={handleChildBlocksMultiSelect}
          >
            {availableChildOptions.map(o => (
              <option key={o.id} value={o.id}>{o.name}</option>
            ))}
          </select>
        </div>
      )}

      {(formData.type === "creator") && (
        <div className={css.customBlockForm_childBlocks}>
          <label htmlFor="child-blocks">Child Blocks</label>
          <select
            id="child-blocks"
            multiple
            size={6}
            value={formData.childBlocks}
            onChange={handleChildBlocksMultiSelect}
          >
            {availableChildOptions.map(o => (
              <option key={o.id} value={o.id}>{o.name}</option>
            ))}
          </select>
        </div>
      )}

      {(formData.type === "action") && (
        <div className={css.customBlockForm_generatorTemplate} data-testid="section-generator-template">
          <label htmlFor="generator-template">Code<span className={css.required}>*</span></label>
          <textarea
            data-testid="textarea-generatorTemplate"
            id="generator-template"
            rows={3}
            placeholder={"e.g., ${ACTION} ${DIRECTION}\\nset speed ${SPEED}"}
            value={formData.generatorTemplate || ""}
            onChange={(e) => setFormData(prev => ({ ...prev, generatorTemplate: e.target.value }))}
          />
          <div className={css.helpText}>
            Use ${"{ACTION}"} to reference the action. To reference parameter values, use ${"{PARAM_NAME}"} where &quot;PARAM_NAME&quot; is the actual name of the parameter (e.g., ${"{DIRECTION}"}, ${"{MAGNITUDE}"}).
          </div>
        </div>
      )}

      <button type="button" data-testid="submit-block" onClick={handleSubmit}>
        {editingBlock ? "Update Block" : "Add Block"}
      </button>
    </div>
  );
};
