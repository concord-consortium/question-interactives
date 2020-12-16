import React from "react";
import { usePreview } from "react-dnd-preview";
import { DraggableItem } from "./draggable-item";
import { IDraggableItemWrapper } from "./draggable-item-wrapper";

export const DraggableItemPreview = () => {
  const { display, style, item } = usePreview();
  const itemCasted: IDraggableItemWrapper = item;
  if (!display) {
    return null;
  }
  return (
    <div style={style}>
      <DraggableItem item={itemCasted.item} />
    </div>
  );
};

