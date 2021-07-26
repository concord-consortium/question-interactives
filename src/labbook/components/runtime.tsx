import React from "react";
import { ThumbnailChooser, IThumbnailChooserProps } from "./thumbnail-chooser/thumbnail-chooser";
import { Thumbnail, IThumbnailProps } from "./thumbnail-chooser/thumbnail";
// import { PreviewPanel } from "./preview-panel";
import { UploadButton } from "./uploadButton";
import { CommentField } from "./comment-field";
import { v4 as uuidv4 } from "uuid";
import {IAuthoredState, IInteractiveState, ILabbookEntry } from "./types";
import { Runtime as DrawingToolComp } from "../../drawing-tool/components/runtime";
import SnapShotIcon from "../assets/snapshot-image-icon.svg";
import UploadIcon from "../assets/upload-image-icon.svg";
import deepmerge from "deepmerge";
import css from "./runtime.scss";
import {IInteractiveState as IDrawingToolInteractiveState} from "../../drawing-tool/components/types";

export interface IProps {
  authoredState: IAuthoredState;
  interactiveState?: IInteractiveState;
  setInteractiveState?: (updateFunc: (prevState: IInteractiveState | null) => IInteractiveState) => void;
  report?: boolean;
}


// convert 1-26 to A-Z.
const numberToAlpha = (value:number) => (value + 10).toString(26).toUpperCase();

export const Runtime: React.FC<IProps> = ({ authoredState, interactiveState, setInteractiveState, report }) => {
  const {maxItems, showItems} = authoredState;

  const defaultState: IInteractiveState = {
    entries: [],
    selectedId: null,
    answerType: "interactive_state"
  };
  const {entries, selectedId} = {...defaultState, ...interactiveState};

  const setEntries = (newEntries: Array<ILabbookEntry>) => {
    setInteractiveState?.(prevState => ({
      ...prevState as IInteractiveState,
      entries: newEntries
    }));
  };

  const setSelectedItemId = (id:string) => {
    setInteractiveState?.(prevState => ({
      ...prevState as IInteractiveState,
      selectedId: id
    }));
  };

  const addItem = () => {
    const id = uuidv4();
    const item:ILabbookEntry = {
      data: {answerType: "interactive_state"},
      comment: "",
      id
    };
    setSelectedItemId(id);
    setEntries([...entries, item]);
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
    const newEntries = entries.filter((i:ILabbookEntry) => i.id !== id);
    setSelectedItemId("nothing");
    setEntries(newEntries);
  };

  const toThumbnailProps = (entry:ILabbookEntry , index:number) => {
    const thumbProps: IThumbnailProps = {
      data: {entry},
      id: entry.id,
      label: numberToAlpha(index),
      empty: false
    };
    return thumbProps;
  };

  const thumbnailItems = addBlankItems(entries.map(toThumbnailProps), addItem);

  const thumbnailChooserProps: IThumbnailChooserProps = {
    items: thumbnailItems,
    RenderingF: Thumbnail,
    selectedItemId: selectedId,
    setSelectedItemId: setSelectedItemId,
    clearSelectedItemId: clearSelectedItemID,
  };

  const selectedItem = entries.find(i => i.id === selectedId);

  const setDrawingStateFn = (func:(prevState:IDrawingToolInteractiveState|null) => IDrawingToolInteractiveState) => {
    const drawingState = func(null);
    if(selectedItem && drawingState) {
      const updatedDrawing:ILabbookEntry = deepmerge(selectedItem, {data: drawingState}) as ILabbookEntry;
      // Object.assign({}, selectedItem, {data: {drawingState});
      const newEntries = entries.map(i=> i.id === selectedId ? updatedDrawing : i);
      const nextState:IInteractiveState = {
        ...interactiveState,
        answerType: "interactive_state",
        selectedId: selectedId,
        entries: newEntries
      };
      setInteractiveState?.(prevState => ({
        ...prevState,
        ...nextState
      }));
    }
  };

  const drawToolState = selectedItem?.data;
  const title="a"; // TODO: index → AlphaValue
  const setComment = (newComment:string) => {
    if(selectedItem) {
      selectedItem.comment = newComment;
    }
    setEntries([...entries]);
  };

  return (
    <div className={css["app"]}>
      <div className={css["container"]}>
        <ThumbnailChooser {...thumbnailChooserProps} />
        {/* <PreviewPanel item={selectedItem} /> */}
        <div className={css["draw-tool-wrapper"]}>
          <DrawingToolComp
            authoredState={{...authoredState,questionType:'iframe_interactive'}}
            interactiveState={{...drawToolState, answerType:"interactive_state"}}
            setInteractiveState={setDrawingStateFn}
          />
        </div>
        <div className={css["under-sketch"]}>
          <div className={css["buttons"]}>
            <UploadButton>
              <UploadIcon />
              Upload Image
            </UploadButton>

            <UploadButton>
              <SnapShotIcon />
              Take Snapshot
            </UploadButton>
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
