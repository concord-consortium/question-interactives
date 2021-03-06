import React from "react";
import { IDraggableItem, IPosition } from "./types";
import { DragSourceMonitor, useDrag } from "react-dnd";
import { DraggableItem } from "./draggable-item";
import { DraggableItemPreview } from "./draggable-item-preview";
import css from "./draggable-item-wrapper.scss";

export interface IProps {
  item: IDraggableItem;
  position: IPosition;
  draggable: boolean;
}

// These types are used by react-dnd.
export const DraggableItemWrapperType = "draggable-item-wrapper";
export interface IDraggableItemWrapper {
  type: "draggable-item-wrapper";
  item: IDraggableItem;
  position: IPosition;
}

// Provides dragging logic and renders basic draggable item.
export const DraggableItemWrapper: React.FC<IProps> = ({ item, position, draggable }) => {
  const [{ isDragging }, drag] = useDrag<IDraggableItemWrapper, any, any>({
    item: {type: "draggable-item-wrapper", item, position},
    collect: (monitor: DragSourceMonitor) => ({
      isDragging: monitor.isDragging()
    })
  });

  return (
    isDragging
    ? <DraggableItemPreview />
    : <div
        ref={draggable ? drag : undefined}
        className={`${css.draggableItemWrapper} ${draggable ? css.draggable : ""}`}
        style={position}
        data-cy="draggable-item-wrapper"
      >
        <DraggableItem item={item} />
        <div className={css.itemLabel}>{item.label}</div>
      </div>
  );
};
