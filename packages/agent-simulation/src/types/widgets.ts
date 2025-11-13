import { ComponentType } from "react";
import { AgentSimulation } from "../models/agent-simulation";
import { GlobalValue } from "./globals";

export type WidgetData = any;
export interface IWidgetProps {
  data?: WidgetData;
  defaultValue?: GlobalValue;
  global: string;
  type: string;
}

export interface IWidgetComponentProps extends IWidgetProps {
  sim: AgentSimulation;
}
export type WidgetComponent = ComponentType<IWidgetComponentProps>;
