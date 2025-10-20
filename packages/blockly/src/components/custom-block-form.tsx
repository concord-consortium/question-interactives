import React, { useState, useEffect, useMemo } from "react";

import { availableChildBlocks } from "../utils/block-utils";
import { extractCategoriesFromToolbox } from "../utils/toolbox-utils";
import { BLOCK_TYPE_CONFIG } from "./custom-block-form-config";
import { CustomBlockFormNestedBlocks } from "./custom-block-form-nested-blocks";
import { CustomBlockFormOptionList } from "./custom-block-form-option-list";
import { CustomBlockFormParameters } from "./custom-block-form-parameters";
import { CustomBlockType, IBlockConfig, ICustomBlock, INestedBlock, IParameter } from "./types";

import css from "./custom-block-form.scss";

interface IProps {
  blockType: CustomBlockType;
  editingBlock?: ICustomBlock | null;
  existingBlocks?: ICustomBlock[];
  toolbox: string;
  onSubmit: (block: ICustomBlock) => void;
}

interface ICustomBlockFormState {
  childrenEnabled: boolean;
  category: string;
  childBlocks: INestedBlock[];
  color: string;
  conditionLabelPosition?: "prefix" | "suffix";
  conditionInput: boolean;
  defaultCount: number;
  generatorTemplate?: string;
  includeAllOption?: boolean;
  includeCount: boolean;
  includeNumberInput: boolean;
  inputsInline: boolean;
  maxCount: number;
  minCount: number;
  name: string;
  nextStatement: boolean;
  options: { label: string; value: string }[];
  previousStatement: boolean;
  showTargetEntityLabel: boolean;
  targetEntity: string;
  type: CustomBlockType;
}

const blockOptionsFromConfig = (block: ICustomBlock) => {
  if (["creator", "setter"].includes(block.type)) {
    return block.config.typeOptions?.map(opt => ({ label: String(opt[0]), value: opt[1] })) || [{ label: "", value: "" }];
  }

  if (["ask", "condition"].includes(block.type)) {
    return block.config.options?.map(opt => ({ label: String(opt[0]), value: opt[1] })) || [{ label: "", value: "" }];
  }

  return [{ label: "", value: "" }];
};

