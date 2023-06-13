import React, { useEffect, useState } from "react";
import classNames from "classnames";

import { StyledFileInput } from "./styled-file-input";
import { copyImageToS3, copyLocalImageToS3 } from "@concord-consortium/question-interactives-helpers/src/utilities/copy-image-to-s3";
import { Log } from "../labbook-logging";
import UploadIcon from "../assets/upload-image-icon.svg";
import { IThumbnailProps } from "./thumbnail-chooser/thumbnail";
import {
  getAnswerType,
  IGenericAuthoredState,
  IGenericInteractiveState
} from "drawing-tool-interactive/src/components/types";
import { UploadButton } from "./upload-button";


import css from "./upload-button.scss";
import { ILabbookEntry } from "./types";

export interface IUploadButtonProps {label?:string}

export interface IProps {
  authoredState: IGenericAuthoredState;
  setInteractiveState?: (updateFunc: (prevState: IGenericInteractiveState | null) => IGenericInteractiveState) => void;
  setNextInteractiveState?: (updateFunc: (prevState: IGenericInteractiveState | null) => IGenericInteractiveState, item?: ILabbookEntry) => void;
  onUploadStart?: () => void;
  onUploadComplete?: (result: { success: boolean }) => void;
  uploadButtonClass?: 'string';
  uploadIcon?: React.ReactNode;
  disabled?: boolean;
  text?: string;
  showUploadIcon?: boolean;
  item?: IThumbnailProps;
  setSelectedItemId?: (id: string) => void;
  setHideUploadButtons?: (bool: boolean) => void;
  useModal?: string;
  useModalClick?: () => void;
}

export const UploadImage: React.FC<IProps> = ({ authoredState, setInteractiveState, setNextInteractiveState, onUploadStart, onUploadComplete, text,
  disabled, showUploadIcon, item, setSelectedItemId, setHideUploadButtons, useModal, useModalClick}) => {
  const [ uploadInProgress, setUploadInProgress ] = useState(false);
  const stateSaverToUse = setNextInteractiveState ? setNextInteractiveState : setInteractiveState;

  useEffect(() => {
    return () => {
      setUploadInProgress(false);
       setHideUploadButtons?.(false);
    };
  }, [setUploadInProgress, setHideUploadButtons]);

  const uploadFile = (fileOrUrl: File | string) => {
    setUploadInProgress(true);
    // Always copy image to S3 using Shutterbug, so it works even when the image disappears from the external location.
    // Local image could be theoretically stored as dataSrc but it might be too big for Firestore storage that
    // is used by ActivityPlayer. So, copying to S3 is a safer option.
    (typeof fileOrUrl === "string" ? copyImageToS3(fileOrUrl) : copyLocalImageToS3(fileOrUrl))
      .then(url => {
        stateSaverToUse?.(prevState => ({
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
        setUploadInProgress(false);
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

  const classes = classNames(css["upload-button"], {[css.disabled]: uploadInProgress||disabled});

  const renderButtonContents = () => {
    return (
      <>
      {showUploadIcon && <UploadIcon/>}
      <div className={css["button-text"]}>
        { uploadInProgress || disabled
          ? "Please Wait"
          : text
        }
      </div>
      </>
    );
  };

  if (useModal) {
    return (
      <UploadButton disabled={uploadInProgress || disabled} onClick={useModalClick}>
        {renderButtonContents()}
      </UploadButton>
    );
  }

  return (
    <>
    <StyledFileInput
      buttonClass={classes}
      onChange={handleFileUpload}
      setSelectedItemId={setSelectedItemId}
      item={item}
      id={text}
      setHideUploadButtons={setHideUploadButtons}
    >
      {renderButtonContents()}
    </StyledFileInput>
    </>
  );
};
