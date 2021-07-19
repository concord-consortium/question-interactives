import React, {useState} from "react";
import { ThumbnailChooser, IThumbnailChooserProps } from "./thumbnail-chooser/thumbnail-chooser";
import { Thumbnail, IThumbnailProps } from "./thumbnail-chooser/thumbnail";
import { PreviewPanel } from "./preview-panel";
import { UploadButton } from "./uploadButton";
import { CommentField } from "./comment-field";
import SnapShotIcon from "../assets/snapshot-image-icon.svg";
import UploadIcon from "../assets/upload-image-icon.svg";
import css from "./app.scss";


const initialItems:Array<IThumbnailProps> = [
  {
    id: "A",
    empty: false,
    label: "apple",
    thumbContent: "apple",
    data: {}
  },
  {
    id: "B",
    empty: false,
    label: "banana",
    thumbContent: "Banana",
    data: {}
  },
  {
    id: "C",
    empty: false,
    label: "cherry",
    thumbContent: "Cherry",
    data: {}
  },
  {
    id: "D",
    empty: false,
    label: "dog",
    thumbContent: "Dog",
    data: {}
  },
  {
    id: "E",
    empty: false,
    label: "egg",
    thumbContent: "Egg",
    data: {}
  }
];

const displayItems = 4;
const emptyItem:IThumbnailProps = {
  id: "",
  empty: true,
  label: "",
  data: {}
};

const numberToAlpha = (value:number) => (value + 10).toString(36).toUpperCase();
const maxItems = 12;

// Add 'empty' items:
const addBlankItems = (items:Array<IThumbnailProps>, minCount:number, f?: ()=>void) => {
    const numBlanks = Math.max(1, minCount - items.length);
    if(items.length < maxItems) {
      for (let c = 0; c < numBlanks; c++) {
        const item = {... emptyItem};
        item.onClick = f;
        items.push({... emptyItem});
      }
    }
};

const updateLabels = (items:Array<IThumbnailProps>) => {
  items.forEach( (i,idx) => i.id=numberToAlpha(idx));
};


const cleanItemsList = (items: Array<IThumbnailProps>) => {
  const newItems = items.filter(i => !i.empty);
  addBlankItems(newItems, displayItems);
  updateLabels(newItems);
  return newItems;
};

cleanItemsList(initialItems);

export const App = () => {
  const[items, setItems] = useState(cleanItemsList(initialItems));
  const[selectedItemID, _setSelectedItemID] = useState("nothing");

  const addItem = () => {
    const names = "donut carrot lettuce candy milk icecream cookies".split(/\s+/);
    const index = Math.round(Math.random() * names.length);
    const name = names[index];
    const id = Math.round(Math.random() * 100).toString();

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


  return (
    <div className={css["app"]}>
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
