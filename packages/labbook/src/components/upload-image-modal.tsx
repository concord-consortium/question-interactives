import React from "react";
import css from "./upload-image-modal.scss";
import { IGenericAuthoredState } from "drawing-tool-interactive/src/components/types";
import { UploadImage } from "./upload-image";
import { IThumbnailChooserProps, ThumbnailChooser } from "./thumbnail-chooser/thumbnail-chooser";
import classnames from "classnames";

export interface IProps {
  authoredState: IGenericAuthoredState;
  onUploadImage: (url: string, mode?: "replace" | "create") => void;
  onUploadStart: () => void;
  onUploadComplete?: (result: { success: boolean }) => void;
  disabled?: boolean;
  handleCloseModal: () => void;
  thumbnailChooserProps: IThumbnailChooserProps;
  selectedId: string;
  reachedMaxEntries: boolean;
  wideLayout: boolean;
}

export const UploadModal: React.FC<IProps> = ({authoredState, onUploadImage, onUploadStart, onUploadComplete,
  handleCloseModal, disabled, thumbnailChooserProps, selectedId, reachedMaxEntries, wideLayout}) => {
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

  return (
    <div className={css.modal}>
      <div className={css.modalContent}>
        <div className={css.header}>
          What would you like to do?
        </div>
        <div className={css.thumbnails}>
          {renderThumbnails()}
        </div>
        <div className={css.uploadButtons}>
          <UploadImage
            authoredState={authoredState}
            onUploadImage={onUploadImage}
            disabled={disabled}
            onUploadStart={onUploadStart}
            onUploadComplete={onUploadComplete}
            text={"Replace Current Image"}
            uploadMode={"replace"}
          />
          <UploadImage
            authoredState={authoredState}
            onUploadImage={onUploadImage}
            disabled={disabled || reachedMaxEntries}
            onUploadStart={onUploadStart}
            onUploadComplete={onUploadComplete}
            text={"Create New Image"}
            uploadMode={"create"}
          />
        </div>
        <div className={css.bottom}>
          {reachedMaxEntries &&
          <div className={css.instructions}>
            Create New Image is not available because you have reached the maximum number of entries.
          </div>}
          <button className={css.cancelButton} onClick={handleCloseModal}>Cancel</button>
        </div>
      </div>
    </div>
  );
};
