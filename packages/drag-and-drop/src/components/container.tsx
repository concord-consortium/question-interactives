import React, { useCallback, useEffect, useRef, useState } from "react";
import { IRuntimeQuestionComponentProps } from "@concord-consortium/question-interactives-helpers/src/components/base-question-app";
import { IAuthoredState, IDraggableItem, IDroppedItem, IDropZone, IInitialState, IInteractiveState, IPosition, ItemId, TargetId } from "./types";
import { renderHTML } from "@concord-consortium/question-interactives-helpers/src/utilities/render-html";
import { useDrop } from "react-dnd";
import { DraggableItemWrapper, DraggableItemWrapperType, IDraggableItemWrapper } from "./draggable-item-wrapper";
import { DropZoneWrapper, DropZoneWrapperType, IDropZoneWrapper } from "./drop-zone-wrapper";
import css from "./container.scss";
import { generateDataset } from "../utils/generate-dataset";
import { flushStateUpdates } from "@concord-consortium/lara-interactive-api";
import { cssUrlValue } from "@concord-consortium/question-interactives-helpers/src/utilities/css-url-value";
import { DynamicText } from "@concord-consortium/dynamic-text";

export interface IProps extends IRuntimeQuestionComponentProps<IAuthoredState, IInteractiveState> {
  // Used only for authoring (initial state is part of the authored state).
  setInitialState?: (initialState: IInitialState) => void;
  view?: "standalone";
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

const getTargetTop = (
  minTop: number, targets: IDropZone[], targetPositions: Record<TargetId, IPosition>,
  targetDimensions: Record<TargetId, IDimensions>, index: number
) => {
  let top = minTop;
  for (let i = 0; i < index; i += 1) {
    const target = targets[i];
    // If item has been already moved by author, doesn't count it in.
    if (!targetPositions[target.id]) {
      top += targetDimensions[target.id]?.height || 100;
      top += margin;
    }
  }
  return top;
};

export const Container: React.FC<IProps> = ({ authoredState, interactiveState, setInteractiveState, setInitialState, report, view }) => {
  const readOnly = !!(report || (authoredState.required && interactiveState?.submitted));
  const [ itemDimensions, setItemDimensions ] = useState<Record<ItemId, IDimensions>>({});
  const [ targetDimensions, setTargetDimensions ] = useState<Record<TargetId, IDimensions>>({});
  const draggingAreaPromptRef = useRef<HTMLDivElement>(null);
  const canvasWidth = authoredState.canvasWidth || 330;
  const canvasHeight = authoredState.canvasHeight || 300;
  const draggingAreaPromptHeight = draggingAreaPromptRef.current?.offsetHeight || 0;
  const availableWidth = window.innerWidth - 40;
  const availableHeight = window.innerHeight;
  const xScaleRatioForReport = canvasWidth > availableWidth ? availableWidth/canvasWidth : 1;
  const yScaleRatioForReport = canvasHeight > availableHeight ? availableHeight/canvasHeight : 1;
  const scaleRatioForReport = Math.min(xScaleRatioForReport, yScaleRatioForReport);
  // There are 2 sources from where item positions can be obtained. Note that order is very important here.
  const itemPositions: Record<string, IPosition> = {
    // Initial state coming from authored state. Used when this component is used in runtime mode or in authoring mode.
    ...authoredState.initialState?.itemPositions,
    // Interactive state. If only available, that's the highest priority. Used in runtime mode only.
    ...interactiveState?.itemPositions
  };
  const targetPositions: Record<string, IPosition> = {
    ...authoredState.initialState?.targetPositions,
  };
  const droppedItemData: Record<string, IDroppedItem> = {
    ...interactiveState?.droppedItemData
  };

  useEffect(() => {
    // Preload draggable items to get their dimensions.
    authoredState.draggableItems?.forEach(item => {
      if (item.imageUrl) {
        const img = document.createElement("img");
        img.src = item.imageUrl;
        img.onload = () => {
          setItemDimensions(prevHash => ({...prevHash, [item.id]: {width: img.width, height: img.height}}));
        };
      }
    });
    authoredState.dropZones?.forEach(target => {
        setTargetDimensions(prevHash => (
          {...prevHash, [target.id]: {width: target.targetWidth || 100, height: target.targetHeight || 100}}
        ));
    });
  }, [authoredState.draggableItems, authoredState.dropZones]);

  // This useEffect callback will automatically take care of all the necessary dataset updates, so `generateDataset`
  // doesn't need to be spread all over this file in all the `setInteractiveState` calls.
  // It'll also set initial, empty dataset that only includes bin labels and lets graph interactive render correctly.
  useEffect(() => {
    // PJ 16/6/2021: setTimeout should not be necessary. There might be a bug in LARA Interactive API client
    // in or Activity Player. I was debugging that and I noticed that when two interactive state updates happen
    // right after each other, one of them is lost. And it seems to be the latest one.
    // In this particular case, one state update was coming from `handleItemDrop` function that was updating
    // `droppedItemData` and the second one was coming from this callback. Unfortunately, Firestore was reporting
    // only the first state update. 1ms setTimeout seems to workaround this issue for now.
    setTimeout(() => {
      setInteractiveState?.(prevState => ({
        ...prevState,
        answerType: "interactive_state",
        dataset: generateDataset(authoredState.dropZones, prevState?.droppedItemData)
      }));
      flushStateUpdates();
    }, 1);
    // The dependency array should also include `setInteractiveState`, but this function seems to be updated
    // on each state update. It results in an infinite loop. Probably a bug in LARA Interactive API client.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authoredState.dropZones, interactiveState?.droppedItemData]);

  const moveDraggableItem = useCallback((id: string, left: number, top: number) => {
    if (setInitialState) {
      // Authoring mode.
      setInitialState({
        itemPositions: {
          ...authoredState.initialState?.itemPositions,
          [id]: {left, top}
        },
        targetPositions: {
          ...authoredState.initialState?.targetPositions,
          [id]: {left, top}
        },
      });
    } else if (setInteractiveState) {
      // Runtime mode.
      setInteractiveState(prevState => ({
        ...prevState,
        answerType: "interactive_state",
        itemPositions: {
          ...prevState?.itemPositions,
          [id]: {left, top}
        },
      }));
    }
  }, [authoredState.initialState?.itemPositions, authoredState.initialState?.targetPositions, setInitialState, setInteractiveState]);

  const handleItemDrop = useCallback((targetData: IDropZone, targetPosition: IPosition, draggableItem: IDraggableItemWrapper, newItemPosition: IPosition) => {
    const droppedItem = draggableItem.item;
    const targetId = targetData.id;
    const targetDroppedItem = {targetId, targetPosition, droppedItem};

    // nudge item into target. Prioritize the top left corner if the item is too small.
    const nudgedItemPosition = {...newItemPosition};
    if (nudgedItemPosition.left + draggableItem.rect.width > targetPosition.left + targetData.targetWidth) {
      nudgedItemPosition.left = (targetPosition.left + targetData.targetWidth) - draggableItem.rect.width;
    }
    if (nudgedItemPosition.top + draggableItem.rect.height > targetPosition.top + targetData.targetHeight) {
      nudgedItemPosition.top = (targetPosition.top + targetData.targetHeight) - draggableItem.rect.height;
    }
    if (nudgedItemPosition.left < targetPosition.left) {
      nudgedItemPosition.left = targetPosition.left;
    }
    if (nudgedItemPosition.top < targetPosition.top) {
      nudgedItemPosition.top = targetPosition.top;
    }

    if (setInteractiveState) {
      // Runtime mode.
      setInteractiveState(prevState => {
        const newDroppedItemData = {
          ...prevState?.droppedItemData,
          [droppedItem.id]: targetDroppedItem
        };
        const newItemPositions = {
          ...prevState?.itemPositions,
          [droppedItem.id]: nudgedItemPosition
        };
        return {
          ...prevState,
          answerType: "interactive_state",
          droppedItemData: newDroppedItemData,
          itemPositions: newItemPositions
        };
      });
    }
  }, [setInteractiveState]);

  const [{ itemDragging }, drop] = useDrop({
    accept: [DraggableItemWrapperType, DropZoneWrapperType],
    drop(wrapper: IDraggableItemWrapper | IDropZoneWrapper, monitor) {
      const didDrop = monitor.didDrop();
      if (didDrop) {
        return;
      } else {
        const delta = monitor.getDifferenceFromInitialOffset() as { x: number, y: number };
        // if the item was in a drop container, we need to also take into account the top-left position of the container
        const dropTargetData = droppedItemData[wrapper.item.id];
        const left = Math.round(wrapper.position.left + delta.x);
        const top = Math.round(wrapper.position.top + delta.y);
        moveDraggableItem(wrapper.item.id, left, top);

        // if the item was in a drop container, remove it
        if (dropTargetData) {
          const filteredDroppedItemData: Record<string, IDroppedItem> = {};
          for (const key in droppedItemData) {
            if (key !== wrapper.item.id) {
              filteredDroppedItemData[key] = droppedItemData[key];
            }
          }
          if (setInteractiveState) {
            setInteractiveState(prevState => ({
              ...prevState,
              answerType: "interactive_state",
              droppedItemData: filteredDroppedItemData
            }));
          }
        }
      }
    },
    collect: monitor => ({
      itemDragging: monitor.getItem()
    }),
  });

  const draggingAreaStyle = {
    width: canvasWidth + "px",
    height: canvasHeight + "px",
    backgroundImage: authoredState.backgroundImageUrl ? cssUrlValue(authoredState.backgroundImageUrl) : undefined,
    transform: report && view !== "standalone" ? `scale(${scaleRatioForReport})` : undefined,
    transformOrigin: report && view !== "standalone" ? "left top" : undefined
  };

  return (
    <div ref={drop} className={css.draggingArea} style={draggingAreaStyle} data-cy="dnd-container">
      <div ref={draggingAreaPromptRef} className={css.prompt} style={{top: marginTop, left: marginLeft}}>
        <DynamicText>{renderHTML(authoredState.draggingAreaPrompt || "")}</DynamicText>
      </div>
      { authoredState.dropZones?.map((target, idx) => {
          let position = targetPositions[target.id];
          if (!position) {
            // If position is not available, calculate it dynamically using dimensions of other draggable items.
            // Put them all right below the dragging area prompt, in one column.
            const minTargetTop = marginTop;
            const top = getTargetTop(minTargetTop, authoredState.dropZones || [], targetPositions, targetDimensions, idx);
            position = {
              left: marginLeft,
              top: Math.min(canvasHeight - margin, top)
            };
          }
          return <DropZoneWrapper
                   key={target.id}
                   target={target}
                   position={position}
                   draggable={!readOnly && !setInteractiveState}
                   onItemDrop={handleItemDrop}
                 />;
        })
      }
      { authoredState.draggableItems?.map((item, idx) => {
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
          // When an item is being dragged, temporarily disable all other draggables until it is dropped. This
          // ensures the item registers as dropped in a drop zone even if it is dropped on top of another
          // draggable that is already in the drop zone.
          const tempDisable = itemDragging && itemDragging.item.id !== item.id;
          return <DraggableItemWrapper key={item.id} item={item} position={position} draggable={!readOnly && !tempDisable} />;
        })
      }
    </div>
  );
};
