import { ComponentType } from "react";
import { Globals } from "../models/globals";
import { GlobalValue } from "./globals";

export type WidgetSize = "short" | "tall" | "very-tall";

export interface BaseSliderWidgetData {
  formatType?: "decimal" | "integer" | "percent";
  icon?: string;
  label: string;
  max: number;
  min: number;
  precision?: number;
  secondaryLabel?: string;
  showReadout?: boolean;
  step?: number;
  unit?: string;
}

export interface CircularSliderWidgetData extends BaseSliderWidgetData {}
export interface SliderWidgetData extends BaseSliderWidgetData {}

export interface ReadoutWidgetData {
  backgroundColor?: string;
  color?: string;
  formatType?: "decimal" | "integer" | "percent";
  icon?: string;
  label?: string;
  precision?: number;
  unit?: string;
}

export type WidgetData = CircularSliderWidgetData | ReadoutWidgetData | SliderWidgetData;

export interface IWidgetProps {
  data?: WidgetData;
  defaultValue?: GlobalValue;
  globalKey: string;
  type: string;
}

export interface IWidgetComponentProps<TData extends WidgetData = WidgetData> extends IWidgetProps {
  data?: TData;
  globals: Globals;
}
export type WidgetComponent = ComponentType<IWidgetComponentProps>;
