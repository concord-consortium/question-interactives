import React, { useState } from "react";

import { CustomBlockForm } from "./custom-block-form";
import { CustomBlockType, ICustomBlock } from "./types";

import css from "./custom-block-editor-section.scss";

interface IProps {
  blockType: CustomBlockType;
  customBlocks: ICustomBlock[];
  toolbox: string;
  onChange: (blocks: ICustomBlock[]) => void;
}

export const generateBlockId = (block: ICustomBlock) => {
  const sanitizedName = block.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
  const timestamp = Date.now();
  return `custom_${block.type}_${sanitizedName}_${timestamp}`;
};

const blockTypeHeadings: Record<CustomBlockType, string> = {
  action: "Action",
  ask: "Ask",
  builtIn: "Built-in",
  condition: "Condition",
  creator: "Create Things",
  preMade: "Pre-made",
  setter: "Set Properties"
};

export const CustomBlockEditorSection: React.FC<IProps> = ({ blockType, toolbox, customBlocks, onChange }) => {
  const [showForm, setShowForm] = useState<boolean>(false);
  const [editingBlock, setEditingBlock] = useState<ICustomBlock | null>(null);

  const addCustomBlock = (block: ICustomBlock) => {
    const newBlock = { ...block, id: generateBlockId(block) };
    const updatedBlocks = [...customBlocks, newBlock];
    onChange(updatedBlocks);
    setShowForm(false);
    setEditingBlock(null);
  };

  const editCustomBlock = (block: ICustomBlock) => {
    setEditingBlock(block);
    setShowForm(true);
  };

  const updateCustomBlock = (updatedBlock: ICustomBlock) => {
    const updatedBlocks = customBlocks.map(b => b.id === editingBlock?.id ? updatedBlock : b);
    onChange(updatedBlocks);

    setShowForm(false);
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

  const filteredBlocks = customBlocks.filter(b => b.type === blockType);

  return (
    <>
    <div className={css.customBlocks_section} data-testid={`section-${blockType}`}>
      <div className={css.customBlocks_new}>
        <div className={css.customBlocks_newHeading}>
          <h5>{blockTypeHeadings[blockType]} Blocks</h5>
          <button data-testid={`add-${blockType}`} onClick={() => {
            setEditingBlock(null);
            setShowForm(!showForm);
          }}>
            {showForm ? "Cancel" : "Add Block"}
          </button>
        </div>
        {showForm && (
          <CustomBlockForm
            blockType={blockType}
            editingBlock={editingBlock}
            existingBlocks={customBlocks}
            toolbox={toolbox}
            onSubmit={handleFormSubmit}
          />
        )}
      </div>
      <div className={css.customBlocks_current} data-testid={`current-${blockType}`}>
        {filteredBlocks.length > 0 ? (
          filteredBlocks.map(block => (
            <div className={css.customBlocks_currentBlock} key={block.id} data-testid="current-block">
              <div className={css.customBlocks_currentBlockInfo}>
                <strong>{block.name}</strong> ({block.type}) - {block.category}
              </div>
              <div className={css.customBlocks_currentBlockActions}>
                <button data-testid="block-edit" onClick={() => editCustomBlock(block)}>Edit</button>
                <button data-testid="block-delete" onClick={() => deleteBlock(block.id)}>Delete</button>
              </div>
            </div>
          ))
        ) : (
          <div className={css.noBlocks_message}>No {blockType} blocks created yet</div>
        )}
      </div>
    </div>
    </>
  );
};
