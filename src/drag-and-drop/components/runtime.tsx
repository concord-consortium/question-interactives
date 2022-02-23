import React from "react";
import { IRuntimeQuestionComponentProps } from "../../shared/components/base-question-app";
import { IAuthoredState, IInteractiveState } from "./types";
import { renderHTML } from "../../shared/utilities/render-html";
import { ContainerWithDndProvider } from "./container-with-dnd-provider";

interface IProps extends IRuntimeQuestionComponentProps<IAuthoredState, IInteractiveState> {}

export const Runtime: React.FC<IProps> = (props) => {
  const { authoredState, report, view } = props;
  return (
    <div>
      <div>{(!report || view === "standalone") && renderHTML(authoredState.prompt || "")}</div>
      <ContainerWithDndProvider {...props} />
    </div>
  );
};
