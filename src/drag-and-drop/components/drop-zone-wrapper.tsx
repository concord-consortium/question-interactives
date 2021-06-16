import React from "react";
import { DropTargetMonitor, useDrop } from "react-dnd";
import { IDroppedItem, IDropZone, IPosition } from "./types";
import { DragSourceMonitor, useDrag } from "react-dnd";
import { DropZone } from "./drop-zone";
import { DropZonePreview } from "./drop-zone-preview";
import { DraggableItemWrapper, DraggableItemWrapperType, IDraggableItemWrapper } from "./draggable-item-wrapper";
import css from "./drop-zone-wrapper.scss";

const kDropOffset = 30;

export interface IProps {
  target: IDropZone;
  position: IPosition;
  draggable: boolean;
  itemsInTarget: IDroppedItem[];
  onItemDrop: (targetData: IDropZone, targetPosition: IPosition, draggableItem: IDraggableItemWrapper) => void
}

// These types are used by react-dnd.
export const DropZoneWrapperType = "drop-zone-wrapper";
export interface IDropZoneWrapper {
  type: "drop-zone-wrapper";
  item: IDropZone;
  position: IPosition;
}

// Provides dragging logic and renders basic draggable item.
export const DropZoneWrapper: React.FC<IProps> = ({ target, position, draggable, itemsInTarget, onItemDrop }) => {
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
      onItemDrop(target, position, getItem);
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
        { itemsInTarget.map((item: any, idx: number) =>
            <DraggableItemWrapper
              key={`draggable-item-${idx}`}
              item={item.droppedItem}
              position={{ top: kDropOffset * idx, left: kDropOffset * idx }}
              draggable={true}
            />)
        }
        <DropZone target={target} />
        <div className={css.targetLabel}>{target.targetLabel}</div>
      </div>
  );
};
