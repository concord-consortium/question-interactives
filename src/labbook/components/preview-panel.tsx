import React from "react";
import {IThumbnailProps } from "./thumbnail-chooser/thumbnail";
import { ThumbnailTitle } from "./thumbnail-chooser/thumbnail-title";
import css from "./preview-panel.scss";

export interface IPreviewPanelProps {
  item?: IThumbnailProps;
}

export const PreviewPanel: React.FC<IPreviewPanelProps> = (props) => {
  const {item} = props;
  const empty = item ? item.empty : true;
  return(
    <div className={css["preview-wrapper"]}>
      <div className={css["toolbar"]}/>
      <div className={css["preview-panel"]}>
        <ThumbnailTitle empty={empty} title={item?.id}/>
        <div className={css["item-view"]}>
          {item?.thumbContent}
        </div>
      </div>
    </div>
  );
};
