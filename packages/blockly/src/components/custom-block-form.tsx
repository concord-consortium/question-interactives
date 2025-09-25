import React, { useState } from "react";

import { CustomBlockType, ICustomBlock, ICreateBlockConfig, ISetBlockConfig } from "./types";

import css from "./custom-block-form.scss";

interface IProps {
  blockType: CustomBlockType;
  existingBlocks?: ICustomBlock[];
  onSubmit: (block: ICustomBlock) => void;
}

export const CustomBlockForm: React.FC<IProps> = ({ existingBlocks, onSubmit, blockType }) => {
  const [formData, setFormData] = useState<{
    childBlocks: string[];
    color: string;
    name: string;
    type: CustomBlockType;
    inputsInline: boolean;
    previousStatement: boolean;
    nextStatement: boolean;
    // generatorTemplate?: string;
    typeLabel: string;
    options: { label: string; value: string }[];
    includeCount: boolean;
    defaultCount: number;
    minCount: number;
    maxCount: number;
  }>({
    childBlocks: [],
    color: "#312b84",
    name: "",
    type: blockType,

    // layout / connections
    inputsInline: true,
    previousStatement: true,
    nextStatement: true,

    // generator
    // generatorTemplate: "",

    // label
    typeLabel: "",

    // optional dropdown options
    options: [{ label: "", value: "" }],

    // optional slider toggle + fields
    includeCount: true,
    defaultCount: 100,
    minCount: 0,
    maxCount: 500
  });

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

    const typeOptions = formData.options
      .filter(opt => opt.label && opt.value)
      .map(opt => [opt.label, opt.value] as [string, string]);

    const base = {
      // generatorTemplate: formData.generatorTemplate || undefined,
      inputsInline: formData.inputsInline,
      nextStatement: formData.nextStatement,
      previousStatement: formData.previousStatement,
      typeLabel: formData.typeLabel || undefined
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
            typeOptions: typeOptions.length ? typeOptions : undefined
          } as ISetBlockConfig;

    onSubmit({
      color: formData.color,
      config,
      id: "",
      name: formData.name,
      type: formData.type
    });

    console.log("Submitted", {
      color: formData.color,
      config,
      name: formData.name,
      type: formData.type
    });

    // reset (keep sensible defaults)
    setFormData(prev => ({
      ...prev,
      name: "",
      typeLabel: "",
      generatorTemplate: "",
      options: [{ label: "", value: "" }]
    }));
  };

  return (
    <div className={css.customBlockForm}>
      <div className={css.customBlockForm_name}>
        <label htmlFor="block-name">Block Name:</label>
        <input
          id="block-name"
          type="text"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          required
        />
      </div>

      <div className={css.customBlockForm_color}>
        <label>Color:</label>
        <input
          type="color"
          value={formData.color}
          onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
        />
      </div>

      <div className={css.customBlockForm_inputs}>
        <label>
          <input
            type="checkbox"
            checked={formData.inputsInline}
            onChange={(e) => setFormData(prev => ({ ...prev, inputsInline: e.target.checked }))}
          />
          inputsInline
        </label>
        <label>
          <input
            type="checkbox"
            checked={formData.previousStatement}
            onChange={(e) => setFormData(prev => ({ ...prev, previousStatement: e.target.checked }))}
          />
          previousStatement
        </label>
        <label>
          <input
            type="checkbox"
            checked={formData.nextStatement}
            onChange={(e) => setFormData(prev => ({ ...prev, nextStatement: e.target.checked }))}
          />
          nextStatement
        </label>
      </div>

      {/* <div>
        <label>Generator Template (optional):</label><br />
        <textarea
          placeholder={'e.g.\nconst v = "${value}";\nawait sim.setColor(v);'}
          rows={2}
          value={formData.generatorTemplate}
          onChange={(e) => setFormData(prev => ({ ...prev, generatorTemplate: e.target.value }))}
        />
        <div style={{ fontSize: "12px", color: "#666" }}>
          Available placeholders: ${"{name}"}, ${"{label}"}, ${"{count}"}, ${"{type}"}, ${"{value}"}.
        </div>
      </div> */}

      <div className={css.customBlockForm_typeLabel}>
        <label>Type Label (optional):</label>
        <input
          placeholder="e.g., particles, speed"
          type="text"
          value={formData.typeLabel}
          onChange={(e) => setFormData(prev => ({ ...prev, typeLabel: e.target.value }))}
        />
      </div>

      {formData.type === "creator" && (
        <>
          <div>
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
            <>
              <div>
                <label>Default Count:</label>
                <input
                  type="number"
                  value={formData.defaultCount}
                  onChange={(e) => setFormData(prev => ({ ...prev, defaultCount: parseInt(e.target.value) }))}
                />
              </div>
              <div>
                <label>Min Count:</label>
                <input
                  type="number"
                  value={formData.minCount}
                  onChange={(e) => setFormData(prev => ({ ...prev, minCount: parseInt(e.target.value) }))}
                />
              </div>
              <div>
                <label>Max Count:</label>
                <input
                  type="number"
                  value={formData.maxCount}
                  onChange={(e) => setFormData(prev => ({ ...prev, maxCount: parseInt(e.target.value) }))}
                />
              </div>
            </>
          )}
        </>
      )}

      <div className={css.customBlockForm_options}>
        <label>Options (dropdown, optional):</label>
        {formData.options.map((option, index) => (
          <div key={index}>
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
        <button type="button" onClick={addOption}>Add Option</button>
      </div>

      {/* For Creator blocks, we display a multi-select menu listing all the created Setter blocks. A selected Setter block's ID will be added to the Creator block's `childBlocks` property array */}
      {formData.type === "creator" && (
        <div className={css.customBlockForm_childBlocks}>
          <label>Child Setter Blocks (optional):</label>
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

      <button type="button" onClick={handleSubmit}>Add Block</button>
    </div>
  );
};
