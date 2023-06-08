import React, { useState, useRef, useEffect } from "react";
import deepmerge from "deepmerge";
import hash from "object-hash";
import { v4 as uuidv4 } from "uuid";
import { IInteractiveState as IDrawingToolInteractiveState} from "drawing-tool-interactive/src/components/types";
import { DrawingTool } from "drawing-tool-interactive/src/components/drawing-tool";
import { renderHTML } from "@concord-consortium/question-interactives-helpers/src/utilities/render-html";
import { DynamicText } from "@concord-consortium/dynamic-text";

// import { PreviewPanel } from "./preview-panel"; // For mockup / Zeplin matching.
import { Log } from "../labbook-logging";
import { ThumbnailChooser, IThumbnailChooserProps } from "./thumbnail-chooser/thumbnail-chooser";
import { Thumbnail, IThumbnailProps } from "./thumbnail-chooser/thumbnail";
import { UploadImage } from "./upload-image";
import { CommentField } from "./comment-field";
import { IAuthoredState, IInteractiveState, ILabbookEntry } from "./types";
import { TakeSnapshot } from "./take-snapshot";
import { ThumbnailTitle } from "./thumbnail-chooser/thumbnail-title";
import classnames from "classnames";

import css from "./runtime.scss";

export interface IProps {
  authoredState: IAuthoredState;
  interactiveState?: IInteractiveState;
  setInteractiveState?: (updateFunc: (prevState: IInteractiveState | null) => IInteractiveState) => void;
  report?: boolean;
}

const layoutParam = new URLSearchParams(window.location.search).get("layout");
const layout = layoutParam === "wide" ? "wide" : "original";

// convert 1-26 to A-Z.
const numberToAlpha = (value:number) => (value + 10).toString(26).toUpperCase();

const generateItem = () => {
  const id = uuidv4();
  const item: ILabbookEntry = {
    comment: "",
    id
  };
  return item;
};


export const Runtime: React.FC<IProps> = ({ authoredState, interactiveState, setInteractiveState, report }) => {

  const readOnly = !!(report || (authoredState.required && interactiveState?.submitted));

  const isWideLayout = layout === "wide";
  const defaultContainerWidth = isWideLayout ? 574 : 514;
  const defaultCanvasWidth = isWideLayout ? 530 : 465;
  const drawingToolHeight = isWideLayout ? 318 : 495;

  const [disableUI, setDisableUI] = useState(false);
  const [containerWidth, setContainerWidth] = useState(defaultContainerWidth);
  const [canvasWidth, setCanvasWidth] = useState(defaultCanvasWidth);
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

  const {showUploadImageButton, backgroundSource } = authoredState;
  const {entries, selectedId} = ensureSelected(interactiveState as IInteractiveState) as IInteractiveState;
  const containerRef = useRef<HTMLDivElement>(null);

  // require at least 1 thumbnail
  const maxItems = Math.max(authoredState.maxItems, 1);
  const showItems = Math.max(authoredState.showItems, 1);

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
    readOnly,
    wideLayout: isWideLayout
  };

  const selectedItem = entries.find(i => i.id === selectedId);
  const selectedIndex = entries.findIndex(i => i.id === selectedId);
  const title = selectedIndex !== -1 ? numberToAlpha(selectedIndex) : "";

  const updateEntryId = (id: string, fields: Partial<ILabbookEntry>) => {
    setInteractiveState?.((prevState: IInteractiveState) => {
      // Note that the local variable `entries` is generated by `ensureSelected` helper and it should be used
      // when the previous state doesn't exist or the entries array empty.
      const pEntries = prevState?.entries?.length > 0 ? prevState?.entries : entries;
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
      <div><DynamicText>{renderHTML(authoredState.prompt)}</DynamicText></div>
    }
    <div className={classnames(css["app"], {[css.wide]: isWideLayout})} ref={containerRef}>
      <div className={classnames(css["container"], {[css.wide]: isWideLayout})} style={{width: containerWidth}}>
        {layout === "original" && <ThumbnailChooser {...thumbnailChooserProps} />}
        <div className={classnames(css["draw-tool-wrapper"], {[css.wide]: isWideLayout})} data-testid="draw-tool">
          <ThumbnailTitle className={css["draw-tool-title"]} title={title} />
          <DrawingTool
            key={selectedId}
            authoredState={authoredState}
            interactiveState={selectedItem?.data}
            setInteractiveState={setDrawingStateFn}
            buttons={drawingToolButtons}
            width={canvasWidth}
            height={drawingToolHeight}
            readOnly={readOnly}
            wideLayout={isWideLayout}
          />
        </div>
        <div className={classnames(css["under-sketch"], {[css.wide]: isWideLayout})}>
          {!readOnly &&
          <div className={css["buttons"]}>
            {
              (backgroundSource === "upload" || showUploadImageButton) &&
              <UploadImage
                authoredState={authoredState}
                setInteractiveState={setDrawingStateFn}
                disabled={disableUI}
                onUploadStart={onUploadStart}
                onUploadComplete={onUploadEnd}
              />
            }
            {
              backgroundSource === "snapshot" &&
              <TakeSnapshot
                authoredState={authoredState}
                interactiveState={{...selectedItem?.data, answerType: "interactive_state"}}
                setInteractiveState={setDrawingStateFn}
                disabled={disableUI}
                onUploadStart={onUploadStart}
                onUploadComplete={onUploadEnd}
              />
            }
          </div>}
          <CommentField
            title={title}
            comment={selectedItem?.comment||""}
            empty={!selectedItem}
            readOnly={readOnly}
            setComment={setComment}
            wideLayout={isWideLayout}
          />
        </div>
        {layout === "wide" && <ThumbnailChooser {...thumbnailChooserProps} />}
      </div>
    </div>
    </>
  );
};

