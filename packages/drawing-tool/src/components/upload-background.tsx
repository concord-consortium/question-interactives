import React, { useState } from "react";
import UploadIcon from "@concord-consortium/question-interactives-helpers/src/icons/upload.svg";
import { copyImageToS3, copyLocalImageToS3 } from "@concord-consortium/question-interactives-helpers/src/utilities/copy-image-to-s3";
import { getAnswerType, IGenericAuthoredState, IGenericInteractiveState } from "./types";
import classnames from "classnames";

import 'drawing-tool/dist/drawing-tool.css';
import css from "./runtime.scss";
import cssHelpers from "@concord-consortium/question-interactives-helpers/src/styles/helpers.scss";

export interface IProps {
  authoredState: IGenericAuthoredState;
  setInteractiveState?: (updateFunc: (prevState: IGenericInteractiveState | null) => IGenericInteractiveState) => void;
  onUploadStart?: () => void;
  onUploadComplete?: (result: { success: boolean }) => void;
  mediaLibraryEnabled?: boolean;
  setShowUploadModal?: (showModal: boolean) => void;
  uploadInProgress: boolean;
  setUploadInProgress: (inProgress: boolean) => void;
}

export const UploadBackground: React.FC<IProps> = ({ authoredState, setInteractiveState, onUploadStart, onUploadComplete, mediaLibraryEnabled,
  setShowUploadModal, uploadInProgress, setUploadInProgress}) => {
  const [ uploadControlsVisible, setUploadControlsVisible ] = useState(false);

  const handleUploadBtnClick = () => {
    if (mediaLibraryEnabled) {
      setShowUploadModal?.(true);
    } else {
      setUploadControlsVisible(true);
      onUploadStart?.();
    }
  };

  const uploadFile = (fileOrUrl: File | string) => {
    setUploadControlsVisible(false);
    setUploadInProgress(true);
    // Always copy image to S3 using Shutterbug, so it works even when the image disappears from the external location.
    // Local image could be theoretically stored as dataSrc but it might be too big for Firestore storage that
    // is used by ActivityPlayer. So, copying to S3 is a safer option.
    (typeof fileOrUrl === "string" ? copyImageToS3(fileOrUrl) : copyLocalImageToS3(fileOrUrl))
      .then(url => {
        setInteractiveState?.(prevState => ({
          ...prevState,
          userBackgroundImageUrl: url,
          answerImageUrl: url, // necessary metadata for ImageQuestion
          answerType: getAnswerType(authoredState.questionType)
        }));
        onUploadComplete?.({ success: true });
      })
      .catch((error) => {
        window.alert(error);
        console.error(error);
        onUploadComplete?.({ success: false });
      })
      .finally(() => {
        setUploadInProgress(false);
      });
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      uploadFile(file);
    }
  };

  const handleFileDrop = (event: React.DragEvent) => {
    const file = event.dataTransfer?.files?.[0];
    if (file) {
      // Local file dropped.
      uploadFile(file);
    } else {
      // URL dragged.
      const items = event.dataTransfer?.items;
      const item = Array.from(items).find(i => i.kind === "string" && i.type.match(/^text\/uri-list/));
      item?.getAsString(src => {
        uploadFile(src);
      });
    }
    cancelEvent(event);
  };

  // Necessary to make file drop work.
  const cancelEvent = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
  };

  return (
    <>
      {
        !uploadControlsVisible && !uploadInProgress &&
        <button className={classnames(cssHelpers.interactiveButton, cssHelpers.withIcon)} onClick={handleUploadBtnClick} data-test="upload-btn">
          <UploadIcon />
          <div className={cssHelpers.buttonText}>Upload Image</div>
        </button>
      }
      {
        uploadControlsVisible &&
        <div>
          <div className={css.dropArea} onDrop={handleFileDrop} onDragEnter={cancelEvent} onDragOver={cancelEvent} data-test="drop-area">
            Drop an image here or click the button below to choose an image
          </div>
          <input type="file" onChange={handleFileUpload} />
        </div>
      }
      {
        uploadInProgress &&
        <div className={css.uploadInfo}>
          Please wait while image is being uploaded...
        </div>
      }
    </>
  );
};
