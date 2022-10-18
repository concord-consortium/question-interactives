import React from "react";

import { IRuntimeQuestionComponentProps } from "../../shared/components/base-question-app";
import { DefaultAuthoredState, IAuthoredState, IInteractiveState } from "./types";
import { BarChartComponent } from "./bar-chart";

import css from "./runtime.scss";

interface IProps extends IRuntimeQuestionComponentProps<IAuthoredState, IInteractiveState> {}

export const Runtime: React.FC<IProps> = ({ authoredState, interactiveState, setInteractiveState, report }) => {
  authoredState = {...DefaultAuthoredState, ...authoredState};

  return (
    <div className={css.barGraph}>
      <BarChartComponent
        authoredState={authoredState}
        interactiveState={interactiveState}
        setInteractiveState={setInteractiveState}
        report={report} />
    </div>
  );
};
