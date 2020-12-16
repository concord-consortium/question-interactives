import React, { useCallback, useEffect, useRef, useState } from "react";
import { IRuntimeQuestionComponentProps } from "../../shared/components/base-question-app";
import { IAuthoredState, IDraggableItem, IInteractiveState, IPosition, ItemId } from "./types";
import { renderHTML } from "../../shared/utilities/render-html";
import { useDrop } from "react-dnd";
import { DraggableItemPreview } from "./draggable-item-preview";
import { DraggableItemWrapper, DraggableItemWrapperType, IDraggableItemWrapper } from "./draggable-item-wrapper";
import css from "./container.scss";

interface IProps extends IRuntimeQuestionComponentProps<IAuthoredState, IInteractiveState> {}

interface IDimensions {
  width: number;
  height: number;
}

const marginLeft = 10;
const marginTop = 10;
const margin = 5;

const getInitialTop = (minTop: number, items: IDraggableItem[], itemPositions: Record<ItemId, IPosition>, itemDimensions: Record<ItemId, IDimensions>, idx: number) => {
  let top = minTop;
  for (let i = 0; i < idx; i += 1) {
    const item = items[i];
    top += itemDimensions[item.id]?.height || 0;
    top += margin;
  }
  return top;
};

export const Container: React.FC<IProps> = ({ authoredState, interactiveState, setInteractiveState }) => {
  const [ itemDimensions, setItemDimensions ] = useState<Record<ItemId, IDimensions>>({});
  const draggingAreaPromptRef = useRef<HTMLDivElement>(null);
  const itemPositions = interactiveState?.itemPositions || {};
  const canvasWidth = authoredState.canvasWidth || 330;
  const canvasHeight = authoredState.canvasHeight || 300;
  const draggingAreaPromptHeight = draggingAreaPromptRef.current?.offsetHeight || 0;

  useEffect(() => {
    authoredState.draggableItems?.forEach(item => {
      const img = document.createElement("img");
      if (item.imageUrl) {
        img.src = item.imageUrl;
        img.onload = () => {
          setItemDimensions(prevHash => ({...prevHash, [item.id]: {width: img.width, height: img.height }}));
        };
      }
    });
  }, [authoredState.draggableItems]);

  const moveDraggableItem = useCallback((id: string, left: number, top: number) => {
    setInteractiveState?.(prevState => ({
      ...prevState,
      answerType: "interactive_state",
      itemPositions: {
        ...prevState?.itemPositions,
        [id]: {left, top}
      }
    }));
  }, [setInteractiveState]);

  const [, drop] = useDrop({
    accept: DraggableItemWrapperType,
    drop(wrapper: IDraggableItemWrapper, monitor) {
      const delta = monitor.getDifferenceFromInitialOffset() as {
        x: number
        y: number
      };
      const left = Math.round(wrapper.position.left + delta.x);
      const top = Math.round(wrapper.position.top + delta.y);
      moveDraggableItem(wrapper.item.id, left, top);
    }
  });

  const draggingAreaStyle = {
    width: canvasWidth + "px",
    height: canvasHeight + "px",
    backgroundImage: authoredState.backgroundImageUrl ? `url("${authoredState.backgroundImageUrl}")` : undefined
  };

  return (
    <div ref={drop} className={css.draggingArea} style={draggingAreaStyle}>
      <div ref={draggingAreaPromptRef} className={css.prompt} style={{top: marginTop, left: marginLeft}}>
        {renderHTML(authoredState.draggingAreaPrompt || "")}
      </div>
      {
        authoredState.draggableItems?.map((item, idx) => {
          let position = itemPositions?.[item.id];
          if (!position) {
            // If position is not available, calculate it dynamically using dimensions of other draggable items.
            // Put them all right below the dragging area prompt, in one column.
            const minTop = marginTop + draggingAreaPromptHeight;
            const top = getInitialTop(minTop, authoredState.draggableItems || [], itemPositions, itemDimensions, idx);
            position = {
              left: marginLeft,
              top: Math.min(canvasHeight - margin, top)
            };
          }
          return <DraggableItemWrapper key={item.id} item={item} position={position} />;
        })
      }
      {/* Dragged item preview image (one that follows mouse cursor) */}
      <DraggableItemPreview />
    </div>
  );
};
