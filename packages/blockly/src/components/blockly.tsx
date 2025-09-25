import { IRuntimeQuestionComponentProps } from "@concord-consortium/question-interactives-helpers/src/components/base-question-app";
import { Events, inject, serialization, WorkspaceSvg } from "blockly";
import React, { useEffect, useMemo, useRef, useState } from "react";

import { registerCustomBlocks } from "../blocks/block-factory";
import "../blocks/block-registration";
import { IAuthoredState, IInteractiveState } from "./types";

import css from "./blockly.scss";

interface IProps extends IRuntimeQuestionComponentProps<IAuthoredState, IInteractiveState> {}

// Save when any of these events occur
const saveEvents: string[] = [Events.BLOCK_CREATE, Events.BLOCK_DELETE, Events.BLOCK_CHANGE, Events.BLOCK_MOVE];

export const BlocklyComponent: React.FC<IProps> = ({ authoredState, interactiveState, setInteractiveState, report }) => {
  const { customBlocks = [], toolbox } = authoredState;
  
  // Ensure customBlocks is always an array
  // Handle both direct array and nested object structure
  const safeCustomBlocks = useMemo(() => {
    if (Array.isArray(customBlocks)) {
      return customBlocks;
    }
    if (customBlocks && typeof customBlocks === 'object' && 'customBlocks' in customBlocks && Array.isArray((customBlocks as any).customBlocks)) {
      return (customBlocks as any).customBlocks;
    }
    return [];
  }, [customBlocks]);
  const { blocklyState } = interactiveState ?? {};
  const [error, setError] = useState<Error | null>(null);
  const blocklyDivRef = useRef<HTMLDivElement>(null);
  const [workspace, setWorkspace] = useState<WorkspaceSvg | null>(null);
  const hasLoadedRef = useRef(false);

  console.log("authoredState", authoredState);
  console.log("customBlocks", customBlocks);

  useEffect(() => {
    if (!toolbox) {
      setError(new Error("Enter a toolbox configuration to see Blockly."));
      return;
    }

    if (blocklyDivRef.current) {
      // Empty existing container before creating a new workspace to avoid duplication.
      // TODO: Find a better way to do this?
      blocklyDivRef.current.innerHTML = "";

      registerCustomBlocks(safeCustomBlocks);

      const initialBlocks = [
        { deletable: false, type: "setup", x: 10, y: 10 },
        { deletable: false, type: "go", x: 10, y: 80 },
        { deletable: false, type: "onclick", x: 10, y: 150 }
      ];

      try {
        const newWorkspace = inject(blocklyDivRef.current, { readOnly: report, toolbox: JSON.parse(toolbox) });
        initialBlocks.forEach(block => {
          serialization.blocks.append(block, newWorkspace);
        });
        setWorkspace(newWorkspace);
        setError(null);

        // Set up automatic saving
        const saveState = (event: Events.Abstract) => {
          if (saveEvents.includes(event.type)) {
            const state = serialization.workspaces.save(newWorkspace);
            setInteractiveState?.((prevState: IInteractiveState) => {
              const newState = {
                ...prevState,
                blocklyState: JSON.stringify(state)
              };
              return newState;
            });
          }
        };
        newWorkspace.addChangeListener(saveState);

        return () => newWorkspace.removeChangeListener(saveState);
      } catch (e) {
        setError(e);
      }
    }
  }, [safeCustomBlocks, report, setInteractiveState, toolbox]);

  // Load saved state on initial load
  useEffect(() => {
    if (hasLoadedRef.current || !workspace) return;
    hasLoadedRef.current = true;

    if (blocklyState) serialization.workspaces.load(JSON.parse(blocklyState), workspace);
  }, [blocklyState, workspace]);

  return (
    <div className={css.blockly}>
      {error && <div className={css.error}>Error loading Blockly: {error.message}</div>}
      <div className={css.blocklyDiv} ref={blocklyDivRef}></div>
    </div>
  );
};
