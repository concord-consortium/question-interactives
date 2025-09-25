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


const handleCopyToClipboard = (block: ICustomBlock, setCopiedBlockId: (id: string | null) => void) => {
  const blockJson = generateBlockJson(block);
  navigator.clipboard.writeText(blockJson);
  setCopiedBlockId(block.id);
  setTimeout(() => setCopiedBlockId(null), 2000);
};

export const CustomBlockEditor: React.FC<IProps> = ({ formData, value, onChange, onChangeFormData }) => {
  // const [selectedPredefined, setSelectedPredefined] = useState<string>("");
  const [showSetterForm, setShowSetterForm] = useState(false);
  const [showCreatorForm, setShowCreatorForm] = useState(false);
  const [editingBlock, setEditingBlock] = useState<ICustomBlock | null>(null);
  const [copiedBlockId, setCopiedBlockId] = useState<string | null>(null);

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

    onChange(updatedBlocks);
    
    // Update the full form data to ensure proper re-rendering. Should we just do this and not also call `onChange`?
    if (onChangeFormData) {
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
    
    // Update the full form data to ensure proper re-rendering. Should we just do this and not also call `onChange`?
    if (onChangeFormData) {
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
    const updatedBlocks = value.filter(b => b.id !== id);
    onChange(updatedBlocks);
    
    // Update the full form data to ensure proper re-rendering. Should we just do this and not also call `onChange`?
    if (onChangeFormData) {
      onChangeFormData({
        ...formData,
        customBlocks: updatedBlocks
      });
    }
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

      <div className={css.customBlocksSetter}>
        <div className={css.customBlocksNew}>
          <div className={css.customBlocksNewHeading}>
            <h5>Setter Blocks</h5>
            <button onClick={() => {
              setEditingBlock(null);
              setShowSetterForm(!showSetterForm);
            }}>
              {showSetterForm ? "Cancel" : "Add Block"}
            </button>
          </div>
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
                <div className={css.customBlocksCurrentBlockInfo}>
                  <strong>{block.name}</strong> ({block.type})
                </div>
                <div className={css.customBlocksCurrentBlockActions}>
                  <div className={css.copyButtonContainer}>
                    <button onClick={() => handleCopyToClipboard(block, setCopiedBlockId)}>
                      Copy JSON
                    </button>
                    {copiedBlockId === block.id && (
                      <div className={css.copyTooltip}>
                        Copied!
                      </div>
                    )}
                  </div>
                  <button onClick={() => editCustomBlock(block)}>
                    Edit
                  </button>
                  <button onClick={() => removeBlock(block.id)}>
                    Remove
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className={css.noBlocksMessage}>No setter blocks created yet</div>
          )}
        </div>
      </div>

      <div className={css.customBlocksCreator}>
        <div className={css.customBlocksNew}>
          <div className={css.customBlocksNewHeading}>
            <h5>Creator Blocks</h5>
            <button onClick={() => {
              setEditingBlock(null);
              setShowCreatorForm(!showCreatorForm);
            }}>
              {showCreatorForm ? "Cancel" : "Add Block"}
            </button>
          </div>
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
                <div className={css.customBlocksCurrentBlockInfo}>
                  <strong>{block.name}</strong> ({block.type})
                </div>
                <div className={css.customBlocksCurrentBlockActions}>
                  <div className={css.copyButtonContainer}>
                    <button onClick={() => handleCopyToClipboard(block, setCopiedBlockId)}>
                      Copy JSON
                    </button>
                    {copiedBlockId === block.id && (
                      <div className={css.copyTooltip}>
                        Copied!
                      </div>
                    )}
                  </div>
                  <button onClick={() => editCustomBlock(block)}>
                    Edit
                  </button>
                  <button onClick={() => removeBlock(block.id)}>
                    Remove
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className={css.noBlocksMessage}>No creator blocks created yet</div>
          )}
        </div>
      </div>
    </div>
  );
};
