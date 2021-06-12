import React from "react";
import { DropTargetMonitor, useDrop } from "react-dnd";
import { IDroppedItem, IDropZone, IPosition } from "./types";
import { DragSourceMonitor, useDrag } from "react-dnd";
import { DropZone } from "./drop-zone";
import { DropZonePreview } from "./drop-zone-preview";
import { DraggableItemWrapperType, IDraggableItemWrapper } from "./draggable-item-wrapper";
import css from "./drop-zone-wrapper.scss";
import { DraggableItem } from "./draggable-item";
import { IDataset } from "@concord-consortium/lara-interactive-api";
import { generateDataset } from "../utils/generate-dataset";

export interface IProps {
  target: IDropZone;
  position: IPosition;
  draggable: boolean;
  itemsInTarget: IDroppedItem[];
  setDataset: (dataset: IDataset | null) => void;
  onItemDrop: (targetId: string, draggableItem: IDraggableItemWrapper ) => void
}

// These types are used by react-dnd.
export const DropZoneWrapperType = "drop-zone-wrapper";
export interface IDropZoneWrapper {
  type: "drop-zone-wrapper";
  item: IDropZone;
  position: IPosition;
}


// Provides target logic and renders basic target item.
export const DropZoneWrapper: React.FC<IProps> = ({ target, position, draggable, itemsInTarget, setDataset, onItemDrop }) => {
  const handleDroppedItemData = (targetData: IDropZone, draggableItem: IDraggableItemWrapper) => {
    setDataset(generateDataset(targetData, draggableItem));
  };
  //Used for positioning targets in authoring
  const [{ isDragging }, drag] = useDrag<IDropZoneWrapper, any, any>({
    item: { type: "drop-zone-wrapper", item: target, position },
    collect: (monitor: DragSourceMonitor) => ({
      isDragging: monitor.isDragging(),
    }),
    canDrag: draggable
  });

  //Handles target during runtime
  const [{ isOver, canDrop, getItem }, drop] = useDrop({
    accept: DraggableItemWrapperType,
    drop: (monitor) => {
      onItemDrop(target.id, getItem);
      handleDroppedItemData(target, getItem);
    },
    collect: (monitor: DropTargetMonitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
      getItem: monitor.getItem(),
    }),
  });

  const zoneStyle = {left: position.left, top: position.top, width: target.targetWidth, height: target.targetHeight};
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
          {/* { itemsInTarget.map((itemId: string, idx: number) => { */}
            { itemsInTarget.map((item: any, idx: number) => {
                  // return <div key={item.targetId} className={css.itemInTarget}>{item.targetId}</div>;
                return <DraggableItem key={idx} item={item.droppedItem} />;
              })
            }
            <DropZone target={target} highlight={highlight} />
            <div className={css.targetLabel}>{target.targetLabel}</div>
          </div>
      }
    </>
  );
};
