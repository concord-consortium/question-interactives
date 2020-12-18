import React from "react";
import { IRuntimeQuestionComponentProps } from "../../shared/components/base-question-app";
import { IAuthoredState, IInteractiveState } from "./types";
import { renderHTML } from "../../shared/utilities/render-html";
import { DndProvider } from "react-dnd";
import { TouchBackend } from "react-dnd-touch-backend";
import { Container } from "./container";

interface IProps extends IRuntimeQuestionComponentProps<IAuthoredState, IInteractiveState> {}

export const Runtime: React.FC<IProps> = (props) => {
  return (
    <DndProvider backend={TouchBackend} options={{enableMouseEvents: true}} >
      <div>
        <div>{renderHTML(props.authoredState.prompt || "")}</div>
        <Container {...props} />
      </div>
    </DndProvider>
  );
};
