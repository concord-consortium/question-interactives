import { IDataset } from "@concord-consortium/lara-interactive-api";
import { IDropZone, TargetId } from "../components/types";

export const generateDataset = ( targets: IDropZone[], targetValues?: Record<TargetId, number>): IDataset | null => {

  const rows = targets.map( target => {
    const label = target.targetLabel || "Bin";
    const value = targetValues ? targetValues[label] : 0;
    return [label, value];
  });
  console.log(rows);
  return {
    type: "dataset",
    version: 1,
    properties: ["x", "y"],
    // Always use first property as X axis. It might be necessary to customize that in the future, but it doesn't
    // seem useful now.
    xAxisProp: "x",
    rows: rows
  };
};
