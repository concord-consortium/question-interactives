import React, { useState } from "react";
import { copyImageToS3, copyLocalImageToS3 } from "@concord-consortium/question-interactives-helpers/src/utilities/copy-image-to-s3";
import css from "./drag-to-upload.scss";
import { StyledFileInput } from "../styled-file-input";
import classnames from "classnames";

interface IProps {
  disabled?: boolean;
  onUploadStart?: () => void;
  onUploadImage: (url: string) => void;
  onUploadComplete?: (result: { success: boolean }) => void;
  uploadInProgress?: boolean;
  setUploadInProgress?: (inProgress: boolean) => void;
}

export const DragToUpload: React.FC<IProps> = ({disabled, onUploadImage, onUploadStart, onUploadComplete, uploadInProgress, setUploadInProgress}) => {

  const uploadFile = (fileOrUrl: File | string) => {
    setUploadInProgress?.(true);
    // Always copy image to S3 using Shutterbug, so it works even when the image disappears from the external location.
    // Local image could be theoretically stored as dataSrc but it might be too big for Firestore storage that
    // is used by ActivityPlayer. So, copying to S3 is a safer option.
    (typeof fileOrUrl === "string" ? copyImageToS3(fileOrUrl) : copyLocalImageToS3(fileOrUrl))
      .then(url => {
        onUploadImage(url);
        onUploadComplete?.({ success: true });
      })
      .catch((error) => {
        window.alert(error);
        console.error(error);
      })
      .finally(() => {
        setUploadInProgress?.(false);
        onUploadComplete?.({ success: false });
      });
  };

  const handleFileUpload = (file: File|undefined) => {
    if(!disabled) {
      if (file) {
        onUploadStart?.();
        uploadFile(file);
      }
    }
  };

  const handleFileDrop = (event: React.DragEvent) => {
    const file = event.dataTransfer?.files?.[0];
    if (file) {
      onUploadStart?.();
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

  const classes = classnames(css["upload-button"], {[css.disabled]: uploadInProgress||disabled});


  return (
    <div className={css.container}>
      <div className={css.dropArea} onDrop={handleFileDrop} onDragEnter={cancelEvent} onDragOver={cancelEvent} data-test="drop-area">
        Drop an image here or click the button below to choose an image
      </div>
      <StyledFileInput
        buttonClass={classes}
        onChange={handleFileUpload}
        id={"drop-file-upload"}
      >
        <div className={css["button-text"]}>
          { uploadInProgress
            ? "Please Wait"
            : "Upload from Your Device"
          }
        </div>
      </StyledFileInput>
    </div>
  );
};
