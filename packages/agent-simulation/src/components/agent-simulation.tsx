import * as AA from "@gjmcn/atomic-agents";
import * as AV from "@concord-consortium/atomic-agents-vis";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useObjectStorage, StoredObject } from "@concord-consortium/object-storage";

import {
  addLinkedInteractiveStateListener, removeLinkedInteractiveStateListener, log, createPubSubChannel,
  useInitMessage, PubSubChannel
} from "@concord-consortium/lara-interactive-api";
import {
  IRuntimeQuestionComponentProps
} from "@concord-consortium/question-interactives-helpers/src/components/base-question-app";
import {
  useLinkedInteractiveId
} from "@concord-consortium/question-interactives-helpers/src/hooks/use-linked-interactive-id";
import { SIM_SPEED_DEFAULT, ZOOM_ANIMATION_DURATION, ZOOM_DEFAULT, ZOOM_MAX, ZOOM_MIN, ZOOM_STEP } from "../constants";
import { AgentSimulation } from "../models/agent-simulation";
import { IAuthoredState, IInteractiveState, IRecording, IRecordings, maxMaxRecordingTime } from "./types";
import { ControlPanel } from "./control-panel";
import { Widgets } from "./widgets";
import { ZoomControls } from "./zoom-controls";
import { RecordingStrip } from "./recording-strip";
import { Modal } from "@concord-consortium/question-interactives-helpers/src/components/modal";

import ModelIcon from "../assets/model-icon.svg";
import ReturnToModelIcon from "../assets/return-to-model-icon.svg";
import RecordingIcon from "../assets/recording-icon.svg";
import DeleteRecordingIcon from "../assets/delete-recording-icon.svg";
import WarningTriangleIcon from "../assets/warning-triangle-icon.svg";

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

interface IProps extends IRuntimeQuestionComponentProps<IAuthoredState, IInteractiveState> { }

interface FailedSaveInfo {
  approximateSizeBytes: number;
  placeholderIndex: number;
  placeholderSnapshot?: string;
}

const SAVE_TIMEOUT_MS = 30_000;

