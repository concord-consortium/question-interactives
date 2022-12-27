import React from "react";
import { IDropZone } from "./types";

export interface IProps {
  target: IDropZone;
}

// Just a box for now, but it can be extended in the future to include text and other elements.
export const DropZone: React.FC<IProps> = ({ target }) => {
  const style={width: target.targetWidth, height: target.targetHeight};
  return (
    <div style={style} />
  );
};
