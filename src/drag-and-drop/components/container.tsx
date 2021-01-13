import React, { useCallback, useEffect, useRef, useState } from "react";
import { IRuntimeQuestionComponentProps } from "../../shared/components/base-question-app";
import { IAuthoredState, IDraggableItem, IInitialState, IInteractiveState, IPosition, ItemId } from "./types";
import { renderHTML } from "../../shared/utilities/render-html";
import { useDrop } from "react-dnd";
import { DraggableItemPreview } from "./draggable-item-preview";
import { DraggableItemWrapper, DraggableItemWrapperType, IDraggableItemWrapper } from "./draggable-item-wrapper";
import css from "./container.scss";

export interface IProps extends IRuntimeQuestionComponentProps<IAuthoredState, IInteractiveState> {
  // Used only for authoring (initial state is part of the authored state).
  setInitialState?: (initialState: IInitialState) => void;
}

interface IDimensions {
  width: number;
  height: number;
}

export const marginLeft = 10;
export const marginTop = 10;
export const margin = 5;

const getInitialTop = (
  minTop: number, items: IDraggableItem[], itemPositions: Record<ItemId, IPosition>,
  itemDimensions: Record<ItemId, IDimensions>, idx: number
) => {
  let top = minTop;
  for (let i = 0; i < idx; i += 1) {
    const item = items[i];
    // If item has been already moved by author, doesn't count it in.
    if (!itemPositions[item.id]) {
      top += itemDimensions[item.id]?.height || 0;
      top += margin;
    }
  }
  return top;
};

export const Container: React.FC<IProps> = ({ authoredState, interactiveState, setInteractiveState, setInitialState, report }) => {
  const readOnly = !!(report || (authoredState.required && interactiveState?.submitted));
  const [ itemDimensions, setItemDimensions ] = useState<Record<ItemId, IDimensions>>({});
  const draggingAreaPromptRef = useRef<HTMLDivElement>(null);
  const canvasWidth = authoredState.canvasWidth || 330;
  const canvasHeight = authoredState.canvasHeight || 300;
  const draggingAreaPromptHeight = draggingAreaPromptRef.current?.offsetHeight || 0;
  // There are 2 sources from where item positions can be obtained. Note that order is very important here.
  const itemPositions: Record<string, IPosition> = {
    // Initial state coming from authored state. Used when this component is used in runtime mode or in authoring mode.
    ...authoredState.initialState?.itemPositions,
    // Interactive state. If only available, that's the highest priority. Used in runtime mode only.
    ...interactiveState?.itemPositions
  };

  useEffect(() => {
    // Preload draggable items to get their dimensions.
    authoredState.draggableItems?.forEach(item => {
      if (item.imageUrl) {
        const img = document.createElement("img");
        img.src = item.imageUrl;
        img.onload = () => {
          setItemDimensions(prevHash => ({...prevHash, [item.id]: {width: img.width, height: img.height }}));
        };
      }
    });
  }, [authoredState.draggableItems]);

  const moveDraggableItem = useCallback((id: string, left: number, top: number) => {
    if (setInitialState) {
      // Authoring mode.
      setInitialState({
        itemPositions: {
          ...authoredState.initialState?.itemPositions,
          [id]: {left, top}
        }
      });
    } else if (setInteractiveState) {
      // Runtime mode.
      setInteractiveState(prevState => ({
        ...prevState,
        answerType: "interactive_state",
        itemPositions: {
          ...prevState?.itemPositions,
          [id]: {left, top}
        }
      }));
    }
  }, [authoredState.initialState?.itemPositions, setInitialState, setInteractiveState]);

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
    <div ref={drop} className={css.draggingArea} style={draggingAreaStyle} data-cy="dnd-container">
      <div ref={draggingAreaPromptRef} className={css.prompt} style={{top: marginTop, left: marginLeft}}>
        {renderHTML(authoredState.draggingAreaPrompt || "")}
      </div>
      {
        authoredState.draggableItems?.map((item, idx) => {
          let position = itemPositions[item.id];
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
          return <DraggableItemWrapper key={item.id} item={item} position={position} draggable={!readOnly} />;
        })
      }
      {/* Dragged item preview image (one that follows mouse cursor) */}
      <DraggableItemPreview />
    </div>
  );
};