import React, { useState } from "react";

import { CustomBlockType, ICustomBlock, ICreateBlockConfig, ISetBlockConfig } from "./types";

interface IProps {
  value: ICustomBlock[];
  onChange: (blocks: ICustomBlock[]) => void;
}

const generateBlockJson = (block: ICustomBlock) => {
  return `{
    "kind": "block",
    "type": "custom_${block.id}"
  }`;
};

const handleCopyToClipboard = (block: ICustomBlock) => {
  const blockJson = generateBlockJson(block);
  navigator.clipboard.writeText(blockJson);
  // TODO: Feedback but something better than an alert.
  alert("Block JSON copied to clipboard. Paste it into your toolbox configuration.");
};

export const CustomBlockEditor: React.FC<IProps> = ({ value, onChange }) => {
  // const [selectedPredefined, setSelectedPredefined] = useState<string>("");
  const [showCustomForm, setShowCustomForm] = useState(false);

  // TODO: Determine if it's actually useful to have predefined blocks.
  // const addPredefinedBlock = () => {
  //   if (selectedPredefined) {
  //     const predefined = PREDEFINED_BLOCKS.find(b => b.id === selectedPredefined);
  //     if (predefined) {
  //       onChange([...value, { ...predefined, id: `${predefined.id}_${Date.now()}` }]);
  //       setSelectedPredefined("");
  //     }
  //   }
  // };

  const addCustomBlock = (block: ICustomBlock) => {
    onChange([...value, { ...block, id: `custom_${Date.now()}` }]);
    setShowCustomForm(false);
  };

  const removeBlock = (id: string) => {
    onChange(value.filter(b => b.id !== id));
  };

  return (
    <div className="custom-blocks">
      <h4>Custom Blocks</h4>
      {/* <div className="custom-blocks__predefined" style={{ marginBottom: "20px" }}>
        <label>Add Predefined Block:</label>
        <select 
          value={selectedPredefined} 
          onChange={(e) => setSelectedPredefined(e.target.value)}
        >
          <option value="">Select a predefined block...</option>
          {PREDEFINED_BLOCKS.map(block => (
            <option key={block.id} value={block.id}>
              {block.name}
            </option>
          ))}
        </select>
        <button onClick={addPredefinedBlock} disabled={!selectedPredefined}>
          Add
        </button>
      </div> */}

      <div className="custom-blocks__new" style={{ marginBottom: "20px" }}>
        <button onClick={() => setShowCustomForm(!showCustomForm)}>
          {showCustomForm ? "Cancel" : "Add Custom Block"}
        </button>
        {showCustomForm && (
          <CustomBlockForm onSubmit={addCustomBlock} />
        )}
      </div>

      <div className="custom-blocks__current">
        <h5>Current Blocks:</h5>
        {value.map(block => (
          <div className="custom-blocks__current__block" key={block.id} style={{ border: "1px solid #ccc", padding: "10px", margin: "5px 0" }}>
            <strong>{block.name}</strong> ({block.type})
            <button onClick={() => removeBlock(block.id)} style={{ float: "right" }}>
              Remove
            </button>

            <div className="custom-blocks__current__block__json" style={{ marginTop: "10px", fontSize: "12px" }}>
              <strong>Toolbox JSON:</strong>
              <pre style={{ 
                background: "#f5f5f5", 
                padding: "8px", 
                border: "1px solid #ddd",
                margin: "5px 0",
                fontSize: "11px",
                overflow: "auto"
              }}>
               {generateBlockJson(block)}
              </pre>
              <button 
                onClick={() => handleCopyToClipboard(block)}
                style={{ fontSize: "11px", padding: "2px 6px" }}
              >
                Copy JSON
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const CustomBlockForm: React.FC<{ onSubmit: (block: ICustomBlock) => void }> = ({ onSubmit }) => {
  const [formData, setFormData] = useState({
    color: "#312b84",
    name: "",
    type: "creator" as CustomBlockType,

    // layout / connections
    inputsInline: true,
    previousStatement: true,
    nextStatement: true,

    // generator
    generatorTemplate: "",

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
      generatorTemplate: formData.generatorTemplate || undefined,
      inputsInline: formData.inputsInline,
      nextStatement: formData.nextStatement,
      previousStatement: formData.previousStatement,
      typeLabel: formData.typeLabel || undefined
    };

    const config =
      formData.type === "creator"
        ? {
            ...base,
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
    <>
      <div>
        <label>Block Name:</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          required
        />
      </div>

      <div>
        <label>Block Type:</label>
        <select
          value={formData.type}
          onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as CustomBlockType }))}
        >
          <option value="creator">Creator</option>
          <option value="setter">Setter</option>
        </select>
      </div>

      <div>
        <label>Color:</label>
        <input
          type="color"
          value={formData.color}
          onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
        />
      </div>

      <div>
        <label>
          <input
            type="checkbox"
            checked={formData.inputsInline}
            onChange={(e) => setFormData(prev => ({ ...prev, inputsInline: e.target.checked }))}
          />
          inputsInline
        </label>
        <label style={{ marginLeft: 8 }}>
          <input
            type="checkbox"
            checked={formData.previousStatement}
            onChange={(e) => setFormData(prev => ({ ...prev, previousStatement: e.target.checked }))}
          />
          previousStatement
        </label>
        <label style={{ marginLeft: 8 }}>
          <input
            type="checkbox"
            checked={formData.nextStatement}
            onChange={(e) => setFormData(prev => ({ ...prev, nextStatement: e.target.checked }))}
          />
          nextStatement
        </label>
      </div>

      <div>
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
      </div>

      <div>
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

      <div>
        <label>Options (dropdown, optional):</label>
        {formData.options.map((option, index) => (
          <div key={index} style={{ display: "flex", gap: "5px", marginBottom: "5px" }}>
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

      <button type="button" onClick={handleSubmit}>Add Block</button>
    </>
  );
};
