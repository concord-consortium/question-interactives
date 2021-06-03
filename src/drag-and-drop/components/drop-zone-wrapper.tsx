import React from "react";
import { IDropZone, IPosition } from "./types";
import { DragSourceMonitor, useDrag } from "react-dnd";
import { DropZone } from "./drop-zone";
import css from "./drop-zone-wrapper.scss";
import { DropZonePreview } from "./drop-zone-preview";

export interface IProps {
  item: IDropZone;
  position: IPosition;
  draggable: boolean;
}

// These types are used by react-dnd.
export const DropZoneWrapperType = "drop-zone-wrapper";
export interface IDropZoneWrapper {
  type: "drop-zone-wrapper";
  item: IDropZone;
  position: IPosition;
}

// Provides dragging logic and renders basic draggable item.
export const DropZoneWrapper: React.FC<IProps> = ({ item, position, draggable }) => {
  const [{ isDragging }, drag] = useDrag<IDropZoneWrapper, any, any>({
    item: { type: "drop-zone-wrapper", item, position },
    collect: (monitor: DragSourceMonitor) => ({
      isDragging: monitor.isDragging(),
    }),
    canDrag: draggable
  });

  return (
    <>
      {isDragging ? <DropZonePreview /> :
        <div
          ref={draggable ? drag : undefined}
          className={`${css.dropZoneWrapper} ${draggable ? css.draggable : ""} ${item.imageUrl ? "" : css.background }`}
          style={position}
          data-cy="draggable-item-wrapper"
        >
          <DropZone item={item} />
        </div>
      }
    </>
  );
};
