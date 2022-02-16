import React from "react";
import { IRuntimeQuestionComponentProps } from "../../shared/components/base-question-app";
import { IAuthoredState, IInteractiveState } from "./types";
import { renderHTML } from "../../shared/utilities/render-html";
import { ContainerWithDndProvider } from "./container-with-dnd-provider";

interface IProps extends IRuntimeQuestionComponentProps<IAuthoredState, IInteractiveState> {
  view?: string;
}

export const Runtime: React.FC<IProps> = (props) => {
  const { authoredState, report } = props;
  const urlParams = new URLSearchParams(window.location.search);
  const view = urlParams.get("view");
  if (view) {
    props  = {...props, view: view};
  }
  return (
    <div>
      <div>{(!report || view === "standalone") && renderHTML(authoredState.prompt || "")}</div>
      <ContainerWithDndProvider {...props} />
    </div>
  );
};
