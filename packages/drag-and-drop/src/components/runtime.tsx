import React from "react";
import { IRuntimeQuestionComponentProps } from "@concord-consortium/question-interactives-helpers/src/components/base-question-app";
import { DynamicText } from "@concord-consortium/dynamic-text";

import { IAuthoredState, IInteractiveState } from "./types";
import { renderHTML } from "@concord-consortium/question-interactives-helpers/src/utilities/render-html";
import { ContainerWithDndProvider } from "./container-with-dnd-provider";

interface IProps extends IRuntimeQuestionComponentProps<IAuthoredState, IInteractiveState> {}

export const Runtime: React.FC<IProps> = (props) => {
  const { authoredState, report, view } = props;
  return (
    <div>
      <div>{(!report || view === "standalone") && <DynamicText>{renderHTML(authoredState.prompt || "")}</DynamicText>}</div>
      <ContainerWithDndProvider {...props} />
    </div>
  );
};
