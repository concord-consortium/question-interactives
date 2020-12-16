import React from "react";
import { usePreview } from "react-dnd-preview";
import { DraggableItem } from "./draggable-item";
import { IDraggableItemWrapper } from "./draggable-item-wrapper";
import css from "./draggable-item-preview.scss";

export const DraggableItemPreview = () => {
  const { display, style, item } = usePreview();
  // draggable-item-wrapper doesn't support TypeScript, so we can only manually cast its result to some types.
  const itemCasted: IDraggableItemWrapper = item;
  if (!display) {
    return null;
  }
  console.log(style);

  return (
    <div className={css.draggableItemPreview} style={style}>
      <DraggableItem item={itemCasted.item} />
    </div>
  );
};

