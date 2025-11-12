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
  setter: "Set Properties"
};

export const CustomBlockEditorSection: React.FC<IProps> = ({ blockType, toolbox, customBlocks, onChange }) => {
  const [showForm, setShowForm] = useState<boolean>(false);
  const [editingBlock, setEditingBlock] = useState<ICustomBlock | null>(null);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

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
    setIsExpanded(true);
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

  const moveBlock = (id: string, direction: "up" | "down") => {
    // Blocks are only reordered within their type group (e.g., setter blocks among other setter blocks),
    // and we maintain the relative positions of different block types in the full array.
    const filteredIndex = filteredBlocks.findIndex(b => b.id === id);
    if (filteredIndex === -1) return;

    const newFilteredIndex = direction === "up" ? filteredIndex - 1 : filteredIndex + 1;
    if (newFilteredIndex < 0 || newFilteredIndex >= filteredBlocks.length) return;

    const reorderedFilteredBlocks = [...filteredBlocks];
    const [movedBlock] = reorderedFilteredBlocks.splice(filteredIndex, 1);
    reorderedFilteredBlocks.splice(newFilteredIndex, 0, movedBlock);

    // Find the current positions of blocks of this type in the array of all blocks.
    const blockTypeIndices = customBlocks
      .map((block, index) => ({ block, currentIndex: index }))
      .filter(item => item.block.type === blockType);

    // Create the final array preserving inter-section ordering.
    const finalBlocks = [...customBlocks];
    blockTypeIndices.forEach((item, sectionIndex) => {
      finalBlocks[item.currentIndex] = reorderedFilteredBlocks[sectionIndex];
    });

    onChange(finalBlocks);
  };

  const filteredBlocks = customBlocks.filter(b => b.type === blockType);

  return (
    <div className={css.customBlocks_section} data-testid={`section-${blockType}`}>
      <div className={css.customBlocks_header}>
        <button
          className={css.customBlocks_toggleButton}
          data-testid={`toggle-${blockType}`}
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <span className={`${css.customBlocks_chevron} ${isExpanded ? css.expanded : ""}`}>▼</span>
          <h5>{blockTypeHeadings[blockType]} Blocks</h5>
        </button>
        <span className={css.customBlocks_blockCount}>
          ({filteredBlocks.length} {filteredBlocks.length === 1 ? "block" : "blocks"})
        </span>
        <button
          className={css.customBlocks_addButton}
          data-testid={`add-${blockType}`}
          type="button"
          onClick={() => {
            setEditingBlock(null);
            setShowForm(!showForm);
            if (!isExpanded) {
              setIsExpanded(true);
            }
          }}
        >
          {showForm ? "Cancel" : "Add Block"}
        </button>
      </div>

      {isExpanded && (
        <div className={css.customBlocks_content}>
          {showForm && (
            <div className={css.customBlocks_formWrapper}>
              <CustomBlockForm
                blockType={blockType}
                editingBlock={editingBlock}
                existingBlocks={customBlocks}
                toolbox={toolbox}
                onSubmit={handleFormSubmit}
              />
            </div>
          )}
          <div className={css.customBlocks_current} data-testid={`current-${blockType}`}>
            {filteredBlocks.length > 0 ? (
              filteredBlocks.map((block, index) => (
                <div className={css.customBlocks_currentBlock} key={block.id} data-testid="current-block">
                  <div className={css.customBlocks_currentBlockInfo}>
                    <strong>{block.name}</strong> ({block.type}) - {block.category}
                  </div>
                  <div className={css.customBlocks_currentBlockActions}>
                    <button
                      aria-label={`Move ${block.name} block up`}
                      className={css.moveButton}
                      data-testid="block-move-up"
                      disabled={index === 0}
                      title={`Move ${block.name} block up`}
                      type="button"
                      onClick={() => moveBlock(block.id, "up")}
                    >
                      ↑
                    </button>
                    <button
                      aria-label={`Move ${block.name} block down`}
                      className={css.moveButton}
                      data-testid="block-move-down"
                      disabled={index === filteredBlocks.length - 1}
                      title={`Move ${block.name} block down`}
                      type="button"
                      onClick={() => moveBlock(block.id, "down")}
                    >
                      ↓
                    </button>
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
      )}
    </div>
  );
};
