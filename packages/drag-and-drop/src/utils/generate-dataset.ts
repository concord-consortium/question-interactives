import { IDataset } from "@concord-consortium/lara-interactive-api";
import { IDroppedItem, IDropZone, ItemId } from "../components/types";

export const generateDataset = (targets?: IDropZone[], droppedItemsData?: Record<ItemId, IDroppedItem>): IDataset => {
  const rows = targets?.map((target, idx) => {
    const label = target.targetLabel || `Bin ${idx + 1}`;
    let value = 0;
    Object.values(droppedItemsData || {}).forEach(droppedItemData => {
      if (target.id === droppedItemData.targetId) {
        // In the future summing can be replaced with other function types.
        value += droppedItemData.droppedItem.value;
      }
    });
    return [label, value];
  });

  return {
    type: "dataset",
    version: 1,
    properties: ["Bin label", "Value"],
    // Always use first property as X axis. It might be necessary to customize that in the future, but it doesn't
    // seem useful now.
    xAxisProp: "Bin label",
    rows: rows || [[]]
  };
};
