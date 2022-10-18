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
  hint?: string;
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

export const DefaultAuthoredState: Omit<Required<IAuthoredState>, "questionSubType"|"required"|"prompt"> = {
  version: 1,
  questionType: "iframe_interactive",
  hint: "",
  title: "",
  xAxisLabel: "",
  yAxisLabel: "",
  yAxisOrientation: "horizontal",
  maxYValue: 100,
  yAxisCountBy: 5,
  showValuesAboveBars: true,
  numberOfDecimalPlaces: 0,
  bars: []
};

export const DemoAuthoredState: IAuthoredState = {
  version: 1,
  questionType: "iframe_interactive",
  prompt: "<p>Can you <strong>estimate</strong> the amount of Spring and Summer sunlight?</p>",
  hint: "The amount Spring and Summer sunlight will be larger than Winter and Fall",
  title: "Estimate Amount of Spring and Summer Sunlight",
  xAxisLabel: "Seasons",
  yAxisLabel: "Days of Sunlight",
  yAxisOrientation: "horizontal",
  maxYValue: 100,
  yAxisCountBy: 10,
  showValuesAboveBars: true,
  numberOfDecimalPlaces: 0,
  bars: [
    { label: "Winter", value: 25, lockValue: true, color: "#EA6D2F" },
    { label: "Spring", value: 0, lockValue: false, color: "#FFC320" },
    { label: "Summer", value: 75, lockValue: false, color: "#2DA343" },
    { label: "Fall", value: 50, lockValue: true, color: "#6FC6DA" }
  ]
};
