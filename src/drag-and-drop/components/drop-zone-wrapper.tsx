import React from "react";
import { useDrop } from "react-dnd";
import { IDropZone, IPosition } from "./types";
import { DragSourceMonitor, useDrag } from "react-dnd";
import { DropZone } from "./drop-zone";
import { DropZonePreview } from "./drop-zone-preview";
import { DraggableItemWrapperType, IDraggableItemWrapper } from "./draggable-item-wrapper";
import css from "./drop-zone-wrapper.scss";

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

  const handleItemDrop = (wrapper: IDraggableItemWrapper) => {
    console.log("wrapper: ", wrapper);

    // if (trayType && notebookType) {
    //   if (trayType === notebookType) {
    //     setErrorClass("");
    //     onCategorizeAnimal(trayType, notebookType);
    //   }
    //   else {
    //     setErrorClass("error");
    //   }
    // }
  };

  const [{ isDragging }, drag] = useDrag<IDropZoneWrapper, any, any>({
    item: { type: "drop-zone-wrapper", item, position },
    collect: (monitor: DragSourceMonitor) => ({
      isDragging: monitor.isDragging(),
    }),
    canDrag: draggable
  });

  // const [, drop] = useDrop({
  const [{ isOver }, drop] = useDrop({
    accept: DraggableItemWrapperType,
    drop: (wrapper: IDraggableItemWrapper, monitor ) => {
      handleItemDrop(wrapper);
    },
    collect: monitor => ({
      isOver: !!monitor.isOver(),
    }),
  });

  return (
    <>
      {isDragging ? <DropZonePreview /> :
        <div
          ref={draggable ? drag : drop}
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
