import React, { useState } from "react";
import { IMediaLibraryItem } from "@concord-consortium/lara-interactive-api";
import classnames from "classnames";

import cssHelpers from "@concord-consortium/question-interactives-helpers/src/styles/helpers.scss";
import css from "./media-library-picker.scss";

interface IProps {
  onUploadImage: (url: string, mode?: "replace" | "create") => void;
  onUploadStart?: () => void;
  onUploadComplete?: (result: { success: boolean }) => void;
  disabled?: boolean;
  items?: IMediaLibraryItem[];
  setUploadInProgress?: (inProgress: boolean) => void;
  onCloseModal: () => void;
}

export const MediaLibraryPicker: React.FC<IProps> = ({items, disabled, onUploadImage, onUploadStart, onUploadComplete, setUploadInProgress, onCloseModal}) => {
  const [selectedThumbnail, setSelectedThumbnail] = useState<IMediaLibraryItem>();

  const handleUploadFile = () => {
    if(!disabled && selectedThumbnail?.url) {
      const {url} = selectedThumbnail;
      onUploadStart?.();
      onUploadImage(url);
      onUploadComplete?.({ success: true });
      setUploadInProgress?.(false);
    }
  };

  // This function helps us style the tooltip so that it follows the user's mouse around as it hovers over a thumbnail.
  function showTooltip(e: React.MouseEvent<HTMLDivElement>) {
    const current = e.currentTarget.children[0];
    const getPosition = (xOrY: string) => {
      const pagePosition = xOrY === "x" ? e.pageX : e.pageY;
      return `${(pagePosition + current.clientWidth + 10 < document.body.clientWidth) ? (pagePosition + 10 + "px") : (document.body.clientWidth + 5 - current.clientWidth + "px")}`;
    };
    if (current) {
      current.setAttribute("style", `left: ${getPosition("x")}; top: ${getPosition("y")}`);
    }
  }


  return (
    <>
    <div className={css.container}>
      <div className={css.instructions}>Upload an image from this activity:</div>
      <div className={css.mediaLibraryPicker}>
        <div className={css.innerContainer}>
          {items && items.map((item) => {
            return (
              <div
                className={classnames(css.thumbnail, {[css.selected]: item === selectedThumbnail})}
                key={item.url}
                style={{backgroundImage: `url(${item.url})`}}
                onMouseMove={showTooltip}
                onClick={() => setSelectedThumbnail(item)}
              >
                <div className={css.toolTip}>{item.caption}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
    <div className={css.bottomButtons}>
      <button className={classnames(cssHelpers.interactiveButton, {[cssHelpers.disabled]: !selectedThumbnail})} disabled={!selectedThumbnail} onClick={handleUploadFile}>
        Upload from Activity
      </button>
      <button className={classnames(cssHelpers.interactiveButton, css.cancelButton)} onClick={onCloseModal}>
        Cancel
      </button>
    </div>
    </>
  );
};
