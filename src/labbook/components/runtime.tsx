import React, {useEffect, useState} from "react";
import { ThumbnailChooser, IThumbnailChooserProps } from "./thumbnail-chooser/thumbnail-chooser";
import { Thumbnail, IThumbnailProps } from "./thumbnail-chooser/thumbnail";
import { PreviewPanel } from "./preview-panel";
import { UploadButton } from "./uploadButton";
import { CommentField } from "./comment-field";
import { v4 as uuidv4 } from "uuid";
import {IAuthoredState, IInteractiveState } from "./types";

import SnapShotIcon from "../assets/snapshot-image-icon.svg";
import UploadIcon from "../assets/upload-image-icon.svg";

import css from "./runtime.scss";

export interface IProps {
  authoredState: IAuthoredState;
  interactiveState?: IInteractiveState | null;
  setInteractiveState?: (updateFunc: (prevState: IInteractiveState | null) => IInteractiveState) => void;
  report?: boolean;
}

const emptyItem:IThumbnailProps = {
  id: "",
  empty: true,
  label: "",
  data: {}
};

// convert 1-26 to A-Z.
const numberToAlpha = (value:number) => (value + 10).toString(26).toUpperCase();

export const Runtime: React.FC<IProps> = ({ authoredState, interactiveState, setInteractiveState, report }) => {
  const {maxItems, showItems} = authoredState;
  return <RenderRuntime
    initialItems={[]}
    minItems={showItems}
    maxItems={maxItems}
    key={authoredState.maxItems}/>;
};

interface intProps {
  initialItems:Array<IThumbnailProps>;
  minItems:number;
  maxItems:number;
}

export const RenderRuntime: React.FC<intProps> = ({
  initialItems, minItems, maxItems}) => {
  const[items, setItems] = useState(initialItems);
  const[selectedItemID, _setSelectedItemID] = useState("nothing");

  // Add 'empty' items:
  const addBlankItems = (_items: Array<IThumbnailProps>, onClick?: () => void) => {
    const itemsToShow = minItems;
    const numBlanks = Math.max(1, itemsToShow - _items.length);
    if (_items.length < maxItems) {
      for (let c = 0; c < numBlanks; c++) {
        const item = { ...emptyItem };
        item.onClick = onClick;
        _items.push({ ...emptyItem });
      }
    }
  };

  const cleanItemsList = (_items: Array<IThumbnailProps>) => {
    const newItems = _items.filter(i => !i.empty);
    addBlankItems(newItems);
    updateLabels(newItems);
    return newItems;
  };

  const updateLabels = (_items:Array<IThumbnailProps>) => {
    _items.forEach( (i,idx) => i.id=numberToAlpha(idx));
  };

  // TODO: Implement:
  const addItem = () => {
    const names = "coffee tea donut carrot lettuce candy milk icecream cookies".split(/\s+/);
    const index = Math.round(Math.random() * names.length);
    const name = names[index];
    const id = uuidv4();

    const item:IThumbnailProps = {
      data: {},
      empty: false,
      id,
      label: name,
      thumbContent: name
    };

    items.push(item);
    _setSelectedItemID("none");
    const newItems=cleanItemsList(items);
    setItems(newItems);
  };

  items.filter(i => i.empty).forEach(i => i.onClick = addItem);

  const setSelectedItemID = (id: string) => {
    const found = items.find((i:IThumbnailProps) => i.id === id);
    if(found) {
      _setSelectedItemID(id);
    }
  };

  // const appendItem = (newItem:IItemSpec) => setItems(items.concat(newItem));
  const clearSelectedItemID = (id: string) => {
    const newItems = items.filter((i:IThumbnailProps) => i.id !== id);
    _setSelectedItemID("nothing");
    setItems(cleanItemsList(newItems));
  };

  const thumbnailChooserProps: IThumbnailChooserProps = {
    items,
    RenderingF: Thumbnail,
    selectedItemID,
    setSelectedItemID,
    clearSelectedItemID,
  };

  const selectedItem = items.find(i => i.id === selectedItemID);
  useEffect( () => {
    setItems(cleanItemsList(initialItems));
  },[initialItems]);

  return (
    <div className={css["app"]}>
      <div>MinItems:{minItems}</div>
      <div className={css["container"]}>
        <ThumbnailChooser {...thumbnailChooserProps} />
        <PreviewPanel item={selectedItem} />
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
          <CommentField item={selectedItem}/>
        </div>
      </div>
    </div>
  );
};
