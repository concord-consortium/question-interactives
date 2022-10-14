import React, { useState, useRef, useEffect } from "react";
import deepmerge from "deepmerge";
import hash from "object-hash";
import { v4 as uuidv4 } from "uuid";
import { IInteractiveState as IDrawingToolInteractiveState} from "../../drawing-tool/components/types";
import { DrawingTool } from "../../drawing-tool/components/drawing-tool";
// import { PreviewPanel } from "./preview-panel"; // For mockup / Zeplin matching.
import { Log } from "../labbook-logging";
import { ThumbnailChooser, IThumbnailChooserProps } from "./thumbnail-chooser/thumbnail-chooser";
import { Thumbnail, IThumbnailProps } from "./thumbnail-chooser/thumbnail";
import { UploadImage } from "./upload-image";
import { CommentField } from "./comment-field";
import { IAuthoredState, IInteractiveState, ILabbookEntry } from "./types";
import { TakeSnapshot } from "./take-snapshot";
import { ThumbnailTitle } from "./thumbnail-chooser/thumbnail-title";

import css from "./runtime.scss";
import { renderHTML } from "../../shared/utilities/render-html";

export interface IProps {
  authoredState: IAuthoredState;
  interactiveState?: IInteractiveState;
  setInteractiveState?: (updateFunc: (prevState: IInteractiveState | null) => IInteractiveState) => void;
  report?: boolean;
}

// convert 1-26 to A-Z.
const numberToAlpha = (value:number) => (value + 10).toString(26).toUpperCase();

const generateItem = () => {
  const id = uuidv4();
  const item:ILabbookEntry = {
    data: {answerType: "interactive_state"},
    comment: "",
    id
  };
  return item;
};


