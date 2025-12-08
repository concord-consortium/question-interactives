import * as AA from "@gjmcn/atomic-agents";
import * as AV from "@concord-consortium/atomic-agents-vis";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useObjectStorage, TypedObject } from "@concord-consortium/object-storage";

import {
  addLinkedInteractiveStateListener, removeLinkedInteractiveStateListener, log
} from "@concord-consortium/lara-interactive-api";
import {
  IRuntimeQuestionComponentProps
} from "@concord-consortium/question-interactives-helpers/src/components/base-question-app";
import {
  useLinkedInteractiveId
} from "@concord-consortium/question-interactives-helpers/src/hooks/use-linked-interactive-id";
import { SIM_SPEED_DEFAULT, ZOOM_ANIMATION_DURATION, ZOOM_DEFAULT, ZOOM_MAX, ZOOM_MIN, ZOOM_STEP } from "../constants";
import { AgentSimulation } from "../models/agent-simulation";
import { IAuthoredState, IInteractiveState, IRecording, IRecordings } from "./types";
import { ControlPanel } from "./control-panel";
import { Widgets } from "./widgets";
import { ZoomControls } from "./zoom-controls";
import { RecordingStrip } from "./recording-strip";
import { Modal } from "@concord-consortium/question-interactives-helpers/src/components/modal";

import ModelIcon from "../assets/model-icon.svg";
import ReturnToModelIcon from "../assets/return-to-model-icon.svg";
import RecordingIcon from "../assets/recording-icon.svg";
import DeleteRecordingIcon from "../assets/delete-recording-icon.svg";

import css from "./agent-simulation.scss";

const thumbnailSize = 34; // size of the recording thumbnail in pixels
const getThumbnail = (snapshot?: string): Promise<string | undefined> => {

  return new Promise<string | undefined>(resolve => {
    if (snapshot) {
      const thumbCanvas = document.createElement("canvas");
      thumbCanvas.width = thumbnailSize;
      thumbCanvas.height = thumbnailSize;
      const ctx = thumbCanvas.getContext("2d");
      if (ctx) {
        const img = new window.Image();
        img.onload = () => {
          ctx.drawImage(img, 0, 0, thumbnailSize, thumbnailSize);
          resolve(thumbCanvas.toDataURL("image/png"));
        };
        img.src = snapshot;
      } else {
        resolve(undefined);
      }
    } else {
      resolve(undefined);
    }
  });
};

const maxRecordingTime = 20 * 1000; // 20 seconds

interface IProps extends IRuntimeQuestionComponentProps<IAuthoredState, IInteractiveState> { }

