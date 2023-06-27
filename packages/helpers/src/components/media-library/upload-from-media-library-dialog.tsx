import React from "react";
import { IMediaLibraryItem } from "@concord-consortium/lara-interactive-api";
import { DragToUpload } from "./drag-to-upload";
import { MediaLibraryPicker } from "./media-library-picker";
import classnames from "classnames";

import css from "./upload-from-media-library-dialog.scss";

export interface IProps {
  onUploadImage: (url: string, mode?: "replace" | "create") => void;
  onUploadStart?: () => void;
  onUploadComplete?: (result: { success: boolean }) => void;
  disabled?: boolean;
  handleCloseModal: () => void;
  mediaLibraryItems?: IMediaLibraryItem[];
  uploadInProgress?: boolean;
  setUploadInProgress?: (inProgress: boolean) => void;
}

export const UploadFromMediaLibraryDialog: React.FC<IProps> = ({onUploadImage, onUploadStart, onUploadComplete, disabled,
  mediaLibraryItems, uploadInProgress, setUploadInProgress, handleCloseModal}) => {
  return (
    <div className={css.modal}>
      <div className={classnames(css.modalContent)}>
        <DragToUpload
          disabled={disabled}
          onUploadStart={onUploadStart}
          onUploadImage={onUploadImage}
          onUploadComplete={onUploadComplete}
          uploadInProgress={uploadInProgress}
          setUploadInProgress={setUploadInProgress}
        />
        <div className={css.or}>OR</div>
        <MediaLibraryPicker
          disabled={disabled}
          onUploadStart={onUploadStart}
          onUploadImage={onUploadImage}
          onUploadComplete={onUploadComplete}
          items={mediaLibraryItems}
          setUploadInProgress={setUploadInProgress}
          onCloseModal={handleCloseModal}
        />
      </div>
    </div>
  );
};
