import React, { useState } from "react";
import { IThumbnailChooserProps } from "./thumbnail-chooser/thumbnail-chooser";
import { CreateOrReplaceImage } from "./create-or-replace-image";
import { IMediaLibraryItem } from "@concord-consortium/lara-interactive-api";
import { UploadFromMediaLibrary } from "./upload-from-media-library";
import classnames from "classnames";

import css from "./upload-image-modal.scss";

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
  mediaLibraryItems?: IMediaLibraryItem[];
  selectedItemHasImageUrl: boolean;
}

export const UploadModal: React.FC<IProps> = ({onUploadImage, onUploadStart, onUploadComplete,
  handleCloseModal, disabled, thumbnailChooserProps, selectedId, reachedMaxEntries, wideLayout,
  mediaLibraryItems, selectedItemHasImageUrl}) => {
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
      <div className={classnames(css.modalContent, {[css.larger]: !selectedItemHasImageUrl || showMediaLibraryPicker})}>
        {!selectedItemHasImageUrl || showMediaLibraryPicker ?
          <UploadFromMediaLibrary
            disabled={disabled}
            onUploadStart={onUploadStart}
            onUploadImage={handleUploadImage}
            onUploadComplete={onUploadComplete}
            items={mediaLibraryItems}
          /> :
          <CreateOrReplaceImage
            onUploadImage={mediaLibraryItems ? handleSetUploadMode : onUploadImage}
            disabled={disabled || reachedMaxEntries}
            onUploadStart={onUploadStart}
            onUploadComplete={onUploadComplete}
            onCloseModal={handleCloseModal}
            thumbnailChooserProps={thumbnailChooserProps}
            selectedId={selectedId}
            reachedMaxEntries={reachedMaxEntries}
            wideLayout={wideLayout}
            mediaLibraryEnabled={!!mediaLibraryItems}
          />
        }
      </div>
    </div>
  );
};
