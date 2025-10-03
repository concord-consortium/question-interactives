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
  const [blocklyCode, setBlocklyCode] = useState<string>("");
  const dataSourceInteractive = useLinkedInteractiveId("dataSourceInteractive");
  const containerRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(true);
  const simRef = useRef<AA.Simulation | null>(null);

  // Keep the blockly code updated with the linked interactive
  useEffect(() => {
    if (!dataSourceInteractive) return;

    const listener = (newLinkedIntState: IInteractiveState | undefined) => {
      const newBlocklyCode = newLinkedIntState && "blocklyCode" in newLinkedIntState && newLinkedIntState.blocklyCode;
      if (typeof newBlocklyCode === "string") {
        setBlocklyCode(newBlocklyCode);
      } else {
        setBlocklyCode("");
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
    // Set up the simulation
    simRef.current = new AA.Simulation({
      gridStep: gridStep,
      height: gridHeight,
      width: gridWidth
    });

    // Run the simulation setup code
    const functionCode = `(sim, AA) => { ${code} }`;
    // Indirect eval (with ?.) is supposed to be safer and faster than direct eval
    const simFunction = eval?.(functionCode);
    simFunction?.(simRef.current, AA);

    // Visualize and start the simulation
    AV.vis(simRef.current, { target: containerRef.current });
    simRef.current.pause(true);
  }, [code, gridHeight, gridStep, gridWidth]);

  const handlePauseClick = () => {
    if (simRef.current) {
      simRef.current.pause(!paused);
      setPaused(!paused);
    }
  };

  return (
    <div className={css.agentSimulationComponent}>
      <h4>Blockly Code</h4>
      <div className={css.code}>
        {blocklyCode}
      </div>
      <button onClick={handlePauseClick}>
        {paused ? "Play" : "Pause"}
      </button>
      <div ref={containerRef} className={css.simContainer} />
    </div>
  );
};
