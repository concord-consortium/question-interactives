import React from "react";
import { IDraggableItem } from "./types";
import css from "./draggable-item.scss";

export interface IProps {
  item: IDraggableItem;
}

// Just an image for now, but it can be extended in the future to include some text and other elements.
export const DraggableItem: React.FC<IProps> = ({ item }) => {
  return (
    <div className={`${css.draggableItem}`}>
      <div className={`${css.itemLabel}`}>{item.itemLabel}</div>
      <div className={`${css.itemValue}`}>{item.itemValue} {item.itemUnit}</div>
      {item.imageUrl && <img src={item.imageUrl} alt="draggable item" width={`${item.imageWidth}px`} height={`${item.imageHeight}px`}/>}
    </div>
  );
};
