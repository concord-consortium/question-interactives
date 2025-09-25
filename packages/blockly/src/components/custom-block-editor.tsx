import React, { useState } from "react";

import { CustomBlockForm } from "./custom-block-form";
import { ICustomBlock } from "./types";

import css from "./custom-block-editor.scss";

interface IProps {
  formData?: any;
  value: ICustomBlock[];
  onChange: (blocks: ICustomBlock[]) => void;
  onChangeFormData?: (formData: any) => void;
}

const generateBlockJson = (block: ICustomBlock) => {
  return `{
    "kind": "block",
    "type": "${block.id}"
  }`;
};


const handleCopyToClipboard = (block: ICustomBlock) => {
  const blockJson = generateBlockJson(block);
  navigator.clipboard.writeText(blockJson);
  // TODO: Feedback but something better than an alert.
  alert("Block JSON copied to clipboard. Paste it into your toolbox configuration.");
};

export const CustomBlockEditor: React.FC<IProps> = ({ formData, value, onChange, onChangeFormData }) => {
  // const [selectedPredefined, setSelectedPredefined] = useState<string>("");
  const [showSetterForm, setShowSetterForm] = useState(false);
  const [showCreatorForm, setShowCreatorForm] = useState(false);
  const [editingBlock, setEditingBlock] = useState<ICustomBlock | null>(null);

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
    const newBlock = { ...block, id: `custom_${Date.now()}` };
    const updatedBlocks = [...value, newBlock];
    
    // Update the customBlocks field
    onChange(updatedBlocks);
    
    // Also update the full form data to ensure proper re-rendering
    if (formData && onChangeFormData) {
      onChangeFormData({
        ...formData,
        customBlocks: updatedBlocks
      });
    }
    
    setShowSetterForm(false);
    setShowCreatorForm(false);
    setEditingBlock(null);
  };

  const editCustomBlock = (block: ICustomBlock) => {
    setEditingBlock(block);
    if (block.type === "setter") {
      setShowSetterForm(true);
    } else {
      setShowCreatorForm(true);
    }
  };

  const updateCustomBlock = (updatedBlock: ICustomBlock) => {
    const updatedBlocks = value.map(b => b.id === editingBlock?.id ? updatedBlock : b);
    
    onChange(updatedBlocks);
    
    if (formData && onChangeFormData) {
      onChangeFormData({
        ...formData,
        customBlocks: updatedBlocks
      });
    }
    
    setShowSetterForm(false);
    setShowCreatorForm(false);
    setEditingBlock(null);
  };

  const handleFormSubmit = (block: ICustomBlock) => {
    if (editingBlock) {
      updateCustomBlock({ ...block, id: editingBlock.id });
    } else {
      addCustomBlock(block);
    }
  };

  const removeBlock = (id: string) => {
    onChange(value.filter(b => b.id !== id));
  };

  return (
    <div className={css.customBlockEditor}>
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

      <div className={css.customBlocksSetter} style={{ marginBottom: "30px" }}>
        <h5>Setter Blocks</h5>
        <div className={css.customBlocksNew} style={{ marginBottom: "20px" }}>
          <button onClick={() => {
            setEditingBlock(null);
            setShowSetterForm(!showSetterForm);
          }}>
            {showSetterForm ? "Cancel" : "Add Setter Block"}
          </button>
          {showSetterForm && (
            <CustomBlockForm 
              existingBlocks={value} 
              onSubmit={handleFormSubmit} 
              blockType="setter"
              editingBlock={editingBlock}
            />
          )}
        </div>

        <div className={css.customBlocksCurrent}>
          {value.filter(b => b.type === "setter").length > 0 ? (
            value.filter(b => b.type === "setter").map(block => (
              <div className={css.customBlocksCurrentBlock} key={block.id} style={{ border: "1px solid #ccc", padding: "10px", margin: "5px 0" }}>
                <strong>{block.name}</strong> ({block.type})
                <div style={{ float: "right" }}>
                  <button onClick={() => editCustomBlock(block)} style={{ marginRight: "5px" }}>
                    Edit
                  </button>
                  <button onClick={() => removeBlock(block.id)}>
                    Remove
                  </button>
                </div>

                <div className={css.customBlocksCurrentBlockJson} style={{ marginTop: "10px", fontSize: "12px" }}>
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
            ))
          ) : (
            <div style={{ color: "#666", fontStyle: "italic" }}>No setter blocks created yet</div>
          )}
        </div>
      </div>

      <div className={css.customBlocksCreator}>
        <h5>Creator Blocks</h5>
        <div className={css.customBlocksNew} style={{ marginBottom: "20px" }}>
          <button onClick={() => {
            setEditingBlock(null);
            setShowCreatorForm(!showCreatorForm);
          }}>
            {showCreatorForm ? "Cancel" : "Add Creator Block"}
          </button>
          {showCreatorForm && (
            <CustomBlockForm 
              existingBlocks={value} 
              onSubmit={handleFormSubmit} 
              blockType="creator"
              editingBlock={editingBlock}
            />
          )}
        </div>

        <div className={css.customBlocksCurrent}>
          {value.filter(b => b.type === "creator").length > 0 ? (
            value.filter(b => b.type === "creator").map(block => (
              <div className={css.customBlocksCurrentBlock} key={block.id} style={{ border: "1px solid #ccc", padding: "10px", margin: "5px 0" }}>
                <strong>{block.name}</strong> ({block.type})
                <div style={{ float: "right" }}>
                  <button onClick={() => editCustomBlock(block)} style={{ marginRight: "5px" }}>
                    Edit
                  </button>
                  <button onClick={() => removeBlock(block.id)}>
                    Remove
                  </button>
                </div>

                <div className={css.customBlocksCurrentBlockJson} style={{ marginTop: "10px", fontSize: "12px" }}>
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
            ))
          ) : (
            <div style={{ color: "#666", fontStyle: "italic" }}>No creator blocks created yet</div>
          )}
        </div>
      </div>
    </div>
  );
};
