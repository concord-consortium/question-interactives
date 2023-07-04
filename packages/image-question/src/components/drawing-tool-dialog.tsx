import React from "react";
import { IAuthoredState, IInteractiveState } from "./types";
import { UpdateFunc } from "@concord-consortium/question-interactives-helpers/src/components/base-app";
import { DrawingTool } from "drawing-tool-interactive/src/components/drawing-tool";
import { DynamicText } from "@concord-consortium/dynamic-text";
import { renderHTML } from "@concord-consortium/question-interactives-helpers/src/utilities/render-html";
import CorrectIcon from "@concord-consortium/question-interactives-helpers/src/icons/correct.svg";
import classnames from "classnames";

import cssHelpers from "@concord-consortium/question-interactives-helpers/src/styles/helpers.scss";
import css from "./drawing-tool-dialog.scss";

interface IProps {
  authoredState: IAuthoredState;
  interactiveState?: IInteractiveState|null;
  handleDrawingToolSetIntState: (updateFunc: UpdateFunc<IInteractiveState>) => void;
  handleTextChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  savingAnnotatedImage: boolean;
  handleCancel: () => void;
  handleClose: () => void;
}

const kGlobalDefaultAnswer = "Please type your answer here.";

export const DrawingToolDialog: React.FC<IProps> = ({authoredState, interactiveState, handleDrawingToolSetIntState,
  handleTextChange, savingAnnotatedImage, handleCancel, handleClose}) => {
  const {prompt, answerPrompt, defaultAnswer} = authoredState;
  const bodyWidth = document.getElementsByTagName("body").item(0)?.clientWidth || window.innerWidth;
  const onIPad = bodyWidth <= 960;

  return (
    <div className={css.dialogContent} style={{width: onIPad ? 840 : 960}}>
      <div className={css.drawingTool} style={{width: onIPad ? 550 : 650}}>
        <DrawingTool
          authoredState={authoredState}
          interactiveState={interactiveState}
          setInteractiveState={handleDrawingToolSetIntState}
          width={onIPad ? 500 : 600}
        />
      </div>
      <div className={css.dialogRightPanel} style={{width: onIPad ? 250 : 280}}>
        { prompt && <div className={css.prompt}><DynamicText>{renderHTML(prompt)}</DynamicText></div> }
        { answerPrompt && <>
          <hr />
          <div className={css.answerPrompt}><DynamicText>{renderHTML(answerPrompt)}</DynamicText></div>
          <textarea
            value={interactiveState?.answerText || ""}
            onChange={handleTextChange}
            rows={8}
            className={interactiveState?.answerText ? css.hasAnswer : css.default}
            placeholder={defaultAnswer || kGlobalDefaultAnswer}
          />
        </> }
        <div className={css.closeDialogSection}>
          { savingAnnotatedImage ?
            <div>Please wait while your drawing is being saved...</div> :
            <div className={css.closeDialogButtons}>
              <button className={cssHelpers.interactiveButton} onClick={handleCancel} data-test="cancel-upload-btn">
                Cancel
              </button>
              <button
                className={classnames(cssHelpers.interactiveButton, cssHelpers.withIcon)}
                onClick={handleClose}
                data-test="close-dialog-btn">
                  <CorrectIcon/>
                  <div className={cssHelpers.buttonText}>Done</div>
              </button>
            </div>
          }
        </div>
      </div>
    </div>
  );
};
