import { Events, inject, serialization } from "blockly";
import classNames from "classnames";
import React, { useEffect, useRef, useState } from "react";

import { registerCustomBlocks } from "../blocks/block-factory";
import { stateContainsType } from "../utils/block-utils";
import { injectCustomBlocksIntoToolbox } from "../utils/toolbox-utils";
import { ICustomBlock } from "./types";

import css from "./custom-block-form-child-blocks.scss";

// Update when any of these events occur
const saveEvents: string[] = [Events.BLOCK_CREATE, Events.BLOCK_DELETE, Events.BLOCK_CHANGE, Events.BLOCK_MOVE];

interface IProps {
  childBlocks?: serialization.blocks.State;
  editingBlock?: ICustomBlock | null;
  existingBlocks?: ICustomBlock[];
  onChange: (childBlocksTemplate?: serialization.blocks.State) => void;
  toolbox: string;
}

export const CustomBlockFormChildBlocks = ({
  childBlocks, editingBlock, existingBlocks, onChange, toolbox
}: IProps) => {
  const childBlocksRef = useRef<serialization.blocks.State | undefined>(childBlocks);
  const childBlocksContainerRef = useRef<HTMLDivElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [hasChange, setHasChange] = useState(false);

  // Set up Blockly workspace for editing child blocks
  useEffect(() => {
    if (!(isEditing && childBlocksContainerRef.current)) return;

    childBlocksContainerRef.current.innerHTML = "";

    // Prevent cycles
    const safeBlocks = (existingBlocks ?? []).filter(block => {
      if (!editingBlock) return true;
      if (block.id === editingBlock.id) return false;
      if (block.config.childBlocksTemplate && stateContainsType(block.config.childBlocksTemplate, editingBlock.id)) {
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
  }, [childBlocks,editingBlock, existingBlocks, isEditing, onChange, toolbox]);

  const handleClick = () => {
    if (!isEditing) {
      setIsEditing(true);
    } else {
      onChange(childBlocksRef.current);
      setIsEditing(false);
      setHasChange(false);
    }
  };

  const containerClassName = classNames({ [css.childBlocks_container]: isEditing });
  const buttonClassName = classNames({ [css.childBlocks_changeWarning]: hasChange });

  return (
    <div className={css.childBlocks} data-testid="child-blocks">
      <div className={css.childBlocks_headerContainer}>
        <div className={css.childBlocks_header}>
          <h6>Child Blocks</h6>
        </div>
        <button className={buttonClassName} onClick={handleClick}>
          {isEditing ? "Save Child Blocks" : "Edit Child Blocks"}
        </button>
      </div>

      <div className={containerClassName} ref={childBlocksContainerRef} />
    </div>
  );
};
