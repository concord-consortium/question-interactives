import React from "react";
import { usePreview } from "react-dnd-preview";
import { DropZone } from "./drop-zone";
import { IDropZoneWrapper } from "./drop-zone-wrapper";
import css from "./drop-zone-preview.scss";

export const DropZonePreview = () => {
  const { display, style, item } = usePreview();
  // drop-zone-wrapper doesn't support TypeScript, so we can only manually cast its result to some types.
  const itemCasted: IDropZoneWrapper = item;
  if (!display) {
    return null;
  }

  return (
    <div className={css.dropZonePreview} style={style}>
      <DropZone item={itemCasted.item} />
    </div>
  );
};

