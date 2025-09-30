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
import { sim } from "./sims/predator-prey-model";
import { IAuthoredState, IInteractiveState } from "./types";

import css from "./agent-simulation.scss";

interface IProps extends IRuntimeQuestionComponentProps<IAuthoredState, IInteractiveState> {}

export const AgentSimulationComponent = ({
  authoredState, interactiveState, setInteractiveState, report
}: IProps) => {
  const [blocklyCode, setBlocklyCode] = useState<string>("");
  const dataSourceInteractive = useLinkedInteractiveId("dataSourceInteractive");
  const containerRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef<boolean>(false);

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

  useEffect(() => {
    AV.vis(sim, { target: containerRef.current });
  }, []);

  const handlePauseClick = () => {
    sim.pause(!pausedRef.current);
    pausedRef.current = !pausedRef.current;
  };

  return (
    <div className={css.agentSimulationComponent}>
      <h4>Blockly Code</h4>
      <div className={css.blocklyCode}>
        {blocklyCode}
      </div>
      <button onClick={handlePauseClick}>
        {pausedRef.current ? "Resume" : "Pause"}
      </button>
      <div ref={containerRef} className={css.simContainer} />
    </div>
  );
};
