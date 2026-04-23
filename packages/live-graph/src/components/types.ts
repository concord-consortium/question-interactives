import { IAuthoringInteractiveMetadata } from "@concord-consortium/lara-interactive-api";

export type YAxisRangeMode = "auto" | "fixed";
export type ColumnFilteringMode = "all" | "allow" | "ignore";
export type LegendPosition = "top" | "right" | "bottom" | "left";
export type ChartTitleAlignment = "start" | "center" | "end";

export interface IAuthoredState extends IAuthoringInteractiveMetadata {
  version: 1;
  dataSourceInteractive?: string; // "none" sentinel until a real interactive is picked
  chartTitle?: string;
  xAxisColumn?: string;
  xAxisLabel?: string;
  xAxisMax?: number;
  yAxisLabel?: string;
  yAxisRangeMode?: YAxisRangeMode;
  yMin?: number;
  yMax?: number;
  columnDisplayNames?: string; // raw "name=label\nname=label" text
  columnFilteringMode?: ColumnFilteringMode;
  allowList?: string;
  ignoreList?: string;
  chartHeight?: number;
  legendPosition?: LegendPosition;
  chartTitleAlignment?: ChartTitleAlignment;
  noDataMessage?: string;
  noSourceMessage?: string;
}

export const DEFAULT_NO_DATA_MESSAGE = "Waiting for data...";
export const DEFAULT_NO_SOURCE_MESSAGE = "No data source configured";

export const DemoAuthoredState: IAuthoredState = {
  version: 1,
  questionType: "iframe_interactive",
};
