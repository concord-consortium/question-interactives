import React, { useState } from "react";
import { IRuntimeQuestionComponentProps } from "@concord-consortium/question-interactives-helpers/src/components/base-question-app";
import { closeModal, showModal } from "@concord-consortium/lara-interactive-api";
import { TakeSnapshot } from "drawing-tool-interactive/src/components/take-snapshot";
import { UploadBackground } from "drawing-tool-interactive/src/components/upload-background";
import { getURLParam } from "@concord-consortium/question-interactives-helpers/src/utilities/get-url-param";
import { DrawingTool, drawingToolCanvasSelector } from "drawing-tool-interactive/src/components/drawing-tool";
import { renderHTML } from "@concord-consortium/question-interactives-helpers/src/utilities/render-html";
import { UpdateFunc } from "@concord-consortium/question-interactives-helpers/src/components/base-app";
import Shutterbug from "shutterbug";
import PencilIcon from "@concord-consortium/question-interactives-helpers/src/icons/pencil.svg";
import { useCorsImageErrorCheck } from "@concord-consortium/question-interactives-helpers/src/hooks/use-cors-image-error-check";
import { DecorateChildren } from "@concord-consortium/text-decorator";
import { useGlossaryDecoration } from "@concord-consortium/question-interactives-helpers/src/hooks/use-glossary-decoration";
import { DynamicText } from "@concord-consortium/dynamic-text";

import { IAuthoredState, IInteractiveState } from "./types";

import css from "./runtime.scss";
import cssHelpers from "@concord-consortium/question-interactives-helpers/src/styles/helpers.scss";

interface IProps extends IRuntimeQuestionComponentProps<IAuthoredState, IInteractiveState> {}

const kGlobalDefaultAnswer = "Please type your answer here.";
const drawingToolDialogUrlParam = "drawingToolDialog";

