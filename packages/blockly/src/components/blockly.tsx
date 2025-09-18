import { IRuntimeQuestionComponentProps } from "@concord-consortium/question-interactives-helpers/src/components/base-question-app";
import { Events, inject, serialization, WorkspaceSvg } from "blockly";
import React, { useEffect, useRef, useState } from "react";

import { IAuthoredState, IInteractiveState } from "./types";

import css from "./blockly.scss";

interface IProps extends IRuntimeQuestionComponentProps<IAuthoredState, IInteractiveState> {}

// Save when any of these events occur
const saveEvents: string[] = [Events.BLOCK_CREATE, Events.BLOCK_DELETE, Events.BLOCK_CHANGE, Events.BLOCK_MOVE];

export const BlocklyComponent: React.FC<IProps> = ({ authoredState, interactiveState, setInteractiveState, report }) => {
  const { toolbox } = authoredState;
  const { json } = interactiveState ?? {};
  const [error, setError] = useState<Error | null>(null);
  const blocklyDivRef = useRef<HTMLDivElement>(null);
  const [workspace, setWorkspace] = useState<WorkspaceSvg | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    if (!toolbox) {
      setError(new Error("Enter a toolbox configuration to see Blockly."));
      return;
    }

    if (blocklyDivRef.current) {
      try {
        const newWorkspace = inject(blocklyDivRef.current, { toolbox: JSON.parse(toolbox) });
        setWorkspace(newWorkspace);
        setError(null);

        // Set up automatic saving
        const saveState = (event: Events.Abstract) => {
          if (saveEvents.includes(event.type)) {
            const state = serialization.workspaces.save(newWorkspace);
            setInteractiveState?.((prevState: IInteractiveState) => {
              const newState = {
                ...prevState,
                json: JSON.stringify(state)
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
  }, [setInteractiveState, toolbox]);

  // Load saved state on initial load
  useEffect(() => {
    if (hasLoaded || !workspace) return;
    setHasLoaded(true);

    if (json) serialization.workspaces.load(JSON.parse(json), workspace);
  }, [hasLoaded, json, workspace]);

  return (
    <div className={css.blockly}>
      {error && <div className={css.error}>Error loading Blockly: {error.message}</div>}
      <div className={css.blocklyDiv} ref={blocklyDivRef}></div>
    </div>
  );
};
