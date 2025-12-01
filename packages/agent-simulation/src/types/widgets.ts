import { ComponentType } from "react";
import { AgentSimulation } from "../models/agent-simulation";
import { GlobalValue } from "./globals";

export type WidgetSize = "short" | "tall" | "very-tall";

export interface ReadoutWidgetData {
  backgroundColor?: string;
  color?: string;
  formatType?: "decimal" | "integer" | "percent";
  label?: string;
  precision?: number;
  unit?: string;
}

export interface SliderWidgetData {
  label?: string;
  max: number;
  min: number;
}

// TODO: Define more widget data types as they are added.
export type WidgetData = ReadoutWidgetData | SliderWidgetData;
export interface IWidgetProps {
  data?: WidgetData;
  defaultValue?: GlobalValue;
  globalKey: string;
  type: string;
}

export interface IWidgetComponentProps<TData extends WidgetData = WidgetData> extends IWidgetProps {
  data?: TData;
  sim: AgentSimulation;
}
export type WidgetComponent = ComponentType<IWidgetComponentProps>;
