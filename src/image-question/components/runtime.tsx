import React, { useRef, useCallback, useMemo } from "react";
import { IRuntimeQuestionComponentProps } from "../../shared/components/base-question-app";
import { renderHTML } from "../../shared/utilities/render-html";
import { IAuthoredState, IInteractiveState } from "./app";
import css from "./runtime.scss";
import { Runtime as DrawingToolRuntime } from "../../drawing-tool/components/runtime";
import { IAuthoredState as IDrawingAuthoredState } from "../../drawing-tool/components/app";
import { IProps as IDrawingToolProps } from "../../drawing-tool/components/runtime";

interface IProps extends IRuntimeQuestionComponentProps<IAuthoredState, IInteractiveState> {
}

const usePrevious = (value: any) => {
  const ref = React.useRef();
  React.useEffect(function() {
    ref.current = value;
  }, [value]);
  return ref.current;
};

export const Runtime: React.FC<IProps> = ({ authoredState, interactiveState, setInteractiveState, report }) => {
  const readOnly = report || (authoredState.required && interactiveState?.submitted);

  const drawingAuthoredStateRef = useRef<IDrawingAuthoredState>({
    version: authoredState.version,
    imageFit: authoredState.imageFit,
    imagePosition: authoredState.imagePosition,
    stampCollections: authoredState.stampCollections,
    questionType: "iframe_interactive"
  });

  const drawingAuthoredState = useMemo(() => drawingAuthoredStateRef.current, []);

  const prevDrawingAuthoringState = usePrevious(drawingAuthoredStateRef.current);

  console.log("drawingAuthoringState comparison:", prevDrawingAuthoringState === drawingAuthoredStateRef.current);

  const _drawState = (interactiveState?.drawingState) ? interactiveState?.drawingState : "";
  const _textState = (interactiveState?.answerText) ? interactiveState?.answerText : "";

  const drawingStateRef = useRef<any>({ drawingState: _drawState });
  const textStateRef = useRef<any>(_textState);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const setInteractiveStateCallback = useCallback((intState) => { setInteractiveState?.(intState);}, []);

  const handleSetInteractiveState = useCallback(() => {
    console.log("I'm handleSetInteractiveState");
    setInteractiveStateCallback?.((prevState: any) => ({
      ...prevState,
      drawingState: drawingStateRef.current,
      answerType: "interactive_state",
      answerText: textStateRef.current
    }));
  }, [setInteractiveStateCallback]);

  const handleDrawingChange = useCallback((userState: string) => {
    drawingStateRef.current = { drawingState: userState };
    console.log("I'm handleDrawingChanged");
    handleSetInteractiveState();
  }, [handleSetInteractiveState]);

  const handleTextChange = useCallback((event: React.ChangeEvent<HTMLTextAreaElement>) => {
    textStateRef.current = event.target.value;
    console.log("I'm handleTextChanged");
    handleSetInteractiveState();
  }, [handleSetInteractiveState]);

  const areEqual = (prevProps: IDrawingToolProps, nextProps: IDrawingToolProps) => {
    debugger;
    console.log("authoredState:", prevProps.authoredState === nextProps.authoredState);
    console.log("interactiveState:", prevProps.interactiveState === nextProps.interactiveState);
    console.log("onDrawingChange:", prevProps.onDrawingChange === nextProps.onDrawingChange);
    return true;
  };

  console.log("rendering in image question");
  const DrawToolMemo = React.memo(DrawingToolRuntime, areEqual);
  return (
    <fieldset>
      { authoredState.prompt &&
        <legend className={css.prompt}>
          {renderHTML(authoredState.prompt)}
        </legend> }
        <DrawToolMemo authoredState={drawingAuthoredState} interactiveState={drawingStateRef.current} onDrawingChange={handleDrawingChange} />
      <div>
        <textarea
          value={textStateRef.current}
          onChange={readOnly ? undefined : handleTextChange}
          readOnly={readOnly}
          disabled={readOnly}
          rows={8}
          placeholder={authoredState.defaultAnswer || "Please type your answer here."}
        />
      </div>

    </fieldset>
  );
};
