import React, { useRef } from "react";
import { DynamicText } from "@concord-consortium/dynamic-text";
import { DragSourceMonitor, useDrag } from "react-dnd";

import { IDraggableItem, IPosition } from "./types";
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
  rect: { width: number; height: number; };
}

// Provides dragging logic and renders basic draggable item.
export const DraggableItemWrapper: React.FC<IProps> = ({ item, position, draggable }) => {
  const draggableElement = useRef<HTMLDivElement>(null);
  const [{ isDragging }, drag] = useDrag<IDraggableItemWrapper, any, any>({
    item: {type: "draggable-item-wrapper", item, position, rect: draggableElement.current?.getBoundingClientRect() || {width: 1, height: 1}},
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
        <div ref={draggableElement}>
          <DraggableItem item={item} />
        </div>
        <div className={css.itemLabel}><DynamicText>{item.label}</DynamicText></div>
      </div>
  );
};
