import React from "react";
import { IDragTarget, IPosition } from "./types";

export interface IProps {
  target: IDragTarget;
  position: IPosition;
}

// Just an image for now, but it can be extended in the future to include some text and other elements.
export const DragTargetWrapper: React.FC<IProps> = ({ target }) => {
  return (
    <img src={target.imageUrl} alt="drag target"/>
  );
};
