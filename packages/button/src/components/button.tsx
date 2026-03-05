import React from "react";

import { IRuntimeQuestionComponentProps } from "@concord-consortium/question-interactives-helpers/src/components/base-question-app";
import { IAuthoredState, IInteractiveState } from "./types";

import css from "./button.scss";

interface IProps extends IRuntimeQuestionComponentProps<IAuthoredState, IInteractiveState> {}

export const ButtonComponent: React.FC<IProps> = ({ authoredState }) => {
  return (
    <div className={css.buttonComponent}>
      <p><strong>Temporary Debug View</strong> — this will be replaced with the button component in a future story.</p>
      <pre>{JSON.stringify(authoredState, null, 2)}</pre>
    </div>
  );
};
