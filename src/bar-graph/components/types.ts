import { IAuthoringInteractiveMetadata, IRuntimeInteractiveMetadata } from "@concord-consortium/lara-interactive-api";

// Note that TS interfaces should match JSON schema. Currently there's no way to generate one from the other.
// TS interfaces are not available in runtime in contrast to JSON schema.

export type AxisOrientation = "horizontal" | "vertical"

export interface IBar {
  label: string
  value?: number;
  lockValue?: boolean;
  color?: string;
}

export interface IAuthoredState extends IAuthoringInteractiveMetadata {
  version: number;
  title?: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
  yAxisOrientation?: AxisOrientation;
  maxYValue?: number;
  yAxisCountBy?: number;
  showValuesAboveBars?: boolean;
  numberOfDecimalPlaces?: number;
  bars: IBar[]
}

export interface IInteractiveState extends IRuntimeInteractiveMetadata {
  submitted?: boolean;
}
