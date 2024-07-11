import React, { useEffect, useState } from "react";
import { IRuntimeQuestionComponentProps } from "@concord-consortium/question-interactives-helpers/src/components/base-question-app";
import { IMediaLibrary, closeModal, showModal, useInitMessage } from "@concord-consortium/lara-interactive-api";
import { getURLParam } from "@concord-consortium/question-interactives-helpers/src/utilities/get-url-param";
import { drawingToolCanvasSelector } from "drawing-tool-interactive/src/components/drawing-tool";
import { UpdateFunc } from "@concord-consortium/question-interactives-helpers/src/components/base-app";
import Shutterbug from "shutterbug";
import { useCorsImageErrorCheck } from "@concord-consortium/question-interactives-helpers/src/hooks/use-cors-image-error-check";
import { UploadFromMediaLibraryDialog } from "../../../helpers/src/components/media-library/upload-from-media-library-dialog";
import { DrawingToolDialog } from "./drawing-tool-dialog";
import { InlineContent } from "./inline-content";
import { IAuthoredState, IInteractiveState } from "./types";

interface IProps extends IRuntimeQuestionComponentProps<IAuthoredState, IInteractiveState> {}

const drawingToolDialogUrlParam = "drawingToolDialog";

export const Runtime: React.FC<IProps> = ({ authoredState, interactiveState, setInteractiveState, report }) => {
  const {required, backgroundSource, backgroundImageUrl, allowUploadFromMediaLibrary} = authoredState;
  const readOnly = report || (required && interactiveState?.submitted);
  const [ controlsHidden, setControlsHidden ] = useState(false);
  const [ drawingStateUpdated, setDrawingStateUpdated ] = useState(false);
  const [ savingAnnotatedImage, setSavingAnnotatedImage ] = useState(false);
  const [uploadInProgress, setUploadInProgress] = useState(false);

  const [ showUploadModal, setShowUploadModal ] = useState(false);
  const [mediaLibrary, setMediaLibrary] = useState<IMediaLibrary|undefined>(undefined);
  const initMessage = useInitMessage();

  useEffect(() => {
    if (initMessage?.mode === "runtime") {
      setMediaLibrary(initMessage.mediaLibrary);
    }
  }, [initMessage]);

  const drawingToolDialog = getURLParam(drawingToolDialogUrlParam);
  const authoredBgCorsError = useCorsImageErrorCheck({
    performTest: backgroundSource === "url" && !!backgroundImageUrl,
    imgSrc: backgroundImageUrl
  });

  const snapshotOrUploadFinished = ({ success }: { success: boolean }) => {
    setControlsHidden(false);
    setShowUploadModal(false);
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

  const handleUploadStart = () => {
    setControlsHidden(true);
  };

  const handleUploadImage = (url: string) => {
    setInteractiveState?.(prevState => ({
      ...prevState,
      userBackgroundImageUrl: url,
      answerImageUrl: url, // necessary metadata for ImageQuestion
      answerType: "image_question_answer"
    }));
  };

  const handleCancel = () => closeModal({});

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

  const mediaLibraryEnabled = allowUploadFromMediaLibrary && mediaLibrary?.enabled && mediaLibrary?.items.length > 0;
  const mediaLibraryItems = mediaLibraryEnabled ? mediaLibrary.items.filter((i) => i.type === "image") : undefined;

  return (
    <>
      { showUploadModal && !uploadInProgress ?
        <>
          {/*create an empty div with needed height so modal can overlay properly*/}
          <div style={{height: "600px"}}/>
          <UploadFromMediaLibraryDialog
            onUploadImage={handleUploadImage}
            onUploadStart={handleUploadStart}
            onUploadComplete={snapshotOrUploadFinished}
            mediaLibraryItems={mediaLibraryItems}
            uploadInProgress={uploadInProgress}
            setUploadInProgress={setUploadInProgress}
            handleCloseModal={() => setShowUploadModal(false)}
          />
        </> :
        drawingToolDialog ?
          <DrawingToolDialog
            authoredState={authoredState}
            interactiveState={interactiveState}
            handleDrawingToolSetIntState={handleDrawingToolSetIntState}
            handleCancel={handleCancel}
            handleClose={handleClose}
            handleTextChange={handleTextChange}
            savingAnnotatedImage={savingAnnotatedImage}
          /> :
        <InlineContent
          authoredState={authoredState}
          interactiveState={interactiveState}
          readOnly={readOnly}
          authoredBgCorsError={authoredBgCorsError}
          controlsHidden={controlsHidden}
          setInteractiveState={setInteractiveState}
          snapshotOrUploadFinished={snapshotOrUploadFinished}
          handleUploadStart={handleUploadStart}
          setShowUploadModal={setShowUploadModal}
          mediaLibraryEnabled={mediaLibraryEnabled}
          setUploadInProgress={setUploadInProgress}
          uploadInProgress={uploadInProgress}
          openDrawingToolDialog={openDrawingToolDialog}
        />
      }
    </>
  );
};
