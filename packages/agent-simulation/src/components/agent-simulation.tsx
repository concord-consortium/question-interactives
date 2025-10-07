import React, { useEffect, useState } from "react";

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
  const [code, setCode] = useState<string>("");
  const dataSourceInteractive = useLinkedInteractiveId("dataSourceInteractive");

  // Keep the blockly code updated with the linked interactive
  useEffect(() => {
    if (!dataSourceInteractive) return;

    const listener = (newLinkedIntState: IInteractiveState | undefined) => {
      const newCode = newLinkedIntState && "code" in newLinkedIntState && newLinkedIntState.code;
      if (typeof newCode === "string") {
        setCode(newCode);
      } else {
        setCode("");
      }
    };

    const options = { interactiveItemId: dataSourceInteractive };
    addLinkedInteractiveStateListener<any>(listener, options);

    return () => {
      removeLinkedInteractiveStateListener<any>(listener);
    };
  }, [dataSourceInteractive]);

  return (
    <div className={css.agentSimulationComponent}>
      <h4>Blockly Code</h4>
      <div className={css.code}>
        {code}
      </div>
    </div>
  );
};
