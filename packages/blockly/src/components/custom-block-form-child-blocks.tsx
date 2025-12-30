import { Events, inject, serialization } from "blockly";
import classNames from "classnames";
import React, { MutableRefObject, useEffect, useRef, useState } from "react";

import { registerCustomBlocks } from "../blocks/block-factory";
import { saveEvents, stateContainsType } from "../utils/block-utils";
import { injectCustomBlocksIntoToolbox } from "../utils/toolbox-utils";
import { ICustomBlock } from "./types";

import css from "./custom-block-form-child-blocks.scss";

interface IProps {
  childBlocksRef: MutableRefObject<serialization.blocks.State | undefined>;
  editingBlock?: ICustomBlock | null;
  existingBlocks?: ICustomBlock[];
  setHasChange: (hasChange: boolean) => void;
  toolbox: string;
}

export const CustomBlockFormChildBlocks = ({
  childBlocksRef, editingBlock, existingBlocks, setHasChange, toolbox
}: IProps) => {
  const childBlocks = editingBlock?.config.defaultChildBlocks;
  const childBlocksContainerRef = useRef<HTMLDivElement>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Set up Blockly workspace for editing child blocks
  useEffect(() => {
    if (!(isEditing && childBlocksContainerRef.current)) return;

    childBlocksContainerRef.current.innerHTML = "";

    // Do not include blocks that would enable cycles
    const safeBlocks = (existingBlocks ?? []).filter(block => {
      if (!editingBlock) return true;
      if (block.id === editingBlock.id) return false;
      if (block.config.defaultChildBlocks && stateContainsType(block.config.defaultChildBlocks, editingBlock.id)) {
        return false;
      }
      return true;
    });
    registerCustomBlocks(safeBlocks, false);

    // Inject custom blocks into toolbox based on their assigned categories
    const enhancedToolbox = injectCustomBlocksIntoToolbox(toolbox, safeBlocks);
    const newWorkspace = inject(childBlocksContainerRef.current, {
      readOnly: false, toolbox: JSON.parse(enhancedToolbox), trashcan: true
    });

    // Add the current template to the workspace and render it
    if (childBlocks) serialization.blocks.append(childBlocks, newWorkspace);
    newWorkspace.render();

    // Set up saving changes
    const saveState = (event: Events.Abstract) => {
      if (saveEvents.includes(event.type)) {
        const topBlock = newWorkspace.getTopBlocks(true)[0];
        const template = topBlock ? serialization.blocks.save(topBlock) : undefined;
        if (template) {
          if (childBlocksRef.current &&
            JSON.stringify(childBlocksRef.current) !== JSON.stringify(template)) {
            setHasChange(true);
          }
          childBlocksRef.current = template;
        }
      }
    };
    newWorkspace.addChangeListener(saveState);

    const childBlocksContainer = childBlocksContainerRef.current;
    return () => {
      newWorkspace.removeChangeListener(saveState);
      if (childBlocksContainer) childBlocksContainer.innerHTML = "";
    };
  }, [childBlocks, childBlocksRef, editingBlock, existingBlocks, isEditing, setHasChange, toolbox]);

  const handleButtonClick = () => {
    if (!isEditing) {
      setIsEditing(true);
    }
  };

  const containerClassName = classNames({ [css.childBlocks_container]: isEditing });

  return (
    <div className={css.childBlocks} data-testid="child-blocks">
      <div className={css.childBlocks_headerContainer}>
        <div className={css.childBlocks_header}>
          <h6>Child Blocks</h6>
        </div>
        {!isEditing && (
          <button onClick={handleButtonClick}>
            Edit Child Blocks
          </button>
        )}
      </div>

      <div className={containerClassName} ref={childBlocksContainerRef} />
    </div>
  );
};
