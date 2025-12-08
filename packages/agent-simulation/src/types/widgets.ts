import { ComponentType } from "react";
import { AgentSimulation } from "../models/agent-simulation";
import { GlobalValue } from "./globals";

export type WidgetSize = "short" | "tall" | "very-tall";

export interface BaseSliderWidgetData {
  formatType?: "decimal" | "integer" | "percent";
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
  label?: string;
  precision?: number;
  unit?: string;
}

// TODO: Define more widget data types as they are added.
export type WidgetData = CircularSliderWidgetData | ReadoutWidgetData | SliderWidgetData;
export interface IWidgetProps {
  data?: WidgetData;
  defaultValue?: GlobalValue;
  globalKey: string;
  type: string;
}

export interface IWidgetComponentProps<TData extends WidgetData = WidgetData> extends IWidgetProps {
  data?: TData;
  sim: AgentSimulation;
  isCompletedRecording: boolean;
  isRecording: boolean;
  inRecordingMode: boolean;
  recordedGlobalValues?: Record<string, any>;
}
export type WidgetComponent = ComponentType<IWidgetComponentProps>;
