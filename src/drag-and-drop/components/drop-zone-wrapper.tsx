import React, { useCallback } from "react";
import { DropTarget, DropTargetMonitor, useDrop } from "react-dnd";
import { IDropZone, IPosition } from "./types";
import { DragSourceMonitor, useDrag } from "react-dnd";
import { DropZone } from "./drop-zone";
import { DropZonePreview } from "./drop-zone-preview";
import { DraggableItemWrapperType, IDraggableItemWrapper } from "./draggable-item-wrapper";
import css from "./drop-zone-wrapper.scss";
import { setInteractiveState } from "@concord-consortium/lara-interactive-api";

export interface IProps {
  item: IDropZone;
  position: IPosition;
  draggable: boolean;
  moveDraggableItem: (id: string, left: number, top: number) => void
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
    moveDraggableItem(getItem, getItem.top, getItem.left );
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

  const moveDraggableItem = useCallback((id: string, left: number, top: number) => {
      // Runtime mode.
      setInteractiveState((prevState: { itemPositions: any; }) => ({
        ...prevState,
        answerType: "interactive_state",
        itemPositions: {
          ...prevState?.itemPositions,
          [id]: {left, top}
        },
      }));
    }, [setInteractiveState]);

  const [{ isDragging }, drag] = useDrag<IDropZoneWrapper, any, any>({
    item: { type: "drop-zone-wrapper", item, position },
    collect: (monitor: DragSourceMonitor) => ({
      isDragging: monitor.isDragging(),
    }),
    canDrag: draggable
  });

  // const [, drop] = useDrop({
  const [{ isOver, canDrop, getItem }, drop] = useDrop({
    accept: DraggableItemWrapperType,
    drop: (wrapper: any, monitor ) => {
      handleItemDrop(wrapper);
    },
    collect: (monitor: DropTargetMonitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
      getItem: monitor.getItem(),
    }),
  });

  const zoneStyle = {left: position.left, top: position.top, height: item.targetHeight, width: item.targetWidth};
  const highlight = isOver && canDrop;
  return (
    <>
      {isDragging ? <DropZonePreview /> :
        <div
          ref={draggable ? drag : drop}
          className={`${css.dropZoneWrapper}
                      ${draggable ? css.draggable : ""}
                      ${item.imageUrl ? "" : css.background }
                      ${isOver && canDrop? css.highlight : ""}`
                    }
          style={zoneStyle}
          data-cy="draggable-item-wrapper"
        >
            <DropZone item={item} highlight={highlight}/>
        </div>
      }
    </>
  );
};
