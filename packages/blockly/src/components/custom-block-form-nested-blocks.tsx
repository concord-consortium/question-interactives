import { Events, inject, serialization } from "blockly";
import classNames from "classnames";
import React, { useEffect, useRef, useState } from "react";

import { registerCustomBlocks } from "../blocks/block-factory";
import { stateContainsType } from "../utils/block-utils";
import { injectCustomBlocksIntoToolbox } from "../utils/toolbox-utils";
import { ICustomBlock } from "./types";

import css from "./custom-block-form-nested-blocks.scss";

// Update when any of these events occur
const saveEvents: string[] = [Events.BLOCK_CREATE, Events.BLOCK_DELETE, Events.BLOCK_CHANGE, Events.BLOCK_MOVE];

interface IProps {
  childBlocksTemplate?: serialization.blocks.State;
  editingBlock?: ICustomBlock | null;
  existingBlocks?: ICustomBlock[];
  onChangeTemplate: (childBlocksTemplate?: serialization.blocks.State) => void;
  toolbox: string;
}

export const CustomBlockFormNestedBlocks: React.FC<IProps> = ({
  childBlocksTemplate, editingBlock, existingBlocks, onChangeTemplate, toolbox
}) => {
  const childBlocksTemplateRef = useRef<serialization.blocks.State | undefined>(childBlocksTemplate);
  const childBlocksContainerRef = useRef<HTMLDivElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [hasChange, setHasChange] = useState(false);

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
    if (childBlocksTemplate) serialization.blocks.append(childBlocksTemplate, newWorkspace);
    newWorkspace.render();

    // Set up saving changes
    const saveState = (event: Events.Abstract) => {
      if (saveEvents.includes(event.type)) {
        const topBlock = newWorkspace.getTopBlocks(true)[0];
        const template = topBlock ? serialization.blocks.save(topBlock) : undefined;
        if (template) {
          if (childBlocksTemplateRef.current &&
            JSON.stringify(childBlocksTemplateRef.current) !== JSON.stringify(template)) {
            setHasChange(true);
          }
          childBlocksTemplateRef.current = template;
        }
      }
    };
    newWorkspace.addChangeListener(saveState);

    const childBlocksContainer = childBlocksContainerRef.current;
    return () => {
      newWorkspace.removeChangeListener(saveState);
      if (childBlocksContainer) childBlocksContainer.innerHTML = "";
    };
  }, [childBlocksTemplate,editingBlock, existingBlocks, isEditing, onChangeTemplate, toolbox]);

  const handleClick = () => {
    if (!isEditing) {
      setIsEditing(true);
    } else {
      onChangeTemplate(childBlocksTemplateRef.current);
      setIsEditing(false);
      setHasChange(false);
    }
  };

  const containerClassName = classNames({ [css.nestedBlocks_container]: isEditing });
  const buttonClassName = classNames({ [css.nestedBlocks_changeWarning]: hasChange });

  return (
    <div className={css.nestedBlocks} data-testid="nested-blocks">
      <div className={css.nestedBlocks_headerContainer}>
        <div className={css.nestedBlocks_header}>
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

