import React from "react";
import { IThumbnailChooserProps, ThumbnailChooser } from "./thumbnail-chooser/thumbnail-chooser";
import { UploadImage } from "./upload-image";
import classnames from "classnames";
import { UploadButton } from "./upload-button";
import UploadIcon from "../assets/upload-image-icon.svg";

import css from "./create-or-replace-image.scss";

export interface IProps {
  onUploadImage: (url: string, mode?: "replace" | "create") => void;
  onUploadStart: () => void;
  onUploadComplete?: (result: { success: boolean }) => void;
  onCloseModal: () => void;
  disabled?: boolean;
  thumbnailChooserProps: IThumbnailChooserProps;
  selectedId: string;
  reachedMaxEntries: boolean;
  wideLayout: boolean;
  allowUploadFromMediaLibrary?: boolean;
}

export const CreateOrReplaceImage: React.FC<IProps> = ({onUploadImage, onUploadStart, onUploadComplete,
  onCloseModal, disabled, thumbnailChooserProps, selectedId, reachedMaxEntries, wideLayout, allowUploadFromMediaLibrary}) => {
  const nextItem = thumbnailChooserProps.items.find(i => i.empty);
  const thumbnailItems = thumbnailChooserProps.items.filter((i) => {
    return i.id === selectedId || i.id === nextItem?.id;
  });
  const thumbnailPreviewProps = {...thumbnailChooserProps, items: thumbnailItems, readOnly: true, uploadPreviewMode: true};

  const renderThumbnails = () => {
    return (
      reachedMaxEntries ?
      <>
        <div className={css.reachedMaxEntries}>
          <ThumbnailChooser {...thumbnailPreviewProps} />
        </div>
        <div className={classnames(css.fakeThumbnail, {[css.wide]: wideLayout})}>
          <div className={css.plusButton}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16">
              <line x1="8" y1="0" x2="8" y2="16" strokeWidth="2.5"/>
              <line x1="0" y1="8" x2="16" y2="8" strokeWidth="2.5"/>
            </svg>
          </div>
          <div className={css.label}>New</div>
        </div>
      </> :
      <ThumbnailChooser {...thumbnailPreviewProps}/>
    );
  };

  const renderButtons = () => {
    if (allowUploadFromMediaLibrary) {
      return (
        <div className={css.uploadButtons}>
          <UploadButton disabled={disabled} onClick={() => onUploadImage("", "replace")}>
            <div className={css["button-text"]}>
              {disabled ? "Please Wait" : "Replace Current Image"}
            </div>
          </UploadButton>
          <UploadButton disabled={disabled} onClick={() => onUploadImage("", "create")}>
          <div className={css["button-text"]}>
            {disabled ? "Please Wait" : "Create New Image"}
          </div>
        </UploadButton>
        </div>
      );
    } else {
      return (
        <div className={css.uploadButtons}>
          <UploadImage
            onUploadImage={onUploadImage}
            disabled={disabled}
            onUploadStart={onUploadStart}
            onUploadComplete={onUploadComplete}
            text={"Replace Current Image"}
            uploadMode={"replace"}
          />
          <UploadImage
            onUploadImage={onUploadImage}
            disabled={disabled || reachedMaxEntries}
            onUploadStart={onUploadStart}
            onUploadComplete={onUploadComplete}
            text={"Create New Image"}
            uploadMode={"create"}
          />
        </div>
      );
    }
  };

  return (
    <>
      <div className={css.header}>
        What would you like to do?
      </div>
      <div className={css.thumbnails}>
        {renderThumbnails()}
      </div>
      {renderButtons()}
      <div className={css.bottom}>
        {reachedMaxEntries &&
        <div className={css.instructions}>
          Create New Image is not available because you have reached the maximum number of entries.
        </div>}
        <button className={css.cancelButton} onClick={onCloseModal}>Cancel</button>
      </div>
    </>
  );
};
