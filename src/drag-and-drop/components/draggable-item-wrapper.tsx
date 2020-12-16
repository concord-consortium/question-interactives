import React from "react";
import { IDraggableItem, IPosition } from "./types";
import { DragSourceMonitor, useDrag } from "react-dnd";
import { DraggableItem } from "./draggable-item";
import css from "./draggable-item-wrapper.scss";

export interface IProps {
  item: IDraggableItem;
  position: IPosition;
}

// These types are used by react-dnd.
export const DraggableItemWrapperType = "draggable-item-wrapper";
export interface IDraggableItemWrapper {
  type: "draggable-item-wrapper";
  item: IDraggableItem;
  position: IPosition;
}

// Provides dragging logic and renders basic draggable item.
export const DraggableItemWrapper: React.FC<IProps> = ({ item, position }) => {
  const [{ isDragging }, drag] = useDrag<IDraggableItemWrapper, any, any>({
    item: { type: "draggable-item-wrapper", item, position },
    collect: (monitor: DragSourceMonitor) => ({
      isDragging: monitor.isDragging()
    })
  });

  if (isDragging) {
    // Hide source element on dragging and render preview only.
    return null;
  }

  return (
    <div ref={drag} className={css.draggableItemWrapper} style={position}>
      <DraggableItem item={item} />
    </div>
  );
};
