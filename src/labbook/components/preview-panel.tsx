import React from "react";
import {IThumbnailProps } from "./thumbnail-chooser/thumbnail";
import { ThumbnailTitle } from "./thumbnail-chooser/thumbnail-title";
import "./preview-panel.scss";

export interface IPreviewPanelProps {
  item?: IThumbnailProps;
}

export const PreviewPanel: React.FC<IPreviewPanelProps> = (props) => {
  const {item} = props;
  const empty = item ? item.empty : true;
  return(
    <div className="preview-wrapper">
      <div className="toolbar"/>
      <div className="preview-panel">
        <ThumbnailTitle empty={empty} title={item?.id}/>
        <div className="item-view">
          {item?.thumbContent}
        </div>
      </div>
    </div>
  );
};
