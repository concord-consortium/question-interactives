import React, { useEffect, useState } from "react";
import { StyledFileInput } from "../../../helpers/src/components/styled-file-input";
import { copyImageToS3, copyLocalImageToS3 } from "@concord-consortium/question-interactives-helpers/src/utilities/copy-image-to-s3";
import { Log } from "../labbook-logging";
import UploadIcon from "../assets/upload-image-icon.svg";
import classnames from "classnames";

import css from "./upload-button.scss";

export interface IUploadButtonProps {label?:string}

export interface IProps {
  onUploadImage: (url: string, mode?: "replace" | "create") => void;
  onUploadStart?: () => void;
  onUploadComplete?: (result: { success: boolean }) => void;
  disabled?: boolean;
  text?: string;
  showUploadIcon?: boolean;
  uploadMode?: "replace" | "create";
}

export const UploadImage: React.FC<IProps> = ({ onUploadImage, uploadMode, onUploadStart, onUploadComplete, text,
  disabled, showUploadIcon,}) => {
  const [ uploadInProgress, setUploadInProgress ] = useState(false);

  useEffect(() => {
    return () => {
      setUploadInProgress(false);
    };
  }, [setUploadInProgress]);

  const uploadFile = (fileOrUrl: File | string) => {
    setUploadInProgress(true);
    // Always copy image to S3 using Shutterbug, so it works even when the image disappears from the external location.
    // Local image could be theoretically stored as dataSrc but it might be too big for Firestore storage that
    // is used by ActivityPlayer. So, copying to S3 is a safer option.
    (typeof fileOrUrl === "string" ? copyImageToS3(fileOrUrl) : copyLocalImageToS3(fileOrUrl))
      .then(url => {
        onUploadImage(url, uploadMode);
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

  const classes = classnames(css["upload-button"], {[css.disabled]: uploadInProgress||disabled});

  return (
    <>
      <StyledFileInput
        buttonClass={classes}
        onChange={handleFileUpload}
        id={text}
      >
        {showUploadIcon && <UploadIcon/>}
        <div className={css["button-text"]}>
          { uploadInProgress
            ? "Please Wait"
            : text
          }
        </div>
      </StyledFileInput>
    </>
  );
};
