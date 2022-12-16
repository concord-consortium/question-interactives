import React, { useState } from "react";
import classNames from "classnames";

import { StyledFileInput } from "./styled-file-input";
import { copyImageToS3, copyLocalImageToS3 } from "@concord-consortium/question-interactives-helpers/src/utilities/copy-image-to-s3";
import { Log } from "../labbook-logging";
import css from "./upload-button.scss";
import UploadIcon from "../assets/upload-image-icon.svg";

import {
  getAnswerType,
  IGenericAuthoredState,
  IGenericInteractiveState
} from "drawing-tool/src/components/types";

export interface IUploadButtonProps {label?:string}

export interface IProps {
  authoredState: IGenericAuthoredState;
  setInteractiveState?: (updateFunc: (prevState: IGenericInteractiveState | null) => IGenericInteractiveState) => void;
  onUploadStart?: () => void;
  onUploadComplete?: (result: { success: boolean }) => void;
  uploadButtonClass?: 'string';
  uploadIcon?: React.ReactNode;
  disabled?: boolean;
}

export const UploadImage: React.FC<IProps> = ({ authoredState, setInteractiveState, onUploadStart, onUploadComplete, uploadButtonClass, uploadIcon, children, disabled}) => {
  const [ uploadInProgress, setUploadInProgress ] = useState(false);

  const uploadFile = (fileOrUrl: File | string) => {
    setUploadInProgress(true);
    // Always copy image to S3 using Shutterbug, so it works even when the image disappears from the external location.
    // Local image could be theoretically stored as dataSrc but it might be too big for Firestore storage that
    // is used by ActivityPlayer. So, copying to S3 is a safer option.
    (typeof fileOrUrl === "string" ? copyImageToS3(fileOrUrl) : copyLocalImageToS3(fileOrUrl))
      .then(url => {
        setInteractiveState?.(prevState => ({
          ...prevState,
          userBackgroundImageUrl: url,
          answerType: getAnswerType(authoredState.questionType)
        }));
        Log({action: "picture uploaded", data: {url}});
        onUploadComplete?.({ success: true });
      })
      .catch((error) => {
        Log({action: "upload fail", data: {error}});
        window.alert(error);
        console.error(error);
      })
      .finally(() => {
        onUploadComplete?.({ success: false });
        setUploadInProgress(false);
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

  const classes = classNames(css["upload-button"], {[css.disabled]: uploadInProgress||disabled});

  return (
    <>
      <StyledFileInput buttonClass={classes} onChange={handleFileUpload}>
        <UploadIcon />
        <div className={css["button-text"]}>
          { uploadInProgress || disabled
            ? "Please Wait"
            : "Upload Image"
          }
        </div>
      </StyledFileInput>
    </>
  );
};
