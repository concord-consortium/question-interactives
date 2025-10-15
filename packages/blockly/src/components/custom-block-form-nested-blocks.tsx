import React, { useState } from "react";

import { wouldCreateCircularReference } from "../utils/nested-block-utils";
import { INestedBlock } from "./types";

import css from "./custom-block-form-nested-blocks.scss";

interface IProps {
  availableBlocks: Array<{ id: string; name: string; type: string; canHaveChildren: boolean }>;
  maxDepth?: number;
  nestedBlocks: INestedBlock[];
  parentBlockId: string;
  onChange: (blocks: INestedBlock[]) => void;
}

export const CustomBlockFormNestedBlocks: React.FC<IProps> = ({
  availableBlocks,
  maxDepth = 10,
  nestedBlocks,
  parentBlockId,
  onChange
}) => {
  const [expandedBlocks, setExpandedBlocks] = useState<Set<string>>(new Set());

  const toggleExpand = (blockId: string) => {
    setExpandedBlocks(prev => {
      const next = new Set(prev);
      if (next.has(blockId)) {
        next.delete(blockId);
      } else {
        next.add(blockId);
      }
      return next;
    });
  };

  const addChildBlock = (parentPath: number[], blockId: string) => {
    const newBlocks = JSON.parse(JSON.stringify(nestedBlocks)) as INestedBlock[];
    
    // Navigate to the parent location and get the parent block ID
    let target: INestedBlock[] = newBlocks;
    let parentBlock: string | null = null;
    
    for (let i = 0; i < parentPath.length; i++) {
      const idx = parentPath[i];
      if (!target[idx].children) {
        target[idx].children = [];
      }
      parentBlock = target[idx].blockId;
      target = target[idx].children as INestedBlock[];
    }
    
    // Add the new child
    const childBlockInfo = availableBlocks.find(b => b.id === blockId);
    const newChild: INestedBlock = { blockId };
    if (childBlockInfo?.canHaveChildren) {
      newChild.canHaveChildren = true;
    }
    target.push(newChild);
    onChange(newBlocks);
    
    // Expand the parent to show the newly added child
    if (parentBlock) {
      setExpandedBlocks(prev => {
        const next = new Set(prev);
        next.add(parentBlock as string);
        return next;
      });
    }
  };

  const removeBlock = (path: number[]) => {
    const newBlocks = JSON.parse(JSON.stringify(nestedBlocks)) as INestedBlock[];
    
    if (path.length === 1) {
      // Remove from root level
      newBlocks.splice(path[0], 1);
    } else {
      // Navigate to parent and remove
      let target: INestedBlock[] = newBlocks;
      for (let i = 0; i < path.length - 1; i++) {
        target = target[path[i]].children as INestedBlock[];
      }
      target.splice(path[path.length - 1], 1);
    }
    
    onChange(newBlocks);
  };

  const moveBlock = (path: number[], direction: "up" | "down") => {
    const newBlocks = JSON.parse(JSON.stringify(nestedBlocks)) as INestedBlock[];
    
    // Navigate to the parent array
    let target: INestedBlock[] = newBlocks;
    if (path.length > 1) {
      for (let i = 0; i < path.length - 1; i++) {
        target = target[path[i]].children as INestedBlock[];
      }
    }
    
    const idx = path[path.length - 1];
    const newIdx = direction === "up" ? idx - 1 : idx + 1;
    
    if (newIdx >= 0 && newIdx < target.length) {
      [target[idx], target[newIdx]] = [target[newIdx], target[idx]];
      onChange(newBlocks);
    }
  };

  const canAddChild = (blockPath: number[], childBlockId: string): boolean => {
    const depth = blockPath.length + 1;
    if (depth >= maxDepth) {
      return false;
    }
    
    // Check circular reference
    const blockAtPath = getBlockAtPath(nestedBlocks, blockPath);
    if (blockAtPath && wouldCreateCircularReference(nestedBlocks, blockAtPath.blockId, childBlockId)) {
      return false;
    }
    
    return true;
  };

  const getBlockAtPath = (blocks: INestedBlock[], path: number[]): INestedBlock | null => {
    let current: INestedBlock[] = blocks;
    for (let i = 0; i < path.length; i++) {
      if (!current[path[i]]) return null;
      if (i === path.length - 1) {
        return current[path[i]];
      }
      current = current[path[i]].children || [];
    }
    return null;
  };

  const getBlockInfo = (blockId: string) => {
    return availableBlocks.find(b => b.id === blockId) || { id: blockId, name: blockId, type: "unknown" };
  };

  const renderNestedBlock = (block: INestedBlock, path: number[], depth: number) => {
    const blockInfo = getBlockInfo(block.blockId);
    const isExpanded = expandedBlocks.has(block.blockId);
    const hasChildren = block.children && block.children.length > 0;
    const siblingCount = path.length === 1 ? nestedBlocks.length : 
      (getBlockAtPath(nestedBlocks, path.slice(0, -1))?.children?.length || 0);
    const isFirst = path[path.length - 1] === 0;
    const isLast = path[path.length - 1] === siblingCount - 1;

    return (
      <div key={`${path.join("-")}`} className={css.nestedBlock} style={{ marginLeft: `${depth * 20}px` }}>
        <div className={css.nestedBlock_row}>
          <div className={css.nestedBlock_info}>
            {hasChildren && (
              <button
                className={css.nestedBlock_toggleButton}
                type="button"
                onClick={() => toggleExpand(block.blockId)}
              >
                {isExpanded ? "▼" : "▶"}
              </button>
            )}
            {!hasChildren && <span className={css.nestedBlock_spacer}></span>}
            <span className={css.nestedBlock_name}>{blockInfo.name}</span>
            <span className={css.nestedBlock_depth}>Level {depth + 1}</span>
          </div>
          <div className={css.nestedBlock_actions}>
            <button
              className={css.nestedBlock_actionButton}
              disabled={isFirst}
              type="button"
              onClick={() => moveBlock(path, "up")}
            >
              Up
            </button>
            <button
              className={css.nestedBlock_actionButton}
              disabled={isLast}
              type="button"
              onClick={() => moveBlock(path, "down")}
            >
              Down
            </button>
            <button
              className={css.nestedBlock_actionButton}
              type="button"
              onClick={() => removeBlock(path)}
            >
              Remove
            </button>
          </div>
        </div>

        {/* Add child dropdown - only show if block can have children and not at max depth */}
        {(block.canHaveChildren ?? false) && depth < maxDepth - 1 && (
          <div className={css.nestedBlock_addChild}>
            <select
              className={css.nestedBlock_addChildSelect}
              onChange={(e) => {
                if (e.target.value) {
                  addChildBlock(path, e.target.value);
                  e.target.value = "";
                }
              }}
              value=""
            >
              <option value="">+ Add nested block...</option>
              {availableBlocks
                .filter(b => canAddChild(path, b.id))
                .map(b => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
            </select>
          </div>
        )}

        {/* Render children */}
        {hasChildren && isExpanded && block.children && (
          <div className={css.nestedBlock_children}>
            {block.children.map((child, idx) =>
              renderNestedBlock(child, [...path, idx], depth + 1)
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={css.nestedBlocks} data-testid="nested-blocks">
      <div className={css.nestedBlocks_header}>
        <h6>Child Blocks</h6>
      </div>

      {nestedBlocks.length === 0 ? (
        <div className={css.nestedBlocks_empty}>
          No nested blocks added yet.
        </div>
      ) : (
        <div className={css.nestedBlocks_tree}>
          {nestedBlocks.map((block, idx) => renderNestedBlock(block, [idx], 0))}
        </div>
      )}

      {/* Root level Add dropdown */}
      <div className={css.nestedBlocks_addRoot}>
        <select
          className={css.nestedBlocks_addRootSelect}
          data-testid="add-root-block"
          onChange={(e) => {
            if (e.target.value) {
              const blockInfo = availableBlocks.find(b => b.id === e.target.value);
              const newBlock: INestedBlock = { blockId: e.target.value };
              if (blockInfo?.canHaveChildren) {
                newBlock.canHaveChildren = true;
              }
              onChange([...nestedBlocks, newBlock]);
              e.target.value = "";
            }
          }}
          value=""
        >
          <option value="">+ Add block...</option>
          {availableBlocks
            .filter(b => b.id !== parentBlockId)
            .map(b => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
        </select>
      </div>
    </div>
  );
};

