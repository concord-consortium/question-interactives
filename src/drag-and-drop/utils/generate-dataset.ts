import { IDataset } from "@concord-consortium/lara-interactive-api";
import { IDraggableItemWrapper } from "../components/draggable-item-wrapper";
import { IDropZone } from "../components/types";

export const generateDataset = (target: IDropZone, draggableItem: IDraggableItemWrapper): IDataset | null => {
  const value = draggableItem.item.value;
  const label = target.targetLabel || "Bin 1";
  return {
    type: "dataset",
    version: 1,
    properties: ["body of water", "area"],
    // Always use first property as X axis. It might be necessary to customize that in the future, but it doesn't
    // seem useful now.
    xAxisProp: "body of water",
    rows: [[label,value]]
  };
};