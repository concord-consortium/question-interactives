import React, { useCallback, useEffect, useRef, useState } from "react";
import { IRuntimeQuestionComponentProps } from "../../shared/components/base-question-app";
import { IAuthoredState, IDraggableItem, IInteractiveState, IPosition, ItemId } from "./types";
import { renderHTML } from "../../shared/utilities/render-html";
import { useDrop } from "react-dnd";
import { DraggableItemPreview } from "./draggable-item-preview";
import { DraggableItemWrapper, DraggableItemWrapperType, IDraggableItemWrapper } from "./draggable-item-wrapper";
import css from "./runtime.scss";

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

export const Runtime: React.FC<IProps> = ({ authoredState, interactiveState, setInteractiveState }) => {
  const [ itemDimensions, setItemDimensions ] = useState<Record<ItemId, IDimensions>>({});
  const draggingAreaPromptRef = useRef<HTMLDivElement>(null);
  const itemPositions = interactiveState?.itemPositions || {};
  const canvasWidth = authoredState.canvasHeight || 330;
  const canvasHeight = authoredState.canvasHeight || 300;
  const draggingAreaPromptHeight = draggingAreaPromptRef.current?.offsetHeight || 0;
  const draggingAreaStyle = { width: canvasWidth + "px", height: canvasHeight + "px"};

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

  const moveBox = useCallback((id: string, left: number, top: number) => {
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
      moveBox(wrapper.item.id, left, top);
    }
  });

  return (
    <div>
      <div>{renderHTML(authoredState.prompt || "")}</div>
      <div ref={drop} className={css.draggingArea} style={draggingAreaStyle}>
        <div ref={draggingAreaPromptRef} className={css.prompt} style={{top: marginTop, left: marginLeft}}>
          {renderHTML(authoredState.draggingAreaPrompt || "")}
        </div>
        {
          authoredState.draggableItems?.map((item, idx) => {
            let position = itemPositions?.[item.id];
            if (!position) {
              const minTop = marginTop + draggingAreaPromptHeight;
              const top = getInitialTop(minTop, authoredState.draggableItems || [], itemPositions, itemDimensions, idx);
              position = {
                left: marginLeft,
                top: Math.min(canvasHeight - 10, top)
              };
            }
            return <DraggableItemWrapper key={item.id} item={item} position={position} />;
          })
        }
        <DraggableItemPreview />
      </div>
    </div>
  );
};