export const AgentSimulationComponent = ({
  authoredState, interactiveState, setInteractiveState, report
}: IProps) => {
  const { code, gridHeight, gridStep, gridWidth } = authoredState;
  // The blockly code we're using, which doesn't get updated until the user accepts newer code
  const [blocklyCode, _setBlocklyCode] = useState<string>(interactiveState?.blocklyCode || "");
  const [recordings, _setRecordings] = useState<IRecordings>(interactiveState?.recordings || []);
  const [modelName, setModelName] = useState<string>(interactiveState?.name || "Model 1");
  const [externalModelName, setExternalModelName] = useState<string>(modelName);
  const [currentRecordingIndex, setCurrentRecordingIndex] = useState<number>(-1);
  // The code we're receiving from blockly, which won't be used until the user accepts it
  const [externalBlocklyCode, setExternalBlocklyCode] = useState<string>("");
  const [showBlocklyCode, setShowBlocklyCode] = useState<boolean>(false);
  const dataSourceInteractive = useLinkedInteractiveId("dataSourceInteractive");
  const containerRef = useRef<HTMLDivElement>(null);
  const nameUpdateAvailable = modelName !== externalModelName;
  const codeUpdateAvailable = !!(externalBlocklyCode && blocklyCode !== externalBlocklyCode);
  const hasCodeSource = !!dataSourceInteractive;
  const [paused, setPaused] = useState(false);
  const [error, setError] = useState("");
  const [resetCount, setResetCount] = useState(0);
  const [newRecordingCount, setNewRecordingCount] = useState(0);
  const simRef = useRef<AgentSimulation | null>(null);
  // This state is used to force a re-render when the simulation changes,
  // ensuring Widgets receives the updated simRef.current.
  const [, setSimVersion] = useState(0);
  const [hasBeenStarted, setHasBeenStarted] = useState(false);
  const [hasBeenReset, setHasBeenReset] = useState(false);

  // Determine if Play button should be enabled
  // Play button is disabled when there is a code source and either:
  // - blocklyCode is not defined
  // - blocklyCode does not match externalBlocklyCode
  const canPlay = hasCodeSource
    ? !!blocklyCode && (!externalBlocklyCode || blocklyCode === externalBlocklyCode)
    : true;

  // Determine if Reset button should be enabled
  // Reset button is disabled when there is a code source and either:
  // - blocklyCode is not defined
  // - blocklyCode does not match externalBlocklyCode
  // - Reset was clicked after starting (until code update)
  const canReset = hasCodeSource
    ? !!blocklyCode && (!externalBlocklyCode || blocklyCode === externalBlocklyCode) && !hasBeenReset
    : true;

  const [zoomLevel, setZoomLevel] = useState(ZOOM_DEFAULT);
  const objectStorage = useObjectStorage();
  const recordStartTimeRef = useRef<number | null>(null);
  const recordUpdateDurationIntervalRef = useRef<number | null>(null);
  const [showDeleteRecordingConfirm, setShowDeleteRecordingConfirm] = useState(false);
  const tickDataRef = useRef<{ [key: string]: any }[]>([]);
  const handlePlayPauseRef: React.MutableRefObject<() => void> = useRef(() => undefined);

  const timeFormatter = useMemo(() => {
    return new Intl.DateTimeFormat(undefined, {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });
  }, []);
  const simSpeedRef = useRef(interactiveState?.simSpeed ?? SIM_SPEED_DEFAULT);
  const animationFrameRef = useRef<number | null>(null);
  const visRef = useRef<AV.VisHandle | null>(null);
  const pauseTimeoutRef = useRef<number | null>(null);
  const recordingResetCompleteRef = useRef(false);

  const setBlocklyCodeAndName = (newCode: string, newName: string) => {
    _setBlocklyCode(newCode);
    setModelName(newName);
    setInteractiveState?.(prev => ({
      answerType: "interactive_state",
      version: 1,
      name: newName,
      blocklyCode: newCode,
      recordings: prev?.recordings ?? []
    }));
  };

  const setRecordings = useCallback((newRecordings: IRecordings) => {
    _setRecordings(newRecordings);
    setInteractiveState?.(prev => ({
      answerType: "interactive_state",
      version: 1,
      name: prev?.name || modelName,
      blocklyCode: prev?.blocklyCode || "",
      recordings: newRecordings
    }));
  }, [modelName, setInteractiveState]);

  const currentRecording = useMemo(() => {
    if (currentRecordingIndex >= 0 && currentRecordingIndex < recordings.length) {
      return recordings[currentRecordingIndex];
    }
    return undefined;
  }, [currentRecordingIndex, recordings]);
  const inRecordingMode = useMemo(() => !!currentRecording, [currentRecording]);
  const isRecording = useMemo(() => !!currentRecording && !paused, [currentRecording, paused]);
  const isCompletedRecording = useMemo(() =>
    !!currentRecording &&
    currentRecording.startedAt !== undefined &&
    currentRecording.duration !== undefined,
    [currentRecording]
  );

  const getRecordingInfo = useCallback(() => {
    const startedAt = currentRecording?.startedAt;
    if (startedAt) {
      const duration = currentRecording?.duration ?? Date.now() - startedAt;
      const durationInSeconds = Math.floor(duration / 1000);
      const durationString = `${durationInSeconds} ${durationInSeconds === 1 ? "sec" : "secs"}`;
      return { formattedTime: timeFormatter.format(startedAt), durationString };
    }
  }, [currentRecording, timeFormatter]);

  // Keep the blockly code updated with the linked interactive
  useEffect(() => {
    if (!dataSourceInteractive) return;

    const listener = (newLinkedIntState: IInteractiveState | undefined) => {
      console.log("linked-interactive-state-update", { newLinkedIntState });
      const newName = newLinkedIntState && "name" in newLinkedIntState && newLinkedIntState.name;
      const newCode = newLinkedIntState && "code" in newLinkedIntState && newLinkedIntState.code;
      log("linked-interactive-state-update", {
        fromInteractive: dataSourceInteractive,
        newName,
        newCode
      });
      if (typeof newName === "string") {
        setExternalModelName(newName);
      }
      if (typeof newCode === "string") {
        setExternalBlocklyCode(newCode);
      } else {
        setExternalBlocklyCode("");
      }
    };

    const options = { interactiveItemId: dataSourceInteractive };
    addLinkedInteractiveStateListener<any>(listener, options);

    return () => {
      removeLinkedInteractiveStateListener<any>(listener);
    };
  }, [dataSourceInteractive]);

  const resetSimulationWithPreservedGlobals = useCallback(() => {
    if (
      gridHeight <= 0 || !Number.isInteger(gridHeight) ||
      gridWidth <= 0 || !Number.isInteger(gridWidth) ||
      gridStep <= 0 || !Number.isInteger(gridStep)
    ) {
      setError("Grid height, width, and step must be positive integers.");
      return false;
    }
    if (gridHeight % gridStep !== 0 || gridWidth % gridStep !== 0) {
      setError("Grid height and width must be divisible by the grid step.");
      return false;
    }

    if (pauseTimeoutRef.current !== null) {
      clearTimeout(pauseTimeoutRef.current);
      pauseTimeoutRef.current = null;
    }

    // Preserve global values for interactive widgets across resets and code updates.
    const prevGlobals: Record<string, any> = {};
    if (simRef.current && simRef.current.globals && simRef.current.widgets.length > 0) {
      const globalValues = simRef.current.globals.values();
      // Only preserve globals for interactive widgets (sliders), not display widgets (readouts).
      const interactiveWidgetKeys = new Set(
        simRef.current.widgets
          .filter(w => w.type === "slider" || w.type === "circular-slider")
          .map(w => w.globalKey)
      );
      Object.keys(globalValues).forEach(key => {
        if (interactiveWidgetKeys.has(key)) {
          prevGlobals[key] = globalValues[key];
        }
      });
    }

    const preservedGlobals = Object.keys(prevGlobals).length > 0 ? prevGlobals : undefined;

    // Cleanup old simulation and visualization
    visRef.current?.destroy();
    if (simRef.current) {
      containerRef.current?.replaceChildren();
      simRef.current.destroy();
    }

    // Set up the simulation
    simRef.current = new AgentSimulation(gridWidth, gridHeight, gridStep, preservedGlobals);

    const setupCode = blocklyCode || code;
    const usingCode = blocklyCode ? "blockly code" : "authored code";

    log("setup-simulation", { gridStep, gridWidth, gridHeight, resetCount, usingCode, code: setupCode });

    // Run the simulation setup code
    const functionCode = `(sim, AA, AV, globals, addWidget) => { ${setupCode} }`;
    try {
      // Indirect eval (with ?.) is supposed to be safer and faster than direct eval
      // - eval executes in the local scope, so has to check every containing scope for variable references
      // - eval interferes with minification and conversion to machine code
      // - eval executes with whatever permissions the containing code has, giving more opportunity for malicious code
      // For more info, see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/eval
      const simFunction = eval?.(functionCode);
      const { globals, sim } = simRef.current;

      simFunction?.(sim, AA, AV, globals, simRef.current.addWidget.bind(simRef.current));
    } catch (e) {
      setError(`Error setting up simulation: ${String(e)}`);
      return false;
    }

    // save the globals at each tick for recording
    let tick = 0;
    tickDataRef.current = [];
    const afterTick = () => {
      if (simRef.current) {
        const { globals } = simRef.current;
        tickDataRef.current.push({ tick, ...globals.values() });
        tick++;
      }
    };

    // Visualize the simulation
    visRef.current = AV.vis(simRef.current.sim, { speed: simSpeedRef.current, target: containerRef.current, preserveDrawingBuffer: true, afterTick });

    setError("");

    // Force a re-render so Widgets receives the updated simRef.current
    setSimVersion(v => v + 1);

    return true;
  }, [blocklyCode, code, gridHeight, gridStep, gridWidth, resetCount]);

  // Setup and display the simulation on mount and when dependencies change
  useEffect(() => {
    const success = resetSimulationWithPreservedGlobals();
    if (!success) return;

    // Pause the sim after a frame.
    // We need to let the sim run for a frame so actors created in setup have a chance to get added to the sim.
    pauseTimeoutRef.current = window.setTimeout(() => {
      simRef.current?.sim.pause(true);
      setPaused(true);
    }, 5);

    return () => {
      // Clear the pause timeout if it hasn't fired yet
      if (pauseTimeoutRef.current !== null) {
        clearTimeout(pauseTimeoutRef.current);
        pauseTimeoutRef.current = null;
      }
    };
  }, [resetSimulationWithPreservedGlobals, newRecordingCount]);

  // Cleanup animation frames, recording intervals, pause timeout, and simulation on unmount
  useEffect(() => {
    const container = containerRef.current;
    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      if (recordUpdateDurationIntervalRef.current !== null) {
        clearInterval(recordUpdateDurationIntervalRef.current);
        recordUpdateDurationIntervalRef.current = null;
      }
      if (pauseTimeoutRef.current !== null) {
        clearTimeout(pauseTimeoutRef.current);
        pauseTimeoutRef.current = null;
      }

      // Cleanup simulation and visualization on unmount
      visRef.current?.destroy();
      if (simRef.current) {
        container?.replaceChildren();
        simRef.current.destroy();
      }
    };
  }, []);

  const handlePlayPause = useCallback(() => {
    if (simRef.current) {
      if (currentRecording) {
        if (recordUpdateDurationIntervalRef.current) {
          clearInterval(recordUpdateDurationIntervalRef.current);
          recordUpdateDurationIntervalRef.current = null;
        }

        // When starting a recording for the first time, reset the simulation first.
        // This captures the user's current global values in the simulation's initial state.
        if (paused && !currentRecording.startedAt && !recordingResetCompleteRef.current) {
          const success = resetSimulationWithPreservedGlobals();
          if (!success) return;
          // Let the sim run briefly for setup, then continue starting the recording
          pauseTimeoutRef.current = window.setTimeout(() => {
            simRef.current?.sim.pause(true);
            recordingResetCompleteRef.current = true;
            handlePlayPauseRef.current();
          }, 5);
          return;
        }

        recordingResetCompleteRef.current = false;

        if (paused) {
          recordStartTimeRef.current = Date.now();
        }
        const startedAt = recordStartTimeRef.current || Date.now();
        const duration = Date.now() - startedAt;

        if (paused) {
          // Capture current global values for interactive widgets
          const globalValues: Record<string, any> = {};
          if (simRef.current && simRef.current.widgets.length > 0) {
            const currentGlobals = simRef.current.globals.values();
            const interactiveWidgetKeys = new Set(
              simRef.current.widgets
                .filter(w => w.type === "slider" || w.type === "circular-slider")
                .map(w => w.globalKey)
            );
            Object.keys(currentGlobals).forEach(key => {
              if (interactiveWidgetKeys.has(key)) {
                globalValues[key] = currentGlobals[key];
              }
            });
          }

          const pausedRecordings = [...recordings];
          log("start-record-simulation", { startedAt, globalValues });
          pausedRecordings[currentRecordingIndex] = { modelName, startedAt, globalValues };

          // Update the recording duration every 1/2 second while recording
          recordUpdateDurationIntervalRef.current = window.setInterval(() => {
            const updatedDuration = Date.now() - startedAt;
            if (updatedDuration <= maxRecordingTime) {
              const updatedRecordings = [...pausedRecordings];
              updatedRecordings[currentRecordingIndex] = {
                ...updatedRecordings[currentRecordingIndex],
                duration: updatedDuration
              };
              setRecordings(updatedRecordings);
            } else {
              // stop recording after maxRecordingTime
              handlePlayPauseRef.current();
            }
          }, 500);

          setRecordings(pausedRecordings);
        } else {
          log("stop-record-simulation", { startedAt, duration });

          if (!currentRecording.objectId) {
            const notPausedRecordings = [...recordings];

            const save = async () => {
              // get a snapshot of the simulation
              const canvas = containerRef.current?.querySelector("canvas") as HTMLCanvasElement | null;
              const snapshot = canvas?.toDataURL("image/png");
              const thumbnail = await getThumbnail(snapshot);

              // save the recording data in a TypedObject
              const info = getRecordingInfo();
              const description = info ? `${modelName}: ${info.formattedTime} (${info.durationString})` : modelName;
              const typedObject = new TypedObject({
                name: "Simulation Recording",
                description,
              });

              if (snapshot && canvas) {
                typedObject.addImage({
                  name: "Final Simulation Screenshot",
                  subType: "simulation-screenshot",
                  url: snapshot,
                  width: canvas.width,
                  height: canvas.height,
                });
              }

              if (thumbnail) {
                typedObject.addImage({
                  name: "Final Simulation Thumbnail",
                  subType: "simulation-thumbnail",
                  url: thumbnail,
                  width: thumbnailSize,
                  height: thumbnailSize,
                });
              }

              const cols = Object.keys(tickDataRef.current[0] || simRef.current?.globals.values() || {});
              const rows = tickDataRef.current.length > 0 ? tickDataRef.current.map(tickEntry => Object.values(tickEntry)) : [];
              typedObject.addDataTable({
                name: "Simulation Tick Data",
                description,
                subType: "simulation-tick-data",
                cols,
                rows
              });

              const finalCode = blocklyCode || code;
              typedObject.addText({
                name: "Simulation Code",
                subType: "simulation-code",
                text: finalCode
              });

              const { id } = typedObject;
              objectStorage.add(typedObject, { id });
              // Preserve existing recording data (including globalValues) while adding new fields
              notPausedRecordings[currentRecordingIndex] = {
                ...notPausedRecordings[currentRecordingIndex],
                objectId: id,
                startedAt,
                duration,
                thumbnail,
                snapshot
              };
              setRecordings(notPausedRecordings);

              // Clear out the tick data for the next recording
              tickDataRef.current = [];
            };

            save();
          }
        }

      } else {
        log(paused ? "play-simulation" : "pause-simulation");
      }

      simRef.current.sim.pause(!paused);
      setPaused(!paused);
      if (!hasBeenStarted) {
        setHasBeenStarted(true);
      }
    }
  }, [currentRecording, paused, hasBeenStarted, resetSimulationWithPreservedGlobals, recordings, currentRecordingIndex, modelName, setRecordings, getRecordingInfo, blocklyCode, code, objectStorage]);

  // a ref is used here as handlePlayPause is used in a setInterval in handlePlayPause above
  // to stop recording after maxRecordingTime
  handlePlayPauseRef.current = handlePlayPause;

  const handleReset = () => {
    setResetCount(prev => {
      log("reset-simulation", { resetCount: prev + 1 });
      return prev + 1;
    });
    if (hasBeenStarted) {
      setHasBeenReset(true);
    }
    setHasBeenStarted(false);
  };

  const handleUpdateCode = () => {
    log("update-code", {
      oldName: modelName,
      newName: externalModelName,
      oldCode: blocklyCode,
      newCode: externalBlocklyCode
    });
    setBlocklyCodeAndName(externalBlocklyCode, externalModelName);
    setHasBeenStarted(false);
    setHasBeenReset(false);
  };

  const handleChangeSimSpeed = useCallback((newSpeed: number) => {
    const oldSpeed = simSpeedRef.current;
    log("change-simulation-speed", { oldSpeed, newSpeed });

    simSpeedRef.current = newSpeed;
    visRef.current?.setSimSpeed?.(newSpeed);

    setInteractiveState?.(prev => ({
      answerType: "interactive_state",
      version: 1,
      name: prev?.name || modelName,
      simSpeed: newSpeed,
      blocklyCode: prev?.blocklyCode || "",
      recordings: prev?.recordings || []
    }));
  }, [modelName, setInteractiveState]);

  const handleZoomIn = () => {
    const newZoomLevel = Math.min(zoomLevel + ZOOM_STEP, ZOOM_MAX);
    log("zoom-in", { fromZoomLevel: zoomLevel, toZoomLevel: newZoomLevel });
    setZoomLevel(newZoomLevel);
  };

  const handleZoomOut = () => {
    const newZoomLevel = Math.max(zoomLevel - ZOOM_STEP, ZOOM_MIN);
    log("zoom-out", { fromZoomLevel: zoomLevel, toZoomLevel: newZoomLevel });
    setZoomLevel(newZoomLevel);
  };

  const handleFitAll = () => {
    log("fit-all-in-view", { fromZoomLevel: zoomLevel, toZoomLevel: ZOOM_DEFAULT });

    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    // Smoothly scroll back to top-left while zooming to ZOOM_DEFAULT.
    // This prevents jittering when the top-left corner is out of view.
    const wrapper = containerRef.current?.parentElement;
    if (wrapper) {
      const startScrollLeft = wrapper.scrollLeft;
      const startScrollTop = wrapper.scrollTop;
      const startTime = performance.now();

      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / ZOOM_ANIMATION_DURATION, 1);
        const easeOut = 1 - Math.pow(1 - progress, 3);

        wrapper.scrollLeft = startScrollLeft * (1 - easeOut);
        wrapper.scrollTop = startScrollTop * (1 - easeOut);

        if (progress < 1) {
          animationFrameRef.current = requestAnimationFrame(animate);
        } else {
          animationFrameRef.current = null;
        }
      };

      animationFrameRef.current = requestAnimationFrame(animate);
    }

    setZoomLevel(ZOOM_DEFAULT);
  };

  const handleNewRecording = () => {
    recordingResetCompleteRef.current = false;
    const newRecording: IRecording = { modelName };
    const newRecordings = [...recordings, newRecording];
    setRecordings(newRecordings);
    setCurrentRecordingIndex(newRecordings.length - 1);
    setNewRecordingCount(prev => prev + 1);
  };

  const handleSelectRecording = (index: number) => {
    setCurrentRecordingIndex(index);
  };

  const handleDeleteRecording = () => setShowDeleteRecordingConfirm(true);
  const handleCancelDeleteRecording = () => setShowDeleteRecordingConfirm(false);
  const handleConfirmDeleteRecording = useCallback(() => {
    const newRecordings = recordings.filter((_, i) => i !== currentRecordingIndex);
    setRecordings(newRecordings);
    setCurrentRecordingIndex(-1);
    setShowDeleteRecordingConfirm(false);
  }, [currentRecordingIndex, recordings, setRecordings]);

  const renderRecordingInfo = () => {
    const info = getRecordingInfo();
    if (info) {
      return (
        <span className={css.recordingInfo}>
          {info.formattedTime} ({info.durationString})
        </span>
      );
    } else if (inRecordingMode) {
      return <span className={css.recordingInfo}>(Start recording)</span>;
    }
    return null;
  };

  return (
    <div className={css.agentSimulationComponent}>
      <div className={css.topBar}>
        <div className={css.leftSide}>
          {currentRecordingIndex !== -1 && (
            <div className={css.returnToTinker}>
              <button onClick={() => handleSelectRecording(-1)} disabled={isRecording}>
                <ReturnToModelIcon />
              </button>
            </div>
          )}
          {inRecordingMode ? <RecordingIcon className={css.modelIcon} /> : <ModelIcon className={css.modelIcon} />}
          <div className={css.modelInfo}>
            <div className={css.modelName}>{currentRecording?.modelName ?? modelName}</div>
            <div>{renderRecordingInfo()}</div>
          </div>
        </div>
        <div className={css.rightSide}>
          <RecordingStrip
            isRecording={isRecording}
            onNewRecording={handleNewRecording}
            onSelectRecording={handleSelectRecording}
            recordings={recordings}
            currentRecordingIndex={currentRecordingIndex}
          />
        </div>
      </div>
      <ControlPanel
        updateAvailable={codeUpdateAvailable || nameUpdateAvailable}
        hasCodeSource={hasCodeSource}
        paused={paused}
        currentRecording={currentRecording}
        simSpeed={simSpeedRef.current}
        onChangeSimSpeed={handleChangeSimSpeed}
        onPlayPause={handlePlayPause}
        onReset={handleReset}
        onUpdateCode={handleUpdateCode}
        onDeleteRecording={handleDeleteRecording}
        canPlay={canPlay}
        canReset={canReset}
      />
      {error && <div className={css.error}>{error}</div>}
      <div className={css.simViewport}>
        <div className={css.simScrollArea}>
          <div
            ref={containerRef}
            className={css.simContainer}
            style={{ transform: `scale(${zoomLevel})`, opacity: currentRecording?.snapshot ? 0 : 1 }}
          />
          {currentRecording?.snapshot && (
            <img
              src={currentRecording.snapshot}
              alt="Simulation snapshot"
              className={css.snapshot}
              style={{ transform: `scale(${zoomLevel})` }}
            />
          )}
          <ZoomControls
            zoomLevel={zoomLevel}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onFitAll={handleFitAll}
          />
        </div>
      </div>
      <Widgets
        sim={simRef.current}
        isRecording={isRecording}
        inRecordingMode={inRecordingMode}
        isCompletedRecording={isCompletedRecording}
        recordedGlobalValues={currentRecording?.globalValues}
      />
      {blocklyCode && (
        <>
          {showBlocklyCode &&
            <div className={css.code}>
              {blocklyCode}
            </div>
          }
          <button onClick={() => {
            log(showBlocklyCode ? "hide-blockly-code" : "show-blockly-code");
            setShowBlocklyCode(!showBlocklyCode);
          }}>
            {showBlocklyCode ? "Hide" : "Show"} Blockly Code
          </button>
        </>
      )}
      {showDeleteRecordingConfirm && (
        <Modal
          variant="orange"
          title="Delete Recording"
          Icon={DeleteRecordingIcon}
          message={<div>Are you sure you want to delete <strong>{modelName} {renderRecordingInfo()}</strong>?</div>}
          confirmLabel="Delete"
          onConfirm={handleConfirmDeleteRecording}
          onCancel={handleCancelDeleteRecording}
        />
      )}
    </div>
  );
};