export const Runtime: React.FC<IProps> = ({ authoredState, interactiveState, setInteractiveState, report }) => {
  const decorateOptions = useGlossaryDecoration();
  const readOnly = report || (authoredState.required && interactiveState?.submitted);
  const [ controlsHidden, setControlsHidden ] = useState(false);
  const [ drawingStateUpdated, setDrawingStateUpdated ] = useState(false);
  const [ savingAnnotatedImage, setSavingAnnotatedImage ] = useState(false);
  const drawingToolDialog = getURLParam(drawingToolDialogUrlParam);
  const authoredBgCorsError = useCorsImageErrorCheck({
    performTest: authoredState.backgroundSource === "url" && !!authoredState.backgroundImageUrl,
    imgSrc: authoredState.backgroundImageUrl
  });

  const snapshotOrUploadFinished = ({ success }: { success: boolean }) => {
    setControlsHidden(false);
    if (success) {
      openDrawingToolDialog();
    }
  };

  const openDrawingToolDialog = () => {
    // notCloseable: true disabled click-to-close backdrop and X icon in the corner.
    // Dialog can be closed only via closeModal API.
    const url = new URL(window.location.href);
    url.searchParams.append(drawingToolDialogUrlParam, "true");
    showModal({ type: "dialog", url: url.toString(), notCloseable: true });
  };

  const handleDrawingToolSetIntState = (updateFunc: UpdateFunc<IInteractiveState>) => {
    setInteractiveState?.(updateFunc);
    const newDrawingState = updateFunc(interactiveState || null).drawingState;
    if (newDrawingState !== interactiveState?.drawingState) {
      setDrawingStateUpdated(true);
    }
  };

  const handleTextChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInteractiveState?.((prevState: IInteractiveState) => ({
      ...prevState,
      answerText: event.target.value,
      answerType: "image_question_answer"
    }));
  };

  const hideControls = () => {
    setControlsHidden(true);
  };

  const handleClose = () => {
    if (!drawingStateUpdated) {
      // Just close the modal, there's no need to take a new PNG copy of the drawing tool.
      closeModal({});
      return;
    }
    setSavingAnnotatedImage(true);
    Shutterbug.snapshot({
      selector: drawingToolCanvasSelector,
      done: (snapshotUrl: string) => {
        setInteractiveState?.((prevState: IInteractiveState) => ({
          ...prevState,
          answerImageUrl: snapshotUrl,
          answerType: "image_question_answer"
        }));
        closeModal({});
      },
      fail: (jqXHR: any, textStatus: any, errorThrown: any) => {
        window.alert("Image saving has failed. Please try to close the dialog again. If it continues to fail, try to reload the whole page.");
        console.error("Snapshot has failed", textStatus, errorThrown);
      },
      always: () => {
        setSavingAnnotatedImage(false);
      }
    });
  };

  const renderInline = () => {
    if (authoredBgCorsError) {
      return <div className={css.error}>Authored background image is not CORS enabled. Please use a different background
        image URL or change configuration of the host.</div>;
    }

    const renderSnapshot = authoredState?.backgroundSource === "snapshot";
    const renderUpload = authoredState?.backgroundSource === "upload";
    const renderMakeDrawing = !renderSnapshot && !renderUpload;
    const previousAnswerAvailable = interactiveState?.userBackgroundImageUrl || interactiveState?.answerImageUrl;
    const authoredBackgroundUrl = authoredState?.backgroundSource === "url" && authoredState.backgroundImageUrl;
    const inlineImage = interactiveState?.answerImageUrl || interactiveState?.userBackgroundImageUrl || authoredBackgroundUrl;
    // Render answer prompt and answer text in inline mode to replicate LARA's Image Question UI
    return <div>
      { authoredState.prompt &&
        <DynamicText>
          <DecorateChildren decorateOptions={decorateOptions}>
            <div>{renderHTML(authoredState.prompt)}</div>
          </DecorateChildren>
        </DynamicText>
      }
      { inlineImage && <div><img src={inlineImage} className={css.inlineImg} alt="user work"/></div> }
      { authoredState.answerPrompt && <>
        <div><DynamicText>{renderHTML(authoredState.answerPrompt)}</DynamicText></div>
        <div className={css.studentAnswerText}><DynamicText>{interactiveState?.answerText}</DynamicText></div>
      </> }
      {
        !readOnly &&
        <div>
          {
            renderSnapshot &&
            <TakeSnapshot
              authoredState={authoredState}
              interactiveState={interactiveState}
              setInteractiveState={setInteractiveState}
              onUploadStart={hideControls}
              onUploadComplete={snapshotOrUploadFinished}
            />
          }
          {
            renderUpload &&
            <UploadBackground
              authoredState={authoredState}
              setInteractiveState={setInteractiveState}
              onUploadStart={hideControls}
              onUploadComplete={snapshotOrUploadFinished} />
          }
          {
            !controlsHidden && (renderMakeDrawing || previousAnswerAvailable) &&
            <button className={cssHelpers.apButton} onClick={openDrawingToolDialog} data-test="edit-btn">
              { previousAnswerAvailable ? "Edit" : <span><PencilIcon className={cssHelpers.smallIcon}/> Make Drawing</span> }
            </button>
          }
        </div>
      }
    </div>;
  };

  const renderDialog = () => (
    <div className={css.dialogContent}>
      <div className={css.drawingTool}>
        <DrawingTool
          authoredState={authoredState}
          interactiveState={interactiveState}
          setInteractiveState={handleDrawingToolSetIntState}
        />
      </div>
      <div className={css.dialogRightPanel}>
        { authoredState.prompt && <div><DynamicText>{renderHTML(authoredState.prompt)}</DynamicText></div> }
        { authoredState.answerPrompt && <>
          <hr />
          <div className={css.answerPrompt}><DynamicText>{renderHTML(authoredState.answerPrompt)}</DynamicText></div>
          <textarea
            value={interactiveState?.answerText || ""}
            onChange={handleTextChange}
            rows={8}
            placeholder={authoredState.defaultAnswer || kGlobalDefaultAnswer}
          />
        </> }
        <div className={css.closeDialogSection}>
          { savingAnnotatedImage ?
            <div>Please wait while your drawing is being saved...</div> :
            <button className={cssHelpers.apButton} onClick={handleClose} data-test="close-dialog-btn">
              Close
            </button>
          }
        </div>
      </div>
    </div>
  );

  return drawingToolDialog ? renderDialog() : renderInline();
};
