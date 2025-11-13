import * as AA from "@gjmcn/atomic-agents";
import { makeAutoObservable } from "mobx";

import { Global } from "../types/globals";
import { IWidgetProps } from "../types/widgets";
import "../widgets/register-widgets";

export class AgentSimulation {
  globals: Record<string, Global> = {};
  sim: AA.Simulation;
  widgets: IWidgetProps[] = [];

  constructor(gridWidth: number, gridHeight: number, gridStep: number) {
    this.sim = new AA.Simulation({
      width: gridWidth,
      height: gridHeight,
      gridStep: gridStep
    });
    makeAutoObservable(this);
  }

  addWidget(widget: IWidgetProps) {
    this.widgets.push(widget);
  }

  destroy() {
    this.sim.end();
  }
}