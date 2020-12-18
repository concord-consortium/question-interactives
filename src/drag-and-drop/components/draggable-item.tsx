import React from "react";
import { IDraggableItem } from "./types";

export interface IProps {
  item: IDraggableItem;
}

// Just an image for now, but it can be extended in the future to include some text and other elements.
export const DraggableItem: React.FC<IProps> = ({ item }) => {
  return (
    <img src={item.imageUrl} alt="draggable item"/>
  );
};
