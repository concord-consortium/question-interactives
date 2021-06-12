import React from "react";
import { IDropZone } from "./types";
import css from "./drop-zone-wrapper.scss";

export interface IProps {
  target: IDropZone;
  highlight?: boolean;
}

// Just an image for now, but it can be extended in the future to include some text and other elements.
export const DropZone: React.FC<IProps> = ({ target, highlight }) => {
  return (
    <div className={highlight? css.highlight: ""}>
    {target.imageUrl && <img src={target.imageUrl} alt="drag target" />}
  </div>
  );
};
