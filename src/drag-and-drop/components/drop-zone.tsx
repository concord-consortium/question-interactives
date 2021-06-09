import React from "react";
import { IDropZone } from "./types";
import css from "./drop-zone-wrapper.scss";

export interface IProps {
  target: IDropZone;
  highlight?: boolean;
}

// Just an image for now, but it can be extended in the future to include some text and other elements.
export const DropZone: React.FC<IProps> = ({ target, highlight }) => {
  const style={width: target.targetWidth, height: target.targetHeight};
  return (
    <div className={highlight? css.highlight: ""} style={style}>
      {target.imageUrl && <img src={target.imageUrl} alt="drag target" width={target.targetWidth} height={target.targetHeight}/>}
      <div className={css.targetLabel}>{target.targetLabel}</div>
    </div>
  );
};
