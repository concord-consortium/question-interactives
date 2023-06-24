import React, { useState } from "react";
import { IThumbnailChooserProps } from "./thumbnail-chooser/thumbnail-chooser";
import { CreateOrReplaceImage } from "./create-or-replace-image";
import { DragToUpload } from "./drag-to-upload";
import { MediaLibraryPicker } from "./media-library-picker";

import css from "./upload-image-modal.scss";
import classnames from "classnames";
export interface IProps {
  onUploadImage: (url: string, mode?: "replace" | "create") => void;
  onUploadStart: () => void;
  onUploadComplete?: (result: { success: boolean }) => void;
  disabled?: boolean;
  handleCloseModal: () => void;
  thumbnailChooserProps: IThumbnailChooserProps;
  selectedId: string;
  reachedMaxEntries: boolean;
  wideLayout: boolean;
  allowUploadFromMediaLibrary?: boolean;
}

export const UploadModal: React.FC<IProps> = ({onUploadImage, onUploadStart, onUploadComplete,
  handleCloseModal, disabled, thumbnailChooserProps, selectedId, reachedMaxEntries, wideLayout,
  allowUploadFromMediaLibrary}) => {
    const [uploadMode, setUploadMode] = useState<"replace" | "create">("replace");
    const [showMediaLibraryPicker, setShowMediaLibraryPicker] = useState<boolean>(false);

  const handleSetUploadMode= (url: string, modeForUpload: "replace" | "create") => {
    setUploadMode(modeForUpload);
    setShowMediaLibraryPicker(true);
  };

  const handleUploadImage = (url: string) => {
    onUploadImage(url, uploadMode);
  };

  return (
    <div className={css.modal}>
      <div className={classnames(css.modalContent, {[css.larger]: showMediaLibraryPicker})}>
        {showMediaLibraryPicker ?
          <>
            <DragToUpload
              disabled={disabled}
              onUploadStart={onUploadStart}
              onUploadImage={handleUploadImage}
              onUploadComplete={onUploadComplete}
            />
            <MediaLibraryPicker/>
          </> :
          <CreateOrReplaceImage
            onUploadImage={allowUploadFromMediaLibrary ? handleSetUploadMode : onUploadImage}
            disabled={disabled || reachedMaxEntries}
            onUploadStart={onUploadStart}
            onUploadComplete={onUploadComplete}
            onCloseModal={handleCloseModal}
            thumbnailChooserProps={thumbnailChooserProps}
            selectedId={selectedId}
            reachedMaxEntries={reachedMaxEntries}
            wideLayout={wideLayout}
            allowUploadFromMediaLibrary={allowUploadFromMediaLibrary}
          />
        }
      </div>
    </div>
  );
};
