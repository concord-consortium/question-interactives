import React from "react";

import { ICustomBlock } from "./types";
import { preMadeBlocks } from "../blocks/pre-made-blocks";

import css from "./static-block-editor-section.scss";

// TODO: Replace with actual built-in blocks import if available
const builtInBlocks: ICustomBlock[] = [];

interface StaticBlockEditorSectionProps {
  availableCategories: string[];
  staticBlockCategories: Record<string, string>;
  onCategoryChange: (blockId: string, newCategory: string) => void;
}

export const StaticBlockEditorSection: React.FC<StaticBlockEditorSectionProps> = ({
  availableCategories,
  staticBlockCategories,
  onCategoryChange
}) => {
  const allStaticBlocks = [...builtInBlocks, ...preMadeBlocks];

  return (
    <div className={css.staticBlocks_section} data-testid={`section-builtin-premade`}>
      <div className={css.staticBlocks_new}>
        <div className={css.staticBlocks_newHeading}>
          <h5>Built-in Blocks</h5>
        </div>
      </div>
      <div className={css.staticBlocks_list} data-testid="block-list">
        {allStaticBlocks.length === 0 && (
          <div className={css.staticBlocks_noBlocks}>No built-in or pre-made blocks available</div>
        )}
        {allStaticBlocks.map(block => (
          <div key={block.id} className={css.staticBlocks_listItem} data-testid="block-list-item">
            <div className={css.staticBlocks_blockInfo}>
              <span className={css.staticBlocks_blockName}>{block.name} Block</span>
            </div>
            <div className={css.staticBlocks_blockCategory}>
              <label className={css.staticBlocks_categoryLabel} htmlFor={`category-${block.id}`}>Category:</label>
              <select
                className={css.staticBlocks_categorySelect}
                id={`category-${block.id}`}
                value={staticBlockCategories[block.id] || ""}
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