export const AgentSimulationComponent = ({
  authoredState, interactiveState, setInteractiveState, report
}: IProps) => {
  const { code, gridHeight, gridStep, gridWidth, maxRecordingTime, sampleIntervalUnit, sampleInterval, maxSamples } = authoredState;
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
  const maxRecordingTimeInMs = Math.max(1, Math.min(maxRecordingTime, maxMaxRecordingTime)) * 1000;

  // Determine if Play button should be enabled
  // Play button is disabled when there is a code source and either:
  // - blocklyCode is not defined
  // - blocklyCode does not match externalBlocklyCode
  // - a broken-history entry is currently selected (computed below)
  const basePlayAllowed = hasCodeSource
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
  // Save-failure UI state. failedSaveInfo is set on save failure and cleared when the user
  // acknowledges the error modal. When non-null, the error modal is shown and a transient
  // placeholder is rendered in the strip.
  const [failedSaveInfo, setFailedSaveInfo] = useState<FailedSaveInfo | null>(null);
  // Broken-history UI state. Detected on mount and whenever the set of objectIds changes;
  // never written to interactiveState. No aria-live announcement on detection — broken
  // history is passive state, not a notification-worthy event; the per-entry aria-label
  // is the AT signal on focus.
  const [brokenObjectIds, setBrokenObjectIds] = useState<Set<string>>(new Set());
  // Per-mount cache: objectId -> "ok" | "broken". Persists across renders within a mount,
  // resets on unmount (preserves the "self-healing on every mount" semantic). Avoids
  // refetching readMetadata for previously-seen ids when a new recording is added.
  const metadataCacheRef = useRef<Map<string, "ok" | "broken">>(new Map());
  const tickDataRef = useRef<{ [key: string]: any }[]>([]);
  const handlePlayPauseRef: React.MutableRefObject<() => void> = useRef(() => undefined);
  const inRecordingModeRef = useRef(false);
  // Wall-clock timestamp (Date.now) of the most recent sample taken in this run of the
  // simulation. null = no sample yet, so the next tick is always sampled. Reset whenever
  // the simulation is recreated (reset / new-recording / code update).
  const lastSampleAtRef = useRef<number | null>(null);
  // Sim-tick number of the most recent sample taken in this run of the simulation.
  // null = no sample yet. Reset alongside lastSampleAtRef on sim (re)create.
  const lastSampleTickRef = useRef<number | null>(null);
  // Set true once the max-samples cap has triggered an auto-stop, so we don't try to
  // auto-stop a second time before handlePlayPause has had a chance to pause the sim.
  const maxSamplesAutoStoppedRef = useRef(false);
  // Mirrors authoredState fields for use inside afterTick. `?? "none"` defaults a
  // missing unit — the migrated V1 state with no sampleIntervalMs arrives with
  // sampleIntervalUnit unset. (Fresh-authored states arrive with "none" explicit.)
  const sampleIntervalUnitRef = useRef<"none" | "ms" | "ticks">(sampleIntervalUnit ?? "none");
  sampleIntervalUnitRef.current = sampleIntervalUnit ?? "none";
  const sampleIntervalRef = useRef<number | undefined>(sampleInterval);
  sampleIntervalRef.current = sampleInterval;
  const maxSamplesRef = useRef<number | undefined>(maxSamples);
  maxSamplesRef.current = maxSamples;

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

  const initMessage = useInitMessage();
  const recordingChannelRef = useRef<PubSubChannel|undefined>(undefined);
  useEffect(() => {
    if (initMessage?.mode === "runtime" && initMessage.interactive.id) {
      recordingChannelRef.current = createPubSubChannel(initMessage.interactive.id);
    }
    return undefined;
  }, [initMessage]);

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

  // Mirror of `recordings` state. Two consumers read it:
  //   1. setRecordings (below) resolves the `prev` for functional callers
  //      without nesting setInteractiveState inside a React state updater.
  //   2. The save-failure path in handlePlayPause reads the current value
  //      to compute the placeholder index before filtering out the
  //      in-progress entry (declared lower in the file).
  const recordingsRef = useRef<IRecordings>(recordings);
  recordingsRef.current = recordings;

  const setRecordings = useCallback((
    newRecordings: IRecordings | ((prev: IRecordings) => IRecordings)
  ) => {
    const next = typeof newRecordings === "function"
      ? newRecordings(recordingsRef.current)
      : newRecordings;
    _setRecordings(next);
    setInteractiveState?.(prev => ({
      answerType: "interactive_state",
      version: 1,
      name: prev?.name || modelName,
      blocklyCode: prev?.blocklyCode || "",
      recordings: next
    }));
  }, [modelName, setInteractiveState]);

  // Stable cache key derived from just the objectIds. This is the only data the
  // detection effect cares about; depending on `recordings` directly would re-fire
  // every 500ms while a recording is in progress (the live-duration setInterval
  // mutates the in-progress entry on every tick), causing N+1 Firestore reads
  // per second per active recording.
  // JSON.stringify (rather than join with a delimiter) is unambiguously delimiter-
  // safe: Firestore document IDs may contain any character except "/", "..", and
  // "__name__", so a naive separator like "," could collide. The serialized array
  // is small (<100 ids x ~40 chars).
  const objectIdsKey = useMemo(
    () => JSON.stringify(
      recordings.map(r => r.objectId).filter((id): id is string => !!id)
    ),
    [recordings]
  );

  // Detect pre-existing broken recordings on every mount and whenever the set of
  // objectIds changes. Never mutates recordings / interactiveState — broken state
  // is purely UI. If readMetadata throws (network, auth), the entry is left out of
  // the cache so a later mount can retry (treated as unknown for the current render).
  useEffect(() => {
    let cancelled = false;
    const detect = async () => {
      const objectIds: string[] = JSON.parse(objectIdsKey);
      const cache = metadataCacheRef.current;
      const newIds = objectIds.filter(id => !cache.has(id));
      await Promise.all(
        newIds.map(async (objectId) => {
          try {
            const md = await objectStorage.readMetadata(objectId);
            cache.set(objectId, md === undefined ? "broken" : "ok");
          } catch {
            // transient failure — leave out of cache so a later mount can retry
          }
        })
      );
      if (cancelled) return;
      const broken = new Set<string>();
      for (const objectId of objectIds) {
        if (cache.get(objectId) === "broken") broken.add(objectId);
      }
      // Return prev (same reference) if contents are unchanged so React's
      // Object.is comparison skips an unnecessary re-render. Without this,
      // every detection-effect run triggers a re-render even when no broken
      // entries are added or removed.
      setBrokenObjectIds(prev => {
        if (prev.size === broken.size) {
          let same = true;
          for (const id of broken) {
            if (!prev.has(id)) { same = false; break; }
          }
          if (same) return prev;
        }
        return broken;
      });
    };
    detect();
    return () => { cancelled = true; };
  }, [objectIdsKey, objectStorage]);

  const currentRecording = useMemo(() => {
    if (currentRecordingIndex >= 0 && currentRecordingIndex < recordings.length) {
      return recordings[currentRecordingIndex];
    }
    return undefined;
  }, [currentRecordingIndex, recordings]);
  const inRecordingMode = useMemo(() => !!currentRecording, [currentRecording]);
  inRecordingModeRef.current = inRecordingMode;
  const isRecording = useMemo(() => !!currentRecording && !paused, [currentRecording, paused]);
  const isCompletedRecording = useMemo(() =>
    !!currentRecording &&
    currentRecording.startedAt !== undefined &&
    currentRecording.duration !== undefined,
    [currentRecording]
  );

  // Broken-entry selection disables Play (broken entries cannot play back).
  // basePlayAllowed is the existing code-source/blockly-code gate; the broken
  // check is layered on top so that a future change to one doesn't accidentally
  // re-enable Play for broken entries.
  const selectedIsBroken =
    currentRecording?.objectId !== undefined &&
    brokenObjectIds.has(currentRecording.objectId);
  const canPlay = basePlayAllowed && !selectedIsBroken;

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
    lastSampleAtRef.current = null;
    lastSampleTickRef.current = null;
    maxSamplesAutoStoppedRef.current = false;
    const afterTick = () => {
      if (!simRef.current) {
        return;
      }
      // Hard stop after maxSamples auto-stop is queued: any sim ticks that fire
      // before the setTimeout(0) below has run handlePlayPause must not add to the
      // recording, or the saved row count would exceed `maxSamples`. Reset in
      // resetSimulationWithPreservedGlobals when the sim is rebuilt.
      if (maxSamplesAutoStoppedRef.current) {
        return;
      }
      const { globals } = simRef.current;
      const currentTick = tick;
      tick++;

      // Throttle samples by the configured unit: wall-clock ms or sim ticks.
      // The first tick after a sim (re)create is always sampled because both
      // lastSampleAtRef and lastSampleTickRef start null. `tick` keeps counting
      // every simulation step so downstream consumers can read sim-time.
      const unit = sampleIntervalUnitRef.current;
      const interval = sampleIntervalRef.current;
      const now = Date.now();
      if (
        unit === "ms" &&
        interval !== undefined &&
        lastSampleAtRef.current !== null &&
        now - lastSampleAtRef.current < interval
      ) {
        return;
      }
      if (
        unit === "ticks" &&
        interval !== undefined &&
        lastSampleTickRef.current !== null &&
        currentTick - lastSampleTickRef.current < interval
      ) {
        return;
      }
      // On a kept sample, update both refs unconditionally so a mid-run unit change
      // doesn't replay history.
      lastSampleAtRef.current = now;
      lastSampleTickRef.current = currentTick;

      const values = { tick: currentTick, ...globals.values() };
      tickDataRef.current.push(values);

      const topic = inRecordingModeRef.current ? "recording-tick" : "simulation-tick";
      recordingChannelRef.current?.publish({topic, values});

      // When maxSamples is set and we've just recorded the Nth sample of a recording,
      // stop the recording via the same path as the maxRecordingTime cutoff. Defer to
      // setTimeout(0) so handlePlayPause runs after this tick callback returns, matching
      // the existing maxRecordingTime cutoff which is invoked from a setInterval — keeps
      // the sim.pause + save() chain out of the afterTick stack.
      const cap = maxSamplesRef.current;
      if (
        inRecordingModeRef.current &&
        !maxSamplesAutoStoppedRef.current &&
        cap !== undefined &&
        tickDataRef.current.length >= cap
      ) {
        maxSamplesAutoStoppedRef.current = true;
        setTimeout(() => {
          handlePlayPauseRef.current();
          // Release the guard once handlePlayPause has paused the sim. The guard
          // only needs to cover the gap between cap-hit and the deferred pause;
          // leaving it set across that boundary blocks future ticks on paths
          // that don't rebuild the sim (e.g. save-failure deselects the
          // recording without resetting, or the user re-enters free-play).
          maxSamplesAutoStoppedRef.current = false;
        }, 0);
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

    simRef.current?.sim.pause(true);
    setPaused(true);
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
        if (paused && !currentRecording.startedAt) {
          const success = resetSimulationWithPreservedGlobals();
          if (!success) return;
        }

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
            if (updatedDuration <= maxRecordingTimeInMs) {
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

          if (recordingChannelRef.current) {
            const cols = ["tick", ...Object.keys(simRef.current?.globals.values() || {})];
            recordingChannelRef.current.publish({topic: "recording-started", cols, title: modelName});
          }
        } else {
          log("stop-record-simulation", { startedAt, duration });

          recordingChannelRef.current?.publish({topic: "recording-stopped"});

          if (!currentRecording.objectId) {
            // Identify the in-flight entry by its `startedAt` timestamp, which is
            // unique per recording and stable for the lifetime of the save() call.
            // Using a stable identifier (rather than the captured index) means
            // index shifts during the up-to-30s save window — e.g., the user
            // deletes an earlier saved recording — don't cause the success write
            // to land on the wrong slot or the failure cleanup to filter the
            // wrong entry. `startedAt` is in closure scope from handlePlayPause.
            const inFlightStartedAt = startedAt;

            const save = async () => {
              // get a snapshot of the simulation
              const canvas = containerRef.current?.querySelector("canvas") as HTMLCanvasElement | null;
              const snapshot = canvas?.toDataURL("image/png");
              const thumbnail = await getThumbnail(snapshot);

              // save the recording data in a TypedObject
              const info = getRecordingInfo();
              const description = info ? `${modelName}: ${info.formattedTime} (${info.durationString})` : modelName;
              const storedObject = new StoredObject({
                name: "Simulation Recording",
                type: "simulation-recording",
                subType: "agent-simulation",
                description,
              });

              if (snapshot && canvas) {
                storedObject.addImage({
                  name: "Final Simulation Screenshot",
                  subType: "simulation-screenshot",
                  url: snapshot,
                  width: canvas.width,
                  height: canvas.height,
                });
              }

              if (thumbnail) {
                storedObject.addImage({
                  name: "Final Simulation Thumbnail",
                  subType: "simulation-thumbnail",
                  url: thumbnail,
                  width: thumbnailSize,
                  height: thumbnailSize,
                });
              }

              const cols = Object.keys(tickDataRef.current[0] || simRef.current?.globals.values() || {});
              const rows = tickDataRef.current.length > 0 ? tickDataRef.current.map(tickEntry => Object.values(tickEntry)) : [];
              storedObject.addDataTable({
                name: "Simulation Tick Data",
                description,
                subType: "simulation-tick-data",
                cols,
                rows
              });

              const finalCode = blocklyCode || code;
              storedObject.addText({
                name: "Simulation Code",
                subType: "simulation-code",
                text: finalCode
              });

              const addPromise = objectStorage.add(storedObject);
              // Absorb any late rejection on the timeout path. If the timeout fires, the
              // underlying add() promise is still pending; if it eventually rejects (e.g.,
              // Firestore returns "doc too big" after our timer fired), this prevents an
              // unhandled-rejection warning. The forward marker for researchers is the
              // log("save-recording-failed", { errorMessage: "save timed out after 30s" })
              // event already emitted in the catch handler below.
              addPromise.catch(() => undefined);

              let timeoutId: ReturnType<typeof setTimeout> | undefined;
              try {
                await Promise.race([
                  addPromise,
                  new Promise((_, reject) => {
                    timeoutId = setTimeout(
                      () => reject(new Error("save timed out after 30s")),
                      SAVE_TIMEOUT_MS
                    );
                  }),
                ]);
                // Success path — locate the in-flight entry by its stable
                // `startedAt` (set when recording began) rather than the captured
                // index. If the user deleted an earlier saved recording during
                // the save window, the index would have shifted and an index-
                // based write would corrupt a different slot.
                setRecordings(prev => {
                  const idx = prev.findIndex(
                    r => r.startedAt === inFlightStartedAt && !r.objectId
                  );
                  if (idx === -1) return prev; // entry was already removed
                  const next = [...prev];
                  next[idx] = {
                    ...next[idx],
                    objectId: storedObject.id,
                    startedAt: inFlightStartedAt,
                    duration,
                    thumbnail,
                    snapshot,
                  };
                  return next;
                });
              } catch (err) {
                // Computed inside the catch (only on failure) so the success path doesn't
                // pay for a ~1MB stringify of the tick data we already sent to Firestore.
                const approximateSizeBytes = JSON.stringify(storedObject.data).length;
                const errorMessage = err instanceof Error ? err.message : String(err);
                // Synchronous publish BEFORE the modal opens, per spec.
                recordingChannelRef.current?.publish({
                  topic: "recording-save-failed",
                  objectId: storedObject.id,
                });
                console.error("[agent-simulation] Recording save failed", {
                  objectId: storedObject.id,
                  errorMessage,
                  approximateSizeBytes,
                });
                log("save-recording-failed", { errorMessage, approximateSizeBytes });
                // Actively remove the in-progress entry that was committed to recordings/
                // interactiveState when recording started. Identify by stable startedAt
                // rather than by index so a mid-save delete of an earlier saved recording
                // doesn't cause us to filter the wrong entry (leaving the phantom).
                // Capture the placeholder index from the pre-filter array so the
                // placeholder renders at the slot the recording would have occupied.
                const preFilter = recordingsRef.current;
                const inFlightIdx = preFilter.findIndex(
                  r => r.startedAt === inFlightStartedAt && !r.objectId
                );
                setRecordings(prev =>
                  prev.filter(r => !(r.startedAt === inFlightStartedAt && !r.objectId))
                );
                setCurrentRecordingIndex(-1);
                // Single-modal policy: dismiss any open delete-confirm before opening the
                // error modal so we don't render two aria-modal="true" dialogs at once
                // with competing focus traps. Indices may have shifted because we just
                // removed the in-progress entry; restarting the delete flow is safer.
                setShowDeleteRecordingConfirm(false);
                // Surface to the user. Placeholder occupies the slot just freed by
                // removal, which is the position the recording would have had on success.
                setFailedSaveInfo({
                  approximateSizeBytes,
                  placeholderIndex: inFlightIdx !== -1 ? inFlightIdx : preFilter.length,
                  placeholderSnapshot: snapshot,
                });
              } finally {
                // Clear the 30s timer if add() resolved or rejected before it fired.
                // Without this, the reject callback runs 30s later into a settled promise
                // (no observable effect, but holds a closure for 30s).
                if (timeoutId !== undefined) clearTimeout(timeoutId);
              }
              // Tick data is cleared in both paths.
              tickDataRef.current = [];
            };

            // save() handles its own errors internally via try/catch + modal.
            // Intentionally not awaited so handlePlayPause stays synchronous.
            save();
          }
        }

      } else {
        if (paused) {
          log("play-simulation");
          if (!hasBeenStarted) {
            const cols = ["tick", ...Object.keys(simRef.current?.globals.values() || {})];
            recordingChannelRef.current?.publish({ topic: "simulation-started", cols, title: modelName });
          }
        } else {
          log("pause-simulation");
          recordingChannelRef.current?.publish({ topic: "simulation-paused" });
        }
      }

      simRef.current.sim.pause(!paused);
      setPaused(!paused);
      if (!hasBeenStarted) {
        setHasBeenStarted(true);
      }
    }
  }, [currentRecording, paused, hasBeenStarted, resetSimulationWithPreservedGlobals, recordings, currentRecordingIndex,
      modelName, setRecordings, maxRecordingTimeInMs, getRecordingInfo, blocklyCode, code, objectStorage]);

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
    if (!inRecordingMode) {
      recordingChannelRef.current?.publish({ topic: "simulation-reset" });
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
    const newRecording: IRecording = { modelName };
    const newRecordings = [...recordings, newRecording];
    setRecordings(newRecordings);
    setCurrentRecordingIndex(newRecordings.length - 1);
    setHasBeenStarted(false);
    setNewRecordingCount(prev => prev + 1);
    recordingChannelRef.current?.publish({
      topic: "recording-selected", objectId: null, title: modelName, status: "empty"
    });
  };

  const handleSelectRecording = (index: number) => {
    setCurrentRecordingIndex(index);

    if (index === -1) {
      setHasBeenStarted(false);
      setNewRecordingCount(prev => prev + 1); // trigger sim reset so tick counter starts fresh
      recordingChannelRef.current?.publish({ topic: "recording-deselected" });
      return;
    }

    const recording = recordings[index];
    if (!recording) {
      return;
    }

    // Saving-state guard: entries that have been started (startedAt set) but not
    // yet saved (no objectId) are in the save-in-flight window between Stop and
    // add() resolution. Selecting them would publish recording-selected and start
    // polling for objectId — both pointless until the save resolves. The disabled
    // <button> in the recording strip is the UI half of this defense-in-depth
    // pair; this is the programmatic-call half. Empty recordings (no startedAt
    // yet, just created via New) are NOT saving and remain selectable.
    if (recording.startedAt !== undefined && !recording.objectId) {
      return;
    }

    // Empty recording (no startedAt): re-publish "empty" so a user who deselected
    // an empty recording can re-select it (handleNewRecording publishes "empty"
    // at create-time; this handles re-selection from the strip).
    if (!recording.startedAt) {
      recordingChannelRef.current?.publish({
        topic: "recording-selected", objectId: null, title: recording.modelName, status: "empty"
      });
      return;
    }

    // Past the guards above, recording.objectId is guaranteed defined. Narrow
    // via a local const so we don't sprinkle non-null assertions through the
    // publish call.
    const { objectId } = recording;
    if (!objectId) return; // type-narrowing belt-and-suspenders; unreachable.

    // Broken-entry selection: skip the playback path entirely. The only purpose
    // of selection here is to enable the existing control-panel Delete action.
    if (brokenObjectIds.has(objectId)) {
      return;
    }

    const durationInSeconds = Math.floor((recording.duration ?? 0) / 1000);
    const durationString = `${durationInSeconds} ${durationInSeconds === 1 ? "sec" : "secs"}`;
    const formattedTime = new Date(recording.startedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    const title = recording.duration !== undefined
      ? `${recording.modelName}: ${formattedTime} (${durationString})`
      : recording.modelName;

    recordingChannelRef.current?.publish({
      topic: "recording-selected", objectId, title, status: "ready"
    });
  };

  const handleDeleteRecording = () => setShowDeleteRecordingConfirm(true);
  const handleCancelDeleteRecording = () => setShowDeleteRecordingConfirm(false);
  const handleConfirmDeleteRecording = useCallback(() => {
    const newRecordings = recordings.filter((_, i) => i !== currentRecordingIndex);
    setRecordings(newRecordings);
    setCurrentRecordingIndex(-1);
    setHasBeenStarted(false);
    setNewRecordingCount(prev => prev + 1);
    setShowDeleteRecordingConfirm(false);
    recordingChannelRef.current?.publish({ topic: "recording-deselected" });
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
            brokenObjectIds={brokenObjectIds}
            failedSavePlaceholder={failedSaveInfo ? {
              index: failedSaveInfo.placeholderIndex,
              snapshot: failedSaveInfo.placeholderSnapshot,
            } : undefined}
          />
        </div>
      </div>
      <div className={css.controlPanelContainer}>
        {currentRecordingIndex !== -1 && (
          <div className={css.returnToTinker}>
            <button onClick={() => handleSelectRecording(-1)} disabled={isRecording}>
              <ReturnToModelIcon />
            </button>
          </div>
        )}
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
      </div>
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
              style={{ height: gridHeight, transform: `scale(${zoomLevel})`, width: gridWidth }}
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
      {failedSaveInfo && (
        <Modal
          mode="alert"
          variant="orange"
          title="Recording Save Failed"
          Icon={WarningTriangleIcon}
          message="This recording was too large to save and could not be kept. Please record a shorter session and try again."
          confirmLabel="OK"
          onConfirm={() => setFailedSaveInfo(null)}
          onCancel={() => setFailedSaveInfo(null)}
        />
      )}
    </div>
  );
};
