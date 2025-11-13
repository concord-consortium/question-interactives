import { Blocks } from "blockly";
import React, { useEffect, useState } from "react";

import { ALL_BUILT_IN_BLOCKS, BLOCK_TYPE_ORDER } from "../blocks/block-constants";
import { BuiltInBlockEditorSection } from "./built-in-block-editor-section";
import { CustomBlockEditorSection } from "./custom-block-editor-section";
import { ICustomBlock } from "./types";
import { validateBlocksJson } from "../utils/block-utils";
import { extractCategoriesFromToolbox } from "../utils/toolbox-utils";

import css from "./custom-block-editor.scss";

interface IProps {
  customBlocks: ICustomBlock[];
  toolbox: string;
  onChange: (blocks: ICustomBlock[]) => void;
}

export const CustomBlockEditor: React.FC<IProps> = ({ customBlocks = [], onChange, toolbox }) => {
  const [showCodePreview, setShowCodePreview] = useState(false);
  const [codeText, setCodeText] = useState<string>(JSON.stringify(customBlocks, null, 2));
  const [codeError, setCodeError] = useState<string>("");
  const [isDirty, setIsDirty] = useState<boolean>(false);

  // Keep textarea in sync when external value changes, unless the user has unsaved edits.
  useEffect(() => {
    if (!isDirty) {
      setCodeText(JSON.stringify(customBlocks, null, 2));
      setCodeError("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customBlocks]);

  const handleCodeChange: React.ChangeEventHandler<HTMLTextAreaElement> = (e) => {
    setCodeText(e.target.value);
    setIsDirty(true);
    setCodeError("");
  };

  const resetCodeText = () => {
    setCodeText(JSON.stringify(customBlocks, null, 2));
    setIsDirty(false);
    setCodeError("");
  };

  const applyCodeUpdate = () => {
    try {
      const parsed = JSON.parse(codeText);
      const { valid, error } = validateBlocksJson(parsed);
      if (!valid) {
        setCodeError(error || "Invalid blocks JSON");
        return;
      }
      onChange(parsed as ICustomBlock[]);
      setIsDirty(false);
      setCodeError("");
    } catch (e) {
      setCodeError(e instanceof Error ? e.message : "Unable to parse JSON");
    }
  };

  const availableCategories = extractCategoriesFromToolbox(toolbox);
  const [builtInBlockCategories, setBuiltInBlockCategories] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    ALL_BUILT_IN_BLOCKS.forEach(block => {
      initial[block.id] = block.defaultCategory ?? "";
    });
    return initial;
  });

  // On first render, initialize customBlocks with built-in blocks that have default categories specified.
  useEffect(() => {
    const existingBuiltInIds = new Set(customBlocks.filter(b => b.type === "builtIn").map(b => b.id));
    const builtInBlocksToAdd: ICustomBlock[] = [];

    ALL_BUILT_IN_BLOCKS.forEach(blockInfo => {
      if (blockInfo.defaultCategory && !existingBuiltInIds.has(blockInfo.id)) {
        const builtInBlock: ICustomBlock = {
          id: blockInfo.id,
          name: blockInfo.name,
          type: "builtIn",
          category: blockInfo.defaultCategory,
          color: blockInfo.color,
          config: {
            canHaveChildren: blockInfo.canHaveChildren ?? true
          }
        };
        builtInBlocksToAdd.push(builtInBlock);
      }
    });

    if (builtInBlocksToAdd.length > 0) {
      onChange([...customBlocks, ...builtInBlocksToAdd]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When toolbox changes, update available categories and reset built-in block categories if needed
  useEffect(() => {
    setBuiltInBlockCategories(prev => {
      const updated: Record<string, string> = { ...prev };
      Object.keys(Blocks).forEach((blockId: string) => {
        if (!(blockId in updated)) {
          updated[blockId] = "";
        }
      });
      // Remove any blocks that no longer exist
      Object.keys(updated).forEach(id => {
        if (!Object.prototype.hasOwnProperty.call(Blocks, id)) {
          delete updated[id];
        }
      });
      return updated;
    });
  }, [toolbox]);

  const handleBuiltInBlockCategoryChange = (blockId: string, newCategory: string) => {
    setBuiltInBlockCategories(prev => ({ ...prev, [blockId]: newCategory }));

    // Remove any previous instance of this built-in block from customBlocks
    let updatedBlocks = customBlocks.filter(b => b.id !== blockId);

    if (newCategory) {
      // For built-in blocks, we just need to track the category assignment.
      // The actual block definition already exists in Blockly from custom-built-in-blocks.ts
      // or from Blockly core. We create a minimal `ICustomBlock` entry just to track the category.
      // TODO: Adding placeholder entries is a workaround, as @tealefristoe noted at
      // https://github.com/concord-consortium/question-interactives/pull/408#discussion_r2429095534
      // To populate the toolbox, we only need each built-in block's ID and category. Ideally, we'd drop
      // the "builtIn" type from `ICustomBlock` and instead add a `builtInCategories` field to `authoredState`
      // that only specifies ID and category values for built-in blocks). Then `injectCustomBlocksIntoToolbox`
      // could use both `authoredState.customBlocks` and `authoredState.builtInCategories`, eliminating the
      // need for this placeholder logic.
      const builtInBlock: ICustomBlock = {
        id: blockId,
        name: blockId.charAt(0).toUpperCase() + blockId.slice(1),
        type: "builtIn",
        category: newCategory,
        color: "#0089b8",
        config: {
          canHaveChildren: true
        }
      };
      updatedBlocks = [...updatedBlocks, builtInBlock];
    }
    onChange(updatedBlocks);
  };

  return (
    <div className={css.customBlockEditor} data-testid="custom-block-editor">
      <h4>Custom Blocks</h4>

      {/* Render sections for each block type except "builtIn" which we handle separately below. */}
      {BLOCK_TYPE_ORDER.filter(type => type !== "builtIn").map(type => (
        <CustomBlockEditorSection
          key={type}
          blockType={type}
          toolbox={toolbox}
          customBlocks={customBlocks}
          onChange={onChange}
        />
      ))}

      <BuiltInBlockEditorSection
        availableCategories={availableCategories}
        blockCategories={builtInBlockCategories}
        onCategoryChange={handleBuiltInBlockCategoryChange}
      />

      {/* Editable code preview for all custom blocks. */}
      <div className={css.codePreview} data-testid="code-preview">
        <div className={css.codePreview_header}>
          <h5>Custom Blocks Code</h5>
          <div className={css.codePreview_actions}>
            <button type="button" data-testid="code-toggle" onClick={() => setShowCodePreview(prev => !prev)}>
              {showCodePreview ? "Hide" : "Show"}
            </button>
          </div>
        </div>
        {showCodePreview && (
          <div className={css.codePreview_body} data-testid="code-preview-body">
            <textarea data-testid="code-textarea" value={codeText} onChange={handleCodeChange} className={css.codeTextarea} />
            {codeError && <div className={css.codeError} data-testid="code-error">{codeError}</div>}
            <div className={css.codePreview_actions}>
              <button type="button" data-testid="code-reset" onClick={resetCodeText} disabled={!isDirty}>Reset</button>
              <button type="button" data-testid="code-update" onClick={applyCodeUpdate} disabled={!isDirty}>Update</button>
            </div>
          </div>
        )}
      </div>
      <hr className={css.divider} />
    </div>
  );
};
