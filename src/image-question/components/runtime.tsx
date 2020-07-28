import React, { useRef } from "react";
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
  const drawingAuthoredState: IDrawingAuthoredState = {
    version: authoredState.version,
    imageFit: authoredState.imageFit,
    imagePosition: authoredState.imagePosition,
    stampCollections: authoredState.stampCollections,
    questionType: "iframe_interactive"
  };

  const _drawState = (interactiveState?.drawingState) ? interactiveState?.drawingState : "";
  const _textState = (interactiveState?.answerText) ? interactiveState?.answerText : "";

  const drawingStateRef = useRef<any>({ drawingState: _drawState });
  const textStateRef = useRef<any>(_textState);

  const handleDrawingChange = (userState: string) => {
    drawingStateRef.current = { drawingState: userState };
    handleSetState();
  };

  const handleTextChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    textStateRef.current = event.target.value;
    handleSetState();
  };

  const handleSetState = () => {
    setInteractiveState?.(prevState => ({
      ...prevState,
      drawingState: drawingStateRef.current,
      answerType: "interactive_state",
      answerText: textStateRef.current
    }));
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
          onChange={readOnly ? undefined : handleTextChange}
          readOnly={readOnly}
          disabled={readOnly}
          rows={8}
          placeholder={authoredState.defaultAnswer || "Please type your answer here."}
        />
      </div>
      <DrawingToolRuntime authoredState={drawingAuthoredState} interactiveState={drawingStateRef.current} onDrawingChange={handleDrawingChange} />
    </fieldset>
  );
};
