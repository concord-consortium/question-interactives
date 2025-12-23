import { Events, inject, serialization } from "blockly";
import React, { useEffect, useRef, useState } from "react";

import { registerCustomBlocks } from "../blocks/block-factory";
import { injectCustomBlocksIntoToolbox } from "../utils/toolbox-utils";
import { ICustomBlock } from "./types";

import css from "./custom-block-form-nested-blocks.scss";

// Update when any of these events occur
const saveEvents: string[] = [Events.BLOCK_CREATE, Events.BLOCK_DELETE, Events.BLOCK_CHANGE, Events.BLOCK_MOVE];

interface IProps {
  childBlocksTemplate?: serialization.blocks.State;
  existingBlocks?: ICustomBlock[];
  onChangeTemplate: (childBlocksTemplate?: serialization.blocks.State) => void;
  toolbox: string;
}

export const CustomBlockFormNestedBlocks: React.FC<IProps> = ({
  childBlocksTemplate, existingBlocks, onChangeTemplate, toolbox
}) => {
  const childBlocksTemplateRef = useRef<serialization.blocks.State | undefined>(childBlocksTemplate);
  const childBlocksContainerRef = useRef<HTMLDivElement>(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (!(isEditing && childBlocksContainerRef.current)) return;

    childBlocksContainerRef.current.innerHTML = "";

    registerCustomBlocks(existingBlocks ?? [], false);

    // Inject custom blocks into toolbox based on their assigned categories
    const enhancedToolbox = injectCustomBlocksIntoToolbox(toolbox, existingBlocks ?? []);
    const newWorkspace = inject(childBlocksContainerRef.current, {
      readOnly: false, toolbox: JSON.parse(enhancedToolbox), trashcan: true
    });
    if (childBlocksTemplateRef.current) serialization.blocks.append(childBlocksTemplateRef.current, newWorkspace);

    // Set up automatic saving
    const saveState = (event: Events.Abstract) => {
      if (saveEvents.includes(event.type)) {
        const topBlock = newWorkspace.getTopBlocks(true)[0];
        const template = topBlock ? serialization.blocks.save(topBlock) : undefined;
        if (template) childBlocksTemplateRef.current = template;
      }
    };
    newWorkspace.addChangeListener(saveState);

    const childBlocksContainer = childBlocksContainerRef.current;
    return () => {
      newWorkspace.removeChangeListener(saveState);
      if (childBlocksContainer) childBlocksContainer.innerHTML = "";
    };
  }, [existingBlocks, isEditing, onChangeTemplate, toolbox]);

  const handleClick = () => {
    if (!isEditing) {
      setIsEditing(true);
    } else {
      onChangeTemplate(childBlocksTemplateRef.current);
      setIsEditing(false);
    }
  };

  return (
    <div className={css.nestedBlocks} data-testid="nested-blocks">
      <div className={css.nestedBlocks_header}>
        <h6>Child Blocks</h6>
      </div>

      <button className={css.nestedBlocks_editingButton} onClick={handleClick}>
        {isEditing ? "Save Child Blocks" : "Edit Child Blocks"}
      </button>

      <div className={css.nestedBlocks_container} ref={childBlocksContainerRef} />
    </div>
  );
};

