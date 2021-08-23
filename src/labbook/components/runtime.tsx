import React, { useState } from "react";
import deepmerge from "deepmerge";
import Shutterbug from "shutterbug";
import hash from "object-hash";
import { debounce } from "ts-debounce";
import { v4 as uuidv4 } from "uuid";

import { IInteractiveState as IDrawingToolInteractiveState} from "../../drawing-tool/components/types";
import { DrawingTool, drawingToolCanvasSelector  } from "../../drawing-tool/components/drawing-tool";

// import { PreviewPanel } from "./preview-panel"; // For mockup / Zeplin matching.
import { Log } from "../labbook-logging";
import { ThumbnailChooser, IThumbnailChooserProps } from "./thumbnail-chooser/thumbnail-chooser";
import { Thumbnail, IThumbnailProps } from "./thumbnail-chooser/thumbnail";
import { UploadImage } from "./upload-image";
import { CommentField } from "./comment-field";
import { IAuthoredState, IInteractiveState, ILabbookEntry } from "./types";
import { TakeSnapshot } from "./take-snapshot";

import css from "./runtime.scss";

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


  const [disableUI, setDisableUI] = useState(false);
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

  const toThumbnailProps = (entry:ILabbookEntry , index:number) => {
    const thumbProps: IThumbnailProps = {
      data: {entry},
      id: entry.id,
      label: numberToAlpha(index),
      thumbContent: entry.imageUrl ? <img src={entry.imageUrl} />: "[blank]",
      empty: false
    };
    return thumbProps;
  };

  const thumbnailItems = addBlankItems(entries.map(toThumbnailProps), addItem);

  const thumbnailChooserProps: IThumbnailChooserProps = {
    items: thumbnailItems,
    RenderingF: Thumbnail,
    selectedItemId: selectedId||null,
    setSelectedItemId: setSelectedItemId,
    clearSelectedItemId: clearSelectedItemID,
    maxDisplayItems: showItems
  };

  const selectedItem = entries.find(i => i.id === selectedId);
  const selectedIndex = entries.findIndex(i => i.id === selectedId);
  const title = selectedIndex !== -1 ? numberToAlpha(selectedIndex) : "";

  const updateEntryId = (id: string, fields: Partial<ILabbookEntry>) => {
    setInteractiveState?.((prevState: IInteractiveState) => {
      const pEntries = prevState?.entries||entries;
      const item = pEntries?.find(i => i.id === id);
      if(item) {
        const updatedEntry: ILabbookEntry = deepmerge(item, fields) as ILabbookEntry;
        const newEntries = pEntries.map(i=> i.id === selectedId ? updatedEntry : i);
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
    if(selectedId) {
      updateEntryId(selectedId, fields);
    }
  };

  const _saveSelectedPreview = (itemId: string) => {
    Shutterbug.snapshot({
      selector: drawingToolCanvasSelector,
      done: (snapshotUrl: string) => {
        updateEntryId(itemId, {imageUrl: snapshotUrl});
      },
      fail: (jqXHR: any, textStatus: any, errorThrown: any) => {
        window.alert("Image saving has failed. Please try to close the dialog again. If it continues to fail, try to reload the whole page.");
        console.error("Snapshot has failed", textStatus, errorThrown);
      }
    });
  };

  const saveSelectedPreview = debounce(_saveSelectedPreview, 500);

  const setDrawingStateFn = (func:(prevState:IDrawingToolInteractiveState|null) => IDrawingToolInteractiveState) => {
    const drawingState = func(selectedItem?.data||null);
    if(drawingState) {
      const drawingHash = hash(drawingState);
      if(selectedItem?.dataHash !== drawingHash) {
        updateSelectedEntryState({data: drawingState});
        if(selectedItem?.id) {
          saveSelectedPreview(selectedItem.id);
        }
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
    <div className={css["app"]}>
      <div className={css["container"]}>
        <ThumbnailChooser {...thumbnailChooserProps} />
        {/* <PreviewPanel item={selectedItem} /> */}
        <div className={css["draw-tool-wrapper"]}>
          <DrawingTool
            key={selectedId}
            authoredState={authoredState}
            interactiveState={{...selectedItem?.data, answerType: "interactive_state"}}
            setInteractiveState={setDrawingStateFn}
            buttons={drawingToolButtons}
            width={465}
            height={495}
          />
        </div>
        <div className={css["under-sketch"]}>
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

          </div>
          <CommentField
            title={title}
            comment={selectedItem?.comment||""}
            empty={!selectedItem}
            setComment={setComment}
          />
        </div>
      </div>
    </div>
  );
};

