import React from "react";
import { IAuthoredState, IInteractiveState } from "./types";
import { UpdateFunc } from "@concord-consortium/question-interactives-helpers/src/components/base-app";
import { DynamicText } from "@concord-consortium/dynamic-text";
import { renderHTML } from "@concord-consortium/question-interactives-helpers/src/utilities/render-html";
import { DecorateChildren } from "@concord-consortium/text-decorator";
import { useGlossaryDecoration } from "@concord-consortium/question-interactives-helpers/src/hooks/use-glossary-decoration";
import { TakeSnapshot } from "drawing-tool-interactive/src/components/take-snapshot";
import { UploadBackground } from "drawing-tool-interactive/src/components/upload-background";
import PencilIcon from "@concord-consortium/question-interactives-helpers/src/icons/pencil.svg";
import classnames from "classnames";

import css from "./inline-content.scss";
import cssHelpers from "@concord-consortium/question-interactives-helpers/src/styles/helpers.scss";

interface IProps {
  authoredState: IAuthoredState;
  interactiveState?: IInteractiveState|null;
  readOnly?: boolean;
  authoredBgCorsError: boolean;
  controlsHidden: boolean;
  setInteractiveState: ((updateFunc: UpdateFunc<IInteractiveState>) => void) | undefined;
  snapshotOrUploadFinished: ({ success }: {success: boolean;}) => void;
  handleUploadStart: () => void;
  setShowUploadModal: (showModal: boolean) => void;
  mediaLibraryEnabled?: boolean;
  setUploadInProgress: (inProgress: boolean) => void;
  uploadInProgress: boolean;
  openDrawingToolDialog: () => void;
}

export const InlineContent: React.FC<IProps> = ({authoredState, interactiveState, readOnly, authoredBgCorsError,
  controlsHidden, snapshotOrUploadFinished, setInteractiveState, handleUploadStart, setUploadInProgress, setShowUploadModal,
  mediaLibraryEnabled, uploadInProgress, openDrawingToolDialog}) => {
  const {prompt, answerPrompt, backgroundImageUrl, backgroundSource} = authoredState;
  const decorateOptions = useGlossaryDecoration();

  const renderSnapshot = backgroundSource === "snapshot";
  const renderUpload = backgroundSource === "upload";
  const renderMakeDrawing = !renderSnapshot && !renderUpload;
  const previousAnswerAvailable = interactiveState?.userBackgroundImageUrl || interactiveState?.answerImageUrl;
  const authoredBackgroundUrl = backgroundSource === "url" && backgroundImageUrl;
  const inlineImage = interactiveState?.answerImageUrl || interactiveState?.userBackgroundImageUrl || authoredBackgroundUrl;

  // Render answer prompt and answer text in inline mode to replicate LARA's Image Question UI
  return (
    <>
    { authoredBgCorsError ?
      <div className={css.error}>
        Authored background image is not CORS enabled. Please use a different background image URL or change configuration of the host.
      </div> :
      <div>
        { prompt &&
          <DynamicText>
            <DecorateChildren decorateOptions={decorateOptions}>
              <div>{renderHTML(prompt)}</div>
            </DecorateChildren>
          </DynamicText>
        }
        { inlineImage &&
          <div>
            <img src={inlineImage} className={css.inlineImg} alt="user work"/>
          </div> }
        { answerPrompt &&
          <>
            <div><DynamicText>{renderHTML(answerPrompt)}</DynamicText></div>
            <div className={css.studentAnswerText}><DynamicText>{interactiveState?.answerText}</DynamicText></div>
          </>
        }
        { !readOnly &&
          <div className={css.buttonContainer}>
            {
              renderSnapshot &&
              <TakeSnapshot
                authoredState={authoredState}
                interactiveState={interactiveState}
                setInteractiveState={setInteractiveState}
                onUploadStart={handleUploadStart}
                onUploadComplete={snapshotOrUploadFinished}
              />
            }
            {
              renderUpload &&
              <UploadBackground
                authoredState={authoredState}
                setInteractiveState={setInteractiveState}
                onUploadStart={handleUploadStart}
                onUploadComplete={snapshotOrUploadFinished}
                setShowUploadModal={setShowUploadModal}
                mediaLibraryEnabled={mediaLibraryEnabled}
                setUploadInProgress={setUploadInProgress}
                uploadInProgress={uploadInProgress}
              />
            }
            {
              !controlsHidden && (renderMakeDrawing || previousAnswerAvailable) &&
              <button
                className={classnames(cssHelpers.interactiveButton, {[cssHelpers.withIcon]: !previousAnswerAvailable})}
                onClick={openDrawingToolDialog}
                data-test="edit-btn"
              >
                { previousAnswerAvailable ? "Edit" :
                  <>
                    <PencilIcon className={cssHelpers.smallIcon}/>
                    <div className={cssHelpers.buttonText}>Make Drawing</div>
                  </>
                }
              </button>
              }
          </div>
        }
      </div>
    }
  </>
  );
};
