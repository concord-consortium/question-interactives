import React from "react";

import { IRuntimeQuestionComponentProps } from "@concord-consortium/question-interactives-helpers/src/components/base-question-app";
import { IAuthoredState, IInteractiveState } from "./types";

import css from "./agent-simulation.scss";

interface IProps extends IRuntimeQuestionComponentProps<IAuthoredState, IInteractiveState> {}

export const AgentSimulationComponent: React.FC<IProps> = ({ authoredState, interactiveState, setInteractiveState, report }) => {
  const exampleAuthoredState = (authoredState.exampleAuthoredState ?? "").replace(/\\n/g, "<br/>");

  React.useEffect(() => {
    const update = () => {
      setInteractiveState?.((prev: IInteractiveState) => {
        return {
          ...prev,
          exampleInteractiveState: new Date().toISOString()
        };
      });
    };

    update();
    const timer = setInterval(update, 1000);
    return () => clearTimeout(timer);
  }, [setInteractiveState]);

  return (
    <div className={css.agentSimulationComponent}>
      <div><strong>TODO: Replace this AgentSimulationComponent with your interactive.</strong></div>
      <div>Below is an example of reading the exampleAuthoredState value from authoredState:</div>
      <div className={css.example} dangerouslySetInnerHTML={{ __html: exampleAuthoredState }} />
      <div>Below is an example of reading the exampleInteractiveState value from interactiveState:</div>
      <div className={css.example}>{interactiveState?.exampleInteractiveState}</div>
    </div>
  );
};
