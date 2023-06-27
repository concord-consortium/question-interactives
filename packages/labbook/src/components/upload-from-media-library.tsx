import { IMediaLibraryItem } from "@concord-consortium/lara-interactive-api";
import React from "react";
import { DragToUpload } from "./drag-to-upload";
import { MediaLibraryPicker } from "./media-library-picker";

import css from "./upload-from-media-library.scss";

interface IProps {
  onUploadImage: (url: string, mode?: "replace" | "create") => void;
  onUploadStart: () => void;
  onUploadComplete?: (result: { success: boolean }) => void;
  disabled?: boolean;
  items?: IMediaLibraryItem[];
}

export const UploadFromMediaLibrary: React.FC<IProps> = ({disabled, onUploadImage, onUploadStart, onUploadComplete, items}) => {
  return (
    <>
      <DragToUpload
        disabled={disabled}
        onUploadStart={onUploadStart}
        onUploadImage={onUploadImage}
        onUploadComplete={onUploadComplete}
      />
      <div className={css.or}>OR</div>
      <MediaLibraryPicker
        disabled={disabled}
        onUploadStart={onUploadStart}
        onUploadImage={onUploadImage}
        onUploadComplete={onUploadComplete}
        items={items}
      />
  </>
  );
};
