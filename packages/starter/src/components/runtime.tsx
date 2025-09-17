import React from "react";
import { IRuntimeQuestionComponentProps } from "@concord-consortium/question-interactives-helpers/src/components/base-question-app";
import { renderHTML } from "@concord-consortium/question-interactives-helpers/src/utilities/render-html";
import { DynamicText } from "@concord-consortium/dynamic-text";

import { DefaultAuthoredState, IAuthoredState, IInteractiveState } from "./types";
import { StarterComponent } from "./starter";

import css from "./runtime.scss";

interface IProps extends IRuntimeQuestionComponentProps<IAuthoredState, IInteractiveState> {}

export const Runtime: React.FC<IProps> = ({ authoredState, interactiveState, setInteractiveState, report }) => {
  authoredState = {...DefaultAuthoredState, ...authoredState};

  return (
    <div className={css.barGraph}>
      {authoredState.prompt && <div><DynamicText>{renderHTML(authoredState.prompt)}</DynamicText></div>}
      <StarterComponent
        authoredState={authoredState}
        interactiveState={interactiveState}
        setInteractiveState={setInteractiveState}
        report={report}
      />
    </div>
  );
};
