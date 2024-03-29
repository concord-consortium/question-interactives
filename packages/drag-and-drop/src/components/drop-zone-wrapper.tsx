import React from "react";
import { DropTargetMonitor, useDrop, DragSourceMonitor, useDrag } from "react-dnd";
import { DynamicText } from "@concord-consortium/dynamic-text";

import { IDropZone, IPosition } from "./types";
import { DropZone } from "./drop-zone";
import { DropZonePreview } from "./drop-zone-preview";
import { DraggableItemWrapperType, IDraggableItemWrapper } from "./draggable-item-wrapper";
import css from "./drop-zone-wrapper.scss";

export interface IProps {
  target: IDropZone;
  position: IPosition;
  draggable: boolean;
  onItemDrop: (targetData: IDropZone, targetPosition: IPosition, draggableItem: IDraggableItemWrapper, newItemPosition: IPosition) => void
}

// These types are used by react-dnd.
export const DropZoneWrapperType = "drop-zone-wrapper";
export interface IDropZoneWrapper {
  type: "drop-zone-wrapper";
  item: IDropZone;
  position: IPosition;
}

// Provides dragging logic and renders basic draggable item.
export const DropZoneWrapper: React.FC<IProps> = ({ target, position, draggable, onItemDrop }) => {
  const [{ isDragging }, drag] = useDrag<IDropZoneWrapper, any, any>({
    item: { type: "drop-zone-wrapper", item: target, position },
    collect: (monitor: DragSourceMonitor) => ({
      isDragging: monitor.isDragging(),
    }),
    canDrag: draggable
  });

  const [{ isOver, canDrop, getItem }, drop] = useDrop({
    accept: DraggableItemWrapperType,
    drop: (droppedItem: any, monitor) => {
      const delta = monitor.getDifferenceFromInitialOffset() as { x: number, y: number };
      const newItemPosition = { left: droppedItem.position.left + delta.x, top: droppedItem.position.top + delta.y };
      onItemDrop(target, position, getItem, newItemPosition);
    },
    collect: (monitor: DropTargetMonitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
      getItem: monitor.getItem(),
    }),
  });

  const zoneStyle = { left: position.left, top: position.top, width: target.targetWidth, height: target.targetHeight };
  const highlight = isOver && canDrop;
  const highlightClassName = highlight ? css.highlight : "";
  const draggableClassName = draggable ? css.draggable : "";
  return (
    isDragging
    ? <DropZonePreview />
    : <div
        ref={draggable ? drag : drop}
        className={`${css.dropZoneWrapper} ${css.background} ${draggableClassName} ${highlightClassName}`}
        style={zoneStyle}
        data-cy="drop-zone-wrapper"
      >
        <DropZone target={target} />
        <div className={css.targetLabel}><DynamicText>{target.targetLabel}</DynamicText></div>
      </div>
  );
};
