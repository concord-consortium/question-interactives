import React, { useState } from "react";
import { DropTargetMonitor, useDrop } from "react-dnd";
import { IDropZone, IPosition } from "./types";
import { DragSourceMonitor, useDrag } from "react-dnd";
import { DropZone } from "./drop-zone";
import { DropZonePreview } from "./drop-zone-preview";
import { DraggableItemWrapperType, IDraggableItemWrapper } from "./draggable-item-wrapper";
import css from "./drop-zone-wrapper.scss";

export interface IProps {
  target: IDropZone;
  position: IPosition;
  draggable: boolean;
  itemsInTarget: string[];
  onItemDrop: (targetId: string, draggableItem: IDraggableItemWrapper ) => void
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
    drop: (droppedItem: any) => {
      onItemDrop(target.id, getItem);
      return droppedItem;
    },
    collect: (monitor: DropTargetMonitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
      getItem: monitor.getItem(),
      getDropResult: monitor.getDropResult(),
    }),
  });

  const zoneStyle = {left: position.left, top: position.top};
  const highlight = isOver && canDrop;
  return (
    <>
      { isDragging
        ? <DropZonePreview />
        : <div
            ref={draggable ? drag : drop}
            className={`${css.dropZoneWrapper}
                        ${draggable ? css.draggable : ""}
                        ${target.imageUrl ? "" : css.background }
                        ${(isOver && canDrop)? css.highlight : ""}
                      `}
            style={zoneStyle}
            data-cy="draggable-item-wrapper"
          >
            <DropZone target={target} highlight={highlight} />
          </div>
      }
    </>
  );
};
