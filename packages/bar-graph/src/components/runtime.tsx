import React from "react";

import { IRuntimeQuestionComponentProps } from "@concord-consortium/question-interactives-helpers/src/components/base-question-app";
import { DefaultAuthoredState, IAuthoredState, IInteractiveState } from "./types";
import { BarChartComponent } from "./bar-chart";
import { renderHTML } from "@concord-consortium/question-interactives-helpers/src/utilities/render-html";

import css from "./runtime.scss";

interface IProps extends IRuntimeQuestionComponentProps<IAuthoredState, IInteractiveState> {}

export const Runtime: React.FC<IProps> = ({ authoredState, interactiveState, setInteractiveState, report }) => {
  authoredState = {...DefaultAuthoredState, ...authoredState};

  return (
    <div className={css.barGraph}>
      {authoredState.prompt && <div>{renderHTML(authoredState.prompt)}</div>}
      <BarChartComponent
        authoredState={authoredState}
        interactiveState={interactiveState}
        setInteractiveState={setInteractiveState}
        report={report}
      />
    </div>
  );
};
