import * as AA from "@gjmcn/atomic-agents";

import { Global } from "../types/globals";

export class AgentSimulation {
  globals: Record<string, Global> = {};
  sim: AA.Simulation;

  constructor(gridWidth: number, gridHeight: number, gridStep: number) {
    this.sim = new AA.Simulation({
      width: gridWidth,
      height: gridHeight,
      gridStep: gridStep
    });
  }

  destroy() {
    this.sim.end();
  }
}