import React from "react";
import { IRuntimeQuestionComponentProps } from "../../shared/components/base-question-app";
import { IAuthoredState, IInteractiveState } from "./types";
import { renderHTML } from "../../shared/utilities/render-html";
import { ContainerWithDndProvider } from "./container-with-dnd-provider";

interface IProps extends IRuntimeQuestionComponentProps<IAuthoredState, IInteractiveState> {}

export const Runtime: React.FC<IProps> = (props) => {
  return (
    <div>
      <div>{renderHTML(props.authoredState.prompt || "")}</div>
      <ContainerWithDndProvider {...props} />
    </div>
  );
};
