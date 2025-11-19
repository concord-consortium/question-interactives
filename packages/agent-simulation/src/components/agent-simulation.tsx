import * as AA from "@gjmcn/atomic-agents";
import * as AV from "@gjmcn/atomic-agents-vis";
import React, { useEffect, useRef, useState } from "react";

import {
  addLinkedInteractiveStateListener, removeLinkedInteractiveStateListener, log
} from "@concord-consortium/lara-interactive-api";
import {
  IRuntimeQuestionComponentProps
} from "@concord-consortium/question-interactives-helpers/src/components/base-question-app";
import {
  useLinkedInteractiveId
} from "@concord-consortium/question-interactives-helpers/src/hooks/use-linked-interactive-id";
import { AgentSimulation } from "../models/agent-simulation";
import { ZOOM_ANIMATION_DURATION, ZOOM_DEFAULT, ZOOM_MAX, ZOOM_MIN, ZOOM_STEP } from "../constants";
import { IAuthoredState, IInteractiveState } from "./types";
import { Widgets } from "./widgets";
import { ControlPanel } from "./control-panel";
import { ZoomControls } from "./zoom-controls";

import ModelIcon from "../assets/model-icon.svg";

import css from "./agent-simulation.scss";

interface IProps extends IRuntimeQuestionComponentProps<IAuthoredState, IInteractiveState> {}

export const AgentSimulationComponent = ({
  authoredState, interactiveState, setInteractiveState, report
}: IProps) => {
  const { code, gridHeight, gridStep, gridWidth } = authoredState;
  // The blockly code we're using, which doesn't get updated until the user accepts newer code
  const [blocklyCode, _setBlocklyCode] = useState<string>(interactiveState?.blocklyCode || "");
  // The code we're receiving from blockly, which won't be used until the user accepts it
  const [externalBlocklyCode, setExternalBlocklyCode] = useState<string>("");
  const [showBlocklyCode, setShowBlocklyCode] = useState<boolean>(false);
  const dataSourceInteractive = useLinkedInteractiveId("dataSourceInteractive");
  // TODO: Eventually, users will be able to name a saved Blockly program. For details,
  // see https://concord-consortium.atlassian.net/browse/QI-57 
  // For now, we use a default name. This should be updated to use the name value from
  // the Blockly interactive state when it's available.
  const modelName = "Model 1";
  const containerRef = useRef<HTMLDivElement>(null);
  const codeUpdateAvailable = !!(externalBlocklyCode && blocklyCode !== externalBlocklyCode);
  const hasCodeSource = !!dataSourceInteractive;
  const [paused, setPaused] = useState(true);
  const [error, setError] = useState("");
  const [resetCount, setResetCount] = useState(0);
  const simRef = useRef<AgentSimulation | null>(null);
  const [hasBeenStarted, setHasBeenStarted] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(ZOOM_DEFAULT);

  const setBlocklyCode = (newCode: string) => {
    _setBlocklyCode(newCode);
    setInteractiveState?.(prev => ({
      ...prev,
      answerType: "interactive_state",
      version: 1,
      blocklyCode: newCode
    }));
  };

  // Keep the blockly code updated with the linked interactive
  useEffect(() => {
    if (!dataSourceInteractive) return;

    const listener = (newLinkedIntState: IInteractiveState | undefined) => {
      const newCode = newLinkedIntState && "code" in newLinkedIntState && newLinkedIntState.code;
      log("linked-interactive-state-update", {
        fromInteractive: dataSourceInteractive,
        newCode
      });
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

  // Setup and display the simulation
  useEffect(() => {
    if (
      gridHeight <= 0 || !Number.isInteger(gridHeight) ||
      gridWidth <= 0 || !Number.isInteger(gridWidth) ||
      gridStep <= 0 || !Number.isInteger(gridStep)
    ) {
      setError("Grid height, width, and step must be positive integers.");
      return;
    }
    if (gridHeight % gridStep !== 0 || gridWidth % gridStep !== 0) {
      setError("Grid height and width must be divisible by the grid step.");
      return;
    }

    // Set up the simulation
    simRef.current = new AgentSimulation(gridWidth, gridHeight, gridStep);

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
      return;
    }

    // Visualize and start the simulation
    AV.vis(simRef.current.sim, { target: containerRef.current });
    simRef.current.sim.pause(true);
    setPaused(true);

    setError("");

    const oldSim = simRef.current;
    const container = containerRef.current;
    return () => {
      // Remove old sim when we're ready to update the sim
      container?.replaceChildren();
      oldSim.destroy();
    };
  }, [blocklyCode, code, gridHeight, gridStep, gridWidth, resetCount]);

  const handlePlayPause = () => {
    if (simRef.current) {
      log(paused ? "play-simulation" : "pause-simulation");
      simRef.current.sim.pause(!paused);
      setPaused(!paused);
      if (!hasBeenStarted) {
        setHasBeenStarted(true);
      }
    }
  };

  const handleReset = () => {
    const newResetCount = resetCount + 1;
    log("reset-simulation", { resetCount: newResetCount });
    setResetCount(newResetCount);
    setHasBeenStarted(false);
  };

  const handleUpdateCode = () => {
    log("update-code", {
      oldCode: blocklyCode,
      newCode: externalBlocklyCode
    });
    setBlocklyCode(externalBlocklyCode);
    setHasBeenStarted(false);
  };

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
          requestAnimationFrame(animate);
        }
      };

      requestAnimationFrame(animate);
    }
    
    setZoomLevel(ZOOM_DEFAULT);
  };

  return (
    <div className={css.agentSimulationComponent}>
      <div className={css.modelTitle}>
        <ModelIcon />
        {modelName}
      </div>
      <ControlPanel
        codeUpdateAvailable={codeUpdateAvailable}
        hasBeenStarted={hasBeenStarted}
        hasCodeSource={hasCodeSource}
        paused={paused}
        onPlayPause={handlePlayPause}
        onReset={handleReset}
        onUpdateCode={handleUpdateCode}
      />
      {error && <div className={css.error}>{error}</div>}
      <div className={css.simViewport}>
        <div className={css.simScrollArea}>
          <div 
            ref={containerRef} 
            className={css.simContainer}
            style={{ transform: `scale(${zoomLevel})` }}
          />
        </div>
        <ZoomControls 
          zoomLevel={zoomLevel}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onFitAll={handleFitAll}
        />
      </div>
      <Widgets sim={simRef.current} />
      { blocklyCode && (
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
    </div>
  );
};
