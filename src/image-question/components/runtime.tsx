import React from "react";
import { IRuntimeQuestionComponentProps } from "../../shared/components/base-question-app";
import { renderHTML } from "../../shared/utilities/render-html";
import { IAuthoredState, IInteractiveState } from "./app";
import css from "./runtime.scss";
import { Runtime as DrawingToolRuntime } from "../../drawing-tool/components/runtime";
import { IAuthoredState as IDrawingAuthoredState } from "../../drawing-tool/components/app";

interface IProps extends IRuntimeQuestionComponentProps<IAuthoredState, IInteractiveState> {
}

export const Runtime: React.FC<IProps> = ({ authoredState, interactiveState, setInteractiveState, report }) => {
  const readOnly = report || (authoredState.required && interactiveState?.submitted);
  const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInteractiveState?.(prevState => ({...prevState, drawingState: "", answerType: "interactive_state", answerText: event.target.value }));
  };
  const drawingState: IDrawingAuthoredState = {
    version: authoredState.version,
    imageFit: authoredState.imageFit,
    imagePosition: authoredState.imagePosition,
    stampCollections: authoredState.stampCollections,
    questionType: "iframe_interactive"
  };

  return (
    <fieldset>
      { authoredState.prompt &&
        <legend className={css.prompt}>
          {renderHTML(authoredState.prompt)}
        </legend> }
      <div>
        <textarea
          value={interactiveState?.answerText}
          onChange={readOnly ? undefined : handleChange}
          readOnly={readOnly}
          disabled={readOnly}
          rows={8}
          placeholder={authoredState.defaultAnswer || "Please type your answer here."}
        />
      </div>
      <DrawingToolRuntime authoredState={drawingState} />
    </fieldset>
  );
};
