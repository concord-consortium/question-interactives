import React, { useMemo, useRef, useState } from "react";
import { IRuntimeQuestionComponentProps } from "../../shared/components/base-question-app";
import { renderHTML } from "../../shared/utilities/render-html";
import { IAuthoredState, IInteractiveState } from "./app";
import css from "./runtime.scss";
import { Runtime as DrawingToolRuntime } from "../../drawing-tool/components/runtime";
import { IAuthoredState as IDrawingAuthoredState } from "../../drawing-tool/components/app";
import { IInteractiveState as IDrawingInteractiveState } from "../../drawing-tool/components/app";

// https://stackoverflow.com/a/52703444
type OptionalExceptFor<T, TRequired extends keyof T> = Partial<T> & Pick<T, TRequired>;
type IPartialDrawingInteractiveState = OptionalExceptFor<IDrawingInteractiveState, "drawingState">;

interface IProps extends IRuntimeQuestionComponentProps<IAuthoredState, IInteractiveState> {
}

const kGlobalDefaultAnswer = "Please type your answer here.";

export const Runtime: React.FC<IProps> = ({ authoredState, interactiveState, setInteractiveState, report }) => {
  const { version, imageFit, imagePosition, required, stampCollections } = authoredState;
  const readOnly = report || (required && interactiveState?.submitted);

  const drawingAuthoredState = useMemo<IDrawingAuthoredState>(() => ({
    version,
    imageFit,
    imagePosition,
    stampCollections,
    questionType: "iframe_interactive"
  }), [imageFit, imagePosition, stampCollections, version]);

  const drawStateRef = useRef<IPartialDrawingInteractiveState>({
                          drawingState: interactiveState?.drawingState || "" });
  const [textState, setTextState] = useState<string>(interactiveState?.answerText || "");

  const handleSetInteractiveState = (newTextState?: string) => {
    setInteractiveState?.((prevState: any) => ({
      ...prevState,
      drawingState: drawStateRef.current.drawingState,
      answerType: "interactive_state",
      answerText: newTextState ?? textState
    }));
  };

  const handleDrawingChange = (userState: string) => {
    drawStateRef.current = { drawingState: userState };
    handleSetInteractiveState();
  };

  const handleTextChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTextState(event.target.value);
    handleSetInteractiveState(event.target.value);
  };

  return (
    <fieldset>
      { authoredState.prompt &&
        <legend className={css.prompt}>
          {renderHTML(authoredState.prompt)}
        </legend> }
      <DrawingToolRuntime
        authoredState={drawingAuthoredState}
        interactiveState={drawStateRef.current as IDrawingInteractiveState}
        onDrawingChange={handleDrawingChange} />
      <div>
        <textarea
          value={textState}
          onChange={readOnly ? undefined : handleTextChange}
          readOnly={readOnly}
          disabled={readOnly}
          rows={8}
          placeholder={authoredState.defaultAnswer || kGlobalDefaultAnswer}
        />
      </div>

    </fieldset>
  );
};
