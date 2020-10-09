import React, { useState } from "react";
import { IRuntimeQuestionComponentProps } from "../../shared/components/base-question-app";
import { IAuthoredState, IInteractiveState } from "./app";
import { showModal } from "@concord-consortium/lara-interactive-api";
import { TakeSnapshot } from "../../drawing-tool/components/take-snapshot";
import { UploadBackground } from "../../drawing-tool/components/upload-background";
import { getURLParam } from "../../shared/utilities/get-url-param";
import { DrawingTool } from "../../drawing-tool/components/drawing-tool";
import { renderHTML } from "../../shared/utilities/render-html";
import css from "./runtime.scss";
import cssHelpers from "../../shared/styles/helpers.scss";

interface IProps extends IRuntimeQuestionComponentProps<IAuthoredState, IInteractiveState> {}

const kGlobalDefaultAnswer = "Please type your answer here.";
const drawingToolDialogUrlParam = "drawingToolDialog";

export const Runtime: React.FC<IProps> = ({ authoredState, interactiveState, setInteractiveState, report }) => {
  const readOnly = report || (authoredState.required && interactiveState?.submitted);
  const [ controlsHidden, setControlsHidden ] = useState(false);
  const drawingToolDialog = getURLParam(drawingToolDialogUrlParam);
  const useSnapshot = authoredState?.backgroundSource === "snapshot";
  const useUpload = authoredState?.backgroundSource === "upload";

  const openDrawingToolDialog = () => {
    setControlsHidden(false);
    showModal({ type: "dialog", url: window.location.href + "?" + drawingToolDialogUrlParam });
  };

  const handleTextChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInteractiveState?.((prevState: IInteractiveState) => ({
      ...prevState,
      answerText: event.target.value,
      answerType: "interactive_state"
    }));
  };

  const hideControls = () => {
    setControlsHidden(true);
  };

  const renderInline = () => (
    // Render answer prompt and answer text in inline mode to replicate LARA's Image Question UI
    <div>
      { authoredState.prompt && <div>{renderHTML(authoredState.prompt)}</div> }
      { authoredState.answerPrompt && <div>{renderHTML(authoredState.answerPrompt)}</div> }
      <div className={css.studentAnswerText}>{ interactiveState?.answerText }</div>
      {
        !readOnly &&
        <div>
          {
            useSnapshot &&
            <TakeSnapshot
              authoredState={authoredState}
              interactiveState={interactiveState}
              setInteractiveState={setInteractiveState}
              onUploadStart={hideControls}
              onUploadComplete={openDrawingToolDialog}
            />
          }
          {
            useUpload &&
            <UploadBackground
              setInteractiveState={setInteractiveState}
              onUploadStart={hideControls}
              onUploadComplete={openDrawingToolDialog} />
          }
          {
            !controlsHidden && interactiveState?.userBackgroundImageUrl &&
            <button className={cssHelpers.laraButton} onClick={openDrawingToolDialog} data-test="edit-btn">
              Edit
            </button>
          }
        </div>
      }
    </div>
  );

  const renderDialog = () => (
    <div>
      { authoredState.prompt && <div>{renderHTML(authoredState.prompt)}</div> }
      <DrawingTool
        authoredState={authoredState}
        interactiveState={interactiveState}
        setInteractiveState={setInteractiveState}
      />
      <div>
        { authoredState.answerPrompt && <div className={css.answerPrompt}>{renderHTML(authoredState.answerPrompt)}</div> }
        <textarea
          value={interactiveState?.answerText || ""}
          onChange={handleTextChange}
          rows={8}
          placeholder={authoredState.defaultAnswer || kGlobalDefaultAnswer}
        />
      </div>
    </div>
  );

  return drawingToolDialog ? renderDialog() : renderInline();
};
