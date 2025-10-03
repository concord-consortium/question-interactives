import React, { useEffect, useState } from "react";

import { validateBlocksJson } from "../utils/block-utils";
import { CustomBlockForm } from "./custom-block-form";
import { CustomBlockType, ICustomBlock } from "./types";

import css from "./custom-block-editor.scss";

interface IProps {
  toolbox: string;
  value: ICustomBlock[];
  onChange: (blocks: ICustomBlock[]) => void;
}

const generateBlockId = (block: ICustomBlock) => {
  const sanitizedName = block.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
  const timestamp = Date.now();
  return `custom_${block.type}_${sanitizedName}_${timestamp}`;
};

export const CustomBlockEditor: React.FC<IProps> = ({ value, onChange, toolbox }) => {
  const customBlocks = Array.isArray(value) ? value : [];
  const [showForm, setShowForm] = useState<CustomBlockType | null>(null);
  const [editingBlock, setEditingBlock] = useState<ICustomBlock | null>(null);
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

  const addCustomBlock = (block: ICustomBlock) => {
    const newBlock = { ...block, id: generateBlockId(block) };
    const updatedBlocks = [...customBlocks, newBlock];
    onChange(updatedBlocks);
    setShowForm(null);
    setEditingBlock(null);
  };

  const editCustomBlock = (block: ICustomBlock) => {
    setEditingBlock(block);
    setShowForm(block.type);
  };

  const updateCustomBlock = (updatedBlock: ICustomBlock) => {
    const updatedBlocks = customBlocks.map(b => b.id === editingBlock?.id ? updatedBlock : b);
    onChange(updatedBlocks);
    
    setShowForm(null);
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

  const setterBlocks = customBlocks.filter(b => b.type === "setter");
  const creatorBlocks = customBlocks.filter(b => b.type === "creator");
  const actionBlocks = customBlocks.filter(b => b.type === "action");

  return (
    <div className={css.customBlockEditor} data-testid="custom-block-editor">
      <h4>Custom Blocks</h4>

      {/* Setter blocks section */}
      <div className={css.customBlocks_section} data-testid="section-setter">
        <div className={css.customBlocks_new}>
          <div className={css.customBlocks_newHeading}>
            <h5>Set Properties Blocks</h5>
            <button data-testid="add-setter" onClick={() => {
              setEditingBlock(null);
              setShowForm(showForm === "setter" ? null : "setter");
            }}>
              {showForm === "setter" ? "Cancel" : "Add Block"}
            </button>
          </div>
          {showForm === "setter" && (
            <CustomBlockForm
              blockType="setter"
              editingBlock={editingBlock}
              existingBlocks={customBlocks}
              toolbox={toolbox}
              onSubmit={handleFormSubmit}
            />
          )}
        </div>
        <div className={css.customBlocks_current} data-testid="current-setter">
          {setterBlocks.length > 0 ? (
            setterBlocks.map(block => (
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
            <div className={css.noBlocks_message}>No setter blocks created yet</div>
          )}
        </div>
      </div>

      {/* Creator blocks section */}
      <div className={css.customBlocks_section} data-testid="section-creator">
        <div className={css.customBlocks_new}>
          <div className={css.customBlocks_newHeading}>
            <h5>Create Things Blocks</h5>
            <button data-testid="add-creator" onClick={() => {
              setEditingBlock(null);
              setShowForm(showForm === "creator" ? null : "creator");
            }}>
              {showForm === "creator" ? "Cancel" : "Add Block"}
            </button>
          </div>
          {showForm === "creator" && (
            <CustomBlockForm
              blockType="creator"
              editingBlock={editingBlock}
              existingBlocks={customBlocks}
              toolbox={toolbox}
              onSubmit={handleFormSubmit}
            />
          )}
        </div>
        <div className={css.customBlocks_current} data-testid="current-creator">
          {creatorBlocks.length > 0 ? (
            creatorBlocks.map(block => (
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
            <div className={css.noBlocks_message}>No creator blocks created yet</div>
          )}
        </div>
      </div>

      {/* Action blocks section */}
      <div className={css.customBlocks_section} data-testid="section-action">
        <div className={css.customBlocks_new}>
          <div className={css.customBlocks_newHeading}>
            <h5>Action Blocks</h5>
            <button data-testid="add-action" onClick={() => {
              setEditingBlock(null);
              setShowForm(showForm === "action" ? null : "action");
            }}>
              {showForm === "action" ? "Cancel" : "Add Block"}
            </button>
          </div>
          {showForm === "action" && (
            <CustomBlockForm
              blockType="action"
              editingBlock={editingBlock}
              existingBlocks={customBlocks}
              toolbox={toolbox}
              onSubmit={handleFormSubmit}
            />
          )}
        </div>
        <div className={css.customBlocks_current} data-testid="current-action">
          {actionBlocks.length > 0 ? (
            actionBlocks.map(block => (
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
            <div className={css.noBlocks_message}>No action blocks created yet</div>
          )}
        </div>
      </div>

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
