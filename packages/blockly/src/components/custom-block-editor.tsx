import React, { useEffect, useState } from "react";

import { validateBlocksJson } from "../utils/block-utils";
import { CustomBlockEditorSection } from "./custom-block-editor-section";
import { CustomBlockType, ICustomBlock } from "./types";

import css from "./custom-block-editor.scss";

interface IProps {
  toolbox: string;
  value: ICustomBlock[];
  onChange: (blocks: ICustomBlock[]) => void;
}

export const CustomBlockEditor: React.FC<IProps> = ({ value, onChange, toolbox }) => {
  const customBlocks = Array.isArray(value) ? value : [];
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

  // List of all block types to render sections for each block type in desired order.
  // If the desired order changes or isn't necessary, we may be able to use `VALID_BLOCK_TYPES` from `types.ts` instead
  // and avoid duplicating the list here.
  const blockTypes: CustomBlockType[] = [
    "setter",
    "creator",
    "action",
    "statement",
    "condition"
  ];

  return (
    <div className={css.customBlockEditor} data-testid="custom-block-editor">
      <h4>Custom Blocks</h4>

      {blockTypes.map(type => (
        <CustomBlockEditorSection
          key={type}
          blockType={type}
          toolbox={toolbox}
          customBlocks={customBlocks}
          onChange={onChange}
        />
      ))}

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
