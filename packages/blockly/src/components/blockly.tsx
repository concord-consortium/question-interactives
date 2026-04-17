import {
  IRuntimeQuestionComponentProps
} from "@concord-consortium/question-interactives-helpers/src/components/base-question-app";
import { log } from "@concord-consortium/lara-interactive-api";
import { Events, inject, serialization, WorkspaceSvg } from "blockly";
import { javascriptGenerator } from "blockly/javascript";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { registerCustomBlocks } from "../blocks/block-factory";
import "../blocks/block-registration";
import { saveEvents } from "../utils/block-utils";
import { hasAuthoredStarterContent, parseStarterProgram } from "../utils/starter-utils";
import { injectCustomBlocksIntoToolbox } from "../utils/toolbox-utils";
import { IAuthoredState, IInteractiveState, INITIAL_SEED_BLOCKS, SEED_BLOCK_TYPES } from "./types";
import { FileModal, Header } from "./header";
import { MaybeFileModal } from "./maybe-file-modal";

import css from "./blockly.scss";

interface IProps extends IRuntimeQuestionComponentProps<IAuthoredState, IInteractiveState> {}

const DEFAULT_INTERACTIVE_STATE: IInteractiveState = { answerType: "interactive_state" };

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

      try {
        // Inject custom blocks into toolbox based on their assigned categories
        const enhancedToolbox = injectCustomBlocksIntoToolbox(toolbox, safeCustomBlocks);
        const newWorkspace = inject(blocklyDivRef.current, {
          readOnly: report, toolbox: JSON.parse(enhancedToolbox), trashcan: true
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
            log(eventName, { error: (e instanceof Error ? e.message : String(e)) });
          }
        });

        // Set up automatic saving
        const saveState = (event: Events.Abstract) => {
          if (report) return;
          if (saveEvents.includes(event.type)) {
            const {code, blocklyState} = getWorkspaceCodeAndState();
            setInteractiveState?.((prevState: IInteractiveState | null) => {
              const newState = {
                ...(prevState ?? DEFAULT_INTERACTIVE_STATE),
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
        setError(e instanceof Error ? e : new Error(String(e)));
      }
    }
  }, [getWorkspaceCodeAndState, report, safeCustomBlocks, setInteractiveState, toolbox]);

  const starterProgram = useMemo(
    () => parseStarterProgram(authoredState.starterBlocklyState),
    [authoredState.starterBlocklyState]
  );

  const seedWorkspace = useCallback(() => {
    const ws = workspaceRef.current;
    if (!ws) return;
    let loaded = false;
    if (hasAuthoredStarterContent(starterProgram)) {
      try {
        serialization.workspaces.load(starterProgram, ws);
        loaded = true;
      } catch (e) {
        console.warn("Failed to load authored starter program. Falling back to seed blocks only:", e);
      }
    }
    if (!loaded) {
      INITIAL_SEED_BLOCKS.forEach(b => serialization.blocks.append(b, ws));
    }
    ws.render();
    // Ensure the three seed blocks remain non-deletable regardless of how Blockly round-trips the deletable flag.
    ws.getTopBlocks(false).forEach(b => {
      if ((SEED_BLOCK_TYPES as readonly string[]).includes(b.type)) b.setDeletable(false);
    });
  }, [starterProgram]);

  const loadWorkspaceState = (state: string) => {
    if (!workspaceRef.current) {
      return;
    }

    try {
      serialization.workspaces.load(JSON.parse(state), workspaceRef.current);
      workspaceRef.current.render();
    } catch (loadError) {
      if (loadError instanceof Error && loadError.message.includes("Invalid block definition")) {
        console.warn("Invalid block definition error - likely due to deleted custom blocks:", loadError);
        setError(new Error("Some blocks in your saved work are no longer available."));
      } else {
        throw loadError;
      }
    }
  };

  // Refs used by the re-init restore path so we don't need to add fast-changing values
  // (interactiveState, seedWorkspace) to the useEffect deps and cause churn.
  const interactiveStateRef = useRef(interactiveState);
  const seedWorkspaceRef = useRef(seedWorkspace);
  useEffect(() => { interactiveStateRef.current = interactiveState; });
  useEffect(() => { seedWorkspaceRef.current = seedWorkspace; });

  useEffect(() => {
    initWorkspace();
    // A re-init (caused by toolbox/customBlocks/report/simulationCode changing) leaves the
    // newly-created workspace empty. Restore its content so the save listener doesn't
    // persist blank state. First-load is handled by the dedicated effect below.
    if (hasLoadedRef.current && workspaceRef.current) {
      const savedState = interactiveStateRef.current?.blocklyState;
      if (savedState) {
        try {
          loadWorkspaceState(savedState);
        } catch (e) {
          console.warn("Failed to restore workspace state on re-init:", e);
        }
      } else {
        seedWorkspaceRef.current();
      }
    }
  }, [initWorkspace]);

  // Load saved state on initial load
  useEffect(() => {
    if (hasLoadedRef.current || !workspaceRef.current) {
      return;
    }
    hasLoadedRef.current = true;

    if (interactiveState?.blocklyState) {
      loadWorkspaceState(interactiveState.blocklyState);
    } else {
      seedWorkspace();
      if (!report && hasAuthoredStarterContent(starterProgram)) {
        // Persist the seeded starter so future loads follow the "has saved state" path.
        const { code, blocklyState } = getWorkspaceCodeAndState();
        setInteractiveState?.((prevState: IInteractiveState | null) => ({ ...(prevState ?? DEFAULT_INTERACTIVE_STATE), code, blocklyState }));
      }
    }
    if (interactiveState?.name) {
      setName(interactiveState.name);
    }
  }, [interactiveState, starterProgram, report, seedWorkspace, getWorkspaceCodeAndState, setInteractiveState]);

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
    seedWorkspace();
    const {code, blocklyState} = getWorkspaceCodeAndState();

    const newBlocklyStates = [...updatedSavedBlocklyStates, { name: newName, blocklyState }];
    setSavedBlocklyStates(newBlocklyStates);

    setName(newName);
    setInteractiveState?.((prevState: IInteractiveState | null) => {
      const newState = {
        ...(prevState ?? DEFAULT_INTERACTIVE_STATE),
        name: newName,
        code,
        blocklyState,
        savedBlocklyStates: newBlocklyStates
      };
      return newState;
    });

    return true;
  }, [validateModelName, ensureUpdatedSavedBlocklyStates, initWorkspace, seedWorkspace, getWorkspaceCodeAndState, setInteractiveState]);

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
    setInteractiveState?.((prevState: IInteractiveState | null) => {
      const newState = {
        ...(prevState ?? DEFAULT_INTERACTIVE_STATE),
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
    setInteractiveState?.((prevState: IInteractiveState | null) => {
      const newState = {
        ...(prevState ?? DEFAULT_INTERACTIVE_STATE),
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
    setInteractiveState?.((prevState: IInteractiveState | null) => {
      const newState = {
        ...(prevState ?? DEFAULT_INTERACTIVE_STATE),
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
      seedWorkspace();
      const {code, blocklyState} = getWorkspaceCodeAndState();

      const newName = "Model 1";
      const newBlocklyStates = [...updatedSavedBlocklyStates, { name: newName, blocklyState }];
      setSavedBlocklyStates(newBlocklyStates);

      setName(newName);
      setInteractiveState?.((prevState: IInteractiveState | null) => {
        const newState = {
          ...(prevState ?? DEFAULT_INTERACTIVE_STATE),
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
  }, [ensureUpdatedSavedBlocklyStates, getWorkspaceCodeAndState, handleFileOpen, initWorkspace, seedWorkspace, name, setInteractiveState]);

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
