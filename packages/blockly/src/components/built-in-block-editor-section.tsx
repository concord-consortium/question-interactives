import { Blocks } from "blockly/core";
import React from "react";

import { BLOCKLY_BUILT_IN_BLOCKS } from "../blocks/blockly-built-in-registry";
import { CUSTOM_BUILT_IN_BLOCKS } from "../blocks/custom-built-in-blocks";

import css from "./built-in-block-editor-section.scss";

interface IProps {
  availableCategories: string[];
  blockCategories: Record<string, string>;
  onCategoryChange: (blockId: string, newCategory: string) => void;
}

export const BuiltInBlockEditorSection: React.FC<IProps> = ({availableCategories, blockCategories, onCategoryChange }) => {
  // List of all built-in blocks (both custom-defined and from Blockly core)
  const allBuiltInBlocks = React.useMemo(() => {
    const BUILT_IN_BLOCK_KEYS = [
      ...CUSTOM_BUILT_IN_BLOCKS.map(info => info.id),
      ...BLOCKLY_BUILT_IN_BLOCKS.map(info => info.id)
    ];

    return BUILT_IN_BLOCK_KEYS
      .filter(key => Blocks[key])
      .map(key => ({
        blockKey: key,
        id: key,
        name: key
      }));
  }, []);

  return (
    <div className={css.builtInBlocks_section} data-testid="section-built-in">
      <div className={css.builtInBlocks_new}>
        <div className={css.builtInBlocks_newHeading}>
          <h5>Built-in Blocks</h5>
        </div>
      </div>
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
                id={`category-${block.id}`}
                value={blockCategories[block.id] || ""}
                onChange={e => onCategoryChange(block.id, e.target.value)}
                data-testid={`select-category-${block.id}`}
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
  );
};
