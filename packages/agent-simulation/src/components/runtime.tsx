import React from "react";
import { DynamicText } from "@concord-consortium/dynamic-text";
import {
  IRuntimeQuestionComponentProps
} from "@concord-consortium/question-interactives-helpers/src/components/base-question-app";
import { renderHTML } from "@concord-consortium/question-interactives-helpers/src/utilities/render-html";

import { AgentSimulationComponent } from "./agent-simulation";
import { DefaultAuthoredState, IAuthoredState, IInteractiveState } from "./types";

import css from "./runtime.scss";

interface IProps extends IRuntimeQuestionComponentProps<IAuthoredState, IInteractiveState> {}

export const Runtime: React.FC<IProps> = ({ authoredState, interactiveState, setInteractiveState, report }) => {
  authoredState = {...DefaultAuthoredState, ...authoredState};

  return (
    <div className={css.agentSimulation}>
      {authoredState.prompt && <div><DynamicText>{renderHTML(authoredState.prompt)}</DynamicText></div>}
      <AgentSimulationComponent
        authoredState={authoredState}
        interactiveState={interactiveState}
        setInteractiveState={setInteractiveState}
        report={report}
      />
    </div>
  );
};
