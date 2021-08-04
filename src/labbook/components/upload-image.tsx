import React, { useState } from "react";
import classNames from "classnames";

import { StyledFileInput } from "./styled-file-input";
import { copyImageToS3, copyLocalImageToS3 } from "../../shared/utilities/copy-image-to-s3";

import css from "./upload-button.scss";

export interface IUploadButtonProps {label?:string}

import UploadIcon from "../assets/upload-image-icon.svg";

import {
  getAnswerType,
  IGenericAuthoredState,
  IGenericInteractiveState
} from "../../drawing-tool/components/types";


export interface IProps {
  authoredState: IGenericAuthoredState;
  setInteractiveState?: (updateFunc: (prevState: IGenericInteractiveState | null) => IGenericInteractiveState) => void;
  onUploadStart?: () => void;
  onUploadComplete?: (result: { success: boolean }) => void;
  uploadButtonClass?: 'string';
  uploadIcon?: React.ReactNode;
}

export const UploadImage: React.FC<IProps> = ({ authoredState, setInteractiveState, onUploadStart, onUploadComplete, uploadButtonClass, uploadIcon, children}) => {
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

  const handleFileUpload = (file: File|undefined) => {
    if (file) {
      uploadFile(file);
    }
  };

  const classes = classNames(css["button-back"], {[css.disabled]: uploadInProgress});

  return (
    <>
      <StyledFileInput buttonClass={classes}  onChange={handleFileUpload}>
        <UploadIcon />
        { uploadInProgress
          ? "Please Wait"
          : "Upload Image"
        }
      </StyledFileInput>
    </>
  );
};
