import React, { useState } from "react";
import { IRuntimeQuestionComponentProps } from "../../shared/components/base-question-app";
import { IAuthoredState, IInteractiveState } from "./types";
import { closeModal, showModal } from "@concord-consortium/lara-interactive-api";
import { TakeSnapshot } from "../../drawing-tool/components/take-snapshot";
import { UploadBackground } from "../../drawing-tool/components/upload-background";
import { getURLParam } from "../../shared/utilities/get-url-param";
import { DrawingTool, drawingToolCanvasSelector } from "../../drawing-tool/components/drawing-tool";
import { renderHTML } from "../../shared/utilities/render-html";
import { UpdateFunc } from "../../shared/components/base-app";
import Shutterbug from "shutterbug";
import PencilIcon from "../../shared/icons/pencil.svg";
import { useCorsImageErrorCheck } from "../../shared/hooks/use-cors-image-error-check";
import { DecorateChildren } from "@concord-consortium/text-decorator";
import { useGlossaryDecoration } from "../../shared/hooks/use-glossary-decoration";
import css from "./runtime.scss";
import cssHelpers from "../../shared/styles/helpers.scss";


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
    showModal({ type: "dialog", url: window.location.href + "?" + drawingToolDialogUrlParam, notCloseable: true });
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
      { authoredState.prompt && <DecorateChildren decorateOptions={decorateOptions}><div>{renderHTML(authoredState.prompt)}</div></DecorateChildren> }
      { inlineImage && <div><img src={inlineImage} className={css.inlineImg} alt="user work"/></div> }
      { authoredState.answerPrompt && <div>{renderHTML(authoredState.answerPrompt)}</div> }
      <div className={css.studentAnswerText}>{interactiveState?.answerText}</div>
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
            <button className={cssHelpers.laraButton} onClick={openDrawingToolDialog} data-test="edit-btn">
              { previousAnswerAvailable ? "Edit" : <span><PencilIcon className={cssHelpers.smallIcon}/> Make drawing</span> }
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
        { authoredState.prompt && <div>{renderHTML(authoredState.prompt)}</div> }
        <hr />
        { authoredState.answerPrompt && <div className={css.answerPrompt}>{renderHTML(authoredState.answerPrompt)}</div> }
        <textarea
          value={interactiveState?.answerText || ""}
          onChange={handleTextChange}
          rows={8}
          placeholder={authoredState.defaultAnswer || kGlobalDefaultAnswer}
        />
      </div>
      <div className={css.closeDialogSection}>
        { savingAnnotatedImage ?
          <div>Please wait while your drawing is being saved...</div> :
          <button className={cssHelpers.laraButton} onClick={handleClose} data-test="close-dialog-btn">
            Close
          </button>
        }
      </div>
    </div>
  );

  return drawingToolDialog ? renderDialog() : renderInline();
};
