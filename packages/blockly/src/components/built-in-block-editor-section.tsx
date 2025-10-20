import { Blocks } from "blockly/core";
import React, { useState } from "react";

import { ALL_BUILT_IN_BLOCKS } from "../blocks/block-constants";

import css from "./built-in-block-editor-section.scss";

interface IProps {
  availableCategories: string[];
  blockCategories: Record<string, string>;
  onCategoryChange: (blockId: string, newCategory: string) => void;
}

export const BuiltInBlockEditorSection: React.FC<IProps> = ({availableCategories, blockCategories, onCategoryChange }) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  // List of all built-in blocks (both custom-defined and from Blockly core)
  const allBuiltInBlocks = React.useMemo(() => {
    return ALL_BUILT_IN_BLOCKS
      .filter(block => Blocks[block.id])
      .map(block => ({
        id: block.id,
        name: block.id
      }));
  }, []);

  const assignedBlockCount = Object.keys(blockCategories).filter(key => blockCategories[key] !== "").length;

  return (
    <div className={css.builtInBlocks_section} data-testid="section-built-in">
      <div className={css.builtInBlocks_header}>
        <button
          className={css.builtInBlocks_toggleButton}
          data-testid="toggle-built-in"
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <span className={`${css.builtInBlocks_chevron} ${isExpanded ? css.expanded : ""}`}>▼</span>
          <h5>Built-in Blocks</h5>
          <span className={css.builtInBlocks_blockCount}>
            ({assignedBlockCount} {assignedBlockCount === 1 ? "block" : "blocks"} in toolbox)
          </span>
        </button>
      </div>

      {isExpanded && (
        <div className={css.builtInBlocks_content}>
          <div className={css.builtInBlocks_list} data-testid="block-list">
            {allBuiltInBlocks.length === 0 && (
              <div className={css.builtInBlocks_noBlocks}>No built-in blocks available</div>
            )}
            {allBuiltInBlocks.map(block => (
              <div key={block.id} className={css.builtInBlocks_listItem} data-testid="block-list-item">
                <div className={css.builtInBlocks_blockInfo}>
                  <span className={css.builtInBlocks_blockName}>{block.name} block</span>
                </div>
                <div className={css.builtInBlocks_blockCategory}>
                  <label className={css.builtInBlocks_categoryLabel} htmlFor={`category-${block.id}`}>Category:</label>
                  <select
                    className={css.builtInBlocks_categorySelect}
                    data-testid={`select-category-${block.id}`}
                    id={`category-${block.id}`}
                    value={blockCategories[block.id] || ""}
                    onChange={e => onCategoryChange(block.id, e.target.value)}
                  >
                    <option value="">-- Not in toolbox --</option>
                    {availableCategories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
