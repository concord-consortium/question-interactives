import React, { useState } from "react";

import { CustomBlockForm } from "./custom-block-form";
import { ICustomBlock } from "./types";

import css from "./custom-block-editor.scss";

interface IProps {
  toolbox: string;
  value: ICustomBlock[];
  onChange: (blocks: ICustomBlock[]) => void;
}

const generateBlockJson = (block: ICustomBlock) => {
  return `{
    "kind": "block",
    "type": "${block.id}"
  }`;
};

const generateBlockId = (block: ICustomBlock) => {
  const sanitizedName = block.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
  const timestamp = Date.now();
  return `custom_${block.type}_${sanitizedName}_${timestamp}`;
};

const handleCopyToClipboard = (block: ICustomBlock, setCopiedBlockId: (id: string | null) => void) => {
  const blockJson = generateBlockJson(block);
  navigator.clipboard.writeText(blockJson);
  setCopiedBlockId(block.id);
  setTimeout(() => setCopiedBlockId(null), 2000);
};

export const CustomBlockEditor: React.FC<IProps> = ({ value, onChange, toolbox }) => {
  const customBlocks = Array.isArray(value) ? value : [];
  const [showSetterForm, setShowSetterForm] = useState(false);
  const [showCreatorForm, setShowCreatorForm] = useState(false);
  const [editingBlock, setEditingBlock] = useState<ICustomBlock | null>(null);
  const [copiedBlockId, setCopiedBlockId] = useState<string | null>(null);

  const addCustomBlock = (block: ICustomBlock) => {
    const newBlock = { ...block, id: generateBlockId(block) };
    const updatedBlocks = [...customBlocks, newBlock];
    onChange(updatedBlocks);
    
    setShowSetterForm(false);
    setShowCreatorForm(false);
    setEditingBlock(null);
  };

  const editCustomBlock = (block: ICustomBlock) => {
    setEditingBlock(block);
    if (block.type === "setter") {
      setShowSetterForm(true);
      setShowCreatorForm(false);
    } else {
      setShowCreatorForm(true);
      setShowSetterForm(false);
    }
  };

  const updateCustomBlock = (updatedBlock: ICustomBlock) => {
    const updatedBlocks = customBlocks.map(b => b.id === editingBlock?.id ? updatedBlock : b);
    onChange(updatedBlocks);
    
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

  const deleteBlock = (id: string) => {
    const updatedBlocks = customBlocks.filter(b => b.id !== id);
    onChange(updatedBlocks);
  };

  return (
    <div className={css.customBlockEditor}>
      <h4>Custom Blocks</h4>

      <div className={css.customBlocksSetter}>
        <div className={css.customBlocksNew}>
          <div className={css.customBlocksNewHeading}>
            <h5>Setter Blocks</h5>
            <button onClick={() => {
              setEditingBlock(null);
              setShowSetterForm(!showSetterForm);
              setShowCreatorForm(false);
            }}>
              {showSetterForm ? "Cancel" : "Add Block"}
            </button>
          </div>
          {showSetterForm && (
            <CustomBlockForm 
              existingBlocks={customBlocks} 
              onSubmit={handleFormSubmit} 
              blockType="setter"
              editingBlock={editingBlock}
              toolbox={toolbox}
            />
          )}
        </div>

        <div className={css.customBlocksCurrent}>
          {customBlocks.filter(b => b.type === "setter").length > 0 ? (
            customBlocks.filter(b => b.type === "setter").map(block => (
              <div className={css.customBlocksCurrentBlock} key={block.id}>
                <div className={css.customBlocksCurrentBlockInfo}>
                  <strong>{block.name}</strong> ({block.type}) - {block.category}
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
                  <button onClick={() => deleteBlock(block.id)}>
                    Delete
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
              setShowSetterForm(false);
            }}>
              {showCreatorForm ? "Cancel" : "Add Block"}
            </button>
          </div>
          {showCreatorForm && (
            <CustomBlockForm 
              existingBlocks={customBlocks} 
              onSubmit={handleFormSubmit} 
              blockType="creator"
              editingBlock={editingBlock}
              toolbox={toolbox}
            />
          )}
        </div>

        <div className={css.customBlocksCurrent}>
          {customBlocks.filter(b => b.type === "creator").length > 0 ? (
            customBlocks.filter(b => b.type === "creator").map(block => (
              <div className={css.customBlocksCurrentBlock} key={block.id}>
                <div className={css.customBlocksCurrentBlockInfo}>
                  <strong>{block.name}</strong> ({block.type}) - {block.category}
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
                  <button onClick={() => deleteBlock(block.id)}>
                    Delete
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
