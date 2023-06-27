import React, { useState } from "react";
import { IMediaLibraryItem } from "@concord-consortium/lara-interactive-api";
import classnames from "classnames";
import { Log } from "../labbook-logging";

import css from "./media-library-picker.scss";

interface IProps {
  onUploadImage: (url: string, mode?: "replace" | "create") => void;
  onUploadStart: () => void;
  onUploadComplete?: (result: { success: boolean }) => void;
  disabled?: boolean;
  items?: IMediaLibraryItem[];
}

export const MediaLibraryPicker: React.FC<IProps> = ({items, disabled, onUploadImage, onUploadStart, onUploadComplete}) => {
  const [selectedThumnail, setSelectedThumbnail] = useState<IMediaLibraryItem>();

  const handleUploadFile = (item: IMediaLibraryItem) => {
    if(!disabled && item?.url) {
      setSelectedThumbnail(item);
      const {url} = item;
      onUploadStart?.();
      onUploadImage(url);
      Log({action: "picture uploaded", data: {url}});
      onUploadComplete?.({ success: true });
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
    <div className={css.container}>
      <div className={css.instructions}>Upload an image from this activity:</div>
      <div className={css.mediaLibraryPicker}>
        <div className={css.innerContainer}>
          {items && items.map((item) => {
            return (
              <div
                className={classnames(css.thumbnail, {[css.selected]: item === selectedThumnail})}
                key={item.url}
                style={{backgroundImage: `url(${item.url})`}}
                onMouseMove={showTooltip}
                onClick={() => handleUploadFile(item)}
              >
                <div className={css.toolTip}>{item.caption}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
