import React from "react";
import css from "./upload-image-modal.scss";
import { IGenericAuthoredState } from "drawing-tool-interactive/src/components/types";
import { UploadImage } from "./upload-image";
import { IThumbnailChooserProps, ThumbnailChooser } from "./thumbnail-chooser/thumbnail-chooser";

export interface IProps {
  authoredState: IGenericAuthoredState;
  onUploadImage: (url: string, mode?: "replace" | "create") => void;
  onUploadStart?: () => void;
  onUploadComplete?: (result: { success: boolean }) => void;
  disabled?: boolean;
  handleCloseModal: () => void;
  thumbnailChooserProps: IThumbnailChooserProps;
  selectedId: string;
}

export const UploadModal: React.FC<IProps> = ({authoredState, onUploadImage, onUploadStart, onUploadComplete,
  handleCloseModal, disabled, thumbnailChooserProps, selectedId}) => {
  const nextItem = thumbnailChooserProps.items.find(i => i.empty);
  const thumbnailItems = thumbnailChooserProps.items.filter((i) => {
    return i.id === selectedId || i.id === nextItem?.id;
  });
  const thumbnailPreviewProps = {...thumbnailChooserProps, items: thumbnailItems, readOnly: true, uploadPreviewMode: true};

  return (
    <div className={css.modal}>
      <div className={css.modalContent}>
        <div className={css.header}>
          What would you like to do?
        </div>
        <div className={css.thumbnails}>
          <ThumbnailChooser {...thumbnailPreviewProps} />
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
            disabled={disabled}
            onUploadStart={onUploadStart}
            onUploadComplete={onUploadComplete}
            text={"Create New Image"}
            uploadMode={"create"}
          />
        </div>
        <div className={css.cancel}>
          <button onClick={handleCloseModal}>Cancel</button>
        </div>
      </div>
    </div>
  );
};
