import {
  IRuntimeQuestionComponentProps
} from "@concord-consortium/question-interactives-helpers/src/components/base-question-app";
import { log } from "@concord-consortium/lara-interactive-api";
import { Events, inject, serialization, WorkspaceSvg } from "blockly";
import { javascriptGenerator } from "blockly/javascript";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { registerCustomBlocks } from "../blocks/block-factory";
import "../blocks/block-registration";
import { injectCustomBlocksIntoToolbox } from "../utils/toolbox-utils";
import { IAuthoredState, IInteractiveState } from "./types";
import { FileModal, Header } from "./header";
import { MaybeFileModal } from "./maybe-file-modal";

import css from "./blockly.scss";

interface IProps extends IRuntimeQuestionComponentProps<IAuthoredState, IInteractiveState> {}

// Save when any of these events occur
const saveEvents: string[] = [Events.BLOCK_CREATE, Events.BLOCK_DELETE, Events.BLOCK_CHANGE, Events.BLOCK_MOVE];

export const BlocklyComponent: React.FC<IProps> = ({ authoredState, interactiveState, setInteractiveState, report }) => {
  const { customBlocks = [], simulationCode, toolbox } = authoredState;
  const safeCustomBlocks = useMemo(() => {
    return Array.isArray(customBlocks) ? customBlocks : [];
  }, [customBlocks]);
  const [savedBlocklyStates, setSavedBlocklyStates] = useState(interactiveState?.savedBlocklyStates ?? []);
  const modelNames = useMemo(() => savedBlocklyStates.map(s => s.name), [savedBlocklyStates]);
  const [name, setName] = useState(interactiveState?.name ?? "Model 1");
  const [error, setError] = useState<Error | null>(null);
  const blocklyDivRef = useRef<HTMLDivElement>(null);
  const workspaceRef = useRef<WorkspaceSvg | null>(null);
  const hasLoadedRef = useRef(false);
  const [fileModal, setFileModal] = useState<FileModal>(undefined);

  const getWorkspaceCodeAndState = useCallback(() => {
    if (!workspaceRef.current) {
      return {code: "", blocklyState: ""};
    }

    const state = serialization.workspaces.save(workspaceRef.current);
    const blocklyCode = javascriptGenerator.workspaceToCode(workspaceRef.current);
    const code = `${simulationCode}\n\n${blocklyCode}`;

    return {
      code,
      blocklyState: JSON.stringify(state),
    };
  }, [simulationCode]);

  const initWorkspace = useCallback(() => {
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
        workspaceRef.current = newWorkspace;
        setError(null);

        // Blocks not connected to top-level blocks (e.g., setup, go) should be disabled.
        newWorkspace.addChangeListener(Events.disableOrphans);

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
            const {code, blocklyState} = getWorkspaceCodeAndState();
            setInteractiveState?.((prevState: IInteractiveState) => {
              const newState = {
                ...prevState,
                code,
                blocklyState
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
  }, [getWorkspaceCodeAndState, report, safeCustomBlocks, setInteractiveState, toolbox]);

  useEffect(() => {
    initWorkspace();
  }, [initWorkspace]);

  const loadWorkspaceState = (state: string) => {
    if (!workspaceRef.current) {
      return;
    }

    try {
      serialization.workspaces.load(JSON.parse(state), workspaceRef.current);
    } catch (loadError) {
      if (loadError instanceof Error && loadError.message.includes("Invalid block definition")) {
        console.warn("Invalid block definition error - likely due to deleted custom blocks:", loadError);
        setError(new Error("Some blocks in your saved work are no longer available."));
      } else {
        throw loadError;
      }
    }
  };

  // Load saved state on initial load
  useEffect(() => {
    if (hasLoadedRef.current || !workspaceRef.current) {
      return;
    }
    hasLoadedRef.current = true;

    if (interactiveState?.blocklyState) {
      loadWorkspaceState(interactiveState.blocklyState);
    }
    if (interactiveState?.name) {
      setName(interactiveState.name);
    }
  }, [interactiveState]);

  const validateModelName = useCallback((newName: string, { renaming, opening } = { renaming: false, opening: false }): boolean => {
    if (newName.length === 0) {
      alert("Please enter a valid model name.");
      return false;
    }

    if (renaming && newName === name) {
      return true;
    }

    if (!opening && modelNames.indexOf(newName) !== -1) {
      alert(`A model named "${newName}" already exists. Please choose a different name.`);
      return false;
    }

    return true;
  }, [modelNames, name]);

  const ensureUpdatedSavedBlocklyStates = useCallback(() => {
    let updatedSavedBlocklyStates = [...savedBlocklyStates];
    const { blocklyState } = getWorkspaceCodeAndState();
    const savedBlocklyStateIndex = savedBlocklyStates.findIndex(s => s.name === name);
    if (savedBlocklyStateIndex !== -1) {
      updatedSavedBlocklyStates = savedBlocklyStates.map((s, index) => {
        if (index === savedBlocklyStateIndex) {
          return { name, blocklyState };
        }
        return s;
      });
    } else {
      updatedSavedBlocklyStates.push({ name, blocklyState });
    }
    return updatedSavedBlocklyStates;
  }, [getWorkspaceCodeAndState, name, savedBlocklyStates]);

  const handleFileNew = useCallback((newName: string): boolean => {
    if (!validateModelName(newName)) {
      return false;
    }

    const updatedSavedBlocklyStates = ensureUpdatedSavedBlocklyStates();
    initWorkspace();
    if (!workspaceRef.current) {
      alert("Workspace is not initialized.");
      return false;
    }
    const {code, blocklyState} = getWorkspaceCodeAndState();

    const newBlocklyStates = [...updatedSavedBlocklyStates, { name: newName, blocklyState }];
    setSavedBlocklyStates(newBlocklyStates);

    setName(newName);
    setInteractiveState?.((prevState: IInteractiveState) => {
      const newState = {
        ...prevState,
        name: newName,
        code,
        blocklyState,
        savedBlocklyStates: newBlocklyStates
      };
      return newState;
    });

    return true;
  }, [validateModelName, ensureUpdatedSavedBlocklyStates, initWorkspace, getWorkspaceCodeAndState, setInteractiveState]);

  const handleFileOpen = useCallback((selectedName: string): boolean => {
    if (!validateModelName(selectedName, { opening: true })) {
      return false;
    }

    const newWorkspaceState = savedBlocklyStates.find(s => s.name === selectedName);
    if (!newWorkspaceState) {
      alert(`Could not find saved state for model "${selectedName}".`);
      return false;
    }

    const updatedSavedBlocklyStates = ensureUpdatedSavedBlocklyStates();
    initWorkspace();
    if (!workspaceRef.current) {
      alert("Workspace is not initialized.");
      return false;
    }
    loadWorkspaceState(newWorkspaceState.blocklyState);

    const {code, blocklyState} = getWorkspaceCodeAndState();
    setSavedBlocklyStates(updatedSavedBlocklyStates);

    setName(selectedName);
    setInteractiveState?.((prevState: IInteractiveState) => {
      const newState = {
        ...prevState,
        name: selectedName,
        code,
        blocklyState,
        savedBlocklyStates: updatedSavedBlocklyStates
      };
      return newState;
    });

    return true;
  }, [validateModelName, savedBlocklyStates, ensureUpdatedSavedBlocklyStates, initWorkspace, getWorkspaceCodeAndState, setInteractiveState]);

  const handleFileCopy = useCallback((newName: string): boolean => {
    if (!validateModelName(newName)) {
      return false;
    }

    // get the current workspace state to save as the copied model
    const {blocklyState} = getWorkspaceCodeAndState();
    const updatedSavedBlocklyStates = ensureUpdatedSavedBlocklyStates();
    const newBlocklyStates = [...updatedSavedBlocklyStates, { name: newName, blocklyState }];
    setSavedBlocklyStates(newBlocklyStates);

    setName(newName);
    setInteractiveState?.((prevState: IInteractiveState) => {
      const newState = {
        ...prevState,
        name: newName,
        savedBlocklyStates: newBlocklyStates
      };
      return newState;
    });

    return true;
  }, [validateModelName, ensureUpdatedSavedBlocklyStates, getWorkspaceCodeAndState, setInteractiveState]);

  const handleFileRename = useCallback((newName: string): boolean => {
    if (!validateModelName(newName, { renaming: true })) {
      return false;
    }

    const updatedSavedBlocklyStates = ensureUpdatedSavedBlocklyStates()
      .map(s => {
        if (s.name === name) {
          return { name: newName, blocklyState: s.blocklyState };
        }
        return s;
      });
    setSavedBlocklyStates(updatedSavedBlocklyStates);

    setName(newName);
    setInteractiveState?.((prevState: IInteractiveState) => {
      const newState = {
        ...prevState,
        name: newName,
        savedBlocklyStates: updatedSavedBlocklyStates
      };
      return newState;
    });

    return true;
  }, [ensureUpdatedSavedBlocklyStates, name, setInteractiveState, validateModelName]);

  const handleFileDelete = useCallback(() => {
    let updatedSavedBlocklyStates = ensureUpdatedSavedBlocklyStates();
    const savedBlocklyStateIndex = updatedSavedBlocklyStates.findIndex(s => s.name === name);

    if (savedBlocklyStateIndex !== -1) {
      updatedSavedBlocklyStates = updatedSavedBlocklyStates.filter((s, index) => index !== savedBlocklyStateIndex);
    }
    const newSavedBlocklyStateIndex = Math.min(savedBlocklyStateIndex, updatedSavedBlocklyStates.length - 1);

    const newBlocklyState = updatedSavedBlocklyStates[newSavedBlocklyStateIndex];

    if (newBlocklyState) {
      handleFileOpen(newBlocklyState.name);
    } else {
      initWorkspace();
      if (!workspaceRef.current) {
        alert("Workspace is not initialized.");
        return false;
      }
      const {code, blocklyState} = getWorkspaceCodeAndState();

      const newName = "Model 1";
      const newBlocklyStates = [...updatedSavedBlocklyStates, { name: newName, blocklyState }];
      setSavedBlocklyStates(newBlocklyStates);

      setName(newName);
      setInteractiveState?.((prevState: IInteractiveState) => {
        const newState = {
          ...prevState,
          name: newName,
          code,
          blocklyState,
          savedBlocklyStates: newBlocklyStates
        };
        return newState;
      });
    }

    setSavedBlocklyStates(updatedSavedBlocklyStates);

    return true;
  }, [ensureUpdatedSavedBlocklyStates, getWorkspaceCodeAndState, handleFileOpen, initWorkspace, name, setInteractiveState]);

  return (
    <div className={css.blockly}>
      {error && <div className={css.error}>Error loading Blockly: {error.message}</div>}

      <Header name={name} savedStates={savedBlocklyStates} onShowFileModal={setFileModal} />

      <div className={css.blocklyDiv} ref={blocklyDivRef}></div>

      <MaybeFileModal
        name={name}
        fileModal={fileModal}
        setFileModal={setFileModal}
        savedBlocklyStates={savedBlocklyStates}
        handleFileNew={handleFileNew}
        handleFileOpen={handleFileOpen}
        handleFileCopy={handleFileCopy}
        handleFileRename={handleFileRename}
        handleFileDelete={handleFileDelete}
      />
    </div>
  );
};
