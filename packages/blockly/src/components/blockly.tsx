import React, { useEffect } from "react";

import { IRuntimeQuestionComponentProps } from "@concord-consortium/question-interactives-helpers/src/components/base-question-app";
import { IAuthoredState, IInteractiveState } from "./types";

import css from "./blockly.scss";

interface IProps extends IRuntimeQuestionComponentProps<IAuthoredState, IInteractiveState> {}

export const BlocklyComponent: React.FC<IProps> = ({ authoredState, interactiveState, setInteractiveState, report }) => {
  const { config } = authoredState;

  useEffect(() => {
    // TODO: update blockly based on config changes
  }, [config]);

  return (
    <div className={css.blockly}>
      {JSON.stringify(config, null, 2)}
    </div>
  );
};
