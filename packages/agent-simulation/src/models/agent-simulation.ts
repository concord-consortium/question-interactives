import * as AA from "@gjmcn/atomic-agents";
import { makeAutoObservable } from "mobx";

import { IWidgetProps } from "../types/widgets";
import "../widgets/register-widgets";
import { Globals } from "./globals";

export class AgentSimulation {
  globals: Globals = new Globals();
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
