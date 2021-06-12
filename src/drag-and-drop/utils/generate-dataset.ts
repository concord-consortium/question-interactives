import { IDataset } from "@concord-consortium/lara-interactive-api";
import { IDraggableItemWrapper } from "../components/draggable-item-wrapper";
import { IDropZone } from "../components/types";
// import { handleSpecialValue, IDataTableData, IDataTableRow } from "../../shared/utils/handle-special-value";

export const generateDataset = (target: IDropZone, draggableItem: IDraggableItemWrapper): IDataset | null => {
  const dataProps = draggableItem || {};
  const propNames = Object.keys(dataProps);
  // if (propNames.length === 0) {
  //   return null;
  // }
  // const propTitles = propNames.map(n => dataProps[n].title);
  // const experimentData = data.experimentData as IDataTableData;
  // const rows = experimentData.map((row: IDataTableRow) =>
  //   propNames.map(name =>
  //     // Handle values like <AVG>, <STDDEV>, <SUM>, etc.
  //     handleSpecialValue(row[name], name, experimentData) || null
  //   )
  // );
  return {
    type: "dataset",
    version: 1,
    properties: ["bars", "area"],
    // Always use first property as X axis. It might be necessary to customize that in the future, but it doesn't
    // seem useful now.
    xAxisProp: target.targetLabel,
    rows: [[1,1],[2,2], [1,2],[2,1]]
  };
};