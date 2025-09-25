import React, { useEffect, useState } from "react";
import { DynamicText } from "@concord-consortium/dynamic-text";
import {
  addLinkedInteractiveStateListener, removeLinkedInteractiveStateListener
} from "@concord-consortium/lara-interactive-api";
import {
  IRuntimeQuestionComponentProps
} from "@concord-consortium/question-interactives-helpers/src/components/base-question-app";
import {
  useLinkedInteractiveId
} from "@concord-consortium/question-interactives-helpers/src/hooks/use-linked-interactive-id";
import { renderHTML } from "@concord-consortium/question-interactives-helpers/src/utilities/render-html";

import { AgentSimulationComponent } from "./agent-simulation";
import { DefaultAuthoredState, IAuthoredState, IInteractiveState } from "./types";

import css from "./runtime.scss";

interface IProps extends IRuntimeQuestionComponentProps<IAuthoredState, IInteractiveState> {}

export const Runtime: React.FC<IProps> = ({ authoredState, interactiveState, setInteractiveState, report }) => {
  authoredState = {...DefaultAuthoredState, ...authoredState};
  const [blocklyCode, setBlocklyCode] = useState<string>("");
  const dataSourceInteractive1 = useLinkedInteractiveId("dataSourceInteractive1");

  useEffect(() => {
    if (!dataSourceInteractive1) return;

    const listener = (newLinkedIntState: IInteractiveState | undefined) => {
      const newBlocklyCode = newLinkedIntState && "blocklyCode" in newLinkedIntState && newLinkedIntState.blocklyCode;
      if (typeof newBlocklyCode === "string") {
        setBlocklyCode(newBlocklyCode);
      } else {
        setBlocklyCode("");
      }

      const options = { interactiveItemId: dataSourceInteractive1 };
      addLinkedInteractiveStateListener<any>(listener, options);
    };

    return () => {
      removeLinkedInteractiveStateListener<any>(listener);
    };
  }, [dataSourceInteractive1]);

  return (
    <div className={css.agentSimulation}>
      {authoredState.prompt && <div><DynamicText>{renderHTML(authoredState.prompt)}</DynamicText></div>}
      <p>{blocklyCode}</p>
      <AgentSimulationComponent
        authoredState={authoredState}
        interactiveState={interactiveState}
        setInteractiveState={setInteractiveState}
        report={report}
      />
    </div>
  );
};
