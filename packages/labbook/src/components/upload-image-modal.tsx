import React, { useState } from "react";
import { DragToUpload } from "@concord-consortium/question-interactives-helpers/src/components/media-library/drag-to-upload";
import { MediaLibraryPicker } from "@concord-consortium/question-interactives-helpers/src/components/media-library/media-library-picker";
import { IThumbnailChooserProps } from "./thumbnail-chooser/thumbnail-chooser";
import { CreateOrReplaceImage } from "./create-or-replace-image";
import { IMediaLibraryItem } from "@concord-consortium/lara-interactive-api";
import { Log } from "../labbook-logging";
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
    Log({action: "picture uploaded", data: {url}});
    onUploadImage(url, uploadMode);
  };

  return (
    <div className={css.modal}>
      <div className={classnames(css.modalContent, {[css.larger]: !selectedItemHasImageUrl || showMediaLibraryPicker})}>
        {!selectedItemHasImageUrl || showMediaLibraryPicker ?
          <>
            <DragToUpload
              disabled={disabled}
              onUploadStart={onUploadStart}
              onUploadImage={handleUploadImage}
              onUploadComplete={onUploadComplete}
            />
            <div className={css.or}>OR</div>
            <MediaLibraryPicker
              disabled={disabled}
              onUploadStart={onUploadStart}
              onUploadImage={handleUploadImage}
              onUploadComplete={onUploadComplete}
              items={mediaLibraryItems}
              onCloseModal={handleCloseModal}
            />
          </> :
          <CreateOrReplaceImage
            onUploadImage={mediaLibraryItems ? handleSetUploadMode : onUploadImage}
            disabled={disabled}
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
