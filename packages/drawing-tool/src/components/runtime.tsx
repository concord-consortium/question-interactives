import React, { useEffect, useState } from "react";
import { DynamicText } from "@concord-consortium/dynamic-text";
import { DecorateChildren } from "@concord-consortium/text-decorator";
import { IMediaLibrary, useInitMessage } from "@concord-consortium/lara-interactive-api";
import { renderHTML } from "@concord-consortium/question-interactives-helpers/src/utilities/render-html";
import { useCorsImageErrorCheck } from "@concord-consortium/question-interactives-helpers/src/hooks/use-cors-image-error-check";
import { useGlossaryDecoration } from "@concord-consortium/question-interactives-helpers/src/hooks/use-glossary-decoration";


import { IAuthoredState, IInteractiveState } from "./types";
import { UploadFromMediaLibraryDialog } from "@concord-consortium/question-interactives-helpers/src/components/media-library/upload-from-media-library-dialog";
import { UploadBackground } from "./upload-background";
import { TakeSnapshot } from "./take-snapshot";
import { DrawingTool } from "./drawing-tool";

import 'drawing-tool/dist/drawing-tool.css';
import css from "./runtime.scss";

export interface IProps {
  authoredState: IAuthoredState;
  interactiveState?: IInteractiveState | null;
  setInteractiveState?: (updateFunc: (prevState: IInteractiveState | null) => IInteractiveState) => void;
  report?: boolean;
}

export const Runtime: React.FC<IProps> = ({ authoredState, interactiveState, setInteractiveState, report }) => {
  const decorateOptions = useGlossaryDecoration();
  const {required, backgroundSource, prompt, allowUploadFromMediaLibrary} = authoredState;
  const readOnly = !!(report || (required && interactiveState?.submitted));

  const useSnapshot = backgroundSource === "snapshot";
  const useUpload = backgroundSource === "upload";

  const [uploadInProgress, setUploadInProgress] = useState(false);
  const [showUploadModal, setShowUploadModal ] = useState(false);
  const [mediaLibrary, setMediaLibrary] = useState<IMediaLibrary|undefined>(undefined);

  const initMessage = useInitMessage();

  useEffect(() => {
    if (initMessage?.mode === "runtime") {
      setMediaLibrary(initMessage.mediaLibrary);
    }
  }, [initMessage]);

  const handleUploadStart = () => {
    setShowUploadModal(false);
    setUploadInProgress(true);
  };

  const handleUploadImage = (url: string) => {
    setInteractiveState?.(prevState => ({
      ...prevState,
      userBackgroundImageUrl: url,
      answerType: "interactive_state"
    }));
  };

  const authoredBgCorsError = useCorsImageErrorCheck({
    performTest: authoredState.backgroundSource === "url" && !!authoredState.backgroundImageUrl,
    imgSrc: authoredState.backgroundImageUrl
  });
  if (authoredBgCorsError) {
    return <div className={css.error}>Authored background image is not CORS enabled. Please use a different background
      image URL or change configuration of the host.</div>;
  }

  const mediaLibraryEnabled = allowUploadFromMediaLibrary && mediaLibrary?.enabled && mediaLibrary?.items.length > 0;
  const mediaLibraryItems = mediaLibraryEnabled ? mediaLibrary.items.filter((i) => i.type === "image") : undefined;

  return (
    <div>
      { prompt && !showUploadModal &&
        <DecorateChildren decorateOptions={decorateOptions}>
          <div><DynamicText>{renderHTML(prompt)}</DynamicText></div>
        </DecorateChildren> }
      {!showUploadModal && <DrawingTool authoredState={authoredState} interactiveState={interactiveState} setInteractiveState={setInteractiveState} readOnly={readOnly} />}
      {
        !readOnly && useSnapshot && !showUploadModal &&
        <TakeSnapshot authoredState={authoredState} interactiveState={interactiveState} setInteractiveState={setInteractiveState} />
      }
      { showUploadModal &&
        <>
          {/*create an empty div with needed height so modal can overlay properly*/}
          <div style={{height: "600px"}}/>
          <UploadFromMediaLibraryDialog
            onUploadImage={handleUploadImage}
            onUploadStart={handleUploadStart}
            mediaLibraryItems={mediaLibraryItems}
            uploadInProgress={uploadInProgress}
            setUploadInProgress={setUploadInProgress}
            handleCloseModal={() => setShowUploadModal(false)}
          />
        </>
      }
      {
        !readOnly && useUpload && !showUploadModal &&
        <UploadBackground
          authoredState={authoredState}
          setInteractiveState={setInteractiveState}
          setShowUploadModal={setShowUploadModal}
          mediaLibraryEnabled={mediaLibraryEnabled}
          uploadInProgress={uploadInProgress}
          setUploadInProgress={setUploadInProgress}
        />
      }
    </div>
  );
};
