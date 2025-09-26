import React, { useState, useEffect, useMemo } from "react";

import { extractCategoriesFromToolbox } from "../utils/toolbox-utils";
import { CustomBlockType, ICustomBlock, ICreateBlockConfig, ISetBlockConfig } from "./types";

import css from "./custom-block-form.scss";

interface IProps {
  blockType: CustomBlockType;
  editingBlock?: ICustomBlock | null;
  existingBlocks?: ICustomBlock[];
  toolbox: string;
  onSubmit: (block: ICustomBlock) => void;
}

export const CustomBlockForm: React.FC<IProps> = ({ blockType, editingBlock, existingBlocks, onSubmit, toolbox }) => {
  const [formData, setFormData] = useState<{
    category: string;
    childBlocks: string[];
    color: string;
    name: string;
    type: CustomBlockType;
    inputsInline: boolean;
    previousStatement: boolean;
    nextStatement: boolean;
    options: { label: string; value: string }[];
    includeCount: boolean;
    defaultCount: number;
    minCount: number;
    maxCount: number;
    includeNumberInput: boolean;
  }>({
    category: "",
    childBlocks: [],
    color: "#312b84",
    name: "",
    type: blockType,

    // layout / connections
    inputsInline: true,
    previousStatement: true,
    nextStatement: true,

    // optional dropdown options
    options: [{ label: "", value: "" }],

    // optional slider toggle + fields
    includeCount: true,
    defaultCount: 100,
    minCount: 0,
    maxCount: 500,
    includeNumberInput: false
  });

  const availableCategories = useMemo(() => extractCategoriesFromToolbox(toolbox), [toolbox]);

  // Populate form when editing
  useEffect(() => {
    if (editingBlock) {
      const config = editingBlock.config as ICreateBlockConfig | ISetBlockConfig;
      setFormData({
        category: editingBlock.category || (availableCategories[0] || ""),
        childBlocks: (config as ICreateBlockConfig).childBlocks || [],
        color: editingBlock.color,
        name: editingBlock.name,
        type: editingBlock.type,
        inputsInline: config.inputsInline ?? true,
        previousStatement: config.previousStatement ?? true,
        nextStatement: config.nextStatement ?? true,
        options: config.typeOptions ? config.typeOptions.map((option: any) => ({ label: option[0], value: option[1] })) : [{ label: "", value: "" }],
        includeCount: editingBlock.type === "creator" ? 
          (config as ICreateBlockConfig).defaultCount !== undefined : true,
        defaultCount: (config as ICreateBlockConfig).defaultCount ?? 100,
        minCount: (config as ICreateBlockConfig).minCount ?? 0,
        maxCount: (config as ICreateBlockConfig).maxCount ?? 500,
        includeNumberInput: editingBlock.type === "setter" ? 
          (config as ISetBlockConfig).includeNumberInput ?? false : false
      });
    } else {
      // Reset form when not editing - set default category
      setFormData(prev => ({
        ...prev,
        category: "",
        childBlocks: [],
        color: "#312b84",
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
        includeNumberInput: false
      }));
    }
  }, [editingBlock, blockType, availableCategories]);

  const addOption = () => {
    setFormData(prev => ({
      ...prev,
      options: [...prev.options, { label: "", value: "" }]
    }));
  };

  const updateOption = (index: number, field: "label" | "value", value: string) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options.map((opt, i) => 
        i === index ? { ...opt, [field]: value } : opt
      )
    }));
  };

  const removeOption = (index: number) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = () => {
    if (!formData.name) {
      alert("Please provide the block name.");
      return;
    }
    if (!formData.color) {
      alert("Please provide the block color.");
      return;
    }
    if (!formData.category) {
      alert("Please select a category.");
      return;
    }

    const typeOptions = formData.options
      .filter(opt => opt.label && opt.value)
      .map(opt => [opt.label, opt.value] as [string, string]);

    const base = {
      inputsInline: formData.inputsInline,
      nextStatement: formData.nextStatement,
      previousStatement: formData.previousStatement
    };

    const config =
      formData.type === "creator"
        ? {
            ...base,
            childBlocks: formData.childBlocks,
            typeOptions: typeOptions.length ? typeOptions : undefined,
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
            typeOptions: typeOptions.length ? typeOptions : undefined,
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

    // reset (keep sensible defaults)
    setFormData(prev => ({
      ...prev,
      name: "",
      options: [{ label: "", value: "" }],
      childBlocks: []
    }));
  };

  return (
    <div className={css.customBlockForm}>
      <div className={css.customBlockForm_basicFields}>
        <div className={css.customBlockForm_name}>
          <label htmlFor="block-name">
            {blockType === "setter" ? "Property Name" : "Object Name"}
            <span className={css.required}>*</span>
          </label>
          <input
            id="block-name"
            type="text"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder={blockType === "setter" ? "e.g., color, speed" : "e.g., molecules, people"}
            required
          />
        </div>

        <div className={css.customBlockForm_color}>
          <label>Color<span className={css.required}>*</span></label>
          <input
            type="color"
            value={formData.color}
            onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
          />
        </div>
      </div>

      <div className={css.customBlockForm_category}>
        <label>Category<span className={css.required}>*</span></label>
        <select
          value={formData.category}
          onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
          required
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
            type="checkbox"
            checked={formData.inputsInline}
            onChange={(e) => setFormData(prev => ({ ...prev, inputsInline: e.target.checked }))}
          />
          inputsInline
        </label>
        <label className={css.inlineLabel}>
          <input
            type="checkbox"
            checked={formData.previousStatement}
            onChange={(e) => setFormData(prev => ({ ...prev, previousStatement: e.target.checked }))}
          />
          previousStatement
        </label>
        <label className={css.inlineLabel}>
          <input
            type="checkbox"
            checked={formData.nextStatement}
            onChange={(e) => setFormData(prev => ({ ...prev, nextStatement: e.target.checked }))}
          />
          nextStatement
        </label>
      </div>

      {formData.type === "setter" && (
        <div className={css.customBlockForm_includeNumberInput}>
          <label>
            <input
              type="checkbox"
              checked={formData.includeNumberInput}
              onChange={(e) => setFormData(prev => ({ ...prev, includeNumberInput: e.target.checked }))}
            />
            Include Number Input (math_number)
          </label>
        </div>
      )}

      {formData.type === "creator" && (
        <>
          <div className={css.customBlockForm_includeCount}>
            <label>
              <input
                type="checkbox"
                checked={formData.includeCount}
                onChange={(e) => setFormData(prev => ({ ...prev, includeCount: e.target.checked }))}
              />
              Include Count Slider
            </label>
          </div>
          {formData.includeCount && (
            <div className={css.customBlockForm_countFields}>
              <div>
                <label>Min Count</label>
                <input
                  type="number"
                  value={formData.minCount}
                  onChange={(e) => setFormData(prev => ({ ...prev, minCount: parseInt(e.target.value) }))}
                />
              </div>
              <div>
                <label>Max Count</label>
                <input
                  type="number"
                  value={formData.maxCount}
                  onChange={(e) => setFormData(prev => ({ ...prev, maxCount: parseInt(e.target.value) }))}
                />
              </div>
              <div>
                <label>Default Count</label>
                <input
                  type="number"
                  value={formData.defaultCount}
                  onChange={(e) => setFormData(prev => ({ ...prev, defaultCount: parseInt(e.target.value) }))}
                />
              </div>
            </div>
          )}
        </>
      )}

      <div className={css.customBlockForm_options}>
        <label>Options</label>
        {formData.options.map((option, index) => (
          <div key={index} className={css.optionRow}>
            <input
              type="text"
              placeholder="Label"
              value={option.label}
              onChange={(e) => updateOption(index, "label", e.target.value)}
            />
            <input
              type="text"
              placeholder="Value"
              value={option.value}
              onChange={(e) => updateOption(index, "value", e.target.value)}
            />
            <button type="button" onClick={() => removeOption(index)}>Remove</button>
          </div>
        ))}
        <button type="button" className={css.addOptionButton} onClick={addOption}>Add Option</button>
      </div>

      {formData.type === "creator" && (
        <div className={css.customBlockForm_childBlocks}>
          <label>Child Setter Blocks</label>
          <select multiple size={3} value={formData.childBlocks} onChange={(e) => {
            const selectedOptions = Array.from(e.target.selectedOptions).map(opt => opt.value);
            setFormData(prev => ({ ...prev, childBlocks: selectedOptions }));
          }}>
            {existingBlocks?.filter(b => b.type === "setter").map(block => (
              <option key={block.id} value={block.id}>
                {block.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <button type="button" onClick={handleSubmit}>
        {editingBlock ? "Update Block" : "Add Block"}
      </button>
    </div>
  );
};
