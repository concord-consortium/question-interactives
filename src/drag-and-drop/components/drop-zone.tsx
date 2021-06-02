import React from "react";
// import { DropTarget } from "react-dnd";
import { IDropZone } from "./types";

export interface IProps {
  // target: IDropZone;
  item: IDropZone;
}

// Just an image for now, but it can be extended in the future to include some text and other elements.
export const DropZone: React.FC<IProps> = ({ item }) => {
  return (
    <div>
      {item.imageUrl && <img src={item.imageUrl} alt="drag target" width={item.targetWidth} height={item.targetHeight}/>}
      <div className="target-label">{item.targetLabel}</div>
    </div>
  );
};

// export default DropTarget("3", targetBin, collect)(DropZone);
