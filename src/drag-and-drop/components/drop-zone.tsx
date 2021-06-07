import React from "react";
import { IDropZone } from "./types";
import css from "./drop-zone-wrapper.scss";

export interface IProps {
  // target: IDropZone;
  item: IDropZone;
  highlight?: boolean;
}

// Just an image for now, but it can be extended in the future to include some text and other elements.
export const DropZone: React.FC<IProps> = ({ item, highlight }) => {
  const style={width: item.targetWidth, height: item.targetHeight};
  return (
    <div className={highlight && css.highlight} style={style}>
      {item.imageUrl && <img src={item.imageUrl} alt="drag target" width={item.targetWidth} height={item.targetHeight}/>}
      <div>{item.targetLabel}</div>
    </div>
  );
};
