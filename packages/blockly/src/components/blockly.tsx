import {
  IRuntimeQuestionComponentProps
} from "@concord-consortium/question-interactives-helpers/src/components/base-question-app";
import { log } from "@concord-consortium/lara-interactive-api";
import { Events, inject, serialization, WorkspaceSvg } from "blockly";
import { javascriptGenerator } from "blockly/javascript";
import React, { useEffect, useMemo, useRef, useState } from "react";

import { registerCustomBlocks } from "../blocks/block-factory";
import "../blocks/block-registration";
import { injectCustomBlocksIntoToolbox } from "../utils/toolbox-utils";
import { IAuthoredState, IInteractiveState } from "./types";

import css from "./blockly.scss";

interface IProps extends IRuntimeQuestionComponentProps<IAuthoredState, IInteractiveState> {}

// Save when any of these events occur
const saveEvents: string[] = [Events.BLOCK_CREATE, Events.BLOCK_DELETE, Events.BLOCK_CHANGE, Events.BLOCK_MOVE];

export const BlocklyComponent: React.FC<IProps> = ({ authoredState, interactiveState, setInteractiveState, report }) => {
  const { customBlocks = [], simulationCode, toolbox } = authoredState;
  const safeCustomBlocks = useMemo(() => {
    return Array.isArray(customBlocks) ? customBlocks : [];
  }, [customBlocks]);
  const { blocklyState } = interactiveState ?? {};
  const [error, setError] = useState<Error | null>(null);
  const blocklyDivRef = useRef<HTMLDivElement>(null);
  const [workspace, setWorkspace] = useState<WorkspaceSvg | null>(null);
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    if (!toolbox) {
      setError(new Error("Enter a toolbox configuration to see Blockly."));
      return;
    }

    if (blocklyDivRef.current) {
      // Empty existing container before creating a new workspace to avoid duplication.
      blocklyDivRef.current.innerHTML = "";

      registerCustomBlocks(safeCustomBlocks);

      const initialBlocks = [
        { deletable: false, type: "setup", x: 10, y: 10 },
        { deletable: false, type: "go", x: 10, y: 80 },
        { deletable: false, type: "onclick", x: 10, y: 150 }
      ];

      try {
        // Inject custom blocks into toolbox based on their assigned categories
        const enhancedToolbox = injectCustomBlocksIntoToolbox(toolbox, safeCustomBlocks);
        const newWorkspace = inject(blocklyDivRef.current, {
          readOnly: report, toolbox: JSON.parse(enhancedToolbox), trashcan: true
        });
        initialBlocks.forEach(block => {
          serialization.blocks.append(block, newWorkspace);
        });
        setWorkspace(newWorkspace);
        setError(null);

        // Log all changes to the workspace
        newWorkspace.addChangeListener((event) => {
          const eventName = `blockly-${event.type}`;

          try {
            // create a shallow copy so we can delete attributes without modifying the original event
            // and having TypeScript complain as the attributes are required on the event type
            const dupEvent: any = { ...event };
            delete dupEvent.type;
            delete dupEvent.workspaceId;

            // the blocks array can contain circular references, so we need to handle it specially
            const eventParams = JSON.parse(JSON.stringify(dupEvent, (key, value) => {
              if ((key === "blocks") && Array.isArray(value)) {
                return value.map((item) => {
                  if (item && typeof item === "object") {
                    const { id, type } = item as { id?: unknown; type?: unknown };
                    return { ...(id !== undefined && { id }), ...(type !== undefined && { type }) };
                  }
                  return item;
                });
              }
              return value;
            }));

            log(eventName, eventParams);
          } catch (e) {
            console.error("Error stringifying blockly change event for logging:", e);
            log(eventName, { error: e.message || String(e) });
          }
        });

        // Set up automatic saving
        const saveState = (event: Events.Abstract) => {
          if (saveEvents.includes(event.type)) {
            const state = serialization.workspaces.save(newWorkspace);
            const blocklyCode = javascriptGenerator.workspaceToCode(newWorkspace);
            const code = `${simulationCode}\n\n${blocklyCode}`;
            setInteractiveState?.((prevState: IInteractiveState) => {
              const newState = {
                ...prevState,
                code,
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
  }, [report, safeCustomBlocks, setInteractiveState, simulationCode, toolbox]);

  // Load saved state on initial load
  useEffect(() => {
    if (hasLoadedRef.current || !workspace) return;
    hasLoadedRef.current = true;

    if (blocklyState) {
      try {
        serialization.workspaces.load(JSON.parse(blocklyState), workspace);
      } catch (loadError) {
        if (loadError instanceof Error && loadError.message.includes("Invalid block definition")) {
          console.warn("Invalid block definition error - likely due to deleted custom blocks:", loadError);
          setError(new Error("Some blocks in your saved work are no longer available."));
        } else {
          throw loadError;
        }
      }
    }
  }, [blocklyState, workspace]);

  return (
    <div className={css.blockly}>
      {error && <div className={css.error}>Error loading Blockly: {error.message}</div>}
      <div className={css.blocklyDiv} ref={blocklyDivRef}></div>
    </div>
  );
};