export const Runtime: React.FC<IProps> = ({ authoredState, interactiveState, setInteractiveState, report }) => {

  const readOnly = !!(report || (authoredState.required && interactiveState?.submitted));

  const [disableUI, setDisableUI] = useState(false);
  const [containerWidth, setContainerWidth] = useState(514);
  const [canvasWidth, setCanvasWidth] = useState(465);
  const ensureSelected = (prev: Partial<IInteractiveState>) => {
    const result = { ...prev };
    if (!result.entries?.length){
      result.entries = [generateItem()];
    }

    if(!result.entries?.find(e => e.id === result.selectedId)) {
      result.selectedId = result.entries?.[0].id;
    }
    return result;
  };

  const {maxItems, showItems} = authoredState;
  const {entries, selectedId} = ensureSelected(interactiveState as IInteractiveState) as IInteractiveState;
  const containerRef = useRef<HTMLDivElement>(null);

  // checking if app container is smaller than full-width; if so, we need to scale down app
  useEffect(
    () => {
      if (containerRef.current && containerRef.current.clientWidth < 514) {
        setContainerWidth(containerRef.current.clientWidth);
        setCanvasWidth(containerRef.current.clientWidth - 42);
      }
    },
    []
  );

  const setEntries = (newEntries: Array<ILabbookEntry>) => {
    setInteractiveState?.(prevState => ({
      ...prevState as IInteractiveState,
      entries: newEntries
    }));
  };

  const setSelectedItemId = (id:string) => {
    Log({action: "item selected", data:{id}});
    setInteractiveState?.(prevState => ({
      ...prevState as IInteractiveState,
      selectedId: id
    }));
  };

  const addItem = () => {
    Log({action: "item added"});
    const item = generateItem();
    setEntries([...entries||[], item]);
    setSelectedItemId(item.id);
  };

  const addBlankItem = () => {
    return {
      id: uuidv4(),
      empty: true,
      label: "",
      data: {},
      onClick: addItem
    };
  };

  // Add 'empty' items:
  const addBlankItems = (_items: Array<IThumbnailProps>, onClick?: () => void) => {
    const itemsToShow = showItems;
    const numBlanks = Math.max(1, itemsToShow - _items.length);
    if (_items.length < maxItems) {
      for (let c = 0; c < numBlanks; c++) {
        _items.push(addBlankItem());
      }
    }
    return _items;
  };

  const clearSelectedItemID = (id: string) => {
    Log({action: "item deleted", data: {id}});
    const newEntries = entries.filter((i:ILabbookEntry) => i.id !== id);
    setSelectedItemId("nothing");
    setEntries(newEntries);
  };

  const anyObjectInDrawingState = (drawingState?: string) => {
    try {
      return drawingState ? JSON.parse(drawingState)?.canvas.objects?.length > 0 : false;
    } catch (e) {
      return false;
    }
  };

  const toThumbnailProps = (entry: ILabbookEntry, index: number) => {
    const entryNotBlank = entry.data?.userBackgroundImageUrl || anyObjectInDrawingState(entry.data?.drawingState);
    const thumbProps: IThumbnailProps = {
      data: { entry },
      id: entry.id,
      label: numberToAlpha(index),
      thumbContent: entryNotBlank ? (
        <div className={css.labbookThumbnail}>
          <DrawingTool
            buttons={[]} // Hide Drawing Tool UI
            authoredState={authoredState}
            interactiveState={entry.data}
            readOnly={true}
            hideReadOnlyOverlay={true}
            canvasScale={78 / canvasWidth} // 78 is based on the labbookThumbnail width (see runtime.scss)
          />
        </div>
      ) : "[blank]",
      empty: false
    };
    return thumbProps;
  };

  const thumbnailItems = addBlankItems(entries.map(toThumbnailProps), addItem);

  const thumbnailChooserProps: IThumbnailChooserProps = {
    items: thumbnailItems,
    RenderingF: Thumbnail,
    selectedItemId: selectedId || null,
    setSelectedItemId: setSelectedItemId,
    clearSelectedItemId: clearSelectedItemID,
    maxDisplayItems: showItems,
    readOnly
  };

  const selectedItem = entries.find(i => i.id === selectedId);
  const selectedIndex = entries.findIndex(i => i.id === selectedId);
  const title = selectedIndex !== -1 ? numberToAlpha(selectedIndex) : "";

  const updateEntryId = (id: string, fields: Partial<ILabbookEntry>) => {
    setInteractiveState?.((prevState: IInteractiveState) => {
      const pEntries = prevState?.entries || entries;
      const item = pEntries?.find(i => i.id === id);
      if (item) {
        const updatedEntry: ILabbookEntry = deepmerge(item, fields) as ILabbookEntry;
        const newEntries = pEntries.map(i => i.id === selectedId ? updatedEntry : i);
        return {
          ...prevState,
          answerType: "interactive_state",
          entries: newEntries
        };
      }
      return prevState;
    });
  };

  const updateSelectedEntryState = (fields: Partial<ILabbookEntry>) => {
    if (selectedId) {
      updateEntryId(selectedId, fields);
    }
  };

  const setDrawingStateFn = (func: (prevState: IDrawingToolInteractiveState | null) => IDrawingToolInteractiveState) => {
    const drawingState = func(selectedItem?.data || null);
    if (drawingState) {
      const drawingHash = hash(drawingState);
      if (selectedItem?.dataHash !== drawingHash) {
        updateSelectedEntryState({ data: drawingState });
      }
    }
  };

  const setComment = (newComment:string) => {
    updateSelectedEntryState({comment: newComment});
  };

  const onUploadStart = () => setDisableUI(true);
  const onUploadEnd = () => setDisableUI(false);

  const drawingToolButtons = [
    'select',
    'free',
    'shapesPalette',
    'stamp',
    'annotation',
    'trash',
  ];

  return (
    <>
    { authoredState.prompt &&
      <div>{renderHTML(authoredState.prompt)}</div>
    }
    <div className={css["app"]} ref={containerRef}>
      <div className={css["container"]} style={{width: containerWidth}}>
        <ThumbnailChooser {...thumbnailChooserProps} />
        <div className={css["draw-tool-wrapper"]}>
          <ThumbnailTitle className={css["draw-tool-title"]} title={title} />
          <DrawingTool
            key={selectedId}
            authoredState={authoredState}
            interactiveState={{...selectedItem?.data, answerType: "interactive_state"}}
            setInteractiveState={setDrawingStateFn}
            buttons={drawingToolButtons}
            width={canvasWidth}
            height={495}
            readOnly={readOnly}
          />
        </div>
        <div className={css["under-sketch"]}>
          {!readOnly &&
          <div className={css["buttons"]}>
            <UploadImage
              authoredState={authoredState}
              setInteractiveState={setDrawingStateFn}
              disabled={disableUI}
              onUploadStart={onUploadStart}
              onUploadComplete={onUploadEnd}
            />

            <TakeSnapshot
              authoredState={authoredState}
              interactiveState={{...selectedItem?.data, answerType: "interactive_state"}}
              setInteractiveState={setDrawingStateFn}
              disabled={disableUI}
              onUploadStart={onUploadStart}
              onUploadComplete={onUploadEnd}
            />

          </div>}
          <CommentField
            title={title}
            comment={selectedItem?.comment||""}
            empty={!selectedItem}
            readOnly={readOnly}
            setComment={setComment}
          />
        </div>
      </div>
    </div>
    </>
  );
};