export const CustomBlockForm: React.FC<IProps> = ({ blockType, editingBlock, existingBlocks, onSubmit, toolbox }) => {
  const blockConfig = BLOCK_TYPE_CONFIG[blockType];
  const optionTerm = blockConfig.optionTerm || "Options";
  const optionsLabelPlaceholder = blockConfig.optionLabelPlaceholder || "Display text (e.g., blue)";
  const optionsValuePlaceholder = blockConfig.optionValuePlaceholder || "Value (e.g., BLUE)";
  
  const [formData, setFormData] = useState<ICustomBlockFormState>({
    category: "",
    childBlocks: [],
    childrenEnabled: blockConfig.childrenEnabled,
    color: blockConfig.color,
    conditionInput: false,
    defaultCount: 100,
    generatorTemplate: "",
    includeAllOption: false,
    includeCount: true,
    includeNumberInput: false,
    inputsInline: true,
    maxCount: 500,
    minCount: 0,
    name: "",
    nextStatement: true,
    options: [{ label: "", value: "" }],
    previousStatement: true,
    targetEntity: "",
    conditionLabelPosition: "prefix",
    showTargetEntityLabel: true,
    type: blockType
  });

  const availableCategories = useMemo(() => extractCategoriesFromToolbox(toolbox), [toolbox]);
  const childOptions = useMemo(() => {
    if (formData.type === "action" || formData.type === "creator") {
      return availableChildBlocks(existingBlocks, editingBlock?.id);
    }
    return [];
  }, [formData.type, existingBlocks, editingBlock?.id]);

  const availableTargetEntities = useMemo(() => {
    // Get creator blocks from existing blocks to populate target entity dropdown
    return (existingBlocks || [])
      .filter(block => block.type === "creator")
      .map(block => ({ value: block.name, label: block.name }));
  }, [existingBlocks]);

  const handleNestedBlocksChange = (nestedBlocks: INestedBlock[]) => {
    setFormData(prev => ({ ...prev, childBlocks: nestedBlocks }));
  };

  const [parameters, setParameters] = useState<IParameter[]>([]);

  // Populate form when editing.
  useEffect(() => {
    if (editingBlock) {
      const config: IBlockConfig = editingBlock.config;

      setFormData({
        category: editingBlock.category || availableCategories[0] || "",
        childBlocks: config.childBlocks || [],
        childrenEnabled: !!config.canHaveChildren,
        color: editingBlock.color,
        conditionInput: !!editingBlock.config.conditionInput,
        defaultCount: config.defaultCount ?? 100,
        generatorTemplate: config.generatorTemplate || "",
        includeAllOption: config.includeAllOption ?? false,
        includeCount: config.defaultCount != null,
        includeNumberInput: !!config.includeNumberInput,
        inputsInline: !!config.inputsInline,
        maxCount: config.maxCount ?? 500,
        minCount: config.minCount ?? 0,
        name: editingBlock.name,
        nextStatement: !!config.nextStatement,
        options: blockOptionsFromConfig(editingBlock),
        previousStatement: !!config.previousStatement,
        targetEntity: config.targetEntity ?? "",
        conditionLabelPosition: config.labelPosition ?? "prefix",
        showTargetEntityLabel: config.showTargetEntityLabel ?? true,
        type: editingBlock.type
      });

      if (editingBlock.type === "action") {
        setParameters((config.parameters) || []);
      } else {
        setParameters([]);
      }
    } else {
      // Reset form when not editing.
      setFormData(prev => ({
        ...prev,
        childrenEnabled: blockConfig.childrenEnabled,
        category: "",
        childBlocks: [],
        color: blockConfig.color,
        conditionInput: false,
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
        generatorTemplate: "",
        showTargetEntityLabel: true,
        targetEntity: "",
        conditionLabelPosition: "prefix"
      }));
      setParameters([]);
    }
  }, [editingBlock, blockType, availableCategories, blockConfig.childrenEnabled, blockConfig.color, blockConfig]);

  const handleSubmit = () => {
    if (!formData.name) {
      alert("Please provide the block name.");
      return;
    }
    if (!formData.category) {
      alert("Please select a category.");
      return;
    }
    if (formData.type === "creator" && (!formData.options.some(opt => opt.label && opt.value))) {
      alert("Creator blocks must have at least one type option defined.");
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

    const effectiveChildBlocks = formData.childrenEnabled ? formData.childBlocks : [];

    // Compute statement options for statement blocks with a target entity
    let statementOptions: [string, string][] | undefined = undefined;
    if (formData.type === "ask" && formData.targetEntity) {
      const creatorBlock = (existingBlocks || []).find(block =>
        block.type === "creator" && block.name === formData.targetEntity
      );
      if (creatorBlock) {
        statementOptions = creatorBlock.config.typeOptions?.map(option => [option[0], option[1]] as [string, string]);
      }
    }

    const config =
      formData.type === "action"
        ? {
            ...base,
            canHaveChildren: formData.childrenEnabled,
            childBlocks: effectiveChildBlocks,
            parameters: parameters.length ? parameters : undefined,
            generatorTemplate: formData.generatorTemplate?.trim() ? formData.generatorTemplate : undefined
          }
        : formData.type === "ask"
        ? {
            ...base,
            canHaveChildren: true,
            childBlocks: [],
            conditionInput: formData.conditionInput,
            includeAllOption: formData.includeAllOption,
            options: statementOptions,
            targetEntity: formData.targetEntity,
            showTargetEntityLabel: formData.showTargetEntityLabel ?? true
          }
        : formData.type === "condition"
        ? {
            ...base,
            canHaveChildren: false,
            generatorTemplate: formData.generatorTemplate?.trim() ? formData.generatorTemplate : undefined,
            options: formData.options
              .filter(opt => opt.label && opt.value)
              .map(opt => [opt.label, opt.value] as [string, string]),
            labelPosition: formData.conditionLabelPosition || "prefix",
            targetEntity: formData.targetEntity
          }
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
          }
        : {
            ...base,
            canHaveChildren: false,
            typeOptions: formData.includeNumberInput
              ? undefined
              : formData.options
                  .filter(opt => opt.label && opt.value)
                  .map(opt => [opt.label, opt.value] as [string, string]),
            includeNumberInput: formData.includeNumberInput
          };

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
            {blockConfig.label}
            <span className={css.required}>*</span>
          </label>
          <input
            data-testid="input-name"
            id="block-name"
            placeholder={blockConfig.placeholder}
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

      {blockConfig.hasParameters && (
        <CustomBlockFormParameters
          parameters={parameters}
          onParametersChange={setParameters}
        />
      )}

      {blockConfig.hasTargetEntity && (
        <div className={css.customBlockForm_targetEntity} data-testid="section-target-entity">
          <label htmlFor="target-entity">Target Entity</label>
          <select
            data-testid="select-targetEntity"
            id="target-entity"
            value={formData.targetEntity}
            onChange={(e) => setFormData(prev => ({ ...prev, targetEntity: e.target.value }))}
          >
            <option value="">Select an entity...</option>
            {availableTargetEntities.map(entity => (
              <option key={entity.value} value={entity.value}>{entity.label}</option>
            ))}
          </select>

          {formData.type === "ask" && (
            <div className={css.customBlockForm_includeAllOption} data-testid="section-include-all-option">
              <label>
                <input
                  checked={formData.includeAllOption}
                  type="checkbox"
                  onChange={e => setFormData(prev => ({ ...prev, includeAllOption: e.target.checked }))}
                />
                Add &quot;all&quot; Option
              </label>
            </div>
          )}

          {formData.type === "ask" && (
            <div className={css.customBlockForm_showTargetEntityLabel} data-testid="section-show-target-entity-label">
              <label>
                <input
                  type="checkbox"
                  checked={formData.showTargetEntityLabel !== false}
                  onChange={e => setFormData(prev => ({ ...prev, showTargetEntityLabel: e.target.checked }))}
                /> 
                Show Target Entity Label
              </label>
            </div>
          )}
        </div>
      )}

      {blockConfig.hasConditionInput && (
        <div className={css.customBlockForm_includeNumberInput} data-testid="section-include-condition-input">
          <label htmlFor="include-condition-input">
            <input
              checked={formData.conditionInput}
              id="include-condition-input"
              type="checkbox"
              onChange={(e) => setFormData(prev => ({ ...prev, conditionInput: e.target.checked }))}
            />
            Include Condition Input (Boolean)
          </label>
        </div>
      )}

      {blockConfig.hasOptions && (
        <div className={css.customBlockForm_options} data-testid="section-options">
          <label htmlFor="options">{optionTerm}</label>
          <CustomBlockFormOptionList
            dataTestIdPrefix="option"
            labelPlaceholder={optionsLabelPlaceholder}
            options={formData.options}
            valuePlaceholder={optionsValuePlaceholder}
            onOptionsChange={(newOptions) => setFormData(prev => ({ ...prev, options: newOptions }))}
          />
        </div>
      )}

      {/* Show Label Placement field if block supports it and has one or more options defined */}
      {blockConfig.hasLabelPosition && formData.options.some(o => o.label && o.value) && (
        <div className={css.customBlockForm_basicFields} data-testid="section-condition-label-position">
          <div className={css.fieldGroup}>
            <label htmlFor="condition-label-position">Label Placement</label>
            <select
              className={css.conditionLabelPosition}
              data-testid="select-condition-label-position"
              id="condition-label-position"
              value={formData.conditionLabelPosition || "prefix"}
              onChange={(e) => setFormData(prev => ({ ...prev, conditionLabelPosition: (e.target.value as any) }))}
            >
              <option value="prefix">Before options</option>
              <option value="suffix">After options</option>
            </select>
          </div>
        </div>
      )}

      {blockConfig.hasNumberInput && (
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

      {blockConfig.hasCountFields && (
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
                  onChange={(e) => setFormData(prev => ({ ...prev, minCount: parseInt(e.target.value, 10) }))}
                />
              </div>
              <div>
                <label htmlFor="max-count">Max Count</label>
                <input
                  data-testid="input-maxCount"
                  id="max-count"
                  type="number"
                  value={formData.maxCount}
                  onChange={(e) => setFormData(prev => ({ ...prev, maxCount: parseInt(e.target.value, 10) }))}
                />
              </div>
              <div>
                <label htmlFor="default-count">Default Count</label>
                <input
                  data-testid="input-defaultCount"
                  id="default-count"
                  type="number"
                  value={formData.defaultCount}
                  onChange={(e) => setFormData(prev => ({ ...prev, defaultCount: parseInt(e.target.value, 10) }))}
                />
              </div>
            </div>
          )}
        </>
      )}

      {blockConfig.canHaveChildren && (
        <div className={css.customBlockForm_canHaveChildren} data-testid="section-can-have-children">
          <label htmlFor="can-have-children">
            <input
              checked={formData.childrenEnabled}
              data-testid="toggle-canHaveChildren"
              id="can-have-children"
              type="checkbox"
              onChange={(e) => setFormData(prev => ({ ...prev, childrenEnabled: e.target.checked }))}
            /> 
            Contains Child Blocks
          </label>
        </div>
      )}   

      {((formData.type === "creator") || (formData.type === "action" && formData.childrenEnabled)) && (
        <CustomBlockFormNestedBlocks
          availableBlocks={childOptions}
          nestedBlocks={formData.childBlocks}
          parentBlockId={editingBlock?.id || "new-block"}
          onChange={handleNestedBlocksChange}
        />
      )}

      {(blockConfig.hasGeneratorTemplate) && (
        <div className={css.customBlockForm_generatorTemplate} data-testid="section-generator-template">
          <label htmlFor="generator-template">Code<span className={css.required}>*</span></label>
          <textarea
            data-testid="textarea-generatorTemplate"
            id="generator-template"
            rows={3}
            placeholder={blockConfig.generatorPlaceholder || ""}
            value={formData.generatorTemplate || ""}
            onChange={(e) => setFormData(prev => ({ ...prev, generatorTemplate: e.target.value }))}
          />
          <div className={css.helpText}>
            {formData.type === "condition" && (<>Use ${"{CONDITION}"} to reference the condition (selected option). To reference parameter values, use ${"{PARAM_NAME}"} where &quot;PARAM_NAME&quot; is the actual name of the parameter (e.g., ${"{DIRECTION}"}, ${"{MAGNITUDE}"}).</>)}
            {formData.type === "action" && (<>Use ${"{ACTION}"} to reference the action. To reference parameter values, use ${"{PARAM_NAME}"} where &quot;PARAM_NAME&quot; is the actual name of the parameter (e.g., ${"{DIRECTION}"}, ${"{MAGNITUDE}"}).</>)}
          </div>
        </div>
      )}

      <button type="button" data-testid="submit-block" onClick={handleSubmit}>
        {editingBlock ? "Update Block" : "Add Block"}
      </button>
    </div>
  );
};
