import React, { useState, useMemo } from "react";

import { DEFAULT_MAX_NESTING_DEPTH } from "../blocks/block-constants";
import { wouldCreateCircularReference } from "../utils/nested-block-utils";
import { INestedBlock, ICustomBlock } from "./types";

import css from "./custom-block-form-nested-blocks.scss";

interface IProps {
  availableBlocks: Array<{ id: string; name: string; type: string; canHaveChildren: boolean }>;
  existingBlocks?: ICustomBlock[];
  maxDepth?: number;
  nestedBlocks: INestedBlock[];
  parentBlockId: string;
  onChange: (blocks: INestedBlock[]) => void;
}

export const CustomBlockFormNestedBlocks: React.FC<IProps> = ({
  availableBlocks,
  existingBlocks,
  maxDepth = DEFAULT_MAX_NESTING_DEPTH,
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
    const newChild: INestedBlock = { blockId, canHaveChildren: childBlockInfo?.canHaveChildren, defaultOptionValue: undefined };
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
    
    // Navigate to parent and remove
    let target: INestedBlock[] = newBlocks;
    for (let i = 0; i < path.length - 1; i++) {
      target = target[path[i]].children as INestedBlock[];
    }
    target.splice(path[path.length - 1], 1);
    
    onChange(newBlocks);
  };

  const moveBlock = (path: number[], direction: "up" | "down") => {
    const newBlocks = JSON.parse(JSON.stringify(nestedBlocks)) as INestedBlock[];
    
    // Navigate to the parent array
    let target: INestedBlock[] = newBlocks;
    for (let i = 0; i < path.length - 1; i++) {
      target = target[path[i]].children as INestedBlock[];
    }
    
    const idx = path[path.length - 1];
    const newIdx = direction === "up" ? idx - 1 : idx + 1;
    
    if (newIdx >= 0 && newIdx < target.length) {
      [target[idx], target[newIdx]] = [target[newIdx], target[idx]];
      onChange(newBlocks);
    }
  };

  const circularRefCache = new Map<string, boolean>();
  const canAddChild = (blockPath: number[], childBlockId: string): boolean => {
    const depth = blockPath.length + 1;
    if (depth >= maxDepth) return false;

    const blockAtPath = getBlockAtPath(nestedBlocks, blockPath);
    if (blockAtPath) {
      const cacheKey = `${blockAtPath.blockId}:${childBlockId}`;
      if (!circularRefCache.has(cacheKey)) {
        circularRefCache.set(
          cacheKey,
          wouldCreateCircularReference(nestedBlocks, blockAtPath.blockId, childBlockId)
        );
      }
      if (circularRefCache.get(cacheKey)) return false;
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

  const availableBlocksMap = useMemo(() => {
    const map = new Map<string, typeof availableBlocks[0]>();
    availableBlocks.forEach(b => map.set(b.id, b));
    return map;
  }, [availableBlocks]);

  const getBlockInfo = (blockId: string) => {
    return availableBlocksMap.get(blockId) || { id: blockId, name: blockId, type: "unknown", canHaveChildren: false };
  };

  const getCustomBlockById = (id: string) => {
    return (existingBlocks || []).find(b => b.id === id);
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
          <div className={css.nestedBlock_override}>
            <label htmlFor={`nested-override-${path.join("-")}`}>Default override</label>
            {/* Render a select populated from the child's configured options if available. */}
            {(() => {
              const cb = getCustomBlockById(block.blockId);
              let opts: Array<{ label: string; value: string }> | null = null;
              if (cb && cb.config) {
                const raw = (cb.config.typeOptions as any) || (cb.config.options as any) || [];
                opts = Array.isArray(raw)
                  ? raw.map((opt: any) => (Array.isArray(opt) ? { label: String(opt[0]), value: String(opt[1]) } : { label: String(opt?.label || ""), value: String(opt?.value || "") }))
                      .filter(o => o.label && o.value)
                  : null;
              }

              if (opts && opts.length > 0) {
                return (
                  <select
                    id={`nested-override-${path.join("-")}`}
                    data-testid={`nested-override-${path.join("-")}`}
                    value={block.defaultOptionValue ?? ""}
                    onChange={(e) => {
                      const newBlocks = JSON.parse(JSON.stringify(nestedBlocks)) as INestedBlock[];
                      let targetArr: INestedBlock[] = newBlocks;
                      for (let i = 0; i < path.length - 1; i++) {
                        targetArr = targetArr[path[i]].children as INestedBlock[];
                      }
                      const idx = path[path.length - 1];
                      targetArr[idx].defaultOptionValue = e.target.value || undefined;
                      onChange(newBlocks);
                    }}
                  >
                    <option value="">(inherit parent default)</option>
                    {opts.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                );
              }

              // Fallback to text input if we can't determine options for this child block
              return (
                <input
                  id={`nested-override-${path.join("-")}`}
                  data-testid={`nested-override-${path.join("-")}`}
                  placeholder="Override default value (optional)"
                  type="text"
                  value={block.defaultOptionValue ?? ""}
                  onChange={(e) => {
                    const newBlocks = JSON.parse(JSON.stringify(nestedBlocks)) as INestedBlock[];
                    let targetArr: INestedBlock[] = newBlocks;
                    for (let i = 0; i < path.length - 1; i++) {
                      targetArr = targetArr[path[i]].children as INestedBlock[];
                    }
                    const idx = path[path.length - 1];
                    targetArr[idx].defaultOptionValue = e.target.value || undefined;
                    onChange(newBlocks);
                  }}
                />
              );
            })()}
          </div>
          <div className={css.nestedBlock_actions}>
            <button
              aria-label={`Move ${blockInfo.name} block up`}
              className={css.nestedBlock_actionButton}
              data-testid="block-move-up"
              disabled={isFirst}
              title={`Move ${blockInfo.name} block up`}
              type="button"
              onClick={() => moveBlock(path, "up")}
            >
              ↑
            </button>
            <button
              aria-label={`Move ${blockInfo.name} block down`}
              className={css.nestedBlock_actionButton}
              data-testid="block-move-down"
              disabled={isLast}
              title={`Move ${blockInfo.name} block down`}
              type="button"
              onClick={() => moveBlock(path, "down")}
            >
              ↓
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
        {hasChildren && isExpanded && (
          <div className={css.nestedBlock_children}>
            {block.children?.map((child, idx) =>
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
              const blockInfo = getBlockInfo(e.target.value);
              const newBlock: INestedBlock = { blockId: e.target.value, canHaveChildren: blockInfo?.canHaveChildren };
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

