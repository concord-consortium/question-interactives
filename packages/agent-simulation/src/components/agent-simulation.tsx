import * as AA from "@gjmcn/atomic-agents";
import * as AV from "@gjmcn/atomic-agents-vis";
import React, { useEffect, useRef, useState } from "react";

import {
  addLinkedInteractiveStateListener, removeLinkedInteractiveStateListener
} from "@concord-consortium/lara-interactive-api";
import {
  IRuntimeQuestionComponentProps
} from "@concord-consortium/question-interactives-helpers/src/components/base-question-app";
import {
  useLinkedInteractiveId
} from "@concord-consortium/question-interactives-helpers/src/hooks/use-linked-interactive-id";
import { IAuthoredState, IInteractiveState } from "./types";

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
  const containerRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(true);
  const [error, setError] = useState("");
  const [resetCount, setResetCount] = useState(0);
  const simRef = useRef<AA.Simulation | null>(null);

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
    simRef.current = new AA.Simulation({
      gridStep: gridStep,
      height: gridHeight,
      width: gridWidth
    });

    // Run the simulation setup code
    const functionCode = `(sim, AA, AV) => { ${blocklyCode || code} }`;
    try {
      // Indirect eval (with ?.) is supposed to be safer and faster than direct eval
      // - eval executes in the local scope, so has to check every containing scope for variable references
      // - eval interferes with minification and conversion to machine code
      // - eval executes with whatever permissions the containing code has, giving more opportunity for malicious code
      // For more info, see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/eval
      const simFunction = eval?.(functionCode);
      simFunction?.(simRef.current, AA, AV);
    } catch (e) {
      setError(`Error setting up simulation: ${String(e)}`);
      return;
    }

    // Visualize and start the simulation
    AV.vis(simRef.current, { target: containerRef.current });
    simRef.current.pause(true);
    setPaused(true);

    setError("");

    const sim = simRef.current;
    const container = containerRef.current;
    return () => {
      // Remove old sim when we're ready to update the sim
      container?.replaceChildren();
      sim.end();
    };
  }, [blocklyCode, code, gridHeight, gridStep, gridWidth, resetCount]);

  const handlePauseClick = () => {
    if (simRef.current) {
      simRef.current.pause(!paused);
      setPaused(!paused);
    }
  };

  return (
    <div className={css.agentSimulationComponent}>
      {dataSourceInteractive && (
        <button
          className={css.updateButton}
          disabled={!externalBlocklyCode || blocklyCode === externalBlocklyCode}
          onClick={() => setBlocklyCode(externalBlocklyCode)}
        >
          Update Code
        </button>
      )}
      <button onClick={() => setResetCount(resetCount + 1)}>
        Reset
      </button>
      <button onClick={handlePauseClick}>
        {paused ? "Play" : "Pause"}
      </button>
      {error && <div className={css.error}>{error}</div>}
      <div ref={containerRef} className={css.simContainer} />
      { blocklyCode && (
        <>
          {showBlocklyCode &&
            <div className={css.code}>
              {blocklyCode}
            </div>
          }
          <button onClick={() => setShowBlocklyCode(!showBlocklyCode)}>
            {showBlocklyCode ? "Hide" : "Show"} Blockly Code
          </button>
        </>
      )}
    </div>
  );
};
